import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon, AlertCircle, X, Clipboard } from 'lucide-react';
import { AccountDeactivatedDialog } from '@/partials/dialogs/account-deactivated-dialog';
import { toAbsoluteUrl } from '@/lib/helpers';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState('');
  const [showDeactivated, setShowDeactivated] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (errorParam) {
      setError(errorDescription || 'Authentication error. Please try again.');
    }
  }, [searchParams]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRefreshToken(text);
    } catch {
      setError('Failed to read clipboard.');
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setError(null);
    setShowDeactivated(false);
    try {
      if (!refreshToken.trim()) {
        setError('Refresh token is required');
        return;
      }
      await login(refreshToken);
      const nextPath = searchParams.get('next') || '/';
      navigate(nextPath, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'NO_ACCOUNT') {
        setShowDeactivated(true);
      } else {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            alt="Chimney Logo"
            className="w-16 h-16 mb-4"
          />
          <h1 className="text-2xl font-bold text-center mb-1 tracking-tight">Sign in to Chimney</h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            Workflow management tool.
          </p>
          <form onSubmit={onSubmit} className="w-full space-y-5">
            {error && !showDeactivated && (
              <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}
            <div className="flex flex-col gap-3.5">
              <label htmlFor="refreshToken" className="block text-sm font-medium mb-1">
                Refresh Token
              </label>
              <div className="relative">
                <Input
                  id="refreshToken"
                  placeholder="Paste your refresh token here"
                  value={refreshToken}
                  onChange={e => setRefreshToken(e.target.value)}
                  type="text"
                  autoFocus
                  disabled={isProcessing}
                  className="pr-28" // increased padding for two buttons
                />
                
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                
                {refreshToken && (
                <button
                  type="button"
                  onClick={() => setRefreshToken('')}
                  disabled={isProcessing}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  style={{ minWidth: 'auto', height: '28px', width: '28px' }}
                  aria-label="Paste from Clipboard"
                >
                  <X className="h-4 w-4" />
                </button>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Loading...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-8 text-xs text-muted-foreground text-center">
            Need help? <a href="mailto:support@chimney.com" className="text-primary underline">Contact support</a>
          </div>
        </div>
      </div>
      <AccountDeactivatedDialog
        open={showDeactivated}
        onOpenChange={() => setShowDeactivated(false)}
      />
    </>
  );
}
