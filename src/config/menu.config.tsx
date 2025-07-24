import {
  Briefcase,
  Kanban,
  LayoutGrid,
  Settings,
  Users,
  FileWarning,
  Inspect,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
  { heading: 'Crud' },
  {
    title: 'Customers',
    icon: Users,
    path: '/customers',
  },
  {
    title: 'Applications',
    icon: Briefcase,
    path: '/applications',
  },
  {
    title: 'Worker Tasks',
    icon: Kanban,
    path: '/worker-tasks',
  },
  {
    title: 'Blocks',
    icon: Shield,
    children: [
      {
        title: 'Property Blocks',
        icon: FileWarning,
        path: '/property-blocks',
      },
    ],
  },
  {
    title: 'Prevalidations',
    icon: Inspect,
    disabled: true,
    path: '/worker-tasks',
  },
  { heading: 'utils' },
  {
    title: 'Clear Cache',
    icon: RefreshCw,
    path: '/utilities/clear-cache',
  },
  {
    title: 'Tools',
    icon: Settings,
    path: '/utilities/tools',
  },
];
