import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardFooter } from '@/components/ui/card';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { useEnvironment } from '@/providers/environment-provider';
import axios from 'axios';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

export default function ClearCachePage() {
  const { apiBaseUrl } = useEnvironment();
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(SERVICES.map(s => [s, { loading: false }]))
  );
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [rowSuccess, setRowSuccess] = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(SERVICES.map(s => [s, null]))
  );
  const [clearingAll, setClearingAll] = useState(false);

  const handleClearCache = async (service: string) => {
    setRowStates(prev => ({ ...prev, [service]: { loading: true } }));
    setRowSuccess(prev => ({ ...prev, [service]: null }));
    try {
      const res = await axios.get(`${apiBaseUrl}/${service}/cache/evict`);
      if (res.status === 200) {
        setSnackbar({ open: true, message: `Cache cleared successfully for ${service}!`, severity: 'success' });
        setRowSuccess(prev => ({ ...prev, [service]: true }));
      } else {
        setSnackbar({ open: true, message: `Failed to clear cache for ${service}: ${res.statusText}`, severity: 'error' });
        setRowSuccess(prev => ({ ...prev, [service]: false }));
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: `Network error for ${service}: ${e.response?.data || e.message}`, severity: 'error' });
      setRowSuccess(prev => ({ ...prev, [service]: false }));
    } finally {
      setRowStates(prev => ({ ...prev, [service]: { loading: false } }));
      setTimeout(() => setRowSuccess(prev => ({ ...prev, [service]: null })), 1200);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    const results: { service: string; ok: boolean }[] = [];
    await Promise.all(
      SERVICES.map(async (service) => {
        setRowStates(prev => ({ ...prev, [service]: { loading: true } }));
        setRowSuccess(prev => ({ ...prev, [service]: null }));
        try {
          const res = await axios.get(`${apiBaseUrl}/${service}/cache/evict`);
          if (res.status === 200) {
            setRowSuccess(prev => ({ ...prev, [service]: true }));
            results.push({ service, ok: true });
          } else {
            setRowSuccess(prev => ({ ...prev, [service]: false }));
            results.push({ service, ok: false });
          }
        } catch {
          setRowSuccess(prev => ({ ...prev, [service]: false }));
          results.push({ service, ok: false });
        } finally {
          setRowStates(prev => ({ ...prev, [service]: { loading: false } }));
        }
      })
    );
    setClearingAll(false);
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) {
      setSnackbar({ open: true, message: 'All caches cleared successfully!', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: `Some caches failed: ${failed.map(f => f.service).join(', ')}`, severity: 'error' });
    }
    setTimeout(() => setRowSuccess(Object.fromEntries(SERVICES.map(s => [s, null]))), 1200);
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <Card>
          <CardHeader className="pb-4 pt-6 px-6">
            <CardHeading>Clear Service Cache</CardHeading>
            <div className="text-muted-foreground text-sm mt-1 mb-2">
              Use this tool to clear the cache for individual backend services. This is useful for troubleshooting or after deployments. <br />
              <span className="text-xs text-accent-foreground">Note: This action cannot be undone.</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="mt-2 w-fit"
              onClick={handleClearAll}
              disabled={clearingAll || SERVICES.some(s => rowStates[s].loading)}
            >
              {clearingAll ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {clearingAll ? 'Clearing All...' : 'Clear All'}
            </Button>
          </CardHeader>
          <CardTable>
            <div className="overflow-x-auto rounded-lg border border-accent bg-background">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-2 px-4 font-semibold">Service</th>
                    <th className="text-right py-2 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map(service => (
                    <tr
                      key={service}
                      className={cn(
                        'border-b last:border-0 transition-colors',
                        'odd:bg-muted/30 even:bg-background',
                        'hover:bg-accent/30',
                        rowSuccess[service] === true && 'bg-green-100 animate-pulse',
                        rowSuccess[service] === false && 'bg-red-100 animate-pulse',
                        'rounded-lg'
                      )}
                    >
                      <td className="py-2 px-4 flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize text-xs px-2 py-1 rounded-md">
                          {service.replace('-service', '')}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="inline-flex items-center gap-2"
                                onClick={() => handleClearCache(service)}
                                disabled={rowStates[service].loading || clearingAll}
                              >
                                {rowStates[service].loading ? (
                                  <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                {rowStates[service].loading ? 'Clearing...' : 'Clear Cache'}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Clear the cache for <span className="font-semibold">{service}</span> only.
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardTable>
          <CardFooter>
            <div className="text-muted-foreground text-xs">Use this tool to clear the cache for individual backend services.</div>
          </CardFooter>
        </Card>
        {/* Toast/Alert at top-right */}
        {snackbar?.open && (
          <div className="fixed top-6 right-6 z-50 min-w-[260px]">
            <Alert variant={snackbar.severity === 'success' ? 'success' : 'destructive'} appearance="light" onClose={() => setSnackbar(null)}>
              <AlertIcon />
              <AlertTitle>{snackbar.message}</AlertTitle>
            </Alert>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 