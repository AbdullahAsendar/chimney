import { GenericCrudPage } from '@/components/common/GenericCrudPage';

const PropertyBlocksPage = () => (
  <GenericCrudPage
    entity="propertyBlock"
    service="property-service"
    fields={[
      'id',
      'propertyId',
      'startDate',
      'endDate',
      'note',
      'publicNote',
      'reasonId',
      'sourceId',
      'referenceNumber',
      'releaseDate'
    ]}
    enableCreate={true}
    enableEdit={true}
    enableDelete={true}
    editAllAttributes={true}
  />
);

export default PropertyBlocksPage; 