import React from 'react';
import { ICategory } from '../../types';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import Card, { CardBody } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import useDarkMode from '@/hooks/useDarkMode';

interface CategoriesTableProps {
  categories: ICategory[];
  onView: (category: ICategory) => void;
  onEdit: (category: ICategory) => void;
  onDelete: (category: ICategory) => void;
  onToggleStatus: (category: ICategory) => void;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  categories,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { isDarkTheme } = useDarkMode();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'name', desc: false }]);

  const columns = React.useMemo<ColumnDef<ICategory>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Categoria',
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div>
              <div className={`text-sm font-medium ${isDarkTheme ? 'text-indigo-300' : 'text-gray-900'}`}>
                {category.name}
              </div>
              <div className="text-xs text-gray-500">{category.description || '-'}</div>
            </div>
          );
        },
      },
      {
        id: 'parent',
        header: 'Padre',
        cell: ({ row }) => <div className="text-sm">{row.original.parent_name || '-'}</div>,
      },
      {
        id: 'products',
        accessorKey: 'products_count',
        header: 'Productos',
        cell: ({ row }) => <div className="text-sm">{row.original.products_count ?? 0}</div>,
      },
      {
        id: 'status',
        accessorKey: 'is_active',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge color={row.original.is_active ? 'emerald' : 'red'}>
            {row.original.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleStatus(category)}
                className="text-emerald-600 hover:text-emerald-900"
              >
                <Icon icon="HeroPower" className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView(category)}
                className="text-blue-600 hover:text-blue-900"
              >
                <Icon icon="HeroEye" className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(category)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <Icon icon="HeroPencilSquare" className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(category)}
                className="text-red-600 hover:text-red-900"
              >
                <Icon icon="HeroTrash" className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [isDarkTheme, onDelete, onEdit, onToggleStatus, onView],
  );

  const table = useReactTable({
    data: categories,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Container>
      <Card className="overflow-x-auto">
        <CardBody>
          <Table className="w-full table-fixed">
            <THead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Th key={header.id} className="text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </Th>
                  ))}
                </Tr>
              ))}
            </THead>
            <TBody>
              {table.getRowModel().rows.map((row) => (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                  ))}
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="mt-4">
            <TableCardFooterTemplateV2 table={table} />
          </div>
        </CardBody>
      </Card>
    </Container>
  );
};

export default CategoriesTable;
