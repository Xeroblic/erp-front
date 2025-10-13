import React from 'react';
import { ICustomer } from '../types';
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

interface CustomersTableProps {
  customers: ICustomer[];
  onView: (c: ICustomer) => void;
  onEdit: (c: ICustomer) => void;
  onDelete: (c: ICustomer) => void;
}

const getSegmentColor = (segment: string) => {
  switch (segment) {
    case 'CORPORATIVO':
      return 'violet';
    case 'PYME':
      return 'sky';
    case 'PERSONA_NATURAL':
      return 'emerald';
    default:
      return 'gray';
  }
};

const getIndustryColor = (industry: string) => {
  switch (industry) {
    case 'TECNOLOGIA':
      return 'blue';
    case 'EDUCACION':
      return 'violet';
    case 'SALUD':
      return 'emerald';
    case 'COMERCIO':
      return 'amber';
    case 'MANUFACTURA':
      return 'zinc';
    case 'SERVICIOS':
      return 'sky';
    default:
      return 'gray';
  }
};

const getLoyaltyColor = (score: number) => {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'sky';
  if (score >= 40) return 'amber';
  if (score >= 20) return 'red';
  return 'red';
};

const getLoyaltyLevel = (score: number) => {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Muy Bueno';
  if (score >= 40) return 'Bueno';
  if (score >= 20) return 'Regular';
  return 'Bajo';
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, onView, onEdit, onDelete }) => {
  const { isDarkTheme: isDark } = useDarkMode();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'name', desc: false }]);
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
  const actionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    const handleDocClick = (event: MouseEvent) => {
      if (!openDropdownId) return;
      const target = event.target as Node;
      const container = actionRefs.current[openDropdownId];
      if (container && !container.contains(target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [openDropdownId]);

  const columns = React.useMemo<ColumnDef<ICustomer>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Cliente',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <div className={`text-sm font-medium ${isDark ? 'text-red-500' : 'text-gray-900'}`}>{c.name}</div>
              <div className='text-sm text-gray-500'>
                {c.code} • {c.document_number}
              </div>
              <div className='text-sm text-gray-500'>
                {c.city}, {c.country}
              </div>
            </div>
          );
        },
      },
      {
        id: 'contact',
        header: 'Contacto',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <div className='text-sm text-gray-900'>{c.contact_person}</div>
              <div className='text-sm text-gray-500'>{c.contact_email}</div>
              <div className='text-sm text-gray-500'>{c.contact_phone}</div>
            </div>
          );
        },
      },
      {
        id: 'segment',
        header: 'Segmento',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className='space-y-1'>
              <Badge color={getSegmentColor(c.segment)}>{c.segment}</Badge>
              <div>
                <Badge color={getIndustryColor(c.industry)} variant='outline'>
                  {c.industry}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        id: 'loyalty',
        accessorFn: (c) => c.loyalty_score,
        header: 'Fidelidad',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className='flex items-center space-x-2'>
              <div className='text-sm'>
                <div className='font-semibold text-gray-900'>{c.loyalty_score}/100</div>
                <Badge color={getLoyaltyColor(c.loyalty_score)}>{getLoyaltyLevel(c.loyalty_score)}</Badge>
              </div>
            </div>
          );
        },
      },
      {
        id: 'sales',
        accessorFn: (c) => c.total_sales,
        header: 'Ventas',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className='text-sm text-gray-900'>
              <div className='font-medium'>{formatCurrency(c.total_sales)}</div>
              <div className='text-gray-500'>{c.orders_count} órdenes</div>
              <div className='text-gray-500'>Desde {new Date(c.customer_since).toLocaleDateString('es-CO')}</div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'is_active',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge color={row.original.is_active ? 'emerald' : 'red'}>
            {row.original.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const c = row.original;
          const idKey = String(c.id ?? row.id);
          const menuItemClass =
            'flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700';

          return (
            <div
              ref={(el) => (actionRefs.current[idKey] = el)}
              className='flex items-center justify-end space-x-2'
            >
              <div className='hidden space-x-2 sm:flex'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onView(c)}
                  className='text-blue-600 hover:text-blue-900'
                >
                  <Icon icon='HeroEye' className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onEdit(c)}
                  className='text-indigo-600 hover:text-indigo-900'
                >
                  <Icon icon='HeroPencilSquare' className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onDelete(c)}
                  isDisable={c.orders_count > 0}
                  className={
                    c.orders_count > 0
                      ? 'cursor-not-allowed text-gray-400'
                      : 'text-red-600 hover:text-red-900'
                  }
                >
                  <Icon icon='HeroTrash' className='h-4 w-4' />
                </Button>
              </div>

              <div className='relative sm:hidden'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setOpenDropdownId((prev) => (prev === idKey ? null : idKey))}
                  aria-expanded={openDropdownId === idKey}
                  aria-controls={`customer-actions-${idKey}`}
                >
                  <Icon icon='HeroDotsVertical' className='h-4 w-4' />
                </Button>

                {openDropdownId === idKey && (
                  <div
                    id={`customer-actions-${idKey}`}
                    className='absolute right-0 z-20 mt-2 w-44 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800'
                  >
                    <button
                      onClick={() => {
                        onView(c);
                        setOpenDropdownId(null);
                      }}
                      className={menuItemClass}
                    >
                      <Icon icon='HeroEye' className='h-4 w-4' />
                      Ver
                    </button>
                    <button
                      onClick={() => {
                        onEdit(c);
                        setOpenDropdownId(null);
                      }}
                      className={menuItemClass}
                    >
                      <Icon icon='HeroPencilSquare' className='h-4 w-4' />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (c.orders_count === 0) {
                          onDelete(c);
                        }
                        setOpenDropdownId(null);
                      }}
                      className={`${menuItemClass} ${
                        c.orders_count > 0
                          ? 'cursor-not-allowed text-gray-400'
                          : 'text-red-600'
                      }`}
                      disabled={c.orders_count > 0}
                    >
                      <Icon icon='HeroTrash' className='h-4 w-4' />
                      {c.orders_count > 0 ? 'Bloqueado' : 'Eliminar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [isDark, onDelete, onEdit, onView, openDropdownId],
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Container>
      <Card>
        <CardBody className='overflow-x-auto'>
          <Table className='w-full'>
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

export default CustomersTable;
