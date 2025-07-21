import React from 'react';
import GenericCrudPage from '../../components/common/GenericCrudPage';

/**
 * WorkerTask CRUD Page
 * 
 * Entity fields:
 * - id: Primary key
 * - type: WorkerTaskType enum (CREATE, UPDATE, DELETE, etc.)
 * - dataJson: JSON data (CLOB) - contains task-specific data
 * - status: WorkerTaskStatus enum (PENDING, RUNNING, COMPLETED, FAILED, etc.)
 * - trialCount: Number of retry attempts (read-only)
 * - trialMax: Maximum retry attempts
 * - error: Error message (CLOB) - read-only, shows last error
 * - nextRun: Next execution time
 * - jobId: Job identifier (read-only)
 * 
 * Note: Some fields are read-only due to @CreatePermission and @UpdatePermission annotations
 * 
 * Filterable fields based on API spec:
 * - type, status, trialMax, nextRun support filtering
 * - id, trialCount, jobId, error, dataJson may have limited filter support
 */
const WorkerTaskPage: React.FC = () => {
  return (
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
      enableCreate={false} // Worker tasks are typically created by the system, not manually
      enableEdit={true}   // Allow editing status, trialMax, nextRun
      enableDelete={true} // Allow deleting failed or completed tasks
  // Only these fields support filtering
    />
  );
};

export default WorkerTaskPage; 