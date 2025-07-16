import React from 'react';
import { Box, Switch, Typography, useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

interface EnvironmentToggleProps {
  isProduction: boolean;
  onToggle: () => void;
  isLoginPage?: boolean;
}

const EnvironmentToggle: React.FC<EnvironmentToggleProps> = ({ isProduction, onToggle, isLoginPage = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const handleToggle = () => {
    if (isLoginPage) {
      // On login page, just toggle without logout
      onToggle();
    } else {
      // Show confirmation dialog
      const confirmed = window.confirm(
        'Switching environments will log you out. Do you want to continue?'
      );
      
      if (confirmed) {
        // Logout current user
        dispatch(logout());
        // Toggle environment
        onToggle();
      }
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      px: 2,
      py: 1,
      borderRadius: 2,
      bgcolor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: 1
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: 500, 
          color: !isProduction ? theme.palette.primary.main : theme.palette.text.secondary 
        }}
      >
        STG
      </Typography>
      <Switch
        checked={isProduction}
        onChange={handleToggle}
        size="small"
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: theme.palette.primary.main,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      />
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: 500, 
          color: isProduction ? theme.palette.primary.main : theme.palette.text.secondary 
        }}
      >
        PROD
      </Typography>
    </Box>
  );
};

export default EnvironmentToggle; 