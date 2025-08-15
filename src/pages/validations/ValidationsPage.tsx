import { GenericCrudPage } from '@/components/common/GenericCrudPage';

const ValidationsPage = () => (
  <GenericCrudPage
    entity="validation"
    service="workflow-service"
    fields={[
      'id',
      'workflowId',
      'validationType',
      'workflowStepId',
      'deleted'
    ]}
    enableCreate={true}
    enableEdit={true}
    enableDelete={true}
    editAllAttributes={true}
    updateableFields={[
      'validationType',
      'attributesJson',
      'workflowStepId',
      'workflowId'
    ]}
    predefinedFields={{
      validationType: { 
        type: 'single', 
        apiEndpoint: 'chimney/lookup/validation',
        service: 'workflow-service'
      }
    }}
    relationshipFields={{
      'workflowStep': 'workflowStepId',
      'workflow': 'workflowId'
    }}
    relationshipOptions={{
      'workflowStep': {
        service: 'workflow-service',
        entity: 'workflow/lookup/steps',
        labelField: 'name',
        valueField: 'id',
        isLookupEndpoint: true
      },
      'workflow': {
        service: 'workflow-service',
        entity: 'workflow/lookup',
        labelField: 'name',
        valueField: 'id',
        isLookupEndpoint: true
      }
    }}
    customFilters={[
      {
        key: 'with-workflow',
        label: 'With Workflow',
        filterValue: 'workflow=isnull=false'
      },
      {
        key: 'with-workflow-step',
        label: 'With Workflow Step',
        filterValue: 'workflowStep=isnull=false'
      },
      {
        key: 'workflow-filter',
        label: 'Filter by Workflow',
        filterValue: 'workflow.id=={value}',
        type: 'dynamic',
        apiEndpoint: 'workflow/lookup',
        service: 'workflow-service',
        labelField: 'name',
        valueField: 'id'
      }
    ]}
  />
);

export default ValidationsPage; 