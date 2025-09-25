import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IBrand } from '../types';
import BrandRating from '../BrandRating';
import { formatCurrency } from '../utils';

type DetalleMarcaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  brand: IBrand | null;
  onEdit?: (brand: IBrand) => void;
};

const DetalleMarca: React.FC<DetalleMarcaProps> = ({ isOpen, setIsOpen, brand, onEdit }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='2xl'>
    <ModalHeader>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
          <Icon icon='HeroEye' className='h-6 w-6 text-green-600' />
        </div>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Detalles de la Marca</h2>
          <p className='text-sm text-gray-600'>Información completa y métricas</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
      {brand ? (
        <div className='space-y-6'>
          <div className='flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0'>
            <div className='flex items-center space-x-4'>
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className='h-16 w-16 rounded-lg border bg-white object-contain' />
              ) : (
                <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200'>
                  <Icon icon='HeroTag' className='h-8 w-8 text-gray-400' />
                </div>
              )}
              <div>
                <h3 className='text-xl font-bold text-gray-900'>{brand.name}</h3>
                <p className='font-mono text-sm text-gray-500'>{brand.code}</p>
                <div className='mt-2 flex items-center space-x-2'>
                  <Badge color={brand.is_active ? 'emerald' : 'red'}>{brand.is_active ? 'Activa' : 'Inactiva'}</Badge>
                  {brand.is_exclusive && <Badge color='violet'>Exclusiva</Badge>}
                  <Badge variant='outline'>{brand.market_position}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-3 rounded-lg border p-4'>
              <h4 className='font-semibold text-gray-700'>Información General</h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Fabricante</span>
                  <span className='font-medium text-gray-900'>{brand.manufacturer}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>País de origen</span>
                  <span className='font-medium text-gray-900'>{brand.origin_country}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Categoría principal</span>
                  <span className='font-medium text-gray-900'>{brand.category_focus}</span>
                </div>
                {brand.website_url && (
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>Sitio web</span>
                    <a href={brand.website_url} target='_blank' rel='noopener noreferrer' className='text-blue-600 underline hover:text-blue-800'>
                      Visitar
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className='space-y-3 rounded-lg border p-4'>
              <h4 className='font-semibold text-gray-700'>Métricas Comerciales</h4>
              <div className='space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-600'>Calidad promedio</span>
                  <div className='flex items-center space-x-2'>
                    <BrandRating value={brand.quality_rating} />
                    <span className='font-semibold text-gray-900'>{brand.quality_rating}</span>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Margen promedio</span>
                  <span className='font-semibold text-gray-900'>{brand.margin_percentage}%</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Productos</span>
                  <span className='font-semibold text-gray-900'>{brand.products_count}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Ventas totales</span>
                  <span className='font-semibold text-green-600'>{formatCurrency(brand.total_sales)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Precio promedio</span>
                  <span className='font-semibold text-gray-900'>{formatCurrency(brand.avg_price)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-lg border p-4'>
            <h4 className='font-semibold text-gray-700'>Descripci�n</h4>
            <p className='mt-2 text-sm text-gray-600'>{brand.description}</p>
          </div>
        </div>
      ) : (
        <div className='py-6 text-center text-sm text-gray-500'>Selecciona una marca para ver los detalles.</div>
      )}
    </ModalBody>
    <ModalFooter>
      <div className='flex justify-end space-x-3'>
        <Button variant='outline' onClick={() => setIsOpen(false)}>
          Cerrar
        </Button>
        {brand && onEdit && (
          <Button
            color='blue'
            onClick={() => {
              setIsOpen(false);
              onEdit(brand);
            }}
          >
            Editar Marca
          </Button>
        )}
      </div>
    </ModalFooter>
  </Modal>
);

export default DetalleMarca;