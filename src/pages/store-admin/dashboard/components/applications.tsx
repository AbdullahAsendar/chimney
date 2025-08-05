import { Link } from 'react-router';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface IApplicationItem {
  badgeColor:
    | 'success'
    | 'warning'
    | 'destructive'
    | 'primary'
    | 'secondary'
    | 'info'
    | null
    | undefined;
  label: string;
  count: number;
  icon: React.ComponentType<any>;
}

interface IApplicationRow {
  id: string;
  customerName: string;
  type: string;
  status: string;
  submittedDate: string;
  priority: 'high' | 'medium' | 'low';
}

export function Applications() {
  const items: IApplicationItem[] = [
    { badgeColor: 'success', label: 'Approved', count: 456, icon: CheckCircle },
    { badgeColor: 'warning', label: 'Under Review', count: 123, icon: Clock },
    { badgeColor: 'destructive', label: 'Rejected', count: 34, icon: XCircle },
    { badgeColor: 'info', label: 'Pending Documents', count: 67, icon: AlertCircle },
  ];

  const recentApplications: IApplicationRow[] = [
    { 
      id: 'APP-2024-001', 
      customerName: 'Ahmed Al Mansouri', 
      type: 'Property Registration', 
      status: 'Under Review', 
      submittedDate: '2 hours ago',
      priority: 'high'
    },
    { 
      id: 'APP-2024-002', 
      customerName: 'Fatima Al Zaabi', 
      type: 'License Renewal', 
      status: 'Approved', 
      submittedDate: '1 day ago',
      priority: 'medium'
    },
    { 
      id: 'APP-2024-003', 
      customerName: 'Mohammed Al Qasimi', 
      type: 'New Permit', 
      status: 'Pending Documents', 
      submittedDate: '3 days ago',
      priority: 'low'
    },
    { 
      id: 'APP-2024-004', 
      customerName: 'Aisha Al Falasi', 
      type: 'Property Transfer', 
      status: 'Rejected', 
      submittedDate: '1 week ago',
      priority: 'high'
    },
  ];

  const renderItem = (item: IApplicationItem, index: number) => (
    <div key={index} className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge appearance="ghost" variant={item.badgeColor}>
          <BadgeDot className="size-2" />
        </Badge>
        <span className="text-sm font-normal text-foreground">{item.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <item.icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{item.count}</span>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Under Review': return 'warning';
      case 'Rejected': return 'destructive';
      case 'Pending Documents': return 'info';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const renderApplicationRow = (application: IApplicationRow, index: number) => (
    <div
      key={index}
      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{application.id}</span>
          <Badge variant={getPriorityColor(application.priority)} className="text-xs">
            {application.priority}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{application.customerName}</span>
        <span className="text-xs text-muted-foreground">{application.type}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge variant={getStatusColor(application.status)} className="text-xs">
          {application.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{application.submittedDate}</span>
      </div>
    </div>
  );

  const totalApplications = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Applications
        </CardTitle>
        <Button mode="link" asChild>
          <Link to="/applications">View All</Link>
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            Total Applications
          </span>
          <span className="text-3xl font-semibold text-mono">{totalApplications.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1 mb-1.5">
          <Badge
            variant="success"
            className="h-2 w-full max-w-[50%] rounded-xs"
          ></Badge>
          <Badge
            variant="warning"
            className="h-2 w-full max-w-[25%] rounded-xs"
          ></Badge>
          <Badge
            variant="destructive"
            className="h-2 w-full max-w-[15%] rounded-xs"
          ></Badge>
          <Badge
            variant="info"
            className="h-2 w-full max-w-[10%] rounded-xs"
          ></Badge>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recent Submissions</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/applications">View All</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentApplications.map((application, index) => {
              return renderApplicationRow(application, index);
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 