import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { ICustomer } from '../types';

type DetalleClienteProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  customer: ICustomer | null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);

const DetalleCliente: React.FC<DetalleClienteProps> = ({ isOpen, setIsOpen, customer }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Detalle de Cliente</h2>
            <p className='text-sm text-gray-600'>Información general y estado</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {customer ? (
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
            <div>
              <div className='font-medium text-gray-700'>Nombre</div>
              <div className='text-gray-900'>{customer.name}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Código</div>
              <div className='text-gray-900'>{customer.code}</div>
            </div>
            <div className='md:col-span-2'>
              <div className='font-medium text-gray-700'>Contacto</div>
              <div className='text-gray-900'>
                {customer.contact_person} • {customer.contact_email} • {customer.contact_phone}
              </div>
            </div>
            <div className='md:col-span-2'>
              <div className='font-medium text-gray-700'>Dirección</div>
              <div className='text-gray-900'>
                {customer.address}, {customer.city}, {customer.country}
              </div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Estado</div>
              <div className='text-gray-900'>{customer.is_active ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div>
              <div className='font-medium text-gray-700'>Ventas</div>
              <div className='text-gray-900'>{formatCurrency(customer.total_sales)}</div>
            </div>
          </div>
        ) : (
          <div className='py-6 text-center text-sm text-gray-500'>No hay cliente seleccionado.</div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DetalleCliente;

