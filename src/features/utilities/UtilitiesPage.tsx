import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, useTheme, CircularProgress, Alert, Card, CardContent, Tooltip, IconButton } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import axios from 'axios';
import { useEnvironment } from '../../contexts/EnvironmentContext';

const UtilitiesPage: React.FC = () => {
  const theme = useTheme();
  const { apiBaseUrl } = useEnvironment();
  // Receipt
  const [receiptAppId, setReceiptAppId] = useState('');
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState<string | null>(null);
  // Contract
  const [applicationId, setApplicationId] = useState('');
  const [contractResult, setContractResult] = useState<any>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractSuccess, setContractSuccess] = useState<string | null>(null);

  // SEWA/ICP toggles
  const [sewaEnabled, setSewaEnabled] = useState(false);
  const [icpEnabled, setIcpEnabled] = useState(false);
  const [sewaLoading, setSewaLoading] = useState(true);
  const [icpLoading, setIcpLoading] = useState(true);
  const [sewaUpdating, setSewaUpdating] = useState(false);
  const [icpUpdating, setIcpUpdating] = useState(false);

  // PATCH SEWA
  const handleToggleSewa = async () => {
    setSewaUpdating(true);
    try {
      const newValue = !sewaEnabled;
      await axios.patch(
        `${apiBaseUrl}/lookup-service/api/v1/chimney/settings/1`,
        {
          data: {
            type: 'settings',
            id: '1',
            attributes: { value: newValue },
          },
        },
        {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/vnd.api+json',
          },
        }
      );
      setSewaEnabled(newValue);
      // Clear lookup service cache
      await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
    } catch (e) {
      // Optionally show error
    } finally {
      setSewaUpdating(false);
    }
  };

  // PATCH ICP
  const handleToggleIcp = async () => {
    setIcpUpdating(true);
    try {
      const newValue = !icpEnabled;
      await axios.patch(
        `${apiBaseUrl}/lookup-service/api/v1/chimney/settings/2`,
        {
          data: {
            type: 'settings',
            id: '2',
            attributes: { value: newValue },
          },
        },
        {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/vnd.api+json',
          },
        }
      );
      setIcpEnabled(newValue);
      // Clear lookup service cache
      await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
    } catch (e) {
      // Optionally show error
    } finally {
      setIcpUpdating(false);
    }
  };

  // Fetch SEWA and ICP status on mount
  useEffect(() => {
    const fetchSewa = async () => {
      setSewaLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/lookup-service/api/v1/chimney/settings/1`, {
          headers: { 'accept': 'application/vnd.api+json' },
        });
        // Assume value is in res.data.data.attributes.value (adjust if needed)
        setSewaEnabled(Boolean(res.data?.data?.attributes?.value));
      } catch (e) {
        setSewaEnabled(false);
      } finally {
        setSewaLoading(false);
      }
    };
    const fetchIcp = async () => {
      setIcpLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/lookup-service/api/v1/chimney/settings/2`, {
          headers: { 'accept': 'application/vnd.api+json' },
        });
        setIcpEnabled(Boolean(res.data?.data?.attributes?.value));
      } catch (e) {
        setIcpEnabled(false);
      } finally {
        setIcpLoading(false);
      }
    };
    fetchSewa();
    fetchIcp();
  }, [apiBaseUrl]);

  const handleFetchReceipt = async () => {
    setReceiptLoading(true);
    setReceiptError(null);
    setReceiptResult(null);
    setReceiptSuccess(null);
    try {
      const res = await axios.post(
        `${apiBaseUrl}/worker-service/api/v1/task/register?type=DOWNLOAD_RECEIPT`,
        { applicationId: Number(receiptAppId) },
        {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
          },
        }
      );
      if (res.data && res.data.success === false) {
        setReceiptError(res.data.result?.message || 'Unknown error');
        setReceiptResult(null);
        setReceiptSuccess(null);
      } else {
        setReceiptSuccess('Receipt download task registered successfully!');
        setReceiptAppId('');
        setReceiptResult(null);
      }
    } catch (e: any) {
      setReceiptError(e.response?.data?.message || e.message);
      setReceiptSuccess(null);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleRegenerateContract = async () => {
    setContractLoading(true);
    setContractError(null);
    setContractResult(null);
    setContractSuccess(null);
    try {
      const res = await axios.get(
        `${apiBaseUrl}/workflow-service/api/v1/application/${applicationId}/document/regenerate?documentType=CONTRACT`,
        {
          headers: {
            'accept': '*/*',
          },
        }
      );
      if (res.data && res.data.success === false) {
        setContractError(res.data.result?.message || 'Unknown error');
        setContractResult(null);
        setContractSuccess(null);
      } else {
        setContractSuccess('Contract regeneration task registered successfully!');
        setApplicationId('');
        setContractResult(null);
      }
    } catch (e: any) {
      setContractError(e.response?.data?.message || e.message);
      setContractSuccess(null);
    } finally {
      setContractLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="stretch" justifyContent="flex-start" bgcolor={theme.palette.background.default} width="100%" gap={0}>
      {/* SEWA/ICP controls with improved UI/UX */}
      <Card sx={{ mb: 3, p: 0, borderRadius: 3, boxShadow: 0 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>Service Controls</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enable or disable integration with SEWA and ICP services. Status is shown with a colored dot. Click the toggle button to change state.
          </Typography>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            {/* SEWA */}
            <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 220, p: 2, borderRadius: 2, bgcolor: sewaEnabled ? 'success.lighter' : 'grey.100' }}>
              <Tooltip title={sewaEnabled ? 'Enabled' : 'Disabled'}>
                <FiberManualRecordIcon sx={{ color: sewaEnabled ? 'success.main' : 'error.main', fontSize: 28 }} />
              </Tooltip>
              <Box flex={1}>
                <Typography fontWeight={600}>SEWA</Typography>
                <Typography variant="caption" color="text.secondary">Sharjah Electricity & Water Authority</Typography>
              </Box>
              <Tooltip title={sewaEnabled ? 'Disable SEWA' : 'Enable SEWA'}>
                <span>
                  <IconButton onClick={handleToggleSewa} color={sewaEnabled ? 'success' : 'primary'} size="large" disabled={sewaLoading || sewaUpdating}>
                    {(sewaLoading || sewaUpdating) ? <CircularProgress size={24} /> : <PowerSettingsNewIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            {/* ICP */}
            <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 220, p: 2, borderRadius: 2, bgcolor: icpEnabled ? 'success.lighter' : 'grey.100' }}>
              <Tooltip title={icpEnabled ? 'Enabled' : 'Disabled'}>
                <FiberManualRecordIcon sx={{ color: icpEnabled ? 'success.main' : 'error.main', fontSize: 28 }} />
              </Tooltip>
              <Box flex={1}>
                <Typography fontWeight={600}>ICP</Typography>
                <Typography variant="caption" color="text.secondary">Identity & Citizenship Portal</Typography>
              </Box>
              <Tooltip title={icpEnabled ? 'Disable ICP' : 'Enable ICP'}>
                <span>
                  <IconButton onClick={handleToggleIcp} color={icpEnabled ? 'success' : 'primary'} size="large" disabled={icpLoading || icpUpdating}>
                    {(icpLoading || icpUpdating) ? <CircularProgress size={24} /> : <PowerSettingsNewIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
      {/* Original panels below, now as Cards */}
      <Card sx={{ p: 0, borderRadius: 3, boxShadow: 0, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Fetch Receipt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Register a task to download a receipt for a given Application ID.
          </Typography>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              label="Application ID"
              value={receiptAppId}
              onChange={e => setReceiptAppId(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <Button variant="contained" color="primary" onClick={handleFetchReceipt} disabled={receiptLoading || !receiptAppId}>
              {receiptLoading ? <CircularProgress size={22} color="inherit" /> : 'Fetch'}
            </Button>
          </Box>
          {receiptError && <Alert severity="error" sx={{ mb: 2 }}>{receiptError}</Alert>}
          {receiptSuccess && <Alert severity="success" sx={{ mb: 2 }}>{receiptSuccess}</Alert>}
        </CardContent>
      </Card>
      <Card sx={{ p: 0, borderRadius: 3, boxShadow: 0 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Regenerate Contract
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Register a task to regenerate a contract document for a given Application ID.
          </Typography>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              label="Application ID"
              value={applicationId}
              onChange={e => setApplicationId(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <Button variant="contained" color="primary" onClick={handleRegenerateContract} disabled={contractLoading || !applicationId}>
              {contractLoading ? <CircularProgress size={22} color="inherit" /> : 'Regenerate'}
            </Button>
          </Box>
          {contractError && <Alert severity="error" sx={{ mb: 2 }}>{contractError}</Alert>}
          {contractSuccess && <Alert severity="success" sx={{ mb: 2 }}>{contractSuccess}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UtilitiesPage; 