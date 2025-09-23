import React, { Dispatch, SetStateAction } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { ISupplier } from '../../components/types';

type EliminarProveedorProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  supplier: ISupplier | null;
  onConfirm: () => void;
};

const EliminarProveedor: React.FC<EliminarProveedorProps> = ({ isOpen, setIsOpen, supplier, onConfirm }) => {
  const hasAssociations = Boolean(supplier && (supplier.products_count > 0 || supplier.orders_count > 0));

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='sm'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
            <Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
          </div>
          <h3 className='text-lg font-semibold text-red-600'>Confirmar Eliminaci�n</h3>
        </div>
      </ModalHeader>
      <ModalBody>
        {supplier ? (
          <div className='space-y-4 text-sm'>
            <p className='text-gray-700 dark:text-gray-300'>
              �Est�s seguro de que deseas eliminar el proveedor <strong>{supplier.name}</strong>?
            </p>
            <div className='flex items-center space-x-2 text-gray-600'>
              <span>C�digo:</span>
              <Badge variant='outline'>{supplier.code}</Badge>
            </div>
            {hasAssociations ? (
              <div className='rounded-md border border-red-200 bg-red-50 p-3 text-red-700'>
                <div className='flex items-start'>
                  <Icon icon='HeroExclamationTriangle' className='mr-2 mt-0.5 h-5 w-5 text-red-400' />
                  <div>
                    <h4 className='text-sm font-medium text-red-800'>No se puede eliminar</h4>
                    <p>
                      Este proveedor tiene {supplier.products_count} productos y {supplier.orders_count} �rdenes asociadas.
                      Debes reasignar o eliminar esas asociaciones antes de continuar.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-700'>
                <div className='flex items-start'>
                  <Icon icon='HeroExclamationTriangle' className='mr-2 mt-0.5 h-5 w-5 text-yellow-400' />
                  <div>
                    <h4 className='text-sm font-medium text-yellow-800'>Acci�n irreversible</h4>
                    <p>Esta acci�n no se puede deshacer. El proveedor ser� eliminado permanentemente.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='py-6 text-center text-sm text-gray-500'>Selecciona un proveedor para eliminar.</div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className='flex justify-end space-x-3'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button color='red' onClick={onConfirm} isDisable={!supplier || hasAssociations}>
            Eliminar Proveedor
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EliminarProveedor;