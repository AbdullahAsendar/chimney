import { GenericCrudPage } from '@/components/common/GenericCrudPage';

const CustomersPage = () => (
<GenericCrudPage
  entity="customer"
  service="authentication-service"
  fields={['id', 'name', 'nameAr']}
  enableCreate={false}
  enableEdit={true}
  enableDelete={false}
  editAllAttributes={true}
  updateableFields={['name', 'nameAr', 'phone', 'email', 'birthdate', 'emiratesId', 'idCardExpiryDate', 'passportNumber' , 'passportExpiryDate' ,'tradeLicense', 'evaluationNumber', 'licenseExpiryDate',  'businessFlags']}
  predefinedFields={{
    businessFlags: ['SOP1','SOP2','SOP3','FEES_EXEMPT','VIP','EVALUATION_COMPANY','EARLY_ACCESS','HIDDEN_SERVICES','DUPLICATE_CONSENTED','ICP',]
  }}
/>
);

export default CustomersPage; 