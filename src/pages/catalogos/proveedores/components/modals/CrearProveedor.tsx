import React, { Dispatch, SetStateAction, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';

type CrearProveedorProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const CrearProveedor: React.FC<CrearProveedorProps> = ({ isOpen, setIsOpen, onSubmit }) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmitClick = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
      <ModalHeader>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Crear Nuevo Proveedor</h3>
      </ModalHeader>
      <form ref={formRef} id='createSupplierForm' onSubmit={onSubmit}>
        <ModalBody>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='create-name'>Nombre de la Empresa *</Label>
                <Input id='create-name' name='name' placeholder='Nombre de la empresa' required />
              </div>
              <div>
                <Label htmlFor='create-code'>C�digo *</Label>
                <Input id='create-code' name='code' placeholder='C�digo del proveedor' required />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='create-document-type'>Tipo de Documento *</Label>
                <Select id='create-document-type' name='document_type' defaultValue='NIT'>
                  <option value='NIT'>NIT</option>
                  <option value='CC'>Cédula de Ciudadanía</option>
                  <option value='CE'>Cédula de Extranjería</option>
                  <option value='PASSPORT'>Pasaporte</option>
                </Select>
              </div>
              <div>
                <Label htmlFor='create-document-number'>Número de Documento *</Label>
                <Input id='create-document-number' name='document_number' placeholder='Número de documento' required />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='create-email'>Email *</Label>
                <Input id='create-email' name='email' type='email' placeholder='email@empresa.com' required />
              </div>
              <div>
                <Label htmlFor='create-phone'>Teléfono *</Label>
                <Input id='create-phone' name='phone' placeholder='+57 1 234-5678' required />
              </div>
            </div>

            <div>
              <Label htmlFor='create-address'>Dirección *</Label>
              <Textarea id='create-address' name='address' placeholder='Dirección completa' rows={2} required />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='create-city'>Ciudad *</Label>
                <Input id='create-city' name='city' placeholder='Ciudad' required />
              </div>
              <div>
                <Label htmlFor='create-category'>Categoría *</Label>
                <Select id='create-category' name='category' defaultValue='TECNOLOGIA'>
                  <option value='TECNOLOGIA'>Tecnología</option>
                  <option value='OFICINA'>Oficina</option>
                  <option value='SERVICIOS'>Servicios</option>
                  <option value='INSUMOS'>Insumos</option>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Label htmlFor='create-payment-terms'>Términos de Pago (días)</Label>
                <Input id='create-payment-terms' name='payment_terms' type='number' min='0' placeholder='30' />
              </div>
              <div>
                <Label htmlFor='create-credit-limit'>Límite de Crédito</Label>
                <Input id='create-credit-limit' name='credit_limit' type='number' min='0' placeholder='50000000' />
              </div>
              <div>
                <Label htmlFor='create-website'>Sitio Web</Label>
                <Input id='create-website' name='website' placeholder='www.proveedor.com' />
              </div>
            </div>

            <div>
              <h4 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>Contacto Principal</h4>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div>
                  <Label htmlFor='create-contact-person' className='text-xs'>Nombre *</Label>
                  <Input id='create-contact-person' name='contact_person' placeholder='Nombre del contacto' required />
                </div>
                <div>
                  <Label htmlFor='create-contact-email' className='text-xs'>Email *</Label>
                  <Input
                    id='create-contact-email'
                    name='contact_email'
                    type='email'
                    placeholder='contacto@empresa.com'
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='create-contact-phone' className='text-xs'>Teléfono *</Label>
                  <Input
                    id='create-contact-phone'
                    name='contact_phone'
                    placeholder='+57 300 123-4567'
                    required
                  />
                </div>
              </div>
            </div>

            <Checkbox id='create-is-active' name='is_active' defaultChecked label='Proveedor activo' />
          </div>
        </ModalBody>
        <ModalFooter>
          <div className='flex justify-end space-x-3'>
            <Button variant='outline' onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button color='amber' onClick={handleSubmitClick}>
              Crear Proveedor
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CrearProveedor;