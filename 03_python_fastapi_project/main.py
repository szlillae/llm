from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import Product, Cart, CartItem, create_tables, get_db


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


# Response Models
class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    description: str | None
    stock: int

    class Config:
        from_attributes = True

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse
    created_at: datetime

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    created_at: datetime

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
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
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

# Cart endpoints
@app.post("/cart", response_model=CartResponse)
async def create_cart(db: AsyncSession = Depends(get_db)):
    cart = Cart()
    db.add(cart)
    await db.commit()
    await db.refresh(cart)
    
    # Return properly formatted response
    return CartResponse(
        id=cart.id,
        items=[],  # Empty list for new cart
        created_at=cart.created_at
    )

@app.get("/cart/{cart_id}", response_model=CartResponse)
async def get_cart(cart_id: int, db: AsyncSession = Depends(get_db)):
    cart = await db.get(Cart, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Fetch cart items explicitly to avoid lazy loading issues
    cart_items_result = await db.execute(
        select(CartItem).filter(CartItem.cart_id == cart_id)
    )
    cart_items = cart_items_result.scalars().all()
    
    # Format cart items properly
    formatted_items = []
    for item in cart_items:
        # Fetch the product explicitly to ensure it's loaded
        item_product = await db.get(Product, item.product_id)
        if item_product:
            formatted_items.append(CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product=ProductResponse.model_validate(item_product),
                created_at=item.created_at
            ))
    
    return CartResponse(
        id=cart.id,
        items=formatted_items,
        created_at=cart.created_at
    )

@app.post("/cart/{cart_id}/items", response_model=CartResponse)
async def add_to_cart(
    cart_id: int,
    item: CartItemCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if cart exists
    cart = await db.get(Cart, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Check if product exists and has enough stock
    product = await db.get(Product, item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    # Check if item already exists in cart
    result = await db.execute(
        select(CartItem).filter(
            CartItem.cart_id == cart_id,
            CartItem.product_id == item.product_id
        )
    )
    existing_item = result.scalar_one_or_none()

    if existing_item:
        # Update quantity of existing item
        if product.stock < (existing_item.quantity + item.quantity):
            raise HTTPException(status_code=400, detail="Not enough stock")
        existing_item.quantity += item.quantity
        await db.commit()
        await db.refresh(existing_item)
    else:
        # Create new cart item
        cart_item = CartItem(
            cart_id=cart_id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)
        await db.commit()
        await db.refresh(cart_item)

    # Decrease product stock - refresh product first to ensure it's attached to session
    await db.refresh(product)
    product.stock -= item.quantity
    await db.commit()
    await db.refresh(product)
    await db.refresh(cart)

    # Fetch cart items explicitly to avoid lazy loading issues
    cart_items_result = await db.execute(
        select(CartItem).filter(CartItem.cart_id == cart_id)
    )
    cart_items = cart_items_result.scalars().all()
    
    # Format cart items properly
    formatted_items = []
    for cart_item_obj in cart_items:
        # Fetch the product explicitly to ensure it's loaded
        item_product = await db.get(Product, cart_item_obj.product_id)
        if item_product:  # Check if product exists
            formatted_items.append(CartItemResponse(
                id=cart_item_obj.id,
                product_id=cart_item_obj.product_id,
                quantity=cart_item_obj.quantity,
                product=ProductResponse.model_validate(item_product),
                created_at=cart_item_obj.created_at
            ))
    
    return CartResponse(
        id=cart.id,
        items=formatted_items,
        created_at=cart.created_at
    )

@app.delete("/cart/{cart_id}/items/{item_id}", response_model=CartResponse)
async def remove_from_cart(
    cart_id: int,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    # Check if cart exists
    cart = await db.get(Cart, cart_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Check if item exists
    cart_item = await db.get(CartItem, item_id)
    if not cart_item or cart_item.cart_id != cart_id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Restore product stock
    product = await db.get(Product, cart_item.product_id)
    product.stock += cart_item.quantity
    
    # Remove item from cart
    await db.delete(cart_item)
    await db.commit()
    await db.refresh(cart)
    
    # Fetch cart items explicitly to avoid lazy loading issues
    cart_items_result = await db.execute(
        select(CartItem).filter(CartItem.cart_id == cart_id)
    )
    remaining_cart_items = cart_items_result.scalars().all()
    
    # Format cart items properly
    formatted_items = []
    for cart_item_obj in remaining_cart_items:
        # Fetch the product explicitly to ensure it's loaded
        item_product = await db.get(Product, cart_item_obj.product_id)
        if item_product:
            formatted_items.append(CartItemResponse(
                id=cart_item_obj.id,
                product_id=cart_item_obj.product_id,
                quantity=cart_item_obj.quantity,
                product=ProductResponse.model_validate(item_product),
                created_at=cart_item_obj.created_at
            ))
    
    return CartResponse(
        id=cart.id,
        items=formatted_items,
        created_at=cart.created_at
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
