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
import { Search, X, Settings2, Pencil, Trash2, Check, Save, AlertCircle } from 'lucide-react';
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
  predefinedFields?: Record<string, string[]>; // fieldName -> array of possible values
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
      // Convert predefined fields to array if they're strings
      if (predefinedFields[f] && typeof value === 'string' && value) {
        value = value.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
      }
      return { ...acc, [f]: value };
    }, {});
    setEditForm(initialForm);
    setEditError(null);
  };


  const handleEditFormChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
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
      
      // Convert predefined fields from string to array if they exist
      Object.keys(filteredAttributes).forEach(field => {
        if (predefinedFields[field] && typeof filteredAttributes[field] === 'string') {
          filteredAttributes[field] = filteredAttributes[field]
            .split(',')
            .map((value: string) => value.trim())
            .filter((value: string) => value.length > 0);
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
        cell: (info: any) => (
          <div style={{ wordBreak: 'break-word', maxWidth: 320, whiteSpace: 'pre-wrap' }}>
            {typeof info.getValue() === 'object' ? JSON.stringify(info.getValue(), null, 2) : String(info.getValue())}
          </div>
        ),
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
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-6">
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
                  ID: {editRow.id}
                </div>
              )}
            </div>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">
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
                <div key={f} className="space-y-3 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2" htmlFor={`edit-${f}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}
                      <span className="text-xs text-muted-foreground font-normal">({f})</span>
                    </label>
                    {editForm[f] && typeof editForm[f] === 'string' && editForm[f].length > 0 && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Filled
                      </div>
                    )}
                  </div>
                  {predefinedFields[f] ? (
                    <div className="space-y-4">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        Select one or more options:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {predefinedFields[f].map((value: string) => {
                          const currentValues = Array.isArray(editForm[f]) 
                            ? editForm[f] 
                            : (editForm[f] ? editForm[f].split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) : []);
                          const isChecked = currentValues.includes(value);
                          return (
                            <div key={value} className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
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
                      {editForm[f] && Array.isArray(editForm[f]) && editForm[f].length > 0 && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          Selected: {editForm[f].length} option{editForm[f].length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id={`edit-${f}`}
                        value={editForm[f] ?? ''}
                        onChange={e => handleEditFormChange(f, e.target.value)}
                        disabled={editLoading}
                        className="h-11 text-base"
                        placeholder={`Enter ${f.charAt(0).toLowerCase() + f.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                      />
                      {editForm[f] && typeof editForm[f] === 'string' && editForm[f].length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Character count: {editForm[f].length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {editError && (
              <Alert variant="destructive" appearance="light" className="mb-4">
                <AlertIcon />
                <AlertTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {editError}
                </AlertTitle>
              </Alert>
            )}
            
            {/* Enhanced Footer for Save/Cancel */}
            <div className="pt-6 border-t border-border bg-gradient-to-r from-background to-muted/30 rounded-lg p-4">
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
    </div>
  );
}; 