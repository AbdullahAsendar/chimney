import { Link } from 'react-router';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';

interface ICustomerItem {
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

interface ICustomerRow {
  name: string;
  status: string;
  lastActivity: string;
  applications: number;
}

export function Customers() {
  const items: ICustomerItem[] = [
    { badgeColor: 'success', label: 'Active Customers', count: 1247, icon: UserCheck },
    { badgeColor: 'warning', label: 'Pending Verification', count: 89, icon: UserPlus },
    { badgeColor: 'destructive', label: 'Suspended', count: 23, icon: UserX },
  ];

  const recentCustomers: ICustomerRow[] = [
    { name: 'Ahmed Al Mansouri', status: 'Active', lastActivity: '2 hours ago', applications: 3 },
    { name: 'Fatima Al Zaabi', status: 'Pending', lastActivity: '1 day ago', applications: 1 },
    { name: 'Mohammed Al Qasimi', status: 'Active', lastActivity: '3 days ago', applications: 2 },
    { name: 'Aisha Al Falasi', status: 'Suspended', lastActivity: '1 week ago', applications: 0 },
  ];

  const renderItem = (item: ICustomerItem, index: number) => (
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

  const renderCustomerRow = (customer: ICustomerRow, index: number) => (
    <div
      key={index}
      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{customer.name}</span>
        <div className="flex items-center gap-2">
          <Badge 
            variant={customer.status === 'Active' ? 'success' : customer.status === 'Pending' ? 'warning' : 'destructive'}
            className="text-xs"
          >
            {customer.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {customer.applications} application{customer.applications !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{customer.lastActivity}</span>
    </div>
  );

  const totalCustomers = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customers
        </CardTitle>
        <Button mode="link" asChild>
          <Link to="/customers">View All</Link>
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            Total Customers
          </span>
          <span className="text-3xl font-semibold text-mono">{totalCustomers.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1 mb-1.5">
          <Badge
            variant="success"
            className="h-2 w-full max-w-[60%] rounded-xs"
          ></Badge>
          <Badge
            variant="warning"
            className="h-2 w-full max-w-[25%] rounded-xs"
          ></Badge>
          <Badge
            variant="destructive"
            className="h-2 w-full max-w-[15%] rounded-xs"
          ></Badge>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recent Activity</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/customers">View All</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentCustomers.map((customer, index) => {
              return renderCustomerRow(customer, index);
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 