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
/>
);

export default CustomersPage; 