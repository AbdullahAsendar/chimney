import { Customers } from './components/customers';
import { Applications } from './components/applications';
import { WorkerTasks } from './components/worker-tasks';
import { PropertyBlocks } from './components/property-blocks';
import { SystemHealth } from './components/system-health';
import { QuickActions } from './components/quick-actions';

export function DashboardContent() {
  return (
    <div className="flex flex-col gap-5 lg:gap-7.5">
      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5">
        <Customers />
        <Applications />
        <WorkerTasks />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5">
        <div className="lg:col-span-2">
          <PropertyBlocks />
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-5">
            <SystemHealth />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
