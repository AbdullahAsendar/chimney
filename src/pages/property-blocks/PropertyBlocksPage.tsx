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
      'releaseDate',
      'createdByAccountId',
      'createTimestamp',
      'updatedByAccountId',
      'updateTimestamp'
    ]}
    enableCreate={true}
    enableEdit={true}
    enableDelete={true}
    editAllAttributes={true}
  />
);

export default PropertyBlocksPage; 