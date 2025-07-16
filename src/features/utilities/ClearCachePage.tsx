import React, { useState } from 'react';
import { Box, Typography, Button, useTheme, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const SERVICES = [
  'authentication-service',
  'contract-service',
  'dispute-service',
  'document-service',
  'logging-service',
  'lookup-service',
  'notification-service',
  'payment-service',
  'property-service',
  'worker-service',
  'workflow-service',
];

type RowState = {
  loading: boolean;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};

const ClearCachePage: React.FC = () => {
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(SERVICES.map(s => [s, { loading: false }]))
  );
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const theme = useTheme();

  const handleClearCache = async (service: string) => {
    setRowStates(prev => ({
      ...prev,
      [service]: { loading: true },
    }));
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/${service}/cache/evict`
      );
      if (res.status === 200) {
        setSnackbar({ open: true, message: `Cache cleared successfully for ${service}!`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: `Failed to clear cache for ${service}: ${res.statusText}`, severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: `Network error for ${service}: ${e.response?.data || e.message}`, severity: 'error' });
    } finally {
      setRowStates(prev => ({
        ...prev,
        [service]: { loading: false },
      }));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="stretch" justifyContent="flex-start" bgcolor={theme.palette.background.default} px={2} width="100%">
      <TableContainer component={Paper} sx={{ width: '100%', boxShadow: 4, borderRadius: 3, background: theme.palette.background.paper }}>
        <Table size="medium" sx={{ minWidth: 400, width: '100%' }}>
          <TableHead>
            <TableRow sx={{ background: theme.palette.action.hover }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Service</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SERVICES.map(service => (
              <TableRow key={service} hover>
                <TableCell sx={{ fontSize: '1.05rem' }}>{service}</TableCell>
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={rowStates[service].loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                      onClick={() => handleClearCache(service)}
                      disabled={rowStates[service].loading}
                    >
                      {rowStates[service].loading ? 'Clearing...' : 'Clear Cache'}
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 'bold' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClearCachePage; 