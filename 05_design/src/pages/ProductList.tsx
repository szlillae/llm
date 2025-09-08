import { 
  Box, 
  Button, 
  Card, 
  CardActions, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid, 
  IconButton, 
  InputAdornment, 
  TextField, 
  Typography 
} from '@mui/material';
import type { GridProps } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EyeIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';

  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

interface Cart {
  id: number;
  items: CartItem[];
  created_at: string;
}

type DialogType = 'add' | 'edit' | 'view' | 'delete' | null;

interface DialogState {
  open: boolean;
  type: DialogType;
  productId?: number;
}

const API_URL = 'http://localhost:8000/products';
const CART_URL = 'http://localhost:8000/cart';

const ProductList = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    type: null
  });
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<Cart | null>(null);
  // Cart API
  const fetchCart = async () => {
    try {
      const res = await fetch(CART_URL);
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {}
  };

  const addToCart = async (productId: number) => {
    await fetch(CART_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    fetchProducts();
    fetchCart();
  };

  // API utility functions
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      // handle error (optional)
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    fetchProducts();
  };

  const editProduct = async (id: number, product: Omit<Product, 'id'>) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    fetchProducts();
  };

  // Load products on mount
  React.useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const handleOpenDialog = (type: DialogType, productId?: number) => {
    setDialogState({ open: true, type, productId });
  };

  const handleCloseDialog = () => {
    setDialogState({ open: false, type: null });
    setFormData({});
  };

  const handleView = (id: number) => {
    handleOpenDialog('view', id);
  };

  const handleEdit = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setFormData(product);
      handleOpenDialog('edit', id);
    }
  };

  const handleDelete = (id: number) => {
    handleOpenDialog('delete', id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (dialogState.type === 'edit' && dialogState.productId) {
      await editProduct(dialogState.productId, {
        name: formData.name || '',
        description: formData.description || '',
        price: formData.price || 0,
        stock: formData.stock || 0
      });
    } else if (dialogState.type === 'add' && formData.name) {
      await addProduct({
        name: formData.name,
        description: formData.description || '',
        price: formData.price || 0,
        stock: formData.stock || 0
      });
    }
    handleCloseDialog();
  };

  const handleConfirmDelete = async () => {
    if (dialogState.productId) {
      await deleteProduct(dialogState.productId);
    }
    handleCloseDialog();
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, position: 'relative' }}>
          <TextField
            fullWidth
            placeholder="Search products..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.primary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ backgroundColor: 'background.paper' }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
          sx={{ height: '31.5px' }}
        >
          Add Product
        </Button>
      </Box>

      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid key={product.id} {...{ item: true, xs: 12, sm: 6, md: 4 } as GridProps}>
            <Card>
              <Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {product.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {product.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    Stock: {product.stock}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    ${product.price.toFixed(2)}
                  </Typography>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => addToCart(product.id)}
                    sx={{ ml: 2 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
              <CardActions sx={{ mt: 2, gap: 1, px: 0 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EyeIcon />}
                  onClick={() => handleView(product.id)}
                >
                  View
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(product.id)}
                >
                  Edit
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(product.id)}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Cart display in bottom left corner */}
      <Box sx={{ position: 'fixed', bottom: 16, left: 16, width: 300, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 2, p: 2, zIndex: 1000 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Cart</Typography>
        {cart && cart.items.length > 0 ? (
          <Box>
            {cart.items.map(item => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{item.product.name} x {item.quantity}</Typography>
                <Typography variant="body2">${item.product.price.toFixed(2)}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">Cart is empty</Typography>
        )}
      </Box>

      {/* View Dialog */}
      <Dialog 
        open={dialogState.open && dialogState.type === 'view'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Product Details
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogState.productId && products.find(p => p.id === dialogState.productId) && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {products.find(p => p.id === dialogState.productId)?.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {products.find(p => p.id === dialogState.productId)?.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Price: ${products.find(p => p.id === dialogState.productId)?.price.toFixed(2)}
              </Typography>
              <Typography variant="body1">
                Stock: {products.find(p => p.id === dialogState.productId)?.stock}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={dialogState.open && dialogState.type === 'edit'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Product
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogState.productId && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="name"
                label="Name"
                fullWidth
                value={formData.name || ''}
                onChange={handleInputChange}
              />
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={formData.description || ''}
                onChange={handleInputChange}
              />
              <TextField
                name="price"
                label="Price"
                fullWidth
                type="number"
                value={formData.price || ''}
                onChange={handleInputChange}
              />
              <TextField
                name="stock"
                label="Stock"
                fullWidth
                type="number"
                value={formData.stock || ''}
                onChange={handleInputChange}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog 
        open={dialogState.open && dialogState.type === 'add'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Product
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              name="name"
              label="Name" 
              fullWidth 
              value={formData.name || ''} 
              onChange={handleInputChange}
            />
            <TextField 
              name="description"
              label="Description" 
              fullWidth 
              multiline 
              rows={4} 
              value={formData.description || ''} 
              onChange={handleInputChange}
            />
            <TextField 
              name="price"
              label="Price" 
              fullWidth 
              type="number" 
              value={formData.price || ''} 
              onChange={handleInputChange}
            />
            <TextField 
              name="stock"
              label="Stock" 
              fullWidth 
              type="number" 
              value={formData.stock || ''} 
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog 
        open={dialogState.open && dialogState.type === 'delete'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Product
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ pt: 2 }}>
            Are you sure you want to delete this product? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductList;
