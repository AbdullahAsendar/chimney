import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRefreshToken } from './authSlice';
import { Card, CardContent, Typography, Button, Box, TextField, useTheme } from '@mui/material';
import { useEnvironment } from '../../contexts/EnvironmentContext';
import EnvironmentToggle from '../../components/EnvironmentToggle';

const LoginPage: React.FC<{ errorMsg?: string }> = ({ errorMsg }) => {
  const [token, setToken] = useState('');
  const dispatch = useDispatch();
  const theme = useTheme();
  const { isProduction, toggleEnvironment } = useEnvironment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      dispatch(setRefreshToken(token));
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor={theme.palette.background.default}>
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <EnvironmentToggle isProduction={isProduction} onToggle={toggleEnvironment} isLoginPage={true} />
      </Box>
      <Card
        sx={{
          minWidth: 350,
          maxWidth: 400,
          p: 3,
          borderRadius: 4,
          background: theme.palette.background.paper,
          boxShadow: 0,
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            fontWeight="bold"
            sx={{ color: theme.palette.primary.main, letterSpacing: 1 }}
          >
            Chimney
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" mb={2}>
            Enter Refresh Token
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              id="refreshToken"
              label="Refresh Token"
              variant="outlined"
              value={token}
              onChange={e => setToken(e.target.value)}
              fullWidth
              margin="normal"
              autoFocus
              sx={{ input: { color: theme.palette.text.primary } }}
            />
            {errorMsg && (
              <Typography color={theme.palette.error.main} variant="body2" align="center" mb={2}>
                {errorMsg}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, fontWeight: 'bold', py: 1.4, fontSize: '1.1rem', borderRadius: 2 }}
            >
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage; 