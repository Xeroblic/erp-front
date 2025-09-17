import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { ICategory } from '../types';

type DetalleCategoriaProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  category: ICategory | null;
};

const DetalleCategoria: React.FC<DetalleCategoriaProps> = ({ isOpen, setIsOpen, category }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Detalle de Categoría</h2>
            <p className='text-sm text-gray-600'>Información general</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {category ? (
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
            <div>
              <div className='font-medium text-gray-700'>Nombre</div>
              <div className='text-gray-900'>{category.name}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Estado</div>
              <div className='text-gray-900'>{category.is_active ? 'Activa' : 'Inactiva'}</div>
            </div>
            <div className='md:col-span-2'>
              <div className='font-medium text-gray-700'>Descripción</div>
              <div className='text-gray-900'>{category.description || '-'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Padre</div>
              <div className='text-gray-900'>{category.parent_name || '-'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Productos</div>
              <div className='text-gray-900'>{category.products_count ?? 0}</div>
            </div>
          </div>
        ) : (
          <div className='py-6 text-center text-sm text-gray-500'>No hay categoría seleccionada.</div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DetalleCategoria;

