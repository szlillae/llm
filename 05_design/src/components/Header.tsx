import { Box, Typography } from '@mui/material';

const Header = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h1" sx={{ fontSize: '13.2px', mb: 2.5 }}>
        Product Management
      </Typography>
    </Box>
  );
};

export default Header;
