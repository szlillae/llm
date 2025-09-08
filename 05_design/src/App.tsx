import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Header from './components/Header'
import ProductList from './pages/ProductList'
import './App.css'

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '13.2px',
      fontWeight: 400,
      lineHeight: 1.59,
    },
    h4: {
      fontSize: '13.2px',
      fontWeight: 400,
      lineHeight: 1.06,
    },
    body1: {
      fontSize: '11.3px',
      fontWeight: 400,
      lineHeight: 1.55,
      color: '#717182',
    },
    body2: {
      fontSize: '12.8px',
      fontWeight: 500,
      lineHeight: 1.64,
    },
  },
  palette: {
    primary: {
      main: '#030213',
    },
    error: {
      main: '#D4183D',
    },
    text: {
      primary: '#0A0A0A',
      secondary: '#717182',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F3F3F5',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '6.75px',
          fontWeight: 500,
          fontSize: '11.3px',
          lineHeight: 1.55,
        },
        outlined: {
          borderColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12.75px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '15px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '8.75px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6.75px',
            backgroundColor: '#F3F3F5',
            '& fieldset': {
              borderColor: 'transparent',
            },
          },
        },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ maxWidth: '1120px', margin: '0 auto', padding: '20px' }}>
        <Header />
        <ProductList />
      </Box>
    </ThemeProvider>
  )
}

export default App
