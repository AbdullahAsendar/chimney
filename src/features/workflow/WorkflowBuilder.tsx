import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  useTheme,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

import { useEnvironment } from '../../contexts/EnvironmentContext';
import { Navigate } from 'react-router-dom';

interface WorkflowDetails {
  name: string;
  key: string;
  group: string;
  type: 'online' | 'offline';
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
}

interface Document {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

const AVAILABLE_STEPS: WorkflowStep[] = [
  { id: 'application', name: 'Application Submission', description: 'Initial application form submission' },
  { id: 'review', name: 'Review Process', description: 'Administrative review of application' },
  { id: 'approval', name: 'Approval', description: 'Final approval decision' },
  { id: 'payment', name: 'Payment Processing', description: 'Payment collection and processing' },
  { id: 'documentation', name: 'Documentation', description: 'Document verification and collection' },
  { id: 'completion', name: 'Completion', description: 'Workflow completion and closure' },
];

const AVAILABLE_DOCUMENTS: Document[] = [
  { id: 'id_proof', name: 'ID Proof', description: 'Government issued ID document', required: true },
  { id: 'address_proof', name: 'Address Proof', description: 'Proof of residential address', required: true },
  { id: 'income_proof', name: 'Income Proof', description: 'Salary slips or income certificates', required: false },
  { id: 'bank_statement', name: 'Bank Statement', description: 'Recent bank statements', required: false },
  { id: 'property_docs', name: 'Property Documents', description: 'Property ownership documents', required: false },
  { id: 'contract', name: 'Contract Agreement', description: 'Service agreement or contract', required: true },
];

const WorkflowBuilder: React.FC = () => {
  const theme = useTheme();
  const { apiBaseUrl, isProduction } = useEnvironment();
  
  // Redirect to home if in production environment
  if (isProduction) {
    return <Navigate to="/" replace />;
  }
  const [activeStep, setActiveStep] = useState(0);
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails>({
    name: '',
    key: '',
    group: '',
    type: 'online',
  });
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setWorkflowDetails({ name: '', key: '', group: '', type: 'online' });
    setSelectedSteps([]);
    setSelectedDocuments([]);
  };

  const handleStepToggle = (stepId: string) => {
    setSelectedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSubmit = async () => {
    try {
      const workflowData = {
        ...workflowDetails,
        steps: selectedSteps,
        documents: selectedDocuments,
      };
      
      // TODO: Implement API call to save workflow
      console.log('Workflow Data:', workflowData);
      
      // For now, just show success message
      alert('Workflow created successfully!');
      handleReset();
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Error creating workflow. Please try again.');
    }
  };

  const steps = [
    {
      label: 'Workflow Details',
      content: (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflowDetails.name}
              onChange={(e) => setWorkflowDetails(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Workflow Key"
              value={workflowDetails.key}
              onChange={(e) => setWorkflowDetails(prev => ({ ...prev, key: e.target.value }))}
              required
              helperText="Unique identifier for the workflow"
            />
            <TextField
              fullWidth
              label="Workflow Group"
              value={workflowDetails.group}
              onChange={(e) => setWorkflowDetails(prev => ({ ...prev, group: e.target.value }))}
              required
              helperText="Group or category for the workflow"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={workflowDetails.type}
                label="Type"
                onChange={(e) => setWorkflowDetails(prev => ({ ...prev, type: e.target.value as 'online' | 'offline' }))}
              >
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      ),
    },
    {
      label: 'Select Steps',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select the steps that will be part of this workflow:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {AVAILABLE_STEPS.map((step) => (
              <Card 
                key={step.id}
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  borderColor: selectedSteps.includes(step.id) ? theme.palette.primary.main : undefined,
                  bgcolor: selectedSteps.includes(step.id) ? theme.palette.action.selected : undefined,
                }}
                onClick={() => handleStepToggle(step.id)}
              >
                <CardContent sx={{ py: 2, px: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSteps.includes(step.id)}
                        onChange={() => handleStepToggle(step.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {step.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ),
    },
    {
      label: 'Select Documents',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select the documents required for this workflow:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {AVAILABLE_DOCUMENTS.map((document) => (
              <Card 
                key={document.id}
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  borderColor: selectedDocuments.includes(document.id) ? theme.palette.primary.main : undefined,
                  bgcolor: selectedDocuments.includes(document.id) ? theme.palette.action.selected : undefined,
                }}
                onClick={() => handleDocumentToggle(document.id)}
              >
                <CardContent sx={{ py: 2, px: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedDocuments.includes(document.id)}
                        onChange={() => handleDocumentToggle(document.id)}
                      />
                    }
                    label={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {document.name}
                          </Typography>
                          {document.required && (
                            <Chip 
                              label="Required" 
                              size="small" 
                              color="error" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {document.description}
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Workflow Builder
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Create a new workflow by following these steps
      </Typography>
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6" fontWeight="bold">
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                      sx={{ mr: 1 }}
                      disabled={
                        (index === 0 && (!workflowDetails.name || !workflowDetails.key || !workflowDetails.group)) ||
                        (index === 1 && selectedSteps.length === 0) ||
                        (index === 2 && selectedDocuments.length === 0)
                      }
                    >
                      {index === steps.length - 1 ? 'Create Workflow' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3, my: 3, bgcolor: 'grey.50' }}>
            <Typography>All steps completed - you&apos;re finished</Typography>
            <Button onClick={handleReset} sx={{ mt: 1 }}>
              Reset
            </Button>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default WorkflowBuilder; 