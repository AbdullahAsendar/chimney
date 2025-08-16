import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Container } from '@/components/common/container';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


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
  const [seddEnabled, setSeddEnabled] = useState(false);
  const [sewaLoading, setSewaLoading] = useState(true);
  const [icpLoading, setIcpLoading] = useState(true);
  const [seddLoading, setSeddLoading] = useState(true);
  const [sewaUpdating, setSewaUpdating] = useState(false);
  const [icpUpdating, setIcpUpdating] = useState(false);
  const [seddUpdating, setSeddUpdating] = useState(false);
  
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

  // Dev Environment Login
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [devUsersLoading, setDevUsersLoading] = useState(false);
  const [devUsersError, setDevUsersError] = useState<string | null>(null);
  const [selectedDevUser, setSelectedDevUser] = useState<string>('');
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Function to fetch dev users
  const fetchDevUsers = async () => {
    setDevUsersLoading(true);
    setDevUsersError(null);
    try {
      const res = await axios.get(`${apiBaseUrl}/authentication-service/api/v1/auth/sdd/mock-users`, {
        headers: {
          'accept': '*/*'
        }
      });
      
      // Handle different possible response structures
      let users = [];
      if (Array.isArray(res.data)) {
        users = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        users = res.data.data;
      } else if (res.data && Array.isArray(res.data.result)) {
        users = res.data.result;
      } else if (res.data && typeof res.data === 'object') {
        // If it's an object, try to find an array property
        const possibleArrays = Object.values(res.data).filter(val => Array.isArray(val));
        users = possibleArrays.length > 0 ? possibleArrays[0] : [];
      }
      

      
      setDevUsers(users);
    } catch (error) {
      console.error('Failed to fetch dev users:', error);
      setDevUsersError('Failed to load dev users');
      setDevUsers([]);
    } finally {
      setDevUsersLoading(false);
    }
  };

  // Function to login to Aqari
  const handleLoginToAqari = async () => {
    if (!selectedDevUser || !Array.isArray(devUsers)) return;
    
    const user = devUsers.find(u => (u.id || u.uuid) === selectedDevUser);
    if (!user) return;
    
    setLoginLoading(true);
    try {
      const response = await axios.post(
        `${apiBaseUrl}/authentication-service/api/v1/auth/sdd/mock-users/token/encode`,
        {
          idType: user.idType || "ID",
          sub: user.uuid || user.id || user.userId,
          lastnameEN: user.lastnameEN || user.lastName || user.last_name || "",
          firstnameEN: user.firstnameEN || user.firstName || user.first_name || "",
          nationalityAR: user.nationalityAR || "",
          idn: user.idn || user.id || user.userId || "",
          userType: user.userType || user.type || "",
          fullnameAR: user.fullnameAR || "",
          email: user.email || "",
          fullnameEN: user.fullnameEN || user.fullName || user.name || "",
          firstnameAR: user.firstnameAR || "",
          domain: user.domain || null,
          nationalityEN: user.nationalityEN || "",
          gender: user.gender || "",
          lastnameAR: user.lastnameAR || "",
          uuid: user.uuid || user.id || user.userId || "",
          fbToken: user.fbToken || "",
          mobile: user.mobile || user.phone || "",
          fullMobile: user.fullMobile || user.mobile || user.phone || "",
          userId: user.userId || user.id || user.uuid || "",
          townNo: user.townNo || null,
          familyNo: user.familyNo || null,
          cardHolderSignatureImage: user.cardHolderSignatureImage || null,
          photo: user.photo || null,
          dob: user.dob || null,
          passportNumber: user.passportNumber || null,
          acr: user.acr || null
        },
        {
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { code } = response.data;
              if (code) {
          // Create the login URL
          const loginUrlHttps = `https://dev-realestate-ds.sharjah.ae/?c=${code}`;
          
          // Set the login URL for display
          setLoginUrl(loginUrlHttps);
        }
    } catch (error) {
      console.error('Failed to login to Aqari:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoginLoading(false);
    }
  };


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
    const fetchSedd = async () => {
      setSeddLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/lookup-service/api/v1/chimney/settings/3`, {
          headers: { 'accept': 'application/vnd.api+json' },
        });
        setSeddEnabled(Boolean(res.data?.data?.attributes?.value));
      } catch {
        setSeddEnabled(false);
      } finally {
        setSeddLoading(false);
      }
    };
    fetchSewa();
    fetchIcp();
    fetchSedd();
    fetchDevUsers();
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
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      
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
            ...(accessToken ? { 'sdd-token': accessToken } : {}),
            ...(accountId ? { 'account-id': accountId } : {}),
            'accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        }
      );
      setIcpEnabled(newValue);
      await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
    } catch (error) {
      console.error('Failed to update ICP setting:', error);
    } finally {
      setIcpUpdating(false);
    }
  };

  // PATCH SEDD
  const handleToggleSedd = async () => {
    setSeddUpdating(true);
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      
      const newValue = !seddEnabled;
      await axios.patch(
        `${apiBaseUrl}/lookup-service/api/v1/chimney/settings/3`,
        {
          data: {
            type: 'settings',
            id: '3',
            attributes: { value: newValue },
          },
        },
        {
          headers: {
            ...(accessToken ? { 'sdd-token': accessToken } : {}),
            ...(accountId ? { 'account-id': accountId } : {}),
            'accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
        }
      );
      setSeddEnabled(newValue);
      await axios.get(`${apiBaseUrl}/lookup-service/cache/evict`);
    } catch (error) {
      console.error('Failed to update SEDD setting:', error);
    } finally {
      setSeddUpdating(false);
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

  // Copy login URL to clipboard
  const handleCopyLoginUrl = async () => {
    if (loginUrl) {
      try {
        await navigator.clipboard.writeText(loginUrl);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                {/* SEDD */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${seddEnabled ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/40 border-border'}`}>
                  <span className={`inline-flex items-center justify-center rounded-full w-8 h-8 ${seddEnabled ? 'bg-green-200' : 'bg-red-200'}`}>
                    <span className={`w-3 h-3 rounded-full ${seddEnabled ? 'bg-green-600' : 'bg-red-500'}`}></span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base leading-tight">SEDD</div>
                    <div className="text-sm text-muted-foreground">Sharjah Economic Development Department</div>
                    <Badge variant={seddEnabled ? 'success' : 'secondary'} className="mt-1">
                      {seddEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={seddEnabled ? 'primary' : 'outline'}
                        size="icon"
                        onClick={handleToggleSedd}
                        disabled={seddLoading || seddUpdating}
                        aria-label={seddEnabled ? 'Disable SEDD' : 'Enable SEDD'}
                      >
                        {(seddLoading || seddUpdating)
                          ? <LoaderCircleIcon className="animate-spin w-5 h-5" />
                          : <Power className={`w-5 h-5 ${seddEnabled ? 'text-white' : 'text-muted-foreground'}`} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {seddEnabled ? 'Disable SEDD' : 'Enable SEDD'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Utils */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            Application Utils
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

        {/* Dev Environment Login */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Dev Environment Login
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <Card className="col-span-full">
              <CardHeader className="pb-4 pt-5">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">User Selection</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6">
                <CardDescription className="text-sm text-muted-foreground">
                  Select a user from the development environment for testing purposes.
                </CardDescription>
                
                {/* Enhanced User Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select User</label>
                    <div className="relative">
                      <Button
                        variant="outline"
                        onClick={() => setDropdownOpen(true)}
                        className="w-full justify-between px-4 py-4 h-auto min-h-[56px] text-left font-normal text-base"
                        disabled={devUsersLoading}
                      >
                        {(() => {
                          if (!selectedDevUser) return "Choose a user...";
                          if (!Array.isArray(devUsers)) return "Choose a user...";
                          const user = devUsers.find(u => (u.id || u.uuid) === selectedDevUser);
                          if (!user) return "Choose a user...";
                          const displayName = user.firstnameEN || user.firstName || user.name || user.username || 'Unknown User';
                          const userType = user.userType || user.type || 'Unknown';
                          return `${displayName} (${userType})`;
                        })()}
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* User Selection Modal */}
                  <Dialog open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" close={false}>
                      <DialogHeader>
                        <div className="flex items-center justify-between">
                          <DialogTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Select Development User
                          </DialogTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDevUsers}
                            disabled={devUsersLoading}
                            className="flex items-center gap-2"
                          >
                            {devUsersLoading ? (
                              <LoaderCircleIcon className="animate-spin w-4 h-4" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Refresh Users
                          </Button>
                        </div>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                          <Input
                            placeholder="Search users by name, email, or type..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        {/* Users List */}
                        <div className="max-h-[60vh] overflow-y-auto space-y-2">
                          {(() => {
                            if (!Array.isArray(devUsers)) return null;
                            
                            const filteredUsers = devUsers.filter(user => {
                              if (!searchQuery) return true;
                              const displayName = user.firstnameEN || user.firstName || user.name || user.username || '';
                              const userType = user.userType || user.type || '';
                              const email = user.email || '';
                              const searchLower = searchQuery.toLowerCase();
                              return displayName.toLowerCase().includes(searchLower) ||
                                     userType.toLowerCase().includes(searchLower) ||
                                     email.toLowerCase().includes(searchLower);
                            });

                            if (filteredUsers.length === 0) {
                              return (
                                <div className="text-center py-8 text-muted-foreground">
                                  <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <p className="text-lg font-medium">No users found</p>
                                  <p className="text-sm">Try adjusting your search criteria</p>
                                </div>
                              );
                            }

                            return filteredUsers.map((user, index) => {
                              const displayName = user.firstnameEN || user.firstName || user.name || user.username || `User ${index + 1}`;
                              const userType = user.userType || user.type || 'Unknown';
                              const email = user.email || 'No email';
                              const userId = user.userId || user.id || user.uuid || 'N/A';
                              const mobile = user.mobile || user.phone || 'No phone';
                              const isSelected = (user.id || user.uuid) === selectedDevUser;
                              
                              return (
                                <div
                                  key={user.userId || user.uuid || index}
                                  onClick={() => {
                                    setSelectedDevUser(user.id || user.uuid || index);
                                    setDropdownOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className={`p-6 cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md ${
                                    isSelected 
                                      ? 'bg-primary/5 border-primary/30 shadow-md' 
                                      : 'bg-background border-border hover:border-primary/20'
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                                      {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="font-semibold text-lg text-foreground">{displayName}</div>
                                        {isSelected && (
                                          <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                                        )}
                                                                                 <Badge variant={isSelected ? "primary" : "secondary"} className="text-xs">
                                          {userType}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                          </svg>
                                          {email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                          </svg>
                                          {mobile}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                          </svg>
                                          ID: {userId}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Loading State */}
                  {devUsersLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <LoaderCircleIcon className="animate-spin w-5 h-5" />
                        <span className="text-sm font-medium">Loading users...</span>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {devUsersError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                      <XCircle className="w-4 h-4" />
                      <AlertTitle className="text-red-800 dark:text-red-200">{devUsersError}</AlertTitle>
                    </Alert>
                  )}

                  {/* User Count */}
                  {Array.isArray(devUsers) && devUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{devUsers.length} users available</span>
                    </div>
                  )}

                  {/* Selected User */}
                  {selectedDevUser && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {(() => {
                            if (!Array.isArray(devUsers)) return '?';
                            const user = devUsers.find(u => (u.id || u.uuid) === selectedDevUser);
                            if (!user) return '?';
                            const name = user.fullnameEN || user.fullName || user.name || user.firstName || 'User';
                            return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {(() => {
                              if (!Array.isArray(devUsers)) return 'Unknown User';
                              const user = devUsers.find(u => (u.id || u.uuid) === selectedDevUser);
                              if (!user) return 'Unknown User';
                              return user.fullnameEN || user.fullName || user.name || user.firstName || 'Unknown User';
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {(() => {
                              if (!Array.isArray(devUsers)) return 'Unknown';
                              const user = devUsers.find(u => (u.id || u.uuid) === selectedDevUser);
                              if (!user) return 'Unknown';
                              return user.userType || user.type || 'Unknown';
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      {loginLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <LoaderCircleIcon className="animate-spin w-3 h-3" />
                          Generating login URL...
                        </div>
                      ) : loginUrl ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={loginUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                          >
                            {loginUrl}
                          </a>
                          <Button
                            onClick={handleCopyLoginUrl}
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-6 px-2"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleLoginToAqari}
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1"
                        >
                          Generate Login URL
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </TooltipProvider>
  );
} 