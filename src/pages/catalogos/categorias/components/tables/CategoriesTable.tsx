import React from 'react';
import { ICategory } from '../types';
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
  onView: (c: ICategory) => void;
  onEdit: (c: ICategory) => void;
  onDelete: (c: ICategory) => void;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({ categories, onView, onEdit, onDelete }) => {
  const { isDarkTheme: isDark } = useDarkMode();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'name', desc: false }]);

  const columns = React.useMemo<ColumnDef<ICategory>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Categoría',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <div className={`text-sm font-medium ${isDark ? 'text-red-500' : 'text-gray-900'}`}>{c.name}</div>
              <div className='text-xs text-gray-500'>{c.description || '-'}</div>
            </div>
          );
        },
      },
      {
        id: 'parent',
        header: 'Padre',
        cell: ({ row }) => {
          const c = row.original;
          return <div className='text-sm'>{c.parent_name || '-'}</div>;
        },
      },
      {
        id: 'products',
        accessorKey: 'products_count',
        header: 'Productos',
        cell: ({ row }) => <div className='text-sm'>{row.original.products_count ?? 0}</div>,
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
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className='flex space-x-2'>
              <Button size='sm' variant='outline' onClick={() => onView(c)} className='text-blue-600 hover:text-blue-900'>
                <Icon icon='HeroEye' className='h-4 w-4' />
              </Button>
              <Button size='sm' variant='outline' onClick={() => onEdit(c)} className='text-indigo-600 hover:text-indigo-900'>
                <Icon icon='HeroPencilSquare' className='h-4 w-4' />
              </Button>
              <Button size='sm' variant='outline' onClick={() => onDelete(c)} className='text-red-600 hover:text-red-900'>
                <Icon icon='HeroTrash' className='h-4 w-4' />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [isDark, onDelete, onEdit, onView],
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
      <Card className='overflow-x-auto'>
        <CardBody>
          <Table className='w-full table-fixed'>
            <THead>
              {table.getHeaderGroups().map((hg) => (
                <Tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <Th key={header.id} className='text-left'>
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
          <div className='mt-4'>
            <TableCardFooterTemplateV2 table={table} />
          </div>
        </CardBody>
      </Card>
    </Container>
  );
};

export default CategoriesTable;

