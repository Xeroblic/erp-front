import React, { Dispatch, SetStateAction } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { ISupplier } from '../../components/types';
import SupplierRating from '../../components/SupplierRating';
import { formatCurrency, formatDate } from '../../components/utils';

type DetalleProveedorProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  supplier: ISupplier | null;
  onEdit?: (supplier: ISupplier) => void;
};

const DetalleProveedor: React.FC<DetalleProveedorProps> = ({ isOpen, setIsOpen, supplier, onEdit }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='2xl'>
    <ModalHeader>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
          <Icon icon='HeroTruck' className='h-6 w-6 text-orange-600' />
        </div>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Detalles del Proveedor</h2>
          <p className='text-sm text-gray-600'>Informaci�n general y m�tricas comerciales</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
      {supplier ? (
        <div className='space-y-6'>
          <div className='flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0'>
            <div className='flex-1'>
              <h3 className='text-xl font-bold text-gray-900'>{supplier.name}</h3>
              <p className='font-mono text-sm text-gray-500'>{supplier.code}</p>
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                <Badge color={supplier.is_active ? 'emerald' : 'red'}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge color='sky'>{supplier.category}</Badge>
                <Badge variant='outline'>{supplier.document_type} {supplier.document_number}</Badge>
              </div>
            </div>
            <div className='space-y-2 rounded-lg border p-4'>
              <div className='text-sm text-gray-600'>Creado: {formatDate(supplier.created_at)}</div>
              <div className='text-sm text-gray-600'>Actualizado: {formatDate(supplier.updated_at)}</div>
              <div className='flex items-center space-x-2'>
                <SupplierRating value={supplier.rating} />
                <span className='text-sm text-gray-600'>({supplier.rating}/5)</span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-3 rounded-lg border p-4'>
              <h4 className='font-semibold text-gray-700'>Informaci�n de Contacto</h4>
              <div className='text-sm text-gray-600'>
                <p>{supplier.address}</p>
                <p>
                  {supplier.city}, {supplier.country}
                </p>
                {supplier.website && (
                  <a
                    href={`https://${supplier.website.replace(/^https?:\/\//, '')}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 underline hover:text-blue-800'
                  >
                    {supplier.website}
                  </a>
                )}
              </div>
              <div className='text-sm text-gray-600'>
                <p className='font-medium text-gray-700'>Contacto principal</p>
                <p>{supplier.contact_person}</p>
                <p>{supplier.contact_email}</p>
                <p>{supplier.contact_phone}</p>
              </div>
            </div>
            <div className='space-y-3 rounded-lg border p-4'>
              <h4 className='font-semibold text-gray-700'>M�tricas Comerciales</h4>
              <div className='space-y-2 text-sm text-gray-600'>
                <p>
                  <span className='font-medium text-gray-700'>Compras totales:</span>{' '}
                  <span className='text-green-600'>{formatCurrency(supplier.total_purchases)}</span>
                </p>
                <p>
                  <span className='font-medium text-gray-700'>�rdenes:</span> {supplier.orders_count}
                </p>
                <p>
                  <span className='font-medium text-gray-700'>Productos:</span> {supplier.products_count}
                </p>
                <p>
                  <span className='font-medium text-gray-700'>T�rminos de pago:</span> {supplier.payment_terms} d�as
                </p>
                <p>
                  <span className='font-medium text-gray-700'>L�mite de cr�dito:</span> {formatCurrency(supplier.credit_limit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='py-6 text-center text-sm text-gray-500'>Selecciona un proveedor para ver los detalles.</div>
      )}
    </ModalBody>
    <ModalFooter>
      <div className='flex justify-end space-x-3'>
        <Button variant='outline' onClick={() => setIsOpen(false)}>
          Cerrar
        </Button>
        {supplier && onEdit && (
          <Button
            color='amber'
            onClick={() => {
              setIsOpen(false);
              onEdit(supplier);
            }}
          >
            Editar Proveedor
          </Button>
        )}
      </div>
    </ModalFooter>
  </Modal>
);

export default DetalleProveedor;