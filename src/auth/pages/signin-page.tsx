import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircleIcon, AlertCircle, X, Clipboard, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { AccountDeactivatedDialog } from '@/partials/dialogs/account-deactivated-dialog';
import { toAbsoluteUrl } from '@/lib/helpers';
import { EnvironmentToggle } from '@/components/common/environment-toggle';
import { DevEnvironmentLogin } from '@/auth/components/dev-environment-login';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState('');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [showToken, setShowToken] = useState(false);

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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <EnvironmentToggle />
          </div>
          
          {/* Main Login Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 dark:border-slate-700/50">
            <CardHeader className="text-center pb-8 pt-8">
              <div className="flex justify-center mb-1">
                <img
                  src={toAbsoluteUrl('/media/app/default-logo.svg')}
                  alt="Chimney Logo"
                  className="h-12 dark:brightness-0 dark:invert"
                />
              </div>
              <CardDescription className="text-lg">
                Access your Chimney workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8 bg-gray-50 dark:bg-slate-800/50">
              {error && !showDeactivated && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 dark:text-red-200">{error}</AlertTitle>
                </Alert>
              )}
              
                             <form onSubmit={onSubmit} className="space-y-6">
                 <div className="space-y-4">
                   <label htmlFor="refreshToken" className="block text-sm font-semibold text-foreground">
                     <div className="flex items-center gap-2 mb-3">
                       <Shield className="w-5 h-5 text-primary" />
                       Refresh Token
                     </div>
                   </label>
                   <div className="relative">
                     <Input
                       id="refreshToken"
                       placeholder="Paste your refresh token here"
                       value={refreshToken}
                       onChange={e => setRefreshToken(e.target.value)}
                       type={showToken ? "text" : "password"}
                       autoFocus
                       disabled={isProcessing}
                       className="pr-28 h-14 text-base"
                     />
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       <button
                         type="button"
                         onClick={() => setShowToken(!showToken)}
                         className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                         aria-label={showToken ? "Hide token" : "Show token"}
                       >
                         {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                       <button
                         type="button"
                         onClick={handlePaste}
                         className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                         aria-label="Paste from clipboard"
                       >
                         <Clipboard className="h-4 w-4" />
                       </button>
                       {refreshToken && (
                         <button
                           type="button"
                           onClick={() => setRefreshToken('')}
                           disabled={isProcessing}
                           className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                           aria-label="Clear token"
                         >
                           <X className="h-4 w-4" />
                         </button>
                       )}
                     </div>
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Your refresh token is securely encrypted and never stored in plain text.
                   </p>
                 </div>
                 
                 <Button 
                   type="submit" 
                   className="w-full h-14 text-base font-semibold mt-6" 
                   disabled={isProcessing}
                 >
                   {isProcessing ? (
                     <span className="flex items-center gap-3">
                       <LoaderCircleIcon className="h-5 w-5 animate-spin" />
                       Signing in...
                     </span>
                   ) : (
                     <span className="flex items-center gap-3">
                       <Lock className="h-5 w-5" />
                       Sign In
                     </span>
                   )}
                 </Button>
               </form>
            </CardContent>
            
            <div className="border-t border-border bg-white dark:bg-slate-900 dark:border-slate-700">
              <div className="px-8 py-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Need help signing in?
                  </p>
                  <div className="flex justify-center gap-6 text-sm">
                    <a 
                      href="mailto:support@chimney.com" 
                      className="text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Contact Support
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a 
                      href="#" 
                      className="text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Documentation
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Dev Environment Login Card */}
          <DevEnvironmentLogin />
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
