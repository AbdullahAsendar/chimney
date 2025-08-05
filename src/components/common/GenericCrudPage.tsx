import { useEffect, useMemo, useState } from 'react';
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
import { Search, X, Settings2, Pencil, Trash2, Check, Save, AlertCircle, Plus } from 'lucide-react';
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
  predefinedFields?: Record<string, string[] | { type: 'single' | 'multi'; options: string[] }>; // fieldName -> array of possible values or object with type and options
  updateableFields?: string[]; // fields that can be updated, if not provided all fields are updateable
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
  const [rowToDelete, setRowToDelete] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<any>({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Handler to batch search and page reset
  const handleSearch = () => {
    setTableState(prev => ({
      ...prev,
      pageIndex: 0,
      searchQuery: pendingSearchQuery,
    }));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filterQuery = tableState.searchQuery ? `&filter=${encodeURIComponent(tableState.searchQuery)}` : '';
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
              const row: any = { id: item.id ?? '', ...attrs };
              return row;
            })
          : [];
        setRows(items);
        setTotal(data.meta?.page?.totalRecords || items.length);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [entity, service, tableState, apiBaseUrl, sorting]);

  // Delete handler
  const handleDelete = async (row: any) => {
    setRowToDelete(row);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!rowToDelete) return;
    try {
      setLoading(true);
      setError(null);
      const auth = authHelper.getAuth();
      const accessToken = auth?.access_token;
      const accountId = localStorage.getItem('chimney-user-id');
      const url = `${apiBaseUrl}/${service}/api/v1/chimney/${entity}/${rowToDelete.id}`;
      await axios.delete(url, {
        headers: {
          ...(accessToken ? { 'sdd-token': accessToken } : {}),
          ...(accountId ? { 'account-id': accountId } : {}),
          'Content-Type': 'application/json',
          accept: '*/*',
        },
      });
      setRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
      setTotal((prev) => prev - 1);
      setShowDeleteDialog(false);
      setRowToDelete(null);
    } catch (e: any) {
      setError(e.message || 'Failed to delete item');
    } finally {
      setLoading(false);
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


  const handleEditFormChange = (field: string, value: any) => {
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
  };

  const handleCreateFormChange = (field: string, value: any) => {
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
  };

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
      
      const payload = {
        data: {
          type: entity,
          attributes: filteredAttributes,
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
        const row: any = { id: newItem.id ?? '', ...attrs };
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
      const payload = {
        data: {
          type: entity,
          id: editRow.id,
          attributes: filteredAttributes,
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
            {enableDelete && (
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => handleDelete(row.original)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
        meta: { headerClassName: '' },
      } : undefined,
    ].filter(Boolean) as ColumnDef<any, any>[]
  ), [fields, enableEdit, enableDelete]);

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
            onClick={() => {
              setCreateForm({});
              setCreateError(null);
              setShowCreateDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create {entity.charAt(0).toUpperCase() + entity.slice(1)}
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
              <div className="flex items-center gap-2.5">
                <div className="relative">
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
                    className="ps-9 w-160"
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
          <Alert variant="destructive" appearance="light" onClose={() => setError(null)} className="mb-4">
            <AlertIcon />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
      </DataGrid>
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} autoFocus variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      Update Failed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      {editError}
                    </p>
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
                        const fieldConfig = predefinedFields[f];
                        const isMultiSelect = Array.isArray(fieldConfig);
                        const options = isMultiSelect ? fieldConfig : (fieldConfig as any).options;
                        const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
                        
                        if (isSingleSelect) {
                          // Single select implementation
                          const currentValue = editForm[f] || '';
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {options.map((value: string) => (
                                <div key={value} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                  currentValue === value
                                    ? 'border-primary bg-primary/5 text-primary' 
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}>
                                  <div className="relative">
                                    <input
                                      type="radio"
                                      name={f}
                                      id={`${f}-${value}`}
                                      value={value}
                                      checked={currentValue === value}
                                      onChange={(e) => handleEditFormChange(f, e.target.value)}
                                      disabled={editLoading}
                                      className="peer sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                      currentValue === value
                                        ? 'bg-primary border-primary' 
                                        : 'border-gray-300 hover:border-primary/50'
                                    } ${editLoading ? 'opacity-50' : ''}`}>
                                      {currentValue === value && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                  <label htmlFor={`${f}-${value}`} className="text-sm font-medium cursor-pointer flex-1">
                                    {value}
                                  </label>
                                  {currentValue === value && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              ))}
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
                            placeholder={`Enter valid JSON for ${f.charAt(0).toLowerCase() + f.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`}
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
                        placeholder={`Enter ${f.charAt(0).toLowerCase() + f.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-white dark:bg-slate-900 px-8 py-6 border-b border-border">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Create New {entity.charAt(0).toUpperCase() + entity.slice(1)}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details to create a new {entity.charAt(0).toLowerCase() + entity.slice(1)}.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="sticky top-0 z-10 px-8 py-4 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 border-b border-border">
              <Alert variant="destructive" appearance="light" onClose={() => setCreateError(null)}>
                <AlertIcon />
                <AlertTitle>{createError}</AlertTitle>
              </Alert>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50 dark:bg-gray-900/50">
              <div className="space-y-6">
                {fields.filter(f => f.toLowerCase() !== 'id').map(f => (
                  <div key={f} className="space-y-2">
                    <label className="text-sm font-semibold text-foreground" htmlFor={`create-${f}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                    
                    {predefinedFields[f] ? (
                      (() => {
                        const fieldConfig = predefinedFields[f];
                        const isMultiSelect = Array.isArray(fieldConfig);
                        const options = isMultiSelect ? fieldConfig : (fieldConfig as any).options;
                        const isSingleSelect = !isMultiSelect && (fieldConfig as any).type === 'single';
                        
                        if (isSingleSelect) {
                          return (
                            <div className="space-y-2">
                              {options.map((option: string) => (
                                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`create-${f}`}
                                    value={option}
                                    checked={createForm[f] === option}
                                    onChange={(e) => handleCreateFormChange(f, e.target.value)}
                                    disabled={createLoading}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-foreground">{option}</span>
                                </label>
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-2">
                              {options.map((option: string) => (
                                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(createForm[f]) ? createForm[f].includes(option) : false}
                                    onChange={(e) => {
                                      const currentValues = Array.isArray(createForm[f]) ? createForm[f] : [];
                                      if (e.target.checked) {
                                        handleCreateFormChange(f, [...currentValues, option]);
                                      } else {
                                        handleCreateFormChange(f, currentValues.filter((v: string) => v !== option));
                                      }
                                    }}
                                    disabled={createLoading}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-foreground">{option}</span>
                                </label>
                              ))}
                            </div>
                          );
                        }
                      })()
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
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-foreground" htmlFor={`create-${f}`}>
                            {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                          </label>
                          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full font-medium">
                            {f.toLowerCase().includes('json') ? 'JSON' : 
                             f.toLowerCase().includes('data') ? 'Data' :
                             f.toLowerCase().includes('config') ? 'Config' :
                             f.toLowerCase().includes('metadata') ? 'Metadata' :
                             f.toLowerCase().includes('settings') ? 'Settings' : 'Object'}
                          </span>
                        </div>
                        <div className="relative group">
                          <textarea
                            id={`create-${f}`}
                            value={createForm[f] ?? ''}
                            onChange={e => handleCreateFormChange(f, e.target.value)}
                            disabled={createLoading}
                            className="w-full min-h-[220px] p-5 text-sm font-mono bg-background border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            placeholder={`Enter valid JSON for ${f.charAt(0).toLowerCase() + f.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`}
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
            
            {/* Enhanced Footer for Create/Cancel */}
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