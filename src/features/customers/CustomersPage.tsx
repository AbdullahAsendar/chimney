import React from 'react';
import GenericCrudPage from '../../components/common/GenericCrudPage';

const CustomersPage: React.FC = () => {
  return <GenericCrudPage
  entity="customer"
  service="authentication-service"
  fields={['id', 'name', 'nameAr']}
  enableCreate={false}
  enableEdit={true}
  enableDelete={false}
/>;
};

export default CustomersPage; 