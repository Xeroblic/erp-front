import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { IBrand } from '../types';
import BrandRating from '../BrandRating';
import { formatCurrency } from '../utils';

type BrandsGridProps = {
  brands: IBrand[];
  loading: boolean;
  onView: (brand: IBrand) => void;
  onEdit: (brand: IBrand) => void;
  onDelete: (brand: IBrand) => void;
};

const BrandsGrid: React.FC<BrandsGridProps> = ({ brands, loading, onView, onEdit, onDelete }) => (
  <Card>
    <CardHeader>
      <div className='flex items-center justify-between'>
        <CardTitle>Lista de Marcas</CardTitle>
        <span className='text-sm text-gray-500'>{brands.length} marcas</span>
      </div>
    </CardHeader>
    <CardBody className='p-0'>
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-violet-600' />
          <span className='ml-2 text-gray-600'>Cargando marcas...</span>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3'>
          {brands.map((brand) => (
            <div key={brand.id} className='rounded-lg border p-4 transition-shadow hover:shadow-md'>
              <div className='mb-3 flex items-center space-x-3'>
                {brand.logo_url ? (
                  <img className='h-12 w-12 rounded-lg border bg-white object-contain' src={brand.logo_url} alt={brand.name} />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200'>
                    <Icon icon='HeroTag' className='h-6 w-6 text-gray-400' />
                  </div>
                )}
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-900'>{brand.name}</h3>
                  <p className='font-mono text-sm text-gray-500'>{brand.code}</p>
                </div>
                <Badge color={brand.is_active ? 'emerald' : 'red'}>{brand.is_active ? 'Activa' : 'Inactiva'}</Badge>
              </div>

              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Origen:</span>
                  <span className='font-medium'>{brand.origin_country}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-600'>Calidad:</span>
                  <div className='flex items-center space-x-1'>
                    <BrandRating value={brand.quality_rating} />
                    <span className='text-sm'>{brand.quality_rating}</span>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Productos:</span>
                  <span className='font-medium'>{brand.products_count}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Ventas:</span>
                  <span className='font-medium text-green-600'>{formatCurrency(brand.total_sales)}</span>
                </div>
              </div>

              <div className='mt-4 flex space-x-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onView(brand)}
                  className='flex-1 text-blue-600 hover:text-blue-900'
                >
                  <Icon icon='HeroEye' className='mr-1 h-4 w-4' />
                  Ver
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onEdit(brand)}
                  className='flex-1 text-blue-600 hover:text-blue-900'
                >
                  <Icon icon='HeroPencilSquare' className='mr-1 h-4 w-4' />
                  Editar
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onDelete(brand)}
                  isDisable={brand.products_count > 0}
                  className={`flex-1 ${brand.products_count > 0 ? 'cursor-not-allowed text-gray-400' : 'text-red-600 hover:text-red-900'}`}
                >
                  <Icon icon='HeroTrash' className='mr-1 h-4 w-4' />
                  {brand.products_count > 0 ? 'Bloqueado' : 'Eliminar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardBody>
  </Card>
);

export default BrandsGrid;