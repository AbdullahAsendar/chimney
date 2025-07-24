export interface PropertyBlockAttributes {
  createdByAccountId: number;
  createTimestamp: string;
  endDate: string;
  note: string;
  propertyId: number;
  publicNote: string;
  reasonId: number;
  referenceNumber: string | null;
  releaseDate: string | null;
  sourceId: number;
  startDate: string;
  updatedByAccountId: number;
  updateTimestamp: string;
}

export interface PropertyBlockRelationships {
  workflows: {
    data: any[];
  };
}

export interface PropertyBlock {
  type: 'propertyBlock';
  id: string;
  attributes: PropertyBlockAttributes;
  relationships: PropertyBlockRelationships;
}

export interface PropertyBlockResponse {
  data: PropertyBlock[];
  meta: {
    page: {
      number: number;
      limit: number;
      totalPages: number;
      totalRecords: number;
    };
  };
}

export interface PropertyBlockCreateRequest {
  data: {
    type: 'propertyBlock';
    attributes: Partial<PropertyBlockAttributes>;
  };
}

export interface PropertyBlockUpdateRequest {
  data: {
    type: 'propertyBlock';
    id: string;
    attributes: Partial<PropertyBlockAttributes>;
  };
} 