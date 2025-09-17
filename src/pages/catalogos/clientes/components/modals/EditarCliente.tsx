import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import { ICustomer } from '../types';

type EditarClienteProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  customer: ICustomer | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

const EditarCliente: React.FC<EditarClienteProps> = ({ isOpen, setIsOpen, customer, onSubmit }) => {
  const [active, setActive] = React.useState<boolean>(!!customer?.is_active);
  React.useEffect(() => {
    setActive(!!customer?.is_active);
  }, [customer, isOpen]);

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100'>
            <Icon icon='HeroPencilSquare' className='h-6 w-6 text-indigo-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Editar Cliente</h2>
            <p className='text-sm text-gray-600'>Actualiza los datos del cliente</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {customer && (
          <form id='editCustomerForm' className='space-y-4' onSubmit={onSubmit}>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-name' className='required'>Nombre</Label>
                <Input id='edit-name' name='name' type='text' defaultValue={customer.name} required />
              </div>
              <div>
                <Label htmlFor='edit-code' className='required'>Código</Label>
                <Input id='edit-code' name='code' type='text' defaultValue={customer.code} required />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Label htmlFor='edit-doc-type'>Tipo Doc</Label>
                <Select id='edit-doc-type' name='document_type' defaultValue={customer.document_type}>
                  <option value='NIT'>NIT</option>
                  <option value='CC'>CC</option>
                  <option value='CE'>CE</option>
                  <option value='PASSPORT'>PASAPORTE</option>
                </Select>
              </div>
              <div className='md:col-span-2'>
                <Label htmlFor='edit-doc-number'>Número</Label>
                <Input id='edit-doc-number' name='document_number' type='text' defaultValue={customer.document_number} />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Label htmlFor='edit-email'>Email</Label>
                <Input id='edit-email' name='email' type='email' defaultValue={customer.email} />
              </div>
              <div>
                <Label htmlFor='edit-phone'>Teléfono</Label>
                <Input id='edit-phone' name='phone' type='tel' defaultValue={customer.phone} />
              </div>
              <div>
                <Label htmlFor='edit-website'>Sitio Web</Label>
                <Input id='edit-website' name='website' type='text' defaultValue={customer.website} />
              </div>
            </div>

            <div>
              <Label htmlFor='edit-address'>Dirección</Label>
              <Input id='edit-address' name='address' type='text' defaultValue={customer.address} />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Label htmlFor='edit-city'>Ciudad</Label>
                <Input id='edit-city' name='city' type='text' defaultValue={customer.city} />
              </div>
              <div>
                <Label htmlFor='edit-country'>País</Label>
                <Input id='edit-country' name='country' type='text' defaultValue={customer.country} />
              </div>
              <div>
                <Label htmlFor='edit-terms'>Términos de Pago (días)</Label>
                <Input id='edit-terms' name='payment_terms' type='number' min='0' defaultValue={customer.payment_terms} />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Label htmlFor='edit-segment'>Segmento</Label>
                <Select id='edit-segment' name='segment' defaultValue={customer.segment}>
                  <option value='CORPORATIVO'>Corporativo</option>
                  <option value='PYME'>PYME</option>
                  <option value='PERSONA_NATURAL'>Persona Natural</option>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-industry'>Industria</Label>
                <Select id='edit-industry' name='industry' defaultValue={customer.industry}>
                  <option value='TECNOLOGIA'>Tecnología</option>
                  <option value='EDUCACION'>Educación</option>
                  <option value='SALUD'>Salud</option>
                  <option value='COMERCIO'>Comercio</option>
                  <option value='MANUFACTURA'>Manufactura</option>
                  <option value='SERVICIOS'>Servicios</option>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-credit'>Límite de Crédito</Label>
                <Input id='edit-credit' name='credit_limit' type='number' min='0' defaultValue={customer.credit_limit} />
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox id='edit-active' name='is_active' checked={active} onChange={(e) => setActive(e.currentTarget.checked)} />
              <Label htmlFor='edit-active'>Activo</Label>
            </div>
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        <div className='flex justify-end space-x-2'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            color='lime'
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById('editCustomerForm') as HTMLFormElement | null;
              if (form) onSubmit({ preventDefault: () => {}, currentTarget: form } as any);
            }}>
            Guardar Cambios
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EditarCliente;

