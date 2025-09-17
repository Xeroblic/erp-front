import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { IWarehouse } from '../types';

type DetalleBodegaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  warehouse: IWarehouse | null;
};

const DetalleBodega: React.FC<DetalleBodegaProps> = ({ isOpen, setIsOpen, warehouse }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Detalle de Bodega</h2>
            <p className='text-sm text-gray-600'>Información general y estado</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {warehouse ? (
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
            <div>
              <div className='font-medium text-gray-700'>Nombre</div>
              <div className='text-gray-900'>{warehouse.name}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Código</div>
              <div className='text-gray-900'>{warehouse.code}</div>
            </div>
            <div className='md:col-span-2'>
              <div className='font-medium text-gray-700'>Descripción</div>
              <div className='text-gray-900'>{warehouse.description || '-'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Tipo</div>
              <div className='text-gray-900'>{warehouse.warehouse_type}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Capacidad</div>
              <div className='text-gray-900'>
                {warehouse.current_capacity.toLocaleString()} / {warehouse.max_capacity.toLocaleString()}
              </div>
            </div>
            <div className='md:col-span-2'>
              <div className='font-medium text-gray-700'>Dirección</div>
              <div className='text-gray-900'>
                {warehouse.address}, {warehouse.city}, {warehouse.country} ({warehouse.postal_code})
              </div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Gerente</div>
              <div className='text-gray-900'>{warehouse.manager_name || '-'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Teléfono</div>
              <div className='text-gray-900'>{warehouse.phone || '-'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Email</div>
              <div className='text-gray-900'>{warehouse.email || '-'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Horario</div>
              <div className='text-gray-900'>{warehouse.operating_hours || '-'}</div>
            </div>
          </div>
        ) : (
          <div className='py-6 text-center text-sm text-gray-500'>No hay bodega seleccionada.</div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DetalleBodega;
