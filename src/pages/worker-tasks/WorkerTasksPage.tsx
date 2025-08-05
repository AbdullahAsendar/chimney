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
  editAllAttributes={true}
  predefinedFields={{
    status: { 
      type: 'single', 
      options: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] 
    },
    type: {
      type: 'single',
      options: ['APPLICATION_ACTION', 'DOWNLOAD_RECEIPT', 'PAYMENT_STATUS', 'SEWA_MOVE_IN_UPLOAD']
    }
  }}
  createDefaults={{
    trialCount: 0,
    nextRun: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  }}
  />
);

export default WorkerTasksPage; 