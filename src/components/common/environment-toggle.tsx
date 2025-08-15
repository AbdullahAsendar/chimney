import { useEnvironment } from '@/providers/environment-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Server, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Environment = 'local' | 'dev' | 'stg' | 'prod';

export function EnvironmentToggle() {
  const { environment, setEnvironment } = useEnvironment();

  const environments: Array<{
    key: Environment;
    label: string;
    shortLabel: string;
    description: string;
    url: string;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: any;
    isProduction: boolean;
  }> = [
    {
      key: 'local',
      label: 'Local',
      shortLabel: 'LOCAL',
      description: 'Local development server',
      url: 'http://localhost:8080',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: Server,
      isProduction: false,
    },
    {
      key: 'dev',
      label: 'Development',
      shortLabel: 'DEV',
      description: 'Development environment',
      url: 'https://dev-api-realestate-ds.sharjah.ae',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      icon: Server,
      isProduction: false,
    },
    {
      key: 'stg',
      label: 'Staging',
      shortLabel: 'STG',
      description: 'Staging environment',
      url: 'https://stg-api-aqari.ds.sharjah.ae',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      icon: Server,
      isProduction: false,
    },
    {
      key: 'prod',
      label: 'Production',
      shortLabel: 'PROD',
      description: 'Live production environment',
      url: 'https://api-aqari.ds.sharjah.ae',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      icon: AlertTriangle,
      isProduction: true,
    },
  ];

  const currentEnv = environments.find(env => env.key === environment) || environments[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 h-8 px-4",
            currentEnv.borderColor,
            currentEnv.bgColor,
            currentEnv.textColor
          )}
        >
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium opacity-75 leading-none">{currentEnv.shortLabel}</span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-3"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Select Environment
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        
        {environments.map((env) => {
          const IconComponent = env.icon;
          const isActive = environment === env.key;
          
          return (
                         <DropdownMenuItem 
               key={env.key}
               onClick={() => setEnvironment(env.key)}
               className={cn(
                 "flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer mb-1",
                 "hover:bg-muted/50 focus:bg-muted/50",
                 isActive && "bg-muted/80 border border-border"
               )}
             >
                             <div className="flex items-center gap-3 flex-1 min-w-0">
                 <div className={cn(
                   "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                   env.bgColor,
                   env.borderColor,
                   "border"
                 )}>
                   <IconComponent className={cn("h-4 w-4", env.textColor)} />
                 </div>
                 
                 <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{env.label}</span>
                    {isActive && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                    {env.isProduction && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {env.description}
                  </p>
                                     <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <ExternalLink className="h-3 w-3 flex-shrink-0" />
                     <span className="font-mono truncate max-w-32">{env.url}</span>
                   </div>
                </div>
              </div>
              
                             <Badge 
                 variant="outline" 
                 className={cn(
                   "text-xs font-bold border-0 px-2 py-0.5 ml-2 flex-shrink-0",
                   env.color,
                   "text-white shadow-sm"
                 )}
               >
                 {env.shortLabel}
               </Badge>
            </DropdownMenuItem>
          );
        })}
        
                 <DropdownMenuSeparator className="my-2" />
         <div className="px-2 py-1.5">
           <p className="text-xs text-muted-foreground text-center">
             Environment settings are saved locally
           </p>
         </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 