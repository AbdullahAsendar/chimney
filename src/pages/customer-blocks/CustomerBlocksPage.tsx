import React from 'react';
import { GenericCrudPage } from '@/components/common/GenericCrudPage';

const CustomerBlocksPage: React.FC = () => {
  const predefinedFields = {
    active: { type: 'single' as const, options: ['true', 'false'] },
    isAllWorkflow: { type: 'single' as const, options: ['true', 'false'] },
  };

  const createDefaults = {
    active: false,
    isAllWorkflow: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
  };

  return (
    <GenericCrudPage
      entity="customerBlock"
      service="authentication-service"
      fields={['id', 'active', 'startDate', 'endDate', 'isAllWorkflow', 'reasonId', 'sourceId', 'referenceNumber', 'releaseDate', 'remarks']}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
      editAllAttributes={true}
      updateableFields={['active', 'startDate', 'endDate', 'isAllWorkflow', 'reasonId', 'sourceId', 'referenceNumber', 'releaseDate', 'remarks']}
      predefinedFields={predefinedFields}
      createDefaults={createDefaults}
    />
  );
};

export default CustomerBlocksPage; 