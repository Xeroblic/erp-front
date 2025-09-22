import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ISupplier } from '../types';
import SupplierRating from '../SupplierRating';
import { formatCurrency } from '../utils';

type SuppliersTableProps = {
  suppliers: ISupplier[];
  loading: boolean;
  onView: (supplier: ISupplier) => void;
  onEdit: (supplier: ISupplier) => void;
  onDelete: (supplier: ISupplier) => void;
};

const getCategoryBadgeColor = (category: string) => {
  switch (category) {
    case 'TECNOLOGIA':
      return 'sky';
    case 'OFICINA':
      return 'emerald';
    case 'SERVICIOS':
      return 'violet';
    case 'INSUMOS':
      return 'amber';
    default:
      return 'gray';
  }
};

const SuppliersTable: React.FC<SuppliersTableProps> = ({ suppliers, loading, onView, onEdit, onDelete }) => (
  <Card>
    <CardHeader>
      <div className='flex items-center justify-between'>
        <CardTitle>Lista de Proveedores</CardTitle>
        <span className='text-sm text-gray-500'>{suppliers.length} proveedores</span>
      </div>
    </CardHeader>
    <CardBody className='p-0'>
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-orange-600' />
          <span className='ml-2 text-gray-600'>Cargando proveedores...</span>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Proveedor</th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Contacto</th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Categoría</th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Rating</th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Compras</th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Estado</th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className='hover:bg-gray-50'>
                  <td className='whitespace-nowrap px-6 py-4'>
                    <div className='text-sm font-medium text-gray-900'>{supplier.name}</div>
                    <div className='text-sm text-gray-500'>
                      {supplier.code} • {supplier.document_number}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {supplier.city}, {supplier.country}
                    </div>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    <div className='text-sm text-gray-900'>{supplier.contact_person}</div>
                    <div className='text-sm text-gray-500'>{supplier.contact_email}</div>
                    <div className='text-sm text-gray-500'>{supplier.contact_phone}</div>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    <Badge color={getCategoryBadgeColor(supplier.category)}>{supplier.category}</Badge>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    <div className='flex items-center space-x-2'>
                      <SupplierRating value={supplier.rating} />
                      <span className='text-sm text-gray-500'>({supplier.rating}/5)</span>
                    </div>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                    <div className='font-medium'>{formatCurrency(supplier.total_purchases)}</div>
                    <div className='text-gray-500'>{supplier.orders_count} órdenes</div>
                    <div className='text-gray-500'>{supplier.products_count} productos</div>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    <Badge color={supplier.is_active ? 'emerald' : 'red'}>
                      {supplier.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
                    <div className='flex space-x-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onView(supplier)}
                        className='text-blue-600 hover:text-blue-900'
                      >
                        <Icon icon='HeroEye' className='h-4 w-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onEdit(supplier)}
                        className='text-indigo-600 hover:text-indigo-900'
                      >
                        <Icon icon='HeroPencilSquare' className='h-4 w-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onDelete(supplier)}
                        isDisable={supplier.orders_count > 0}
                        className={
                          supplier.orders_count > 0
                            ? 'cursor-not-allowed text-gray-400'
                            : 'text-red-600 hover:text-red-900'
                        }
                      >
                        <Icon icon='HeroTrash' className='h-4 w-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardBody>
  </Card>
);

export default SuppliersTable;