import { GenericCrudPage } from '@/components/common/GenericCrudPage';

const WorkerTasksPage = () => (
  <GenericCrudPage
  entity="workerTask"
  service="worker-service"
  fields={[
    'id',
    'type',
    'dataJson',
    'status', 
    'trialCount',
    'trialMax',
    'nextRun'
    
  ]}
  enableCreate={true} // Worker tasks are typically created by the system, not manually
  enableEdit={true}   // Allow editing status, trialMax, nextRun
  enableDelete={true} // Allow deleting failed or completed tasks
  />
);

export default WorkerTasksPage; 