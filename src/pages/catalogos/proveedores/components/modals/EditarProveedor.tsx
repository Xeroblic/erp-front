import React, { Dispatch, SetStateAction, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import { ISupplier } from '../../types';

type EditarProveedorProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  supplier: ISupplier | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const EditarProveedor: React.FC<EditarProveedorProps> = ({ isOpen, setIsOpen, supplier, onSubmit }) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmitClick = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
      <ModalHeader>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Editar Proveedor</h3>
      </ModalHeader>
      {supplier && (
        <form ref={formRef} id='editSupplierForm' onSubmit={onSubmit}>
          <ModalBody>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label htmlFor='edit-name'>Nombre de la Empresa *</Label>
                  <Input id='edit-name' name='name' defaultValue={supplier.name} required />
                </div>
                <div>
                  <Label htmlFor='edit-code'>Código *</Label>
                  <Input id='edit-code' name='code' defaultValue={supplier.code} required />
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label htmlFor='edit-email'>Email *</Label>
                  <Input id='edit-email' name='email' type='email' defaultValue={supplier.email} required />
                </div>
                <div>
                  <Label htmlFor='edit-phone'>Teléfono *</Label>
                  <Input id='edit-phone' name='phone' defaultValue={supplier.phone} required />
                </div>
              </div>

              <div>
                <Label htmlFor='edit-address'>Dirección *</Label>
                <Textarea id='edit-address' name='address' defaultValue={supplier.address} rows={2} required />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label htmlFor='edit-city'>Ciudad *</Label>
                  <Input id='edit-city' name='city' defaultValue={supplier.city} required />
                </div>
                <div>
                  <Label htmlFor='edit-category'>Categoría *</Label>
                  <Select id='edit-category' name='category' defaultValue={supplier.category}>
                    <option value='TECNOLOGIA'>Tecnología</option>
                    <option value='OFICINA'>Oficina</option>
                    <option value='SERVICIOS'>Servicios</option>
                    <option value='INSUMOS'>Insumos</option>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div>
                  <Label htmlFor='edit-payment-terms'>Términos de Pago (días)</Label>
                  <Input
                    id='edit-payment-terms'
                    name='payment_terms'
                    type='number'
                    min='0'
                    defaultValue={supplier.payment_terms}
                  />
                </div>
                <div>
                  <Label htmlFor='edit-credit-limit'>Límite de Crédito</Label>
                  <Input
                    id='edit-credit-limit'
                    name='credit_limit'
                    type='number'
                    min='0'
                    defaultValue={supplier.credit_limit}
                  />
                </div>
                <div>
                  <Label htmlFor='edit-website'>Sitio Web</Label>
                  <Input id='edit-website' name='website' defaultValue={supplier.website || ''} />
                </div>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>Contacto Principal</h4>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div>
                    <Label htmlFor='edit-contact-person' className='text-xs'>Nombre *</Label>
                    <Input id='edit-contact-person' name='contact_person' defaultValue={supplier.contact_person} required />
                  </div>
                  <div>
                    <Label htmlFor='edit-contact-email' className='text-xs'>Email *</Label>
                    <Input
                      id='edit-contact-email'
                      name='contact_email'
                      type='email'
                      defaultValue={supplier.contact_email}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='edit-contact-phone' className='text-xs'>Teléfono *</Label>
                    <Input
                      id='edit-contact-phone'
                      name='contact_phone'
                      defaultValue={supplier.contact_phone}
                      required
                    />
                  </div>
                </div>
              </div>

              <Checkbox
                id='edit-is-active'
                name='is_active'
                defaultChecked={supplier.is_active}
                label='Proveedor activo'
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <div className='flex justify-end space-x-3'>
              <Button variant='outline' onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button color='amber' onClick={handleSubmitClick}>
                Guardar Cambios
              </Button>
            </div>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};

export default EditarProveedor;