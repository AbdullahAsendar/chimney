import { GenericCrudPage } from '@/components/common/GenericCrudPage';

const ApplicationsPage = () => (
  <GenericCrudPage
  entity="application"
  service="workflow-service" // Assuming 'workflow-service' based on the 'wfl_' prefix
  fields={[
    'id',
    'number',
    'status',
    'startDate',
    'submitDate',
    'completeDate'
  ]}
  enableCreate={true}
  enableEdit={true}
  enableDelete={true}
/>
);

export default ApplicationsPage; 