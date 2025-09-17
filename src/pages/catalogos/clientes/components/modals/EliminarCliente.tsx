import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ICustomer } from '../types';

type EliminarClienteProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  customer: ICustomer | null;
  onConfirm: () => void;
};

const EliminarCliente: React.FC<EliminarClienteProps> = ({ isOpen, setIsOpen, customer, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
            <Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Eliminar Cliente</h2>
            <p className='text-sm text-gray-600'>Esta acción no se puede deshacer</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {customer ? (
          <div className='space-y-2 text-sm text-gray-700'>
            <p>
              ¿Estás seguro que deseas eliminar al cliente
              <span className='font-semibold'> {customer.name}</span>?
            </p>
            {customer.orders_count > 0 && (
              <p className='text-red-600'>
                No se puede eliminar: tiene {customer.orders_count} órdenes.
              </p>
            )}
          </div>
        ) : (
          <div className='text-sm text-gray-500'>No hay cliente seleccionado.</div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className='flex justify-end space-x-2'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button color='red' onClick={onConfirm} isDisable={!!customer && customer.orders_count > 0}>
            Eliminar
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EliminarCliente;

