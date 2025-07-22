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
import { Search, X, Settings2, Pencil, Trash2 } from 'lucide-react';
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
    setEditRow(row);
    setEditForm(editFields.reduce((acc, f) => ({ ...acc, [f]: row[f] ?? '' }), {}));
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
      const filteredAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {entity.charAt(0).toUpperCase() + entity.slice(1)}</DialogTitle>
            <DialogDescription>Update the fields and save changes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto overflow-x-hidden">
            {(editAllAttributes && editRow
              ? Object.keys(editRow).filter(f => !['id', 'createTimestamp', 'updateTimestamp', 'createdByAccountId', 'updatedByAccountId', 'source', 'error', 'jobId'].includes(f))
              : fields.filter(f => f !== 'id')
            ).map((f) => (
              <div key={f} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`edit-${f}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                <Input
                  id={`edit-${f}`}
                  value={editForm[f] ?? ''}
                  onChange={e => handleEditFormChange(f, e.target.value)}
                  disabled={editLoading}
                />
              </div>
            ))}
            {editError && <Alert variant="destructive" appearance="light"><AlertIcon /> <AlertTitle>{editError}</AlertTitle></Alert>}
            {/* Sticky footer for Save/Cancel */}
            <div className="sticky bottom-0 bg-background pt-4 pb-2 px-0 z-10 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={editLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="primary" disabled={editLoading}>
                {editLoading ? <span className="animate-spin mr-2 w-4 h-4 inline-block border-2 border-current border-t-transparent rounded-full" /> : null}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 