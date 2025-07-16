import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

const CompanyPermissionsPage: React.FC = () => {
  const theme = useTheme();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/authentication-service/api/v1/permission/lookup/company`, {
      headers: { 'accept': '*/*', 'sdd-token': accessToken },
    })
      .then(res => setData(res.data.result || []))
      .catch(e => setError(e.response?.data || e.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <Box display="flex" flexDirection="column" alignItems="stretch" justifyContent="flex-start" bgcolor={theme.palette.background.default} px={2} width="100%">
      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ width: '100%', boxShadow: 4, borderRadius: 3, background: theme.palette.background.paper }}>
          <Table size="medium" sx={{ minWidth: 400, width: '100%' }}>
            <TableHead>
              <TableRow sx={{ background: theme.palette.action.hover }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row: any) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name || '-'}</TableCell>
                  <TableCell>
                    {row.active ? (
                      <Box component="span" sx={{
                        bgcolor: '#e6f4ea',
                        color: '#006635',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        letterSpacing: 0.5,
                        display: 'inline-block',
                      }}>
                        Active
                      </Box>
                    ) : (
                      <Box component="span" sx={{
                        bgcolor: '#fdeaea',
                        color: '#d32f2f',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        letterSpacing: 0.5,
                        display: 'inline-block',
                      }}>
                        Inactive
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CompanyPermissionsPage; 