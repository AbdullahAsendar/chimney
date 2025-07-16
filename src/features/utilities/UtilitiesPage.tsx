import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, useTheme, CircularProgress, Alert } from '@mui/material';
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
      <Paper sx={{ p: 4, borderRadius: 3 }} elevation={0}>
        <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
          Fetch Receipt
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
      </Paper>
      <Paper sx={{ p: 4, borderRadius: 3, mt:2 }} elevation={0}>
        <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
          Regenerate Contract
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
      </Paper>
    </Box>
  );
};

export default UtilitiesPage; 