import { Link } from 'react-router';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';

interface IPropertyBlockItem {
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

interface IPropertyBlockRow {
  id: string;
  name: string;
  location: string;
  status: string;
  type: string;
  lastUpdated: string;
  issues: number;
}

export function PropertyBlocks() {
  const items: IPropertyBlockItem[] = [
    { badgeColor: 'success', label: 'Active Blocks', count: 156, icon: CheckCircle },
    { badgeColor: 'warning', label: 'Under Maintenance', count: 23, icon: Clock },
    { badgeColor: 'destructive', label: 'Blocked', count: 8, icon: AlertTriangle },
    { badgeColor: 'info', label: 'Pending Review', count: 12, icon: Building2 },
  ];

  const recentBlocks: IPropertyBlockRow[] = [
    { 
      id: 'BLK-001', 
      name: 'Al Nahda Commercial District', 
      location: 'Sharjah, UAE', 
      status: 'Active', 
      type: 'Commercial',
      lastUpdated: '2 hours ago',
      issues: 0
    },
    { 
      id: 'BLK-002', 
      name: 'Al Majaz Waterfront', 
      location: 'Sharjah, UAE', 
      status: 'Under Maintenance', 
      type: 'Mixed',
      lastUpdated: '1 day ago',
      issues: 2
    },
    { 
      id: 'BLK-003', 
      name: 'Al Qasba Cultural District', 
      location: 'Sharjah, UAE', 
      status: 'Active', 
      type: 'Cultural',
      lastUpdated: '3 days ago',
      issues: 1
    },
    { 
      id: 'BLK-004', 
      name: 'University City', 
      location: 'Sharjah, UAE', 
      status: 'Blocked', 
      type: 'Educational',
      lastUpdated: '1 week ago',
      issues: 5
    },
  ];

  const renderItem = (item: IPropertyBlockItem, index: number) => (
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
      case 'Active': return 'success';
      case 'Under Maintenance': return 'warning';
      case 'Blocked': return 'destructive';
      case 'Pending Review': return 'info';
      default: return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Commercial': return 'primary';
      case 'Residential': return 'success';
      case 'Mixed': return 'warning';
      case 'Cultural': return 'info';
      case 'Educational': return 'secondary';
      default: return 'secondary';
    }
  };

  const renderBlockRow = (block: IPropertyBlockRow, index: number) => (
    <div
      key={index}
      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{block.id}</span>
          <Badge variant={getStatusColor(block.status)} className="text-xs">
            {block.status}
          </Badge>
          <Badge variant={getTypeColor(block.type)} className="text-xs">
            {block.type}
          </Badge>
        </div>
        <span className="text-sm text-foreground font-medium">{block.name}</span>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{block.location}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">{block.lastUpdated}</span>
        {block.issues > 0 && (
          <Badge variant="destructive" className="text-xs">
            {block.issues} issue{block.issues !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );

  const totalBlocks = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Property Blocks
        </CardTitle>
        <Button mode="link" asChild>
          <Link to="/property-blocks">View All</Link>
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            Total Property Blocks
          </span>
          <span className="text-3xl font-semibold text-mono">{totalBlocks.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1 mb-1.5">
          <Badge
            variant="success"
            className="h-2 w-full max-w-[60%] rounded-xs"
          ></Badge>
          <Badge
            variant="warning"
            className="h-2 w-full max-w-[20%] rounded-xs"
          ></Badge>
          <Badge
            variant="destructive"
            className="h-2 w-full max-w-[10%] rounded-xs"
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
            <span className="text-sm font-medium">Recent Blocks</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/property-blocks">View All</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentBlocks.map((block, index) => {
              return renderBlockRow(block, index);
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 