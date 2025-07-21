import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Button, Typography, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Card, CardContent, Chip, IconButton as MuiIconButton
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel, getGridStringOperators } from '@mui/x-data-grid';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useEnvironment } from '../../contexts/EnvironmentContext';
// import { useEnvironment } from '../../contexts/EnvironmentContext';

/**
 * Usage example:
 * <GenericCrudPage
 *   entity="customer"
 *   service="authentication-service"
 *   fields={['id', 'name', 'nameAr']}
 *   enableCreate={true}
 *   enableEdit={true}
 *   enableDelete={true}
 * />
 */
interface GenericCrudPageProps {
  entity: string;
  service: string;
  fields: string[];
  enableCreate?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  selected: any;
  editMode: 'create' | 'edit';
  entity: string;
  allAttributeKeys: string[];
}

interface FilterProps {
  rsqlFilter: string;
  onFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

// Filter component
const FilterComponent: React.FC<FilterProps> = React.memo(({ 
  rsqlFilter, 
  onFilterChange, 
  onClearFilters, 
  onApplyFilters 
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilter = rsqlFilter.trim() !== '';

  const handleClearAll = useCallback(() => {
    onClearFilters();
  }, [onClearFilters]);

  const handleApply = useCallback(() => {
    onApplyFilters();
  }, [onApplyFilters]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: '8px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">RSQL Filter</Typography>
            {hasActiveFilter && (
              <Chip 
                label="Active"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasActiveFilter && (
              <Button
                size="small"
                onClick={handleClearAll}
                startIcon={<ClearIcon />}
                variant="outlined"
                color="error"
              >
                Clear Filter
              </Button>
            )}
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              variant="outlined"
            >
              {expanded ? 'Hide' : 'Show'} Filter
            </Button>
          </Box>
        </Box>

        {expanded && (
          <Box sx={{ mt: 2 }}>
                          <TextField
                label="RSQL Filter Expression"
                value={rsqlFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Example: name=*test* or email=*@example.com"
                helperText="Enter RSQL filter expression. Examples: name==*test*, email==*@example.com, id==123"
                InputProps={{
                  endAdornment: rsqlFilter && (
                    <MuiIconButton
                      size="small"
                      onClick={() => onFilterChange('')}
                      sx={{ mr: -0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </MuiIconButton>
                  ),
                }}
              />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleApply}
                disabled={!hasActiveFilter}
              >
                Apply Filter
              </Button>
              <Button
                variant="outlined"
                onClick={() => setExpanded(false)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// Optimized form field component
const FormField = React.memo(({ 
  field, 
  value, 
  onChange 
}: { 
  field: string; 
  value: string; 
  onChange: (field: string, value: string) => void; 
}) => (
  <TextField
    label={field}
    value={value}
    onChange={(e) => onChange(field, e.target.value)}
    fullWidth
    margin="dense"
    sx={{ mb: 2 }}
  />
));

// Separate EditDialog component to prevent re-renders
const EditDialog: React.FC<EditDialogProps> = React.memo(({ 
  open, 
  onClose, 
  onSave, 
  selected, 
  editMode, 
  entity, 
  allAttributeKeys 
}) => {
  const [formData, setFormData] = useState<any>({});

  // Filter out system fields that shouldn't be editable
  const getEditableFields = useCallback((fields: string[]) => {
    const systemFields = [
      'id', 'createTimestamp', 'updateTimestamp', 'createdByAccountId', 
      'updatedByAccountId', 'source', 'trialCount', 'error', 'jobId'
    ];
    return fields.filter(field => !systemFields.includes(field));
  }, []);

  // Update form data when selected changes
  useEffect(() => {
    setFormData(selected || {});
  }, [selected]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(formData);
  }, [formData, onSave]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{editMode === 'edit' ? `Edit ${entity}` : `Add ${entity}`}</DialogTitle>
      <DialogContent>
        {formData && getEditableFields(allAttributeKeys).map(field => (
          <FormField
            key={field}
            field={field}
            value={formData[field] ?? ''}
            onChange={handleFieldChange}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
});

const PAGE_SIZE = 20;

// Custom filter input for DataGrid column filters
const EnterOrBlurFilterInput = (props: any) => {
  const { item, applyValue, focusElementRef } = props;
  const [value, setValue] = useState(item.value || '');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleApply = () => {
    applyValue({ ...item, value });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <TextField
      variant="outlined"
      size="small"
      value={value}
      onChange={handleChange}
      onBlur={handleApply}
      onKeyDown={handleKeyDown}
      inputRef={focusElementRef}
      fullWidth
    />
  );
};

const GenericCrudPage: React.FC<GenericCrudPageProps> = React.memo(({ 
  entity, 
  service, 
  fields, 
  enableCreate = true, 
  enableEdit = true, 
  enableDelete = true
}) => {
  // const { apiBaseUrl } = useEnvironment();
  const { apiBaseUrl } = useEnvironment();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const accountId = useSelector((state: RootState) => state.auth.accountId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE });
  const [total, setTotal] = useState(0);
  const [allAttributeKeys, setAllAttributeKeys] = useState<string[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [rsqlFilter, setRsqlFilter] = useState<string>('');
  const [appliedRsqlFilter, setAppliedRsqlFilter] = useState<string>('');
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<Record<string, string>>({});
  const [filterModel, setFilterModel] = useState<any>({ items: [] });

  // Debounced filter state
  const [debouncedRsqlFilter, setDebouncedRsqlFilter] = useState(rsqlFilter);
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRsqlFilter(rsqlFilter);
      setDebouncedColumnFilters(columnFilters);
    }, 1200); // 1200ms debounce
    return () => clearTimeout(handler);
  }, [rsqlFilter, columnFilters]);

  // Build filter query string
  const buildFilterQuery = useCallback((filterValue: string, columnFilters: Record<string, string>) => {
    // Combine RSQL filter and column filters into a single RSQL expression
    let rsqlParts: string[] = [];
    if (filterValue && filterValue.trim() !== '') {
      rsqlParts.push(filterValue.trim());
    }
    Object.entries(columnFilters || {})
      .filter(([_, value]) => value && value.trim() !== '')
      .forEach(([field, value]) => {
        // Always use contains (==*value*) for all fields
        rsqlParts.push(`${field}==*${value}*`);
      });
    const rsqlQuery = rsqlParts.length > 0 ? `&filter=${encodeURIComponent(rsqlParts.join(';'))}` : '';
    return rsqlQuery;
  }, []);

  // Fetch entities
  useEffect(() => {
    if (!accessToken || !accountId) {
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;
    // DataGrid is 0-based, API is 1-based
    const apiPage = paginationModel.page + 1;
    const filterQuery = buildFilterQuery(debouncedRsqlFilter, appliedColumnFilters);
    const sortQuery = sortModel.length > 0 ? `&sort=${sortModel.map(s => s.sort === 'desc' ? `-${s.field}` : s.field).join(',')}` : '';
    const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}?page%5Bnumber%5D=${apiPage}&page%5Bsize%5D=${paginationModel.pageSize}&page%5Btotals%5D=true${filterQuery}${sortQuery}`;
    axios.get(url, {
      headers: {
        'accept': 'application/vnd.api+json',
        'sdd-token': accessToken,
        'account-id': accountId,
      },
      signal: abortControllerRef.current.signal,
    })
      .then(res => {
        if (requestIdRef.current !== thisRequestId) return;
        let data = res.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            setError('Failed to parse JSON response');
            setLoading(false);
            return;
          }
        }
        // Map only the display fields for the table
        const items = Array.isArray(data.data)
          ? data.data.map((item: any) => {
              const attrs = item.attributes || {};
              const row: any = { id: item.id ?? '', _allAttrs: attrs };
              fields.forEach(f => {
                if (f === 'id') return; // already set
                row[f] = attrs[f] ?? '';
              });
              return row;
            })
          : [];
        setRows(items);
        setTotal(data.meta?.page?.totalRecords || items.length);
        // Find all attribute keys for the edit dialog
        if (items.length > 0) {
          setAllAttributeKeys(Object.keys(items[0]._allAttrs || {}));
        } else {
          setAllAttributeKeys([]);
        }
      })
      .catch(e => {
        if (requestIdRef.current !== thisRequestId) return;
        if (e.name !== 'AbortError') {
          setError(e.message);
        }
      })
      .finally(() => {
        if (requestIdRef.current === thisRequestId) setLoading(false);
      });
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [paginationModel, debouncedRsqlFilter, accessToken, accountId, entity, service, fields, buildFilterQuery, sortModel, appliedColumnFilters]);

  // Column filter handlers
  const handleColumnFilterChange = useCallback((field: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyColumnFilters = useCallback(() => {
    setAppliedColumnFilters({ ...columnFilters });
    setPaginationModel({ page: 0, pageSize: PAGE_SIZE });
  }, [columnFilters]);

  const handleClearColumnFilters = useCallback(() => {
    setColumnFilters({});
    setAppliedColumnFilters({});
  }, []);

  // Handle DataGrid filter model changes
  const handleFilterModelChange = useCallback((newFilterModel: any) => {
    setFilterModel(newFilterModel);
    
    // Convert DataGrid filter model to our column filters
    const newColumnFilters: Record<string, string> = {};
    if (newFilterModel && newFilterModel.items) {
      newFilterModel.items.forEach((item: any) => {
        if (item.field && item.value) {
          newColumnFilters[item.field] = item.value;
        }
      });
    }
    
    setColumnFilters(newColumnFilters);
    setAppliedColumnFilters(newColumnFilters);
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((value: string) => {
    setRsqlFilter(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setRsqlFilter('');
    setAppliedRsqlFilter('');
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedRsqlFilter(rsqlFilter);
    setPaginationModel({ page: 0, pageSize: PAGE_SIZE });
  }, [rsqlFilter]);

  // Actions
  const handleEdit = useCallback((row: any) => {
    setSelected({ id: row.id, ...row._allAttrs });
    setEditMode('edit');
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((row: any) => {
    if (!window.confirm('Delete this item?')) return;
    const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}/${row.id}`;
    axios.delete(url, {
      headers: {
        'accept': 'application/vnd.api+json',
        'sdd-token': accessToken,
        'account-id': accountId,
      },
    })
      .then(() => setRows(rows => rows.filter(r => r.id !== row.id)))
      .catch(e => alert('Delete failed: ' + e.message));
  }, [apiBaseUrl, service, entity, accessToken, accountId]);

  const handleCreate = useCallback(() => {
    // For create, use allAttributeKeys to build an empty object
    const emptyAttrs = allAttributeKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as any);
    setSelected({ ...emptyAttrs });
    setEditMode('create');
    setDialogOpen(true);
  }, [allAttributeKeys]);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelected(null);
  }, []);

  const handleDialogSave = useCallback((formData: any) => {
    const url = editMode === 'edit'
      ? `${apiBaseUrl}/${service}/api/v1/chimney/${entity}/${formData.id}`
      : `${apiBaseUrl}/${service}/api/v1/chimney/${entity}`;
    const method = editMode === 'edit' ? 'patch' : 'post';
    // Remove id and unwanted fields from attributes
    const { id, source, createdByAccountId, createTimestamp, updatedByAccountId, updateTimestamp, customerType, ...attributes } = formData || {};
    const payload = {
      data: {
        type: entity,
        ...(editMode === 'edit' ? { id: formData.id } : {}),
        attributes,
      },
    };
    axios({
      url,
      method,
      data: payload,
      headers: {
        'accept': 'application/vnd.api+json',
        'content-type': 'application/vnd.api+json',
        'sdd-token': accessToken,
        'account-id': accountId,
      },
    })
      .then(() => {
        setDialogOpen(false);
        setSelected(null);
        setLoading(true);
        setPaginationModel({ ...paginationModel, page: 0 });
      })
      .catch(e => alert('Save failed: ' + e.message));
  }, [apiBaseUrl, service, entity, editMode, accessToken, accountId, paginationModel]);

  // Columns definition moved here to access correct handleEdit/handleDelete
  const containsOnlyOperator = [{
    ...getGridStringOperators().find(op => op.value === 'contains')!,
    InputComponent: EnterOrBlurFilterInput,
  }];
  const columns: GridColDef[] = React.useMemo(() => {
    const baseColumns: GridColDef[] = fields.map(f => ({
      field: f,
      headerName: f.charAt(0).toUpperCase() + f.slice(1),
      width: f === 'id' ? 120 : 200,
      flex: f === 'id' ? undefined : 1,
      sortable: true,
      filterable: true,
      filterOperators: containsOnlyOperator,
    }));

    // Only add actions column if edit or delete is enabled
    if (enableEdit || enableDelete) {
      baseColumns.push({
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params: any) => (
          <>
            {enableEdit && (
              <IconButton onClick={() => handleEdit(params.row)} key="edit">
                <EditIcon />
              </IconButton>
            )}
            {enableDelete && (
              <IconButton color="error" onClick={() => handleDelete(params.row)} key="delete">
                <DeleteIcon />
              </IconButton>
            )}
          </>
        ),
      });
    }

    return baseColumns;
  }, [fields, enableEdit, enableDelete, handleEdit, handleDelete]);

  return (
    <Box sx={{ p: 1 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        {enableCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} sx={{ mb: 2 }}>
            Add {entity.charAt(0).toUpperCase() + entity.slice(1)}
          </Button>
        )}
        
        <FilterComponent
          rsqlFilter={rsqlFilter}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[PAGE_SIZE]}
            rowCount={total}
            pagination
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            loading={loading}
            getRowId={row => row.id}
            disableRowSelectionOnClick
            autoHeight={false}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            sortingMode="server"
            filterModel={filterModel || { items: [] }}
            onFilterModelChange={handleFilterModelChange}
            filterMode="server"
          />
        </div>
      </Paper>
      <EditDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        selected={selected}
        editMode={editMode}
        entity={entity}
        allAttributeKeys={allAttributeKeys}
      />
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
});

export default GenericCrudPage; 