import { Link } from 'react-router';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Kanban, Clock, CheckCircle, AlertTriangle, Play, Pause } from 'lucide-react';

interface ITaskItem {
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

interface ITaskRow {
  id: string;
  title: string;
  assignee: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  progress: number;
}

export function WorkerTasks() {
  const items: ITaskItem[] = [
    { badgeColor: 'success', label: 'Completed', count: 234, icon: CheckCircle },
    { badgeColor: 'warning', label: 'In Progress', count: 45, icon: Play },
    { badgeColor: 'destructive', label: 'Overdue', count: 12, icon: AlertTriangle },
    { badgeColor: 'info', label: 'Pending', count: 67, icon: Clock },
  ];

  const recentTasks: ITaskRow[] = [
    { 
      id: 'TASK-001', 
      title: 'Document Verification - Property Registration', 
      assignee: 'Ahmed Al Mansouri', 
      status: 'In Progress', 
      priority: 'high',
      dueDate: 'Today',
      progress: 75
    },
    { 
      id: 'TASK-002', 
      title: 'Application Review - License Renewal', 
      assignee: 'Fatima Al Zaabi', 
      status: 'Completed', 
      priority: 'medium',
      dueDate: 'Yesterday',
      progress: 100
    },
    { 
      id: 'TASK-003', 
      title: 'Data Entry - New Permit', 
      assignee: 'Mohammed Al Qasimi', 
      status: 'Pending', 
      priority: 'low',
      dueDate: 'Tomorrow',
      progress: 0
    },
    { 
      id: 'TASK-004', 
      title: 'Quality Check - Property Transfer', 
      assignee: 'Aisha Al Falasi', 
      status: 'Overdue', 
      priority: 'high',
      dueDate: '2 days ago',
      progress: 30
    },
  ];

  const renderItem = (item: ITaskItem, index: number) => (
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
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Overdue': return 'destructive';
      case 'Pending': return 'info';
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

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'success';
    if (progress >= 75) return 'warning';
    if (progress >= 50) return 'info';
    return 'destructive';
  };

  const renderTaskRow = (task: ITaskRow, index: number) => (
    <div
      key={index}
      className="flex flex-col gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{task.id}</span>
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {task.priority}
          </Badge>
        </div>
        <Badge variant={getStatusColor(task.status)} className="text-xs">
          {task.status}
        </Badge>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground font-medium">{task.title}</span>
        <span className="text-xs text-muted-foreground">Assigned to: {task.assignee}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${getProgressColor(task.progress)} transition-all duration-300`}
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium">{task.progress}%</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
      </div>
    </div>
  );

  const totalTasks = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Kanban className="h-5 w-5" />
          Worker Tasks
        </CardTitle>
        <Button mode="link" asChild>
          <Link to="/worker-tasks">View All</Link>
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            Total Tasks
          </span>
          <span className="text-3xl font-semibold text-mono">{totalTasks.toLocaleString()}</span>
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
            <span className="text-sm font-medium">Recent Tasks</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/worker-tasks">View All</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentTasks.map((task, index) => {
              return renderTaskRow(task, index);
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 