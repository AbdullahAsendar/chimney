import { Link } from 'react-router';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Server, Database, Globe, Shield, Zap } from 'lucide-react';

interface ISystemMetric {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'error';
  icon: React.ComponentType<any>;
}

interface ISystemAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export function SystemHealth() {
  const metrics: ISystemMetric[] = [
    { name: 'API Response Time', value: '45ms', status: 'good', icon: Zap },
    { name: 'Database Status', value: 'Online', status: 'good', icon: Database },
    { name: 'Server Load', value: '67%', status: 'warning', icon: Server },
    { name: 'Active Connections', value: '1,234', status: 'good', icon: Globe },
    { name: 'Security Status', value: 'Protected', status: 'good', icon: Shield },
    { name: 'Cache Hit Rate', value: '89%', status: 'good', icon: Activity },
  ];

  const alerts: ISystemAlert[] = [
    { 
      id: 'ALT-001', 
      message: 'High server load detected', 
      severity: 'medium', 
      timestamp: '5 minutes ago' 
    },
    { 
      id: 'ALT-002', 
      message: 'Database backup completed', 
      severity: 'low', 
      timestamp: '1 hour ago' 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const renderMetric = (metric: ISystemMetric, index: number) => (
    <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <metric.icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{metric.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{metric.value}</span>
        <Badge variant={getStatusColor(metric.status)} className="text-xs">
          {metric.status}
        </Badge>
      </div>
    </div>
  );

  const renderAlert = (alert: ISystemAlert, index: number) => (
    <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-sm font-medium">{alert.message}</span>
        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
      </div>
      <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
        {alert.severity}
      </Badge>
    </div>
  );

  const overallStatus = metrics.every(m => m.status === 'good') ? 'good' : 
                       metrics.some(m => m.status === 'error') ? 'error' : 'warning';

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
        <Button mode="link" asChild>
          <Link to="/utilities/tools">View Details</Link>
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-normal text-secondary-foreground">
            Overall Status
          </span>
          <Badge variant={getStatusColor(overallStatus)} className="text-sm">
            {overallStatus === 'good' ? 'Healthy' : overallStatus === 'warning' ? 'Warning' : 'Critical'}
          </Badge>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">System Metrics</span>
          <div className="space-y-2">
            {metrics.map((metric, index) => {
              return renderMetric(metric, index);
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recent Alerts</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/utilities/tools">View All</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => {
              return renderAlert(alert, index);
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 