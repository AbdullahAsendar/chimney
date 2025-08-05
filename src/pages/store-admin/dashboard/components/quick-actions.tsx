import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  FileText, 
  Settings, 
  RefreshCw, 
  Download, 
  Upload, 
  Users,
  Building2,
  Briefcase
} from 'lucide-react';

interface IQuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  link: string;
  badge?: string;
  variant?: 'outline' | 'secondary' | 'primary';
}

export function QuickActions() {
  const actions: IQuickAction[] = [
    {
      title: 'Add Customer',
      description: 'Register new customer',
      icon: Plus,
      link: '/customers',
      badge: 'New',
      variant: 'primary'
    },
    {
      title: 'Create Application',
      description: 'Submit new application',
      icon: FileText,
      link: '/applications',
      badge: 'Quick',
      variant: 'outline'
    },
    {
      title: 'Assign Task',
      description: 'Create worker task',
      icon: Briefcase,
      link: '/worker-tasks',
      variant: 'outline'
    },
    {
      title: 'Search Records',
      description: 'Find customers & applications',
      icon: Search,
      link: '/customers',
      variant: 'secondary'
    },
    {
      title: 'Export Data',
      description: 'Download reports',
      icon: Download,
      link: '/utilities/tools',
      variant: 'secondary'
    },
    {
      title: 'System Settings',
      description: 'Configure platform',
      icon: Settings,
      link: '/utilities/tools',
      variant: 'secondary'
    },
  ];

  const renderAction = (action: IQuickAction, index: number) => (
    <Button
      key={index}
      variant={action.variant || 'outline'}
      className="w-full justify-start h-auto p-3"
      asChild
    >
      <Link to={action.link}>
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <action.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col items-start flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{action.title}</span>
              {action.badge && (
                <Badge variant="secondary" className="text-xs">
                  {action.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{action.description}</span>
          </div>
        </div>
      </Link>
    </Button>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-5 lg:p-7.5 lg:pt-4">
        <div className="space-y-2">
          {actions.map((action, index) => {
            return renderAction(action, index);
          })}
        </div>

        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Need help? Contact support for assistance
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 