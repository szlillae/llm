import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  status: 'Draft' | 'Active' | 'Archived';
  onEdit: (id: number) => void;
}

const ProductCard = ({ id, name, description, status, onEdit }: ProductCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Draft':
        return '#FFA726';
      case 'Active':
        return '#66BB6A';
      case 'Archived':
        return '#EF5350';
      default:
        return '#757575';
    }
  };

  return (
    <Card sx={{ 
      minWidth: 275, 
      mb: 2,
      boxShadow: 'none',
      border: '1px solid #E0E0E0',
      borderRadius: '8px'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Chip 
            label={status}
            sx={{
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor(),
              fontWeight: 500
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="text" 
            onClick={() => onEdit(id)}
            sx={{ color: '#1976D2' }}
          >
            Edit
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
