'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ILocation {
  name: string;
  flag: string;
}

interface IStatus {
  label: string;
  variant: 'success' | 'warning' | 'destructive';
}

interface IData {
  id: string;
  orderId: string;
  date: string;
  customer: string;
  amount: string;
  payment: string;
  location: ILocation;
  status: IStatus;
}

const data: IData[] = [
  {
    id: '1',
    orderId: 'APP-1001',
    date: '18 Aug, 2025',
    customer: 'John Doe',
    amount: '-',
    payment: '-',
    location: { name: 'Online', flag: '' },
    status: { label: 'Submitted', variant: 'success' },
  },
  {
    id: '2',
    orderId: 'APP-1002',
    date: '20 Aug, 2025',
    customer: 'Jane Smith',
    amount: '-',
    payment: '-',
    location: { name: 'Online', flag: '' },
    status: { label: 'In Review', variant: 'warning' },
  },
  {
    id: '3',
    orderId: 'APP-1003',
    date: '21 Aug, 2025',
    customer: 'Acme Corp',
    amount: '-',
    payment: '-',
    location: { name: 'Branch', flag: '' },
    status: { label: 'Approved', variant: 'success' },
  },
  {
    id: '4',
    orderId: 'APP-1004',
    date: '22 Aug, 2025',
    customer: 'Bob Lee',
    amount: '-',
    payment: '-',
    location: { name: 'Online', flag: '' },
    status: { label: 'Rejected', variant: 'destructive' },
  },
];

export function RecentOrders() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'customer', desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter by status
      const matchesStatus =
        !selectedStatuses?.length ||
        selectedStatuses.includes(item.status.label);

      // Filter by search query (case-insensitive)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.customer.toLowerCase().includes(searchLower) ||
        item.amount.toLowerCase().includes(searchLower) ||
        item.location.name.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, selectedStatuses]);

  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        accessorKey: 'id',
        accessorFn: (row) => row.id,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        size: 50,
        meta: { cellClassName: '' },
      },
      {
        id: 'orderId',
        accessorFn: (row) => row.orderId,
        header: ({ column }) => (
          <DataGridColumnHeader title="Order ID" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-mono">#{row.original.orderId}</span>
        ),
        enableSorting: true,
        size: 180,
        meta: { cellClassName: '' },
      },
      {
        id: 'date',
        accessorFn: (row) => row.date,
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-secondary-foreground font-normal">
            {row.original.date}
          </span>
        ),
        enableSorting: true,
        size: 130,
        meta: { cellClassName: '' },
      },
      {
        id: 'customer',
        accessorFn: (row) => row.customer,
        header: ({ column }) => (
          <DataGridColumnHeader title="Customer" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-mono font-medium">{row.original.customer}</span>
        ),
        enableSorting: true,
        size: 180,
        meta: { cellClassName: '' },
      },
      {
        id: 'amount',
        accessorFn: (row) => row.amount,
        header: ({ column }) => (
          <DataGridColumnHeader title="Amount" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-mono">${row.original.amount}</span>
        ),
        enableSorting: true,
        size: 100,
        meta: { cellClassName: '' },
      },
      {
        id: 'payment',
        accessorFn: (row) => row.payment,
        header: ({ column }) => (
          <DataGridColumnHeader title="Payment Method" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-secondary-foreground font-normal">
            {row.original.payment}
          </span>
        ),
        enableSorting: true,
        size: 155,
        meta: { cellClassName: '' },
      },
      {
        id: 'location',
        accessorFn: (row) => row.location,
        header: ({ column }) => (
          <DataGridColumnHeader title="Country" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <img
              src={toAbsoluteUrl(`/media/flags/${row.original.location.flag}`)}
              className="h-4 rounded-full"
              alt="flag"
            />
            <span className="leading-none text-foreground font-normal">
              {row.original.location.name}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 180,
        meta: { cellClassName: '' },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="Order Status" column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            size="sm"
            variant={row.original.status.variant}
            appearance="light"
          >
            {row.original.status.label}
          </Badge>
        ),
        enableSorting: true,
        size: 125,
        meta: { cellClassName: '' },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <Button mode="link" underlined="dashed">
            <Link to="#">Details</Link>
          </Button>
        ),
        enableSorting: false,
        size: 75,
        meta: { headerClassName: '' },
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: IData) => row.id,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
      tableLayout={{
        columnsPinnable: true,
        columnsMovable: true,
        columnsVisibility: false,
        cellBorder: true,
      }}
    >
      <Card className="min-w-full">
        <CardHeader className="py-5 flex-wrap gap-2">
          <CardHeading>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeading>
          <CardToolbar>
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 w-40"
              />
              {searchQuery.length > 0 && (
                <Button
                  mode="icon"
                  variant="ghost"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X />
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => alert('Export CSV')}>
              Export CSV
            </Button>
          </CardToolbar>
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
