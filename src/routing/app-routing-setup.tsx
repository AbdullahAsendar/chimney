import { RequireAuth } from '@/auth/require-auth';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { Navigate, Route, Routes } from 'react-router';
import CustomersPage from '@/pages/customers/CustomersPage';
import ApplicationsPage from '@/pages/applications/ApplicationsPage';
import WorkerTasksPage from '@/pages/worker-tasks/WorkerTasksPage';
import PropertyBlocksPage from '@/pages/property-blocks/PropertyBlocksPage';
import CustomerBlocksPage from '@/pages/customer-blocks/CustomerBlocksPage';
import { DashboardPage } from '@/pages/store-admin/dashboard/dashboard-page';
import ClearCachePage from '@/pages/utilities/ClearCachePage';
import ToolsPage from '@/pages/utilities/ToolsPage';
import { AuthRouting } from '@/auth/auth-routing';

export function AppRoutingSetup() {
  return (
    <Routes>
      {/* Auth routes - accessible without authentication */}
      <Route path="/auth/*" element={<AuthRouting />} />
      
      {/* Protected routes - require authentication */}
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/worker-tasks" element={<WorkerTasksPage />} />
          <Route path="/property-blocks" element={<PropertyBlocksPage />} />
          <Route path="/customer-blocks" element={<CustomerBlocksPage />} />
          <Route path="/utilities/clear-cache" element={<ClearCachePage />} />
          <Route path="/utilities/tools" element={<ToolsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Route>
    </Routes>
  );
}
