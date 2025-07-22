import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEnvironment } from '@/providers/environment-provider';
import axios from 'axios';
import { LoaderCircleIcon, Power, CheckCircle2, XCircle } from 'lucide-react';

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
      } else {
        setReceiptSuccess('Receipt download task registered successfully!');
        setReceiptAppId('');
      }
    } catch (e: any) {
      setReceiptError(e.response?.data?.message || e.message);
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
      } else {
        setContractSuccess('Contract regeneration task registered successfully!');
        setApplicationId('');
      }
    } catch (e: any) {
      setContractError(e.response?.data?.message || e.message);
    } finally {
      setContractLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-screen-md px-4 flex flex-col gap-3">
        <div className="mb-2">
          <h1 className="text-2xl font-bold mb-1 tracking-tight">Tools & Utilities</h1>
          <p className="text-muted-foreground text-base mb-2">Admin tools for troubleshooting, integration toggles, and backend operations.</p>
        </div>
        {/* Service Controls - Chimney style */}
        <Card className="shadow-md border border-accent/40">
          <div className="p-6 pb-2">
            <div className="text-lg font-semibold mb-1">Service Controls</div>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
              {/* SEWA */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border border-accent/20 min-w-[260px] grow transition-colors ${sewaEnabled ? 'bg-green-50' : 'bg-muted/40'}`}>
                <span className={`inline-flex items-center justify-center rounded-full w-7 h-7 ${sewaEnabled ? 'bg-green-200' : 'bg-red-200'}`}>
                  <span className={`w-3 h-3 rounded-full ${sewaEnabled ? 'bg-green-600' : 'bg-red-500'}`}></span>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base leading-tight">SEWA</div>
                  <div className="text-xs text-muted-foreground truncate">Sharjah Electricity & Water Authority</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={sewaEnabled ? 'primary' : 'outline'}
                        size="icon"
                        shape="circle"
                        className="shadow-sm"
                        onClick={handleToggleSewa}
                        disabled={sewaLoading || sewaUpdating}
                        aria-label={sewaEnabled ? 'Disable SEWA' : 'Enable SEWA'}
                      >
                        {(sewaLoading || sewaUpdating)
                          ? <LoaderCircleIcon className="animate-spin w-5 h-5" />
                          : <Power className={`w-5 h-5 ${sewaEnabled ? 'text-white' : 'text-muted-foreground'}`} />}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {sewaEnabled ? 'Disable SEWA' : 'Enable SEWA'}
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* ICP */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border border-accent/20 min-w-[260px] grow transition-colors ${icpEnabled ? 'bg-green-50' : 'bg-muted/40'}`}>
                <span className={`inline-flex items-center justify-center rounded-full w-7 h-7 ${icpEnabled ? 'bg-green-200' : 'bg-red-200'}`}>
                  <span className={`w-3 h-3 rounded-full ${icpEnabled ? 'bg-green-600' : 'bg-red-500'}`}></span>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base leading-tight">ICP</div>
                  <div className="text-xs text-muted-foreground truncate">Identity & Citizenship Portal</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={icpEnabled ? 'primary' : 'outline'}
                        size="icon"
                        shape="circle"
                        className="shadow-sm"
                        onClick={handleToggleIcp}
                        disabled={icpLoading || icpUpdating}
                        aria-label={icpEnabled ? 'Disable ICP' : 'Enable ICP'}
                      >
                        {(icpLoading || icpUpdating)
                          ? <LoaderCircleIcon className="animate-spin w-5 h-5" />
                          : <Power className={`w-5 h-5 ${icpEnabled ? 'text-white' : 'text-muted-foreground'}`} />}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {icpEnabled ? 'Disable ICP' : 'Enable ICP'}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>
        <div className="border-t border-dashed border-accent/30" />
        {/* Fetch Receipt */}
        <Card className="shadow-md border border-accent/40">
          <CardHeader className="pb-2">
            <CardTitle>Fetch Receipt</CardTitle>
            <CardDescription>
              Register a task to download a receipt for a given Application ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col sm:flex-row gap-3 items-center"
              onSubmit={e => {
                e.preventDefault();
                handleFetchReceipt();
              }}
            >
              <Input
                placeholder="Application ID"
                value={receiptAppId}
                onChange={e => setReceiptAppId(e.target.value)}
                className="max-w-xs"
                type="number"
                min={1}
                required
              />
              <Button type="submit" variant="primary" size="sm" disabled={receiptLoading || !receiptAppId}>
                {receiptLoading ? <LoaderCircleIcon className="animate-spin w-4 h-4 mr-1" /> : 'Fetch'}
              </Button>
            </form>
            {receiptError && (
              <Alert variant="destructive" appearance="light" className="mt-3">
                <AlertIcon />
                <AlertTitle>{receiptError}</AlertTitle>
              </Alert>
            )}
            {receiptSuccess && (
              <Alert variant="success" appearance="light" className="mt-3">
                <AlertIcon />
                <AlertTitle>{receiptSuccess}</AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>
        <div className="border-t border-dashed border-accent/30" />
        {/* Regenerate Contract */}
        <Card className="shadow-md border border-accent/40">
          <CardHeader className="pb-2">
            <CardTitle>Regenerate Contract</CardTitle>
            <CardDescription>
              Register a task to regenerate a contract document for a given Application ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col sm:flex-row gap-3 items-center"
              onSubmit={e => {
                e.preventDefault();
                handleRegenerateContract();
              }}
            >
              <Input
                placeholder="Application ID"
                value={applicationId}
                onChange={e => setApplicationId(e.target.value)}
                className="max-w-xs"
                type="number"
                min={1}
                required
              />
              <Button type="submit" variant="primary" size="sm" disabled={contractLoading || !applicationId}>
                {contractLoading ? <LoaderCircleIcon className="animate-spin w-4 h-4 mr-1" /> : 'Regenerate'}
              </Button>
            </form>
            {contractError && (
              <Alert variant="destructive" appearance="light" className="mt-3">
                <AlertIcon />
                <AlertTitle>{contractError}</AlertTitle>
              </Alert>
            )}
            {contractSuccess && (
              <Alert variant="success" appearance="light" className="mt-3">
                <AlertIcon />
                <AlertTitle>{contractSuccess}</AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
} 