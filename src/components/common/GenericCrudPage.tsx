import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X, Settings2, Pencil, Trash2, Check, Save, AlertCircle, Plus, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import * as authHelper from '@/auth/lib/helpers';
import axios from 'axios';
import { useEnvironment } from '@/providers/environment-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogBody,
} from '@/components/ui/dialog';

interface GenericCrudPageProps {
  entity: string;
  service: string;
  fields: string[];
  enableCreate?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
  editAllAttributes?: boolean;
  predefinedFields?: Record<string, string[] | { type: 'single' | 'multi'; options: string[] } | { type: 'single' | 'multi'; apiEndpoint: string; service: string }>; // fieldName -> array of possible values or object with type and options or API endpoint
  updateableFields?: string[]; // fields that can be updated, if not provided all fields are updateable
  createDefaults?: Record<string, any>; // default values for create form
  relationshipFields?: Record<string, string>; // relationship field name -> display field name (e.g., 'workflowStep' -> 'workflowStepId')
  relationshipOptions?: Record<string, { service: string; entity: string; labelField?: string; valueField?: string; isLookupEndpoint?: boolean }>; // relationship field name -> options configuration
  customFilters?: Array<{
    key: string;
    label: string;
    filterValue: string;
    type?: 'static' | 'dynamic';
    options?: Array<{ value: string; label: string }>;
    apiEndpoint?: string;
    service?: string;
    labelField?: string;
    valueField?: string;
  }>; // custom API filter options
}

const PAGE_SIZE = 10;

export const GenericCrudPage: React.FC<GenericCrudPageProps> = ({
  entity,
  service,
  fields,
  enableCreate = true,
  enableEdit = true,
  enableDelete = true,
  editAllAttributes = false,
  predefinedFields = {},
  updateableFields,
  createDefaults = {},
  relationshipFields = {},
  relationshipOptions = {},
  customFilters = [],
}) => {
  const { apiBaseUrl } = useEnvironment();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
    searchQuery: '',
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [editRow, setEditRow] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<any>({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [relationshipOptionsData, setRelationshipOptionsData] = useState<Record<string, any[]>>({});
  const [relationshipOptionsLoading, setRelationshipOptionsLoading] = useState<Record<string, boolean>>({});
  const [relationshipOptionsError, setRelationshipOptionsError] = useState<Record<string, boolean>>({});
  const [relationshipLookupData, setRelationshipLookupData] = useState<Record<string, Record<string, any>>>({});
  const [selectedCustomFilter, setSelectedCustomFilter] = useState<string>('all');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [predefinedFieldsData, setPredefinedFieldsData] = useState<Record<string, string[]>>({});
  const [predefinedFieldsLoading, setPredefinedFieldsLoading] = useState<Record<string, boolean>>({});
  const [predefinedFieldsError, setPredefinedFieldsError] = useState<Record<string, boolean>>({});
  const [customFiltersData, setCustomFiltersData] = useState<Record<string, any[]>>({});
  const [customFiltersLoading, setCustomFiltersLoading] = useState<Record<string, boolean>>({});
  const [customFiltersError, setCustomFiltersError] = useState<Record<string, boolean>>({});
  const [dynamicFilterValues, setDynamicFilterValues] = useState<Record<string, string>>({});
  const isFetchingRef = useRef(false);
  const prevValuesRef = useRef<{
    entity: string;
    service: string;
    pageIndex: number;
    pageSize: number;
    searchQuery: string;
    apiBaseUrl: string;
    sorting: SortingState;
    selectedCustomFilter: string;
    customFilters: any[];
  } | null>(null);
  const prevValuesHashRef = useRef<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const customFilterFetchingRef = useRef<Record<string, boolean>>({});
  const fetchedCustomFiltersRef = useRef<Set<string>>(new Set());

  // Memoize relationship field lookup for better performance
  const relationshipFieldLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    if (relationshipFields) {
      Object.entries(relationshipFields).forEach(([key, value]) => {
        lookup[value] = key;
      });
    }
    return lookup;
  }, [relationshipFields]);

  // Memoize predefined field options for better performance
  const getPredefinedFieldOptions = useCallback((fieldName: string) => {
    const fieldConfig = predefinedFields[fieldName];
    if (!fieldConfig) return { options: [], isLoading: false, hasError: false };
    
    if (typeof fieldConfig === 'string') {
      return { options: fieldConfig, isLoading: false, hasError: false };
    }
    
    if (Array.isArray(fieldConfig)) {
      return { options: fieldConfig, isLoading: false, hasError: false };
    }
    
    if ('apiEndpoint' in fieldConfig) {
      const options = predefinedFieldsData[fieldName] || [];
      const isLoading = predefinedFieldsLoading[fieldName] || false;
      const hasError = predefinedFieldsError[fieldName] || false;
      return { options, isLoading, hasError };
    }
    
    return { options: fieldConfig.options || [], isLoading: false, hasError: false };
  }, [predefinedFields, predefinedFieldsData, predefinedFieldsLoading, predefinedFieldsError]);

  // Function to fetch predefined field options from API
  const fetchPredefinedFieldOptions = async (fieldName: string) => {
    const fieldConfig = predefinedFields[fieldName];
    if (!fieldConfig || typeof fieldConfig === 'string' || !('apiEndpoint' in fieldConfig)) return;

    // Don't fetch if already loading or if there was an error
    if (predefinedFieldsLoading[fieldName] || predefinedFieldsError[fieldName]) {
      return;
    }

    setPredefinedFieldsLoading(prev => ({ ...prev, [fieldName]: true }));
    setPredefinedFieldsError(prev => ({ ...prev, [fieldName]: false }));
    
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      
      const url = `${apiBaseUrl}/${fieldConfig.service}/api/v1/${fieldConfig.apiEndpoint}`;
      
      const response = await axios.get(url, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'Content-Type': 'application/json',
          accept: '*/*',
        },
      });
      
      let data = response.data;
      if (typeof data === 'string') data = JSON.parse(data);
      
      // Handle array response
      const options = Array.isArray(data) ? data : [];
      
      setPredefinedFieldsData(prev => ({ ...prev, [fieldName]: options }));
    } catch (error) {
      console.error(`Failed to fetch predefined field options for ${fieldName}:`, error);
      setPredefinedFieldsData(prev => ({ ...prev, [fieldName]: [] }));
      setPredefinedFieldsError(prev => ({ ...prev, [fieldName]: true }));
    } finally {
      setPredefinedFieldsLoading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Function to fetch relationship options
  const fetchRelationshipOptions = async (relationshipKey: string) => {
    const config = relationshipOptions[relationshipKey];
    if (!config) return;

    // Don't fetch if already loading or if there was an error
    if (relationshipOptionsLoading[relationshipKey] || relationshipOptionsError[relationshipKey]) {
      return;
    }

    setRelationshipOptionsLoading(prev => ({ ...prev, [relationshipKey]: true }));
    setRelationshipOptionsError(prev => ({ ...prev, [relationshipKey]: false }));
    
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      
      let url: string;
      if (config.isLookupEndpoint) {
        // For lookup endpoints, use the entity path directly
        url = `${apiBaseUrl}/${config.service}/api/v1/${config.entity}`;
      } else {
        // For regular endpoints, use the chimney path with pagination
        const params = new URLSearchParams();
        params.append('page[size]', '100');
        url = `${apiBaseUrl}/${config.service}/api/v1/chimney/${config.entity}?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'Content-Type': 'application/json',
          accept: '*/*',
        },
      });

      let data = response.data;
      if (typeof data === 'string') data = JSON.parse(data);
      
      let items: any[] = [];
      if (config.isLookupEndpoint) {
        // For lookup endpoints, data is in result array
        items = Array.isArray(data.result) ? data.result : [];
      } else {
        // For regular endpoints, data is in data array
        items = Array.isArray(data.data) ? data.data : [];
      }
      
      setRelationshipOptionsData(prev => ({ ...prev, [relationshipKey]: items }));
      
      // Create lookup map for quick access by ID
      const lookupMap: Record<string, any> = {};
      items.forEach(item => {
        const id = item[config.valueField || 'id'];
        const label = item[config.labelField || 'name'];
        const source = item.source;
        
        // For workflow lookups, include source in the label if available
        let displayLabel = label;
        if (relationshipKey === 'workflow' && source) {
          displayLabel = `${label} (${source})`;
        }
        
        lookupMap[id] = { id, label: displayLabel, source, ...item };
      });
      console.log(`Relationship lookup data for ${relationshipKey}:`, lookupMap);
      setRelationshipLookupData(prev => ({ ...prev, [relationshipKey]: lookupMap }));
    } catch (error) {
      console.error(`Failed to fetch options for ${relationshipKey}:`, error);
      setRelationshipOptionsData(prev => ({ ...prev, [relationshipKey]: [] }));
      setRelationshipOptionsError(prev => ({ ...prev, [relationshipKey]: true }));
    } finally {
      setRelationshipOptionsLoading(prev => ({ ...prev, [relationshipKey]: false }));
    }
  };

  // Function to fetch custom filter options from API
  const fetchCustomFilterOptions = useCallback(async (filterKey: string) => {
    const filter = customFilters.find(f => f.key === filterKey);
    if (!filter || !filter.apiEndpoint) return;

    // Don't fetch if already loading or if there was an error
    if (customFilterFetchingRef.current[filterKey] || customFiltersLoading[filterKey] || customFiltersError[filterKey]) {
      return;
    }

    customFilterFetchingRef.current[filterKey] = true;

    setCustomFiltersLoading(prev => ({ ...prev, [filterKey]: true }));
    setCustomFiltersError(prev => ({ ...prev, [filterKey]: false }));
    
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      
      const url = `${apiBaseUrl}/${filter.service}/api/v1/${filter.apiEndpoint}`;
      
      const response = await axios.get(url, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'Content-Type': 'application/json',
          accept: '*/*',
        },
      });
      
      let data = response.data;
      if (typeof data === 'string') data = JSON.parse(data);
      
      // Handle different response formats
      let options: any[] = [];
      if (Array.isArray(data)) {
        // Direct array response
        options = data;
      } else if (data && Array.isArray(data.result)) {
        // Response with result array (common for lookup endpoints)
        options = data.result;
      } else if (data && Array.isArray(data.data)) {
        // Response with data array
        options = data.data;
      }
      
      console.log(`Custom filter options for ${filterKey}:`, options);
      
      setCustomFiltersData(prev => ({ ...prev, [filterKey]: options }));
      fetchedCustomFiltersRef.current.add(filterKey);
    } catch (error) {
      console.error(`Failed to fetch custom filter options for ${filterKey}:`, error);
      setCustomFiltersData(prev => ({ ...prev, [filterKey]: [] }));
      setCustomFiltersError(prev => ({ ...prev, [filterKey]: true }));
    } finally {
      setCustomFiltersLoading(prev => ({ ...prev, [filterKey]: false }));
      customFilterFetchingRef.current[filterKey] = false;
    }
  }, [customFilters, apiBaseUrl]);

  // Handler to batch search and page reset
  const handleSearch = () => {
    setTableState(prev => ({
      ...prev,
      pageIndex: 0,
      searchQuery: pendingSearchQuery,
    }));
  };

  useEffect(() => {
    // Check if values have actually changed using efficient hash comparison
    const currentValues = {
      entity,
      service,
      pageIndex: tableState.pageIndex,
      pageSize: tableState.pageSize,
      searchQuery: tableState.searchQuery,
      apiBaseUrl,
      sorting,
      selectedCustomFilter,
      customFilters
    };
    
    // Create a simple hash for comparison (much faster than JSON.stringify)
    const currentHash = `${entity}-${service}-${tableState.pageIndex}-${tableState.pageSize}-${tableState.searchQuery}-${apiBaseUrl}-${selectedCustomFilter}-${customFilters.length}-${JSON.stringify(dynamicFilterValues)}`;
    
    if (prevValuesHashRef.current === currentHash) {
      return; // Values haven't changed, don't fetch
    }
    
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }
    
    prevValuesRef.current = currentValues;
    prevValuesHashRef.current = currentHash;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    // Build filter query from search and custom filters
    let filterQuery = '';
    
    if (tableState.searchQuery) {
      filterQuery += `&filter=${encodeURIComponent(tableState.searchQuery)}`;
    }
    
    // Add custom filter if selected
    if (selectedCustomFilter !== 'all' && customFilters.length > 0) {
      const selectedFilter = customFilters.find(f => f.key === selectedCustomFilter);
      if (selectedFilter) {
        if (selectedFilter.type === 'dynamic' && dynamicFilterValues[selectedFilter.key]) {
          // For dynamic filters, use the selected value
          const dynamicValue = dynamicFilterValues[selectedFilter.key];
          const dynamicFilter = selectedFilter.filterValue.replace('{value}', dynamicValue);
          filterQuery += `&filter=${encodeURIComponent(dynamicFilter)}`;
        } else {
          // For static filters, use the predefined value
          filterQuery += `&filter=${encodeURIComponent(selectedFilter.filterValue)}`;
        }
      }
    }
    
    // Build sort query string from sorting state
    const sortQuery = sorting.length > 0
      ? `&sort=${sorting.map(s => (s.desc ? '-' : '') + s.id).join(',')}`
      : '';
    const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}?page%5Bnumber%5D=${tableState.pageIndex + 1}&page%5Bsize%5D=${tableState.pageSize}&page%5Btotals%5D=true${filterQuery}${sortQuery}`;
    const auth = authHelper.getAuth();
    const accessToken = auth?.access_token;
    const accountId = localStorage.getItem('chimney-user-id');
    console.log('Fetching:', url);
    axios.get(url, {
      headers: {
        ...(accessToken ? { 'sdd-token': accessToken } : {}),
        ...(accountId ? { 'account-id': accountId } : {}),
        'Content-Type': 'application/json',
        accept: '*/*',
      },
    })
      .then((res: { data: any }) => {
        let data = res.data;
        if (typeof data === 'string') data = JSON.parse(data);
        const items = Array.isArray(data.data)
          ? data.data.map((item: any) => {
              const attrs = item.attributes || {};
              const relationships = item.relationships || {};
              
              const row: any = { id: item.id ?? '', ...attrs };
              
              // Process relationships
              if (relationshipFields && Object.keys(relationshipFields).length > 0) {
                Object.keys(relationshipFields).forEach(relKey => {
                  const displayField = relationshipFields[relKey];
                  const relData = relationships[relKey]?.data;
                  if (relData) {
                    row[displayField] = relData.id;
                  } else {
                    row[displayField] = null;
                  }
                });
              }
              
              return row;
            })
          : [];
        setRows(items);
        setTotal(data.meta?.page?.totalRecords || items.length);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => {
        setLoading(false);
        isFetchingRef.current = false;
      });
  }, [entity, service, tableState, apiBaseUrl, sorting, selectedCustomFilter, customFilters]);

  // Cleanup function to reset ref when component unmounts
  useEffect(() => {
    return () => {
      isFetchingRef.current = false;
      customFilterFetchingRef.current = {};
      fetchedCustomFiltersRef.current.clear();
    };
  }, []);

  // Fetch relationship options when component loads (lazy loading)
  useEffect(() => {
    console.log('Fetching relationship options for:', relationshipOptions ? Object.keys(relationshipOptions) : []);
    if (relationshipOptions && Object.keys(relationshipOptions).length > 0) {
      // Use setTimeout to defer loading and improve initial page load
      const timeoutId = setTimeout(() => {
        Object.keys(relationshipOptions).forEach(relKey => {
          fetchRelationshipOptions(relKey);
        });
      }, 100); // Small delay to prioritize main data loading
      
      return () => clearTimeout(timeoutId);
    }
  }, [relationshipOptions, apiBaseUrl]);

  // Fetch dynamic custom filter options when selected
  useEffect(() => {
    console.log('Dynamic filter useEffect triggered:', { selectedCustomFilter, customFilters: customFilters.length });
    if (selectedCustomFilter !== 'all') {
      const filter = customFilters.find(f => f.key === selectedCustomFilter);
      if (filter && filter.type === 'dynamic' && filter.apiEndpoint) {
        // Check if we've already fetched this filter
        if (!fetchedCustomFiltersRef.current.has(selectedCustomFilter)) {
          console.log('Fetching custom filter options for:', selectedCustomFilter);
          fetchCustomFilterOptions(selectedCustomFilter);
        }
      }
    }
  }, [selectedCustomFilter, customFilters, fetchCustomFilterOptions]);

  // Soft delete handler (activate/deactivate) - direct toggle without confirmation
  const handleToggleDeleted = async (row: any) => {
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}/${row.id}`;
      
      // Toggle the deleted status
      const newDeletedStatus = !row.deleted;
      
      const payload = {
        data: {
          type: entity,
          id: row.id,
          attributes: {
            deleted: newDeletedStatus
          }
        }
      };
      
      await axios.patch(url, payload, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'accept': 'application/vnd.api+json',
          'content-type': 'application/vnd.api+json',
        },
      });
      
      // Update the row in the table
      setRows((prev) => prev.map((r) => 
        r.id === row.id ? { ...r, deleted: newDeletedStatus } : r
      ));
    } catch (e: any) {
      setError(e.message || 'Failed to update item');
    }
  };

  const handleEdit = (row: any) => {
    let editFields = fields;
    if (editAllAttributes && row) {
      // Use all keys except system fields
      const systemFields = ['id', 'createTimestamp', 'updateTimestamp', 'createdByAccountId', 'updatedByAccountId', 'source', 'error', 'jobId'];
      editFields = Object.keys(row).filter(f => !systemFields.includes(f));
    }
    
    // Filter to only include updateable fields if specified, maintaining the order
    if (updateableFields) {
      editFields = updateableFields.filter(f => editFields.includes(f));
    }
    
    setEditRow(row);
    const initialForm = editFields.reduce((acc, f) => {
      let value = row[f] ?? '';
      // Handle predefined fields based on their type
      if (predefinedFields[f]) {
        const fieldConfig = predefinedFields[f];
        const isMultiSelect = Array.isArray(fieldConfig);
        const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
        
        if (isMultiSelect && typeof value === 'string' && value) {
          // Convert multi-select fields to array
          value = value.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        }
        // For single select, keep as string (no conversion needed)
      }
      return { ...acc, [f]: value };
    }, {});
    setEditForm(initialForm);
    setEditError(null);
  };


  const handleEditFormChange = useCallback((field: string, value: any) => {
    // Format date fields to YYYY-MM-DD for display
    let formattedValue = value;
    if (field.toLowerCase().includes('date') && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          formattedValue = date.toISOString().split('T')[0];
        }
      } catch (e) {
        // If date parsing fails, keep original value
      }
    }
    setEditForm((prev: any) => ({ ...prev, [field]: formattedValue }));
  }, []);

  const handleCreateFormChange = useCallback((field: string, value: any) => {
    // Format date fields to YYYY-MM-DD for display
    let formattedValue = value;
    if (field.toLowerCase().includes('date') && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          formattedValue = date.toISOString().split('T')[0];
        }
      } catch (e) {
        // If date parsing fails, keep original value
      }
    }
    setCreateForm((prev: any) => ({ ...prev, [field]: formattedValue }));
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}`;
      
      // Remove system fields and ignore empty values
      const { id, createTimestamp, updateTimestamp, createdByAccountId, updatedByAccountId, source, error, jobId, customerType, ...attributes } = createForm;
      let filteredAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      
      // Handle predefined fields based on their type when sending to API
      Object.keys(filteredAttributes).forEach(field => {
        if (predefinedFields[field]) {
          const fieldConfig = predefinedFields[field];
          const isMultiSelect = Array.isArray(fieldConfig);
          const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
          
          if (isMultiSelect && Array.isArray(filteredAttributes[field])) {
            // Convert multi-select arrays to comma-separated string for API
            filteredAttributes[field] = filteredAttributes[field].join(',');
          }
          // For single select, keep as string (no conversion needed)
        }
      });
      
      // Separate attributes and relationships
      const relationships: any = {};
      const finalAttributes: any = {};
      
      Object.keys(filteredAttributes).forEach(key => {
        if (Object.values(relationshipFields).includes(key)) {
          // This is a relationship field
          const relKey = Object.keys(relationshipFields).find(k => relationshipFields[k] === key);
          if (relKey && filteredAttributes[key]) {
            relationships[relKey] = {
              data: {
                type: relKey,
                id: filteredAttributes[key]
              }
            };
          }
        } else {
          // This is a regular attribute
          finalAttributes[key] = filteredAttributes[key];
        }
      });
      
      const payload = {
        data: {
          type: entity,
          attributes: finalAttributes,
          ...(Object.keys(relationships).length > 0 && { relationships })
        },
      };
      
      const response = await axios.post(url, payload, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'accept': 'application/vnd.api+json',
          'content-type': 'application/vnd.api+json',
        },
      });
      
      // Add the new item to the list
      const newItem = response.data?.data;
      if (newItem) {
        const attrs = newItem.attributes || {};
        const relationships = newItem.relationships || {};
        
        const row: any = { id: newItem.id ?? '', ...attrs };
        
        // Process relationships
        if (relationshipFields && Object.keys(relationshipFields).length > 0) {
          Object.keys(relationshipFields).forEach(relKey => {
            const displayField = relationshipFields[relKey];
            const relData = relationships[relKey]?.data;
            if (relData) {
              row[displayField] = relData.id;
            } else {
              row[displayField] = null;
            }
          });
        }
        
        setRows((prev) => [row, ...prev]);
        setTotal((prev) => prev + 1);
      }
      
      setShowCreateDialog(false);
      setCreateForm({});
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create item');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}/${editRow.id}`;
      // Remove id and system fields from attributes, and ignore empty values
      const { id, createTimestamp, updateTimestamp, createdByAccountId, updatedByAccountId, source, error, jobId, customerType, ...attributes } = editForm;
      let filteredAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      
      // Only include updateable fields if specified
      if (updateableFields) {
        filteredAttributes = Object.fromEntries(
          Object.entries(filteredAttributes).filter(([key, _]) => updateableFields.includes(key))
        );
      }
      
      // Handle predefined fields based on their type when sending to API
      Object.keys(filteredAttributes).forEach(field => {
        if (predefinedFields[field]) {
          const fieldConfig = predefinedFields[field];
          const isMultiSelect = Array.isArray(fieldConfig);
          const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
          
          if (isMultiSelect && Array.isArray(filteredAttributes[field])) {
            // Convert multi-select arrays to comma-separated string for API
            filteredAttributes[field] = filteredAttributes[field].join(',');
          }
          // For single select, keep as string (no conversion needed)
        }
      });
      // Separate attributes and relationships
      const relationships: any = {};
      const finalAttributes: any = {};
      
      Object.keys(filteredAttributes).forEach(key => {
        if (Object.values(relationshipFields).includes(key)) {
          // This is a relationship field
          const relKey = Object.keys(relationshipFields).find(k => relationshipFields[k] === key);
          if (relKey && filteredAttributes[key]) {
            relationships[relKey] = {
              data: {
                type: relKey,
                id: filteredAttributes[key]
              }
            };
          }
        } else {
          // This is a regular attribute
          finalAttributes[key] = filteredAttributes[key];
        }
      });
      
      const payload = {
        data: {
          type: entity,
          id: editRow.id,
          attributes: finalAttributes,
          ...(Object.keys(relationships).length > 0 && { relationships })
        },
      };
      await axios.patch(url, payload, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'accept': 'application/vnd.api+json',
          'content-type': 'application/vnd.api+json',
        },
      });
      setRows((prev) => prev.map((r) => (r.id === editRow.id ? { ...r, ...filteredAttributes } : r)));
      setEditRow(null);
    } catch (e: any) {
      setEditError(e.message || 'Failed to update item');
    } finally {
      setEditLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => (
    [
      ...fields.map(f => ({
        accessorKey: f,
        header: ({ column }: any) => <DataGridColumnHeader title={f.charAt(0).toUpperCase() + f.slice(1)} column={column} />, 
        cell: (info: any) => {
          const value = info.getValue();
          let displayValue = value;
          
          // Format date fields to YYYY-MM-DD
          if (f.toLowerCase().includes('date') && value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                displayValue = date.toISOString().split('T')[0];
              }
            } catch (e) {
              // If date parsing fails, keep original value
            }
          }
          
          // Enhanced relationship field display
          if (relationshipFields && Object.keys(relationshipFields).length > 0 && Object.values(relationshipFields).includes(f)) {
            if (value) {
              // Find the relationship key for this field using memoized lookup
              const relKey = relationshipFieldLookup[f];
              const lookupData = relKey ? relationshipLookupData[relKey] : null;
              const relItem = lookupData ? lookupData[value] : null;
              const displayName = relItem ? relItem.label : `ID: ${value}`;
              

              
              return (
                <div style={{ wordBreak: 'break-word', maxWidth: 320, whiteSpace: 'pre-wrap' }}>
                  {displayName}
                </div>
              );
            } else {
              return (
                <div style={{ wordBreak: 'break-word', maxWidth: 320, whiteSpace: 'pre-wrap' }}>
                  -
                </div>
              );
            }
          }
          
          // Deleted status indicator (clickable)
          if (f === 'deleted') {
            return (
              <button
                onClick={() => handleToggleDeleted(info.row.original)}
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title={value ? 'Click to activate' : 'Click to deactivate'}
              >
                <div className={`w-2 h-2 rounded-full ${value ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className={`text-xs font-medium ${value ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {value ? 'Deactivated' : 'Active'}
                </span>
              </button>
            );
          }
          
          // Enhanced JSON field display
          if ((f.toLowerCase().includes('json') || f.toLowerCase().includes('data') || f.toLowerCase().includes('config') || f.toLowerCase().includes('metadata') || f.toLowerCase().includes('settings')) && value) {
            try {
              const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
              return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      {f.toLowerCase().includes('json') ? 'JSON' : 
                       f.toLowerCase().includes('data') ? 'Data' :
                       f.toLowerCase().includes('config') ? 'Config' :
                       f.toLowerCase().includes('metadata') ? 'Metadata' :
                       f.toLowerCase().includes('settings') ? 'Settings' : 'Object'}
                    </span>
                    <button
                      onClick={() => {
                        const formatted = JSON.stringify(jsonValue, null, 2);
                        navigator.clipboard.writeText(formatted);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Copy JSON"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-300 line-clamp-3">
                    {JSON.stringify(jsonValue).substring(0, 80)}
                    {JSON.stringify(jsonValue).length > 80 && '...'}
                  </div>
                </div>
              );
            } catch (e) {
              // If JSON parsing fails, show as regular text with warning
              return (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">Invalid JSON</span>
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 line-clamp-3">
                    {String(value).substring(0, 80)}
                    {String(value).length > 80 && '...'}
                  </div>
                </div>
              );
            }
          }
          
          return (
            <div style={{ wordBreak: 'break-word', maxWidth: 320, whiteSpace: 'pre-wrap' }}>
              {typeof displayValue === 'object' ? JSON.stringify(displayValue, null, 2) : String(displayValue)}
            </div>
          );
        },
        enableSorting: true, 
        meta: { headerClassName: '' },
      })),
      // Actions column
      (enableEdit || enableDelete) ? {
        id: 'actions',
        header: ({ column }: any) => <DataGridColumnHeader title="Actions" column={column} />, 
        enableSorting: false,
        cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            {enableEdit && (
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => handleEdit(row.original)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}

          </div>
        ),
        meta: { headerClassName: '' },
      } : undefined,
    ].filter(Boolean) as ColumnDef<any, any>[]
  ), [fields, enableEdit, enableDelete, relationshipFields, relationshipLookupData, handleEdit, handleToggleDeleted]);

  const table = useReactTable({
    columns,
    data: rows,
    pageCount: Math.ceil(total / tableState.pageSize),
    manualPagination: true,
    getRowId: (row: any) => String(row.id),
    state: {
      pagination: { pageIndex: tableState.pageIndex, pageSize: tableState.pageSize },
      sorting,
    },
    columnResizeMode: 'onChange',
    onPaginationChange: (updater) => {
      setTableState(prev => {
        const next = typeof updater === 'function' ? updater({ pageIndex: prev.pageIndex, pageSize: prev.pageSize }) : updater;
        return { ...prev, ...next };
      });
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    const { table } = useDataGrid();
    return (
      <CardToolbar>
        {enableCreate && (
          <Button 
            onClick={async () => {
              setModalLoading(true);
              
              // Initialize create form with defaults and empty relationship fields
              const initialForm = { ...createDefaults };
              if (relationshipFields) {
                Object.values(relationshipFields).forEach(field => {
                  initialForm[field] = '';
                });
              }
              setCreateForm(initialForm);
              setCreateError(null);
              
              // Small delay to show loading state and improve perceived performance
              await new Promise(resolve => setTimeout(resolve, 50));
              
              setShowCreateDialog(true);
              setModalLoading(false);
            }}
            className="flex items-center gap-2"
            disabled={modalLoading}
          >
            {modalLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Opening...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create {entity.charAt(0).toUpperCase() + entity.slice(1)}
              </>
            )}
          </Button>
        )}
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline">
              <Settings2 />
              Columns
            </Button>
          }
        />
      </CardToolbar>
    );
  };

  return (
    <div className="mx-auto max-w-screen-xl">
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={loading}
        tableLayout={{
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
          cellBorder: true,
        }}
        tableClassNames={{
          bodyRow: 'hover:bg-primary/10 transition-colors',
        }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder={`Search ${entity.charAt(0).toUpperCase() + entity.slice(1)}s...`}
                      value={pendingSearchQuery}
                      onChange={(e) => setPendingSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="ps-9"
                    />
                    {pendingSearchQuery.length > 0 && (
                      <Button
                        mode="icon"
                        variant="ghost"
                        className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => {
                          setPendingSearchQuery('');
                          setTableState(prev => ({ ...prev, pageIndex: 0, searchQuery: '' }));
                        }}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                  
                  {/* Filters Section */}
                  {customFilters.length > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                        </div>
                        
                        <Select value={selectedCustomFilter} onValueChange={setSelectedCustomFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Records</SelectItem>
                            {customFilters.map((filter) => (
                              <SelectItem key={filter.key} value={filter.key}>
                                {filter.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Dynamic Filter Dropdown */}
                        {selectedCustomFilter !== 'all' && customFilters.find(f => f.key === selectedCustomFilter)?.type === 'dynamic' && (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const filter = customFilters.find(f => f.key === selectedCustomFilter);
                              if (!filter || !filter.apiEndpoint) return null;
                              
                              const options = customFiltersData[selectedCustomFilter] || [];
                              const isLoading = customFiltersLoading[selectedCustomFilter] || false;
                              const hasError = customFiltersError[selectedCustomFilter] || false;
                              const currentValue = dynamicFilterValues[selectedCustomFilter] || '';
                              
                              console.log('Dynamic filter dropdown state:', {
                                filterKey: selectedCustomFilter,
                                options: options.length,
                                isLoading,
                                hasError,
                                currentValue
                              });
                              
                              // Find the current label with source
                              const currentOption = options.find((option: any) => 
                                option[filter.valueField || 'id'] === currentValue
                              );
                              let currentLabel = '';
                              if (currentOption) {
                                const name = currentOption[filter.labelField || 'name'];
                                const source = currentOption.source;
                                currentLabel = source ? `${name} (${source})` : name;
                              }
                              
                              if (isLoading) {
                                return (
                                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    Loading...
                                  </div>
                                );
                              }
                              
                              if (hasError) {
                                return (
                                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md">
                                    Error loading options
                                  </div>
                                );
                              }
                              
                              return (
                                <Popover 
                                  open={openDropdowns[`dynamic-filter-${selectedCustomFilter}`]} 
                                  onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [`dynamic-filter-${selectedCustomFilter}`]: open }))}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openDropdowns[`dynamic-filter-${selectedCustomFilter}`]}
                                      className="w-48 justify-between text-sm font-normal"
                                    >
                                      <span className="truncate">
                                        {currentLabel || "Select..."}
                                      </span>
                                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search..." />
                                      <CommandList>
                                        <CommandEmpty>No options found.</CommandEmpty>
                                        <CommandGroup>
                                          {options.map((option: any) => {
                                            const value = option[filter.valueField || 'id'];
                                            const name = option[filter.labelField || 'name'];
                                            const source = option.source;
                                            const label = source ? `${name} (${source})` : name;
                                            return (
                                              <CommandItem
                                                key={value}
                                                value={label}
                                                onSelect={() => {
                                                  setDynamicFilterValues(prev => ({ ...prev, [selectedCustomFilter]: value }));
                                                  setOpenDropdowns(prev => ({ ...prev, [`dynamic-filter-${selectedCustomFilter}`]: false }));
                                                  // Trigger search after selection
                                                  setTimeout(() => {
                                                    setTableState(prev => ({ ...prev }));
                                                  }, 100);
                                                }}
                                                className="whitespace-normal"
                                              >
                                                <Check
                                                  className={`mr-2 h-4 w-4 flex-shrink-0 ${
                                                    currentValue === value ? "opacity-100" : "opacity-0"
                                                  }`}
                                                />
                                                <span className="break-words">{label}</span>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      
                      {/* Clear Filters Button */}
                      {(selectedCustomFilter !== 'all' || Object.keys(dynamicFilterValues).some(key => dynamicFilterValues[key])) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomFilter('all');
                            setDynamicFilterValues({});
                            // Trigger search to refresh results
                            setTimeout(() => {
                              setTableState(prev => ({ ...prev }));
                            }, 100);
                          }}
                          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeading>
            <Toolbar />
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <div style={{ minWidth: 0, overflowX: 'auto' }}>
                <DataGridTable />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
        {error && (
          <div className="mt-4 mb-4">
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-md">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-red-800 dark:text-red-200">
                      Data Loading Error
                    </h4>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-3">
                    {error}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setError(null);
                        // Trigger a re-fetch
                        setTableState(prev => ({ ...prev }));
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-xs font-medium rounded-md border border-red-200 dark:border-red-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DataGrid>

      {/* Edit dialog */}
      <Dialog open={!!editRow} onOpenChange={v => { if (!v) setEditRow(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="pb-0 pt-8 px-8 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Pencil className="h-6 w-6 text-primary" />
                  </div>
                  Edit {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  Update the information below and save your changes. All fields marked with an asterisk (*) are required.
                </DialogDescription>
              </div>
              {editRow && (
                <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {editRow.id}
                </div>
              )}
            </div>
          </DialogHeader>
          
          {/* Sticky error message */}
          {editError && (
            <div className="sticky top-0 z-10 px-8 py-4 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 border-b border-border">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Update Failed
                      </h4>
                      <button
                        onClick={() => setEditError(null)}
                        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-3">
                      {editError}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditError(null)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditError(null)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-xs font-medium rounded-md border border-red-200 dark:border-red-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleEditSubmit}>
            <div className="max-h-[65vh] overflow-y-auto px-8 py-8 bg-gray-50 dark:bg-slate-800/50">
              <div className="space-y-6">
                {(editAllAttributes && editRow
                  ? Object.keys(editRow).filter(f => !['id', 'createTimestamp', 'updateTimestamp', 'createdByAccountId', 'updatedByAccountId', 'source', 'error', 'jobId'].includes(f))
                  : fields.filter(f => f !== 'id')
                ).filter(f => !updateableFields || updateableFields.includes(f))
                .sort((a, b) => {
                  // If updateableFields is provided, sort based on its order
                  if (updateableFields) {
                    const aIndex = updateableFields.indexOf(a);
                    const bIndex = updateableFields.indexOf(b);
                    if (aIndex === -1 && bIndex === -1) return 0;
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                  }
                  return 0;
                }).map((f) => (
                  <div key={f} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground" htmlFor={`edit-${f}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                    {Object.values(relationshipFields).includes(f) && (
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full font-medium">
                        {Object.keys(relationshipFields).find(k => relationshipFields[k] === f) || 'Related'}
                      </span>
                    )}
                    {(f.toLowerCase().includes('json') || f.toLowerCase().includes('data') || f.toLowerCase().includes('config') || f.toLowerCase().includes('metadata') || f.toLowerCase().includes('settings')) && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full font-medium">
                        {f.toLowerCase().includes('json') ? 'JSON' : 
                         f.toLowerCase().includes('data') ? 'Data' :
                         f.toLowerCase().includes('config') ? 'Config' :
                         f.toLowerCase().includes('metadata') ? 'Metadata' :
                         f.toLowerCase().includes('settings') ? 'Settings' : 'Object'}
                      </span>
                    )}
                  </div>
                  {predefinedFields[f] ? (
                    <div className="space-y-3">
                      {(() => {
                        const { options, isLoading, hasError } = getPredefinedFieldOptions(f);
                        const fieldConfig = predefinedFields[f];
                        const isMultiSelect = Array.isArray(fieldConfig);
                        const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
                        
                        // Fetch options if not loaded, not loading, and no error
                        if ('apiEndpoint' in fieldConfig && !options.length && !isLoading && !hasError) {
                          fetchPredefinedFieldOptions(f);
                        }
                        
                        if (isLoading) {
                          return (
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
                            </div>
                          );
                        }
                        
                        if (hasError) {
                          return (
                            <div className="p-4 text-sm text-center space-y-2">
                              <div className="text-red-600">Failed to load options</div>
                              <button
                                onClick={() => {
                                  setPredefinedFieldsError(prev => ({ ...prev, [f]: false }));
                                  fetchPredefinedFieldOptions(f);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Retry
                              </button>
                            </div>
                          );
                        }
                        
                        if (isSingleSelect) {
                          // Single select dropdown implementation
                          const currentValue = editForm[f] || '';
                          return (
                            <div className="space-y-2">
                              <Popover 
                                open={openDropdowns[`edit-predefined-${f}`]} 
                                onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [`edit-predefined-${f}`]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openDropdowns[`edit-predefined-${f}`]}
                                    className="h-11 w-full justify-between text-base"
                                    disabled={editLoading || isLoading}
                                  >
                                    {isLoading ? "Loading..." : 
                                     currentValue ? 
                                       currentValue : 
                                       `Select ${f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}`}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder={`Search ${f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}...`} />
                                    <CommandList>
                                      <CommandEmpty>No {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')} found.</CommandEmpty>
                                      <CommandGroup>
                                        {options.map((value: string) => (
                                          <CommandItem
                                            key={value}
                                            value={value}
                                            onSelect={() => {
                                              handleEditFormChange(f, value);
                                              setOpenDropdowns(prev => ({ ...prev, [`edit-predefined-${f}`]: false }));
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                currentValue === value ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            {value}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          );
                        } else {
                          // Multi select implementation (existing)
                          const currentValues = Array.isArray(editForm[f]) 
                            ? editForm[f] 
                            : (editForm[f] ? editForm[f].split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) : []);
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {options.map((value: string) => {
                                const isChecked = currentValues.includes(value);
                                return (
                                  <div key={value} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                    isChecked 
                                      ? 'border-primary bg-primary/5 text-primary' 
                                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                  }`}>
                                    <div className="relative">
                                      <input
                                        type="checkbox"
                                        id={`${f}-${value}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const currentValues = Array.isArray(editForm[f]) 
                                            ? editForm[f] 
                                            : (editForm[f] ? editForm[f].split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) : []);
                                          const newValues = e.target.checked
                                            ? [...currentValues, value]
                                            : currentValues.filter((v: string) => v !== value);
                                          handleEditFormChange(f, newValues);
                                        }}
                                        disabled={editLoading}
                                        className="peer sr-only"
                                      />
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                        isChecked 
                                          ? 'bg-primary border-primary' 
                                          : 'border-gray-300 hover:border-primary/50'
                                      } ${editLoading ? 'opacity-50' : ''}`}>
                                        {isChecked && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                    </div>
                                    <label htmlFor={`${f}-${value}`} className="text-sm font-medium cursor-pointer flex-1">
                                      {value}
                                    </label>
                                    {isChecked && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      })()}
                    </div>
                                     ) : Object.values(relationshipFields).includes(f) ? (
                     <div className="space-y-2">
                       {(() => {
                         const relationshipKey = Object.keys(relationshipFields).find(k => relationshipFields[k] === f);
                         const config = relationshipKey ? relationshipOptions[relationshipKey] : null;
                         const options = relationshipKey ? relationshipOptionsData[relationshipKey] || [] : [];
                         const isLoading = relationshipKey ? relationshipOptionsLoading[relationshipKey] || false : false;
                         const hasError = relationshipKey ? relationshipOptionsError[relationshipKey] || false : false;
                         
                         // Fetch options if not loaded, not loading, and no error
                         if (relationshipKey && !options.length && !isLoading && !hasError && config) {
                           fetchRelationshipOptions(relationshipKey);
                         }

                         const getOptionLabel = (item: any) => {
                           if (!config) return item.id;
                           const labelField = config.labelField || 'name';
                           const label = item[labelField] || item.name || item.id;
                           const source = item.source;
                           
                           // For workflow lookups, include source in parentheses if available
                           if (relationshipKey === 'workflow' && source) {
                             return `${label} (${source})`;
                           }
                           
                           return label;
                         };

                         const getOptionValue = (item: any) => {
                           if (!config) return item.id;
                           const valueField = config.valueField || 'id';
                           return item[valueField] || item.id;
                         };

                         return (
                           <div className="space-y-2">
                             <Popover 
                               open={openDropdowns[`edit-${f}`]} 
                               onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [`edit-${f}`]: open }))}
                             >
                               <PopoverTrigger asChild>
                                 <Button
                                   variant="outline"
                                   role="combobox"
                                   aria-expanded={openDropdowns[`edit-${f}`]}
                                   className="h-11 w-full justify-between text-base"
                                   disabled={editLoading || isLoading}
                                 >
                                   {isLoading ? "Loading..." : 
                                    editForm[f] ? 
                                      options.find(item => getOptionValue(item) === editForm[f]) ? 
                                        getOptionLabel(options.find(item => getOptionValue(item) === editForm[f])) : 
                                        `ID: ${editForm[f]}` : 
                                      `Select ${relationshipKey || 'Related'}`}
                                   <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                 </Button>
                               </PopoverTrigger>
                               <PopoverContent className="w-full p-0" align="start">
                                 <Command>
                                   <CommandInput placeholder={`Search ${relationshipKey || 'related entity'}...`} />
                                   <CommandList>
                                     <CommandEmpty>No {relationshipKey || 'related entity'} found.</CommandEmpty>
                                     <CommandGroup>
                                       {isLoading ? (
                                         <div className="flex items-center justify-center p-4">
                                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                           <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                                         </div>
                                       ) : hasError ? (
                                         <div className="p-4 text-sm text-center space-y-2">
                                           <div className="text-red-600">Failed to load options</div>
                                           <button
                                             onClick={() => {
                                               if (relationshipKey) {
                                                 setRelationshipOptionsError(prev => ({ ...prev, [relationshipKey]: false }));
                                                 fetchRelationshipOptions(relationshipKey);
                                               }
                                             }}
                                             className="text-xs text-blue-600 hover:text-blue-800 underline"
                                           >
                                             Retry
                                           </button>
                                         </div>
                                       ) : options.length > 0 ? (
                                         options.map((item) => (
                                           <CommandItem
                                             key={getOptionValue(item)}
                                             value={getOptionLabel(item)}
                                             onSelect={() => {
                                               handleEditFormChange(f, getOptionValue(item));
                                               setOpenDropdowns(prev => ({ ...prev, [`edit-${f}`]: false }));
                                             }}
                                           >
                                             <Check
                                               className={`mr-2 h-4 w-4 ${
                                                 editForm[f] === getOptionValue(item) ? "opacity-100" : "opacity-0"
                                               }`}
                                             />
                                             {getOptionLabel(item)}
                                           </CommandItem>
                                         ))
                                       ) : (
                                         <div className="p-4 text-sm text-muted-foreground text-center">
                                           No options available
                                         </div>
                                       )}
                                     </CommandGroup>
                                   </CommandList>
                                 </Command>
                               </PopoverContent>
                             </Popover>
                             <div className="text-xs text-muted-foreground flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500"></div>
                               <span>Select a {relationshipKey || 'related entity'}</span>
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                  ) : (
                    f.toLowerCase().includes('date') ? (
                      <Input
                        id={`edit-${f}`}
                        type="date"
                        value={editForm[f] ?? ''}
                        onChange={e => handleEditFormChange(f, e.target.value)}
                        disabled={editLoading}
                        className="h-11 text-base"
                        placeholder="YYYY-MM-DD"
                      />
                    ) : (f.toLowerCase().includes('json') || f.toLowerCase().includes('data') || f.toLowerCase().includes('config') || f.toLowerCase().includes('metadata') || f.toLowerCase().includes('settings')) ? (
                      <div className="space-y-3">
                        
                        <div className="relative group">
                          <textarea
                            id={`edit-${f}`}
                            value={editForm[f] ?? ''}
                            onChange={e => {
                              const value = e.target.value;
                              handleEditFormChange(f, value);
                            }}
                            disabled={editLoading}
                            className="w-full min-h-[220px] p-5 text-sm font-mono bg-background border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          />
                          
                          {/* JSON validation indicator */}
                          {editForm[f] && (
                            <div className="absolute top-3 right-3">
                              {(() => {
                                try {
                                  JSON.parse(editForm[f]);
                                  return (
                                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  );
                                } catch (e) {
                                  return (
                                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          
                          {/* Floating label for empty state */}
                          {!editForm[f] && (
                            <div className="absolute top-4 left-4 text-muted-foreground/50 text-sm pointer-events-none">
                              Start typing JSON...
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {editForm[f] && (
                              <span className="text-xs font-medium">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(editForm[f]);
                                    const keyCount = Object.keys(parsed).length;
                                    return `${keyCount} key${keyCount !== 1 ? 's' : ''}`;
                                  } catch (e) {
                                    return 'Invalid JSON';
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(editForm[f] || '{}');
                                  const formatted = JSON.stringify(parsed, null, 2);
                                  handleEditFormChange(f, formatted);
                                } catch (e) {
                                  // Handle invalid JSON
                                }
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-sm"
                              disabled={editLoading}
                            >
                              Format
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(editForm[f] || '{}');
                                  navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
                                } catch (e) {
                                  // Handle invalid JSON
                                }
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-sm"
                              disabled={editLoading}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Input
                        id={`edit-${f}`}
                        value={editForm[f] ?? ''}
                        onChange={e => handleEditFormChange(f, e.target.value)}
                        disabled={editLoading}
                        className="h-11 text-base"
                        placeholder={`Enter ${f.charAt(0).toLowerCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}`}
                      />
                    )
                  )}
                </div>
              ))}
              </div>
            </div>
            
            {/* Enhanced Footer for Save/Cancel */}
            <div className="border-t border-border bg-white dark:bg-slate-900 px-8 py-6 mt-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="text-xs text-muted-foreground">
                  {editRow && (
                    <span>Editing {entity} • Last updated: {new Date().toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={editLoading} className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" variant="primary" disabled={editLoading} className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transition-shadow">
                    {editLoading ? (
                      <>
                        <span className="animate-spin mr-2 w-4 h-4 inline-block border-2 border-current border-t-transparent rounded-full" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="pb-0 pt-8 px-8 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  Create {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  Fill in the details below to create a new {entity.charAt(0).toLowerCase() + entity.slice(1)}. All fields marked with an asterisk (*) are required.
                </DialogDescription>
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                New
              </div>
            </div>
          </DialogHeader>
          
          {/* Sticky error message */}
          {createError && (
            <div className="sticky top-0 z-10 px-8 py-4 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 border-b border-border">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Creation Failed
                      </h4>
                      <button
                        onClick={() => setCreateError(null)}
                        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-3">
                      {createError}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCreateError(null)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateError(null)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 text-xs font-medium rounded-md border border-red-200 dark:border-red-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleCreateSubmit}>
            <div className="max-h-[65vh] overflow-y-auto px-8 py-8 bg-gray-50 dark:bg-slate-800/50">
              <div className="space-y-6">
                {fields.filter(f => f.toLowerCase() !== 'id').map(f => (
                  <div key={f} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-foreground" htmlFor={`create-${f}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                      {Object.values(relationshipFields).includes(f) && (
                        <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full font-medium">
                          {Object.keys(relationshipFields).find(k => relationshipFields[k] === f) || 'Related'}
                        </span>
                      )}
                      {(f.toLowerCase().includes('json') || f.toLowerCase().includes('data') || f.toLowerCase().includes('config') || f.toLowerCase().includes('metadata') || f.toLowerCase().includes('settings')) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full font-medium">
                          {f.toLowerCase().includes('json') ? 'JSON' : 
                           f.toLowerCase().includes('data') ? 'Data' :
                           f.toLowerCase().includes('config') ? 'Config' :
                           f.toLowerCase().includes('metadata') ? 'Metadata' :
                           f.toLowerCase().includes('settings') ? 'Settings' : 'Object'}
                        </span>
                      )}
                    </div>
                    
                    {predefinedFields[f] ? (
                      (() => {
                        const { options, isLoading, hasError } = getPredefinedFieldOptions(f);
                        const fieldConfig = predefinedFields[f];
                        const isMultiSelect = Array.isArray(fieldConfig);
                        const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
                        
                        // Fetch options if not loaded, not loading, and no error
                        if ('apiEndpoint' in fieldConfig && !options.length && !isLoading && !hasError) {
                          fetchPredefinedFieldOptions(f);
                        }
                        
                        if (isLoading) {
                          return (
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
                            </div>
                          );
                        }
                        
                        if (hasError) {
                          return (
                            <div className="p-4 text-sm text-center space-y-2">
                              <div className="text-red-600">Failed to load options</div>
                              <button
                                onClick={() => {
                                  setPredefinedFieldsError(prev => ({ ...prev, [f]: false }));
                                  fetchPredefinedFieldOptions(f);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Retry
                              </button>
                            </div>
                          );
                        }
                        
                        if (isSingleSelect) {
                          // Single select dropdown implementation (matching edit modal)
                          const currentValue = createForm[f];
                          return (
                            <div className="space-y-2">
                              <Popover 
                                open={openDropdowns[`create-predefined-${f}`]} 
                                onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [`create-predefined-${f}`]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openDropdowns[`create-predefined-${f}`]}
                                    className="h-11 w-full justify-between text-base"
                                    disabled={createLoading || isLoading}
                                  >
                                    {isLoading ? "Loading..." : 
                                     currentValue ? 
                                       currentValue : 
                                       `Select ${f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}`}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder={`Search ${f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}...`} />
                                    <CommandList>
                                      <CommandEmpty>No {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')} found.</CommandEmpty>
                                      <CommandGroup>
                                        {options.map((value: string) => (
                                          <CommandItem
                                            key={value}
                                            value={value}
                                            onSelect={() => {
                                              handleCreateFormChange(f, value);
                                              setOpenDropdowns(prev => ({ ...prev, [`create-predefined-${f}`]: false }));
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                currentValue === value ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            {value}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          );
                        } else {
                          // Multi select implementation (matching edit modal)
                          const currentValues = Array.isArray(createForm[f]) 
                            ? createForm[f] 
                            : (createForm[f] ? createForm[f].split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) : []);
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {options.map((value: string) => {
                                const isChecked = currentValues.includes(value);
                                return (
                                  <div key={value} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                    isChecked 
                                      ? 'border-primary bg-primary/5 text-primary' 
                                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                  }`}>
                                    <div className="relative">
                                      <input
                                        type="checkbox"
                                        id={`create-${f}-${value}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const currentValues = Array.isArray(createForm[f]) 
                                            ? createForm[f] 
                                            : (createForm[f] ? createForm[f].split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) : []);
                                          const newValues = e.target.checked
                                            ? [...currentValues, value]
                                            : currentValues.filter((v: string) => v !== value);
                                          handleCreateFormChange(f, newValues);
                                        }}
                                        disabled={createLoading}
                                        className="peer sr-only"
                                      />
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                        isChecked 
                                          ? 'bg-primary border-primary' 
                                          : 'border-gray-300 hover:border-primary/50'
                                      } ${createLoading ? 'opacity-50' : ''}`}>
                                        {isChecked && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                    </div>
                                    <label htmlFor={`create-${f}-${value}`} className="text-sm font-medium cursor-pointer flex-1">
                                      {value}
                                    </label>
                                    {isChecked && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      })()
                    ) : Object.values(relationshipFields).includes(f) ? (
                      <div className="space-y-2">
                        {(() => {
                          const relationshipKey = Object.keys(relationshipFields).find(k => relationshipFields[k] === f);
                          const config = relationshipKey ? relationshipOptions[relationshipKey] : null;
                          const options = relationshipKey ? relationshipOptionsData[relationshipKey] || [] : [];
                          const isLoading = relationshipKey ? relationshipOptionsLoading[relationshipKey] || false : false;
                          const hasError = relationshipKey ? relationshipOptionsError[relationshipKey] || false : false;
                          
                          // Fetch options if not loaded, not loading, and no error
                          if (relationshipKey && !options.length && !isLoading && !hasError && config) {
                            fetchRelationshipOptions(relationshipKey);
                          }

                          const getOptionLabel = (item: any) => {
                            if (!config) return item.id;
                            const labelField = config.labelField || 'name';
                            const label = item[labelField] || item.name || item.id;
                            const source = item.source;
                            
                            // For workflow lookups, include source in parentheses if available
                            if (relationshipKey === 'workflow' && source) {
                              return `${label} (${source})`;
                            }
                            
                            return label;
                          };

                          const getOptionValue = (item: any) => {
                            if (!config) return item.id;
                            const valueField = config.valueField || 'id';
                            return item[valueField] || item.id;
                          };

                          return (
                            <div className="space-y-2">
                              <Popover 
                                open={openDropdowns[`create-${f}`]} 
                                onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [`create-${f}`]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openDropdowns[`create-${f}`]}
                                    className="h-11 w-full justify-between text-base"
                                    disabled={createLoading || isLoading}
                                  >
                                    {isLoading ? "Loading..." : 
                                     createForm[f] ? 
                                       options.find(item => getOptionValue(item) === createForm[f]) ? 
                                         getOptionLabel(options.find(item => getOptionValue(item) === createForm[f])) : 
                                         `ID: ${createForm[f]}` : 
                                       `Select ${relationshipKey || 'Related'}`}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder={`Search ${relationshipKey || 'related entity'}...`} />
                                    <CommandList>
                                      <CommandEmpty>No {relationshipKey || 'related entity'} found.</CommandEmpty>
                                      <CommandGroup>
                                        {isLoading ? (
                                          <div className="flex items-center justify-center p-4">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                                          </div>
                                        ) : hasError ? (
                                          <div className="p-4 text-sm text-center space-y-2">
                                            <div className="text-red-600">Failed to load options</div>
                                            <button
                                              onClick={() => {
                                                if (relationshipKey) {
                                                  setRelationshipOptionsError(prev => ({ ...prev, [relationshipKey]: false }));
                                                  fetchRelationshipOptions(relationshipKey);
                                                }
                                              }}
                                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                              Retry
                                            </button>
                                          </div>
                                        ) : options.length > 0 ? (
                                          options.map((item) => (
                                            <CommandItem
                                              key={getOptionValue(item)}
                                              value={getOptionLabel(item)}
                                              onSelect={() => {
                                                handleCreateFormChange(f, getOptionValue(item));
                                                setOpenDropdowns(prev => ({ ...prev, [`create-${f}`]: false }));
                                              }}
                                            >
                                              <Check
                                                className={`mr-2 h-4 w-4 ${
                                                  createForm[f] === getOptionValue(item) ? "opacity-100" : "opacity-0"
                                                }`}
                                              />
                                              {getOptionLabel(item)}
                                            </CommandItem>
                                          ))
                                        ) : (
                                          <div className="p-4 text-sm text-muted-foreground text-center">
                                            No options available
                                          </div>
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Select a {relationshipKey || 'related entity'}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (f.toLowerCase().includes('date')) ? (
                      <Input
                        id={`create-${f}`}
                        type="date"
                        value={createForm[f] ?? ''}
                        onChange={e => handleCreateFormChange(f, e.target.value)}
                        disabled={createLoading}
                        className="h-11 text-base"
                      />
                    ) : (f.toLowerCase().includes('json') || f.toLowerCase().includes('data') || f.toLowerCase().includes('config') || f.toLowerCase().includes('metadata') || f.toLowerCase().includes('settings')) ? (
                      <div className="space-y-3">
                        <div className="relative group">
                          <textarea
                            id={`create-${f}`}
                            value={createForm[f] ?? ''}
                            onChange={e => handleCreateFormChange(f, e.target.value)}
                            disabled={createLoading}
                            className="w-full min-h-[220px] p-4 text-sm font-mono bg-background border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          />
                          {createForm[f] && (
                            <div className="absolute top-4 right-4">
                              {(() => {
                                try {
                                  JSON.parse(createForm[f]);
                                  return (
                                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  );
                                } catch (e) {
                                  return (
                                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          
                          {!createForm[f] && (
                            <div className="absolute top-4 left-4 text-muted-foreground/50 text-sm pointer-events-none">
                              Start typing JSON...
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {createForm[f] && (
                              <span className="text-xs font-medium">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(createForm[f]);
                                    const keyCount = Object.keys(parsed).length;
                                    return `${keyCount} key${keyCount !== 1 ? 's' : ''}`;
                                  } catch (e) {
                                    return 'Invalid JSON';
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(createForm[f] || '{}');
                                  const formatted = JSON.stringify(parsed, null, 2);
                                  handleCreateFormChange(f, formatted);
                                } catch (e) {
                                  // Handle invalid JSON
                                }
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-sm"
                              disabled={createLoading}
                            >
                              Format
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(createForm[f] || '{}');
                                  navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
                                } catch (e) {
                                  // Handle invalid JSON
                                }
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-sm"
                              disabled={createLoading}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Input
                        id={`create-${f}`}
                        value={createForm[f] ?? ''}
                        onChange={e => handleCreateFormChange(f, e.target.value)}
                        disabled={createLoading}
                        className="h-11 text-base"
                        placeholder={`Enter ${f.charAt(0).toLowerCase() + f.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enhanced Footer for Save/Cancel */}
            <div className="border-t border-border bg-white dark:bg-slate-900 px-8 py-6 mt-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="text-xs text-muted-foreground">
                  <span>Creating new {entity.charAt(0).toLowerCase() + entity.slice(1)} • {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={createLoading} className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" variant="primary" disabled={createLoading} className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transition-shadow">
                    {createLoading ? (
                      <>
                        <span className="animate-spin mr-2 w-4 h-4 inline-block border-2 border-current border-t-transparent rounded-full" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create {entity.charAt(0).toUpperCase() + entity.slice(1)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 