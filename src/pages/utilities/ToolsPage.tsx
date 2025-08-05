import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Container } from '@/components/common/container';

import { useEnvironment } from '@/providers/environment-provider';
import axios from 'axios';
import { 
  LoaderCircleIcon, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Download, 
  FileText, 
  Zap, 
  Shield, 
  Database, 
  RefreshCw
} from 'lucide-react';
import * as authHelper from '@/auth/lib/helpers';

export default function ToolsPage() {
  const { apiBaseUrl } = useEnvironment();
  
  // SEWA/ICP toggles
  const [sewaEnabled, setSewaEnabled] = useState(false);
  const [icpEnabled, setIcpEnabled] = useState(false);
  const [sewaLoading, setSewaLoading] = useState(true);
  const [icpLoading, setIcpLoading] = useState(true);
  const [sewaUpdating, setSewaUpdating] = useState(false);
  const [icpUpdating, setIcpUpdating] = useState(false);
  
  // Receipt
  const [receiptAppId, setReceiptAppId] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState<string | null>(null);
  
  // Contract
  const [applicationId, setApplicationId] = useState('');
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractSuccess, setContractSuccess] = useState<string | null>(null);



  // Quick Actions
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const [quickActionSuccess, setQuickActionSuccess] = useState<string | null>(null);

  // Fetch SEWA/ICP status on mount
  useEffect(() => {
    const fetchSewa = async () => {
      setSewaLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/lookup-service/api/v1/chimney/settings/1`, {
          headers: { 'accept': 'application/vnd.api+json' },
        });
        setSewaEnabled(Boolean(res.data?.data?.attributes?.value));
      } catch {
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
      } catch {
        setIcpEnabled(false);
      } finally {
        setIcpLoading(false);
      }
    };
    fetchSewa();
    fetchIcp();
  }, [apiBaseUrl]);

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
      await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
    } catch {}
    finally {
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
      await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
    } catch {}
    finally {
      setIcpUpdating(false);
    }
  };

  // Fetch Receipt
  const handleFetchReceipt = async () => {
    setReceiptLoading(true);
    setReceiptError(null);
    setReceiptSuccess(null);
    try {
      const res = await axios.post(
        `${apiBaseUrl}/workflow-service/api/v1/application/${receiptAppId}/document/fetch?documentType=RECEIPT`,
        {},
        {
          headers: {
            'accept': '*/*',
          },
        }
      );
      setReceiptSuccess('Receipt fetch task registered successfully!');
      setReceiptAppId('');
    } catch (error: any) {
      setReceiptError(error.response?.data?.message || 'Failed to fetch receipt');
    } finally {
      setReceiptLoading(false);
    }
  };

  // Regenerate Contract
  const handleRegenerateContract = async () => {
    setContractLoading(true);
    setContractError(null);
    setContractSuccess(null);
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      
      const res = await axios.get(
        `${apiBaseUrl}/workflow-service/api/v1/application/${applicationId}/document/regenerate?documentType=CONTRACT`,
        {
          headers: {
            ...(accessToken ? { 'sdd-token': accessToken } : {}),
            ...(accountId ? { 'account-id': accountId } : {}),
            'accept': '*/*',
          },
        }
      );
      setContractSuccess('Contract regeneration task registered successfully!');
      setApplicationId('');
    } catch (error: any) {
      setContractError(error.response?.data?.message || 'Failed to regenerate contract');
    } finally {
      setContractLoading(false);
    }
  };

  // Quick Actions
  const handleQuickAction = async (action: string) => {
    setQuickActionLoading(true);
    setQuickActionSuccess(null);
    try {
      if (action === 'clear-cache') {
        await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
        setQuickActionSuccess('Cache cleared successfully!');
      } else if (action === 'refresh-status') {
        // Simulate status refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setQuickActionSuccess('System status refreshed!');
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    } finally {
      setQuickActionLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Container>




        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-muted-foreground" />
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => handleQuickAction('clear-cache')}
              disabled={quickActionLoading}
              className="flex items-center gap-2"
            >
              {quickActionLoading ? (
                <LoaderCircleIcon className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Clear Cache
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction('refresh-status')}
              disabled={quickActionLoading}
              className="flex items-center gap-2"
            >
              {quickActionLoading ? (
                <LoaderCircleIcon className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Status
            </Button>
          </div>
          {quickActionSuccess && (
            <Alert variant="success" className="mt-3">
              <CheckCircle2 className="w-4 h-4" />
              <AlertTitle>{quickActionSuccess}</AlertTitle>
            </Alert>
          )}
        </div>

                {/* Service Controls */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Service Controls
          </h2>
          <Card>              
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SEWA */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${sewaEnabled ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/40 border-border'}`}>
                  <span className={`inline-flex items-center justify-center rounded-full w-8 h-8 ${sewaEnabled ? 'bg-green-200' : 'bg-red-200'}`}>
                    <span className={`w-3 h-3 rounded-full ${sewaEnabled ? 'bg-green-600' : 'bg-red-500'}`}></span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base leading-tight">SEWA</div>
                    <div className="text-sm text-muted-foreground">Sharjah Electricity & Water Authority</div>
                    <Badge variant={sewaEnabled ? 'success' : 'secondary'} className="mt-1">
                      {sewaEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={sewaEnabled ? 'primary' : 'outline'}
                        size="icon"
                        onClick={handleToggleSewa}
                        disabled={sewaLoading || sewaUpdating}
                        aria-label={sewaEnabled ? 'Disable SEWA' : 'Enable SEWA'}
                      >
                        {(sewaLoading || sewaUpdating)
                          ? <LoaderCircleIcon className="animate-spin w-5 h-5" />
                          : <Power className={`w-5 h-5 ${sewaEnabled ? 'text-white' : 'text-muted-foreground'}`} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {sewaEnabled ? 'Disable SEWA' : 'Enable SEWA'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* ICP */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${icpEnabled ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/40 border-border'}`}>
                  <span className={`inline-flex items-center justify-center rounded-full w-8 h-8 ${icpEnabled ? 'bg-green-200' : 'bg-red-200'}`}>
                    <span className={`w-3 h-3 rounded-full ${icpEnabled ? 'bg-green-600' : 'bg-red-500'}`}></span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base leading-tight">ICP</div>
                    <div className="text-sm text-muted-foreground">Identity & Citizenship Portal</div>
                    <Badge variant={icpEnabled ? 'success' : 'secondary'} className="mt-1">
                      {icpEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={icpEnabled ? 'primary' : 'outline'}
                        size="icon"
                        onClick={handleToggleIcp}
                        disabled={icpLoading || icpUpdating}
                        aria-label={icpEnabled ? 'Disable ICP' : 'Enable ICP'}
                      >
                        {(icpLoading || icpUpdating)
                          ? <LoaderCircleIcon className="animate-spin w-5 h-5" />
                          : <Power className={`w-5 h-5 ${icpEnabled ? 'text-white' : 'text-muted-foreground'}`} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {icpEnabled ? 'Disable ICP' : 'Enable ICP'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Operations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            System Operations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fetch Receipt */}
            <Card>
              <CardHeader className="pb-4 pt-5">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Fetch Receipt</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <CardDescription className="text-sm text-muted-foreground">
                  Register a task to download a receipt for a given Application ID.
                </CardDescription>
                <form
                  className="space-y-3"
                  onSubmit={e => {
                    e.preventDefault();
                    handleFetchReceipt();
                  }}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Application ID</label>
                    <Input
                      placeholder="Enter Application ID"
                      value={receiptAppId}
                      onChange={e => setReceiptAppId(e.target.value)}
                      type="number"
                      min={1}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={receiptLoading || !receiptAppId}
                    className="w-full"
                  >
                    {receiptLoading ? (
                      <>
                        <LoaderCircleIcon className="animate-spin w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Fetch Receipt
                      </>
                    )}
                  </Button>
                </form>
                {receiptError && (
                  <Alert variant="destructive">
                    <XCircle className="w-4 h-4" />
                    <AlertTitle>{receiptError}</AlertTitle>
                  </Alert>
                )}
                {receiptSuccess && (
                  <Alert variant="success">
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertTitle>{receiptSuccess}</AlertTitle>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Regenerate Contract */}
            <Card>
              <CardHeader className="pb-4 pt-5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Regenerate Contract</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <CardDescription className="text-sm text-muted-foreground">
                  Register a task to regenerate a contract document for a given Application ID.
                </CardDescription>
                <form
                  className="space-y-3"
                  onSubmit={e => {
                    e.preventDefault();
                    handleRegenerateContract();
                  }}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Application ID</label>
                    <Input
                      placeholder="Enter Application ID"
                      value={applicationId}
                      onChange={e => setApplicationId(e.target.value)}
                      type="number"
                      min={1}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={contractLoading || !applicationId}
                    className="w-full"
                  >
                    {contractLoading ? (
                      <>
                        <LoaderCircleIcon className="animate-spin w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Regenerate Contract
                      </>
                    )}
                  </Button>
                </form>
                {contractError && (
                  <Alert variant="destructive">
                    <XCircle className="w-4 h-4" />
                    <AlertTitle>{contractError}</AlertTitle>
                  </Alert>
                )}
                {contractSuccess && (
                  <Alert variant="success">
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertTitle>{contractSuccess}</AlertTitle>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </TooltipProvider>
  );
} 