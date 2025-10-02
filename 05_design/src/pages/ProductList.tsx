import { 
  Box, 
  Button, 
  Card,
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
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EyeIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';

interface Product {
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
  created_at: string;
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

const API_URL = 'http://localhost:8000';
const PRODUCTS_URL = `${API_URL}/products`;
const CART_URL = `${API_URL}/cart`;

const ProductList = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    type: null
  });
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartId, setCartId] = useState<number | null>(null);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // API utility functions
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(PRODUCTS_URL);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number) => {
    let currentCartId = cartId;
    
    // Create cart only when first item is added
    if (!currentCartId) {
      try {
        const res = await fetch(CART_URL, {
          method: 'POST',
        });
        const cartData = await res.json();
        currentCartId = cartData.id;
        setCartId(cartData.id);
        setCart(cartData);
        // Save cart ID to localStorage for persistence
        localStorage.setItem('cartId', cartData.id.toString());
      } catch (err) {
        console.error('Error creating cart:', err);
        return;
      }
    }
    
    try {
      const res = await fetch(`${CART_URL}/${currentCartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      const data = await res.json();
      setCart(data);
      fetchProducts(); // Refresh products to update stock
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!cartId) return;

    try {
      const res = await fetch(`${CART_URL}/${cartId}/items/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setCart(data);
      
      // If cart is empty, clear it from localStorage
      if (data.items.length === 0) {
        localStorage.removeItem('cartId');
        setCartId(null);
        setCart(null);
      }
      
      fetchProducts(); // Refresh products to update stock
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    await fetch(PRODUCTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    fetchProducts();
  };

  const editProduct = async (id: number, product: Omit<Product, 'id'>) => {
    await fetch(`${PRODUCTS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    await fetch(`${PRODUCTS_URL}/${id}`, {
      method: 'DELETE'
    });
    fetchProducts();
  };

  // Load products and restore cart on mount
  React.useEffect(() => {
    fetchProducts();
    
    // Try to restore cart from localStorage
    const savedCartId = localStorage.getItem('cartId');
    if (savedCartId) {
      const parsedCartId = parseInt(savedCartId, 10);
      if (!isNaN(parsedCartId)) {
        setCartId(parsedCartId);
        // Fetch the existing cart
        fetch(`${CART_URL}/${parsedCartId}`)
          .then(res => res.json())
          .then(cartData => {
            setCart(cartData);
          })
          .catch(err => {
            console.error('Error fetching saved cart:', err);
            // If cart doesn't exist anymore, remove from localStorage
            localStorage.removeItem('cartId');
            setCartId(null);
          });
      }
    }
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
      setDialogState({ open: true, type: 'edit', productId: id });
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
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      background: '#fff',
      py: 4
    }}>
      <Box sx={{ maxWidth: '1120px', mx: 'auto', px: 3 }}>
        {/* Header */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 500, 
            mb: 4, 
            color: '#030213',
            fontSize: '15px',
            lineHeight: 1.5
          }}
        >
          Product Management
        </Typography>

        {/* Search and Add */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#717182', width: 18, height: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  background: '#F3F3F5',
                  borderRadius: '8px',
                  fontSize: '13px',
                  '& .MuiOutlinedInput-root': {
                    height: '40px'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #030213'
                  }
                }
              }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
            sx={{
              height: '40px',
              px: 3,
              borderRadius: '8px',
              background: '#030213',
              color: '#fff',
              fontSize: '13px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                background: '#151524'
              }
            }}
          >
            Add Product
          </Button>
        </Box>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {loading ? (
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 8 
              }}>
                <Typography sx={{ 
                  color: '#717182',
                  fontSize: '14px'
                }}>
                  Loading products...
                </Typography>
              </Box>
            </Grid>
          ) : filteredProducts.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 8 
              }}>
                <Typography sx={{ 
                  color: '#717182',
                  fontSize: '14px'
                }}>
                  No products found
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredProducts.map((product) => (
              <Grid item xs={12} sm={12} md={6} key={product.id}>
                <Card sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  border: '1px solid #E4E4E7',
                  boxShadow: 'none'
                }}>
                  <Box sx={{ p: 4 }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontSize: '20px',
                        fontWeight: 500,
                        color: '#18181B',
                        mb: 1
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontSize: '14px',
                        color: '#71717A',
                        mb: 3
                      }}
                    >
                      {product.description}
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '20px',
                          fontWeight: 500,
                          color: '#18181B'
                        }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#71717A'
                        }}
                      >
                        Stock: {product.stock}
                      </Typography>
                      <IconButton
                        color="primary"
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock <= 0}
                        size="small"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box 
                    sx={{ 
                      mt: 'auto',
                      px: 4,
                      pb: 4,
                      display: 'flex',
                      gap: 2
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<EyeIcon />}
                      onClick={() => handleView(product.id)}
                      sx={{
                        flex: 1,
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #E4E4E7',
                        color: '#18181B',
                        fontSize: '14px',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#F4F4F5',
                          borderColor: '#E4E4E7'
                        }
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(product.id)}
                      sx={{
                        flex: 1,
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #E4E4E7',
                        color: '#18181B',
                        fontSize: '14px',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#F4F4F5',
                          borderColor: '#E4E4E7'
                        }
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleDelete(product.id)}
                      sx={{
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
                        p: 0,
                        borderRadius: '8px',
                        backgroundColor: '#EF4444',
                        '&:hover': {
                          backgroundColor: '#DC2626'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Dialogs */}
      {/* View Dialog */}
      <Dialog
        open={dialogState.open && dialogState.type === 'view'}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            width: '444px',
            minHeight: '286px',
            borderRadius: '8.75px',
            boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            p: 0,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: '21px 22px',
          '& .MuiTypography-root': {
            fontSize: '16px',
            fontWeight: 600,
            color: '#000000',
            lineHeight: '0.984375em',
          }
        }}>
          Product Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 15,
              top: 15,
              width: '24px',
              height: '24px',
              color: '#000000',
              p: 0
            }}
          >
            <CloseIcon sx={{ width: '12px', height: '12px' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: '22px', py: 0, overflow: 'visible', flex: 1 }}>
          {dialogState.productId && products.find(p => p.id === dialogState.productId) && (
            <Box sx={{ pt: 0 }}>
              <Typography sx={{ 
                fontSize: '16px',
                fontWeight: 500,
                color: '#000000',
                lineHeight: '1.4765625em',
                mb: '9px'
              }}>
                {products.find(p => p.id === dialogState.productId)?.name}
              </Typography>
              <Typography sx={{ 
                fontSize: '16px',
                fontWeight: 400,
                color: '#717182',
                lineHeight: '1.5em',
                mb: '11px'
              }}>
                {products.find(p => p.id === dialogState.productId)?.description}
              </Typography>
              <Box sx={{ 
                height: '1px',
                background: 'rgba(0, 0, 0, 0.1)',
                mb: '14px',
                mx: 0
              }} />
              <Box sx={{ display: 'flex', gap: '156px', mb: '14px' }}>
                <Box>
                  <Typography sx={{ 
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#717182',
                    lineHeight: '1.4583333333333333em',
                    mb: '3px'
                  }}>
                    Price:
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#030213',
                    lineHeight: '1.4583333333333333em'
                  }}>
                    $ {products.find(p => p.id === dialogState.productId)?.price.toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ 
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#717182',
                    lineHeight: '1.4583333333333333em',
                    mb: '3px'
                  }}>
                    Stock:
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#000000',
                    lineHeight: '1.4583333333333333em'
                  }}>
                    {products.find(p => p.id === dialogState.productId)?.stock} units
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ 
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#717182',
                  lineHeight: '1.4583333333333333em',
                  mb: '4px'
                }}>
                  Product ID:
                </Typography>
                <Typography sx={{ 
                  fontSize: '11px',
                  fontWeight: 400,
                  color: '#000000',
                  lineHeight: '1.2727272727272727em'
                }}>
                  {products.find(p => p.id === dialogState.productId)?.id}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>



      {/* Add Dialog */}
      <Dialog
        open={dialogState.open && dialogState.type === 'add'}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            width: '450px',
            minHeight: '400px',
            borderRadius: '8.75px',
            boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            p: 0,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: '24px 28px',
          '& .MuiTypography-root': {
            fontSize: '18px',
            fontWeight: 600,
            color: '#000000',
            lineHeight: '0.984375em',
          }
        }}>
          Add New Product
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 15,
              top: 15,
              width: '24px',
              height: '24px',
              color: '#000000',
              p: 0
            }}
          >
            <CloseIcon sx={{ width: '14px', height: '14px' }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: '28px', py: 0, overflow: 'visible', flex: 1 }}>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#000000',
                mb: '18px',
                lineHeight: '1.0208333333333333em'
              }}>
                Product Name
              </Typography>
              <TextField
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder="Enter product name"
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: '#F3F3F5',
                    borderRadius: '6.75px',
                    height: '36px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#000000',
                    padding: '8px 11px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#000000',
                mb: '18px',
                lineHeight: '1.0208333333333333em'
              }}>
                Description
              </Typography>
              <TextField
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter product description"
                multiline
                rows={3}
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: '#F3F3F5',
                    borderRadius: '6.75px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#000000',
                    padding: '9px 13px',
                    lineHeight: '1.4',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: '14px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  mb: '18px',
                  lineHeight: '1.0208333333333333em'
                }}>
                  Price ($)
                </Typography>
                <TextField
                  name="price"
                  type="number"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  fullWidth
                  InputProps={{
                    sx: {
                      backgroundColor: '#F3F3F5',
                      borderRadius: '6.75px',
                      height: '36px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#000000',
                      padding: '8px 14px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  mb: '18px',
                  lineHeight: '1.0208333333333333em'
                }}>
                  Stock
                </Typography>
                <TextField
                  name="stock"
                  type="number"
                  value={formData.stock || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  fullWidth
                  InputProps={{
                    sx: {
                      backgroundColor: '#F3F3F5',
                      borderRadius: '6.75px',
                      height: '36px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#000000',
                      padding: '8px 11px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: '28px', gap: '12px' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              height: '32px',
              minWidth: '68px',
              borderRadius: '6.75px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              color: '#000000',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.4583333333333333em',
              textTransform: 'none',
              padding: '7px 14px',
              '&:hover': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            sx={{
              height: '32px',
              minWidth: '113px',
              borderRadius: '6.75px',
              backgroundColor: '#030213',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.4583333333333333em',
              textTransform: 'none',
              padding: '7px 11px',
              '&:hover': {
                backgroundColor: '#1A1A1A'
              }
            }}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={dialogState.open && dialogState.type === 'delete'}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            width: '444px',
            minHeight: '156px',
            borderRadius: '8.75px',
            boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            p: 0,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: '21px 22px',
          '& .MuiTypography-root': {
            fontSize: '16px',
            fontWeight: 600,
            color: '#000000',
            lineHeight: '1.53125em',
          }
        }}>
          Delete Product
        </DialogTitle>
        <DialogContent sx={{ px: '22px', py: 0, overflow: 'visible', flex: 1 }}>
          <Typography sx={{ 
            fontSize: '12px',
            fontWeight: 400,
            color: '#717182',
            lineHeight: '1.4583333333333333em'
          }}>
            Are you sure you want to delete "{products.find(p => p.id === dialogState.productId)?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: '22px', gap: '8px' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              height: '32px',
              minWidth: '68px',
              borderRadius: '6.75px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 500,
              lineHeight: '1.4583333333333333em',
              textTransform: 'none',
              padding: '7px 14px',
              '&:hover': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              height: '32px',
              minWidth: '109px',
              borderRadius: '6.75px',
              backgroundColor: '#D4183D',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 500,
              lineHeight: '1.4583333333333333em',
              textTransform: 'none',
              padding: '7px 12px',
              '&:hover': {
                backgroundColor: '#BD1535'
              }
            }}
          >
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={dialogState.open && dialogState.type === 'edit'}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            width: '450px',
            minHeight: '400px',
            borderRadius: '8.75px',
            boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            p: 0,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: '24px 28px',
          '& .MuiTypography-root': {
            fontSize: '18px',
            fontWeight: 600,
            color: '#000000',
            lineHeight: '0.984375em',
          }
        }}>
          Edit Product
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 15,
              top: 15,
              width: '24px',
              height: '24px',
              color: '#000000',
              p: 0
            }}
          >
            <CloseIcon sx={{ width: '14px', height: '14px' }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: '28px', py: 0, overflow: 'visible', flex: 1 }}>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#000000',
                mb: '18px',
                lineHeight: '1.0208333333333333em'
              }}>
                Product Name
              </Typography>
              <TextField
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder="Product name"
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: '#F3F3F5',
                    borderRadius: '6.75px',
                    height: '36px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#000000',
                    padding: '8px 11px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#000000',
                mb: '18px',
                lineHeight: '1.0208333333333333em'
              }}>
                Description
              </Typography>
              <TextField
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Description"
                multiline
                rows={3}
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: '#F3F3F5',
                    borderRadius: '6.75px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#000000',
                    padding: '9px 13px',
                    lineHeight: '1.4',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: '14px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  mb: '18px',
                  lineHeight: '1.0208333333333333em'
                }}>
                  Price ($)
                </Typography>
                <TextField
                  name="price"
                  type="number"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  fullWidth
                  InputProps={{
                    sx: {
                      backgroundColor: '#F3F3F5',
                      borderRadius: '6.75px',
                      height: '36px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#000000',
                      padding: '8px 14px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  mb: '18px',
                  lineHeight: '1.0208333333333333em'
                }}>
                  Stock
                </Typography>
                <TextField
                  name="stock"
                  type="number"
                  value={formData.stock || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  fullWidth
                  InputProps={{
                    sx: {
                      backgroundColor: '#F3F3F5',
                      borderRadius: '6.75px',
                      height: '36px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#000000',
                      padding: '8px 11px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: '28px', gap: '12px' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              height: '32px',
              minWidth: '68px',
              borderRadius: '6.75px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              color: '#000000',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.4583333333333333em',
              textTransform: 'none',
              padding: '7px 14px',
              '&:hover': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            sx={{
              height: '32px',
              minWidth: '113px',
              borderRadius: '6.75px',
              backgroundColor: '#030213',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.4583333333333333em',
              textTransform: 'none',
              padding: '7px 11px',
              '&:hover': {
                backgroundColor: '#1A1A1A'
              }
            }}
          >
            Update Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cart display in bottom left corner */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          width: 300,
          maxHeight: '60vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 3,
          borderRadius: 2,
          p: 2,
          zIndex: 1000
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>Shopping Cart</Typography>
        {cart && cart.items.length > 0 ? (
          <>
            {cart.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box>
                  <Typography variant="body2">{item.product.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Quantity: {item.quantity}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">${(item.product.price * item.quantity).toFixed(2)}</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2">
                Total: ${cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">Cart is empty</Typography>
        )}
      </Box>
    </Box>
  );
}

export default ProductList;
