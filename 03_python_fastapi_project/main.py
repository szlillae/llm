from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import Product, create_tables, get_db


class ProductCreate(BaseModel):
    name: str
    price: float
    description: str | None = None
    stock: int

class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    description: str | None = None
    stock: int | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    description: str | None
    stock: int

    class Config:
        from_attributes = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield



app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Template"}

@app.get("/products/", response_model=List[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    products = result.scalars().all()

    return products

@app.get("/products/{id}", response_model=ProductResponse)
async def get_product(id: str, db: AsyncSession = Depends(get_db)):
    db_product = await db.get(Product, id)

    if not db_product:
        raise HTTPException(status_code=404, detail="Desired product does not exist!")

    return db_product

@app.post("/products/", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).filter(Product.name == product.name))
    db_product = result.first()

    if db_product:
        raise HTTPException(status_code=400, detail="Product name already exists")


    db_product = Product(name=product.name,
                         price=product.price,
                         description=product.description,
                         stock=product.stock)
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@app.put("/products/{id}", response_model=ProductResponse)
async def update_product(product: ProductUpdate, id: str, db: AsyncSession = Depends(get_db)):
    db_product = await db.get(Product, id)

    if not db_product:
        raise HTTPException(status_code=404, detail="Desired product does not exist!")

    if product.name != None:
        products = await db.execute(select(Product).filter(Product.name == product.name))
        named_product = products.first()
        if named_product:
            raise HTTPException(status_code=400, detail="Cannot update the name, because name already exists!")
        db_product.name = product.name
    
    if product.description != None:
        db_product.description = product.description
    
    if product.price != None:
        db_product.price = product.price
    
    if product.stock != None:
        db_product.stock = product.stock

    await db.commit()
    await db.refresh(db_product)

    return db_product

@app.delete("/products/{id}")
async def delete_product(id: str, db: AsyncSession = Depends(get_db)):
    db_product = await db.get(Product, id)

    if not db_product:
        raise HTTPException(status_code=404, detail="Desired product not found")


    await db.delete(db_product)
    await db.commit()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
