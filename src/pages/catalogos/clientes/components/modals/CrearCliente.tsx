import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';

type CrearClienteProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

const CrearCliente: React.FC<CrearClienteProps> = ({ isOpen, setIsOpen, onSubmit }) => {
  const [active, setActive] = React.useState(true);
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100'>
            <Icon icon='HeroUserPlus' className='h-6 w-6 text-emerald-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Nuevo Cliente</h2>
            <p className='text-sm text-gray-600'>Registra un nuevo cliente</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <form id='createCustomerForm' className='space-y-4' onSubmit={onSubmit}>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='create-name' className='required'>Nombre</Label>
              <Input id='create-name' name='name' type='text' placeholder='Nombre o Razón Social' required />
            </div>
            <div>
              <Label htmlFor='create-code' className='required'>Código</Label>
              <Input id='create-code' name='code' type='text' placeholder='Ej: CLI-001' required />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor='create-doc-type'>Tipo Doc</Label>
              <Select id='create-doc-type' name='document_type' defaultValue='NIT'>
                <option value='NIT'>NIT</option>
                <option value='CC'>CC</option>
                <option value='CE'>CE</option>
                <option value='PASSPORT'>PASAPORTE</option>
              </Select>
            </div>
            <div className='md:col-span-2'>
              <Label htmlFor='create-doc-number'>Número</Label>
              <Input id='create-doc-number' name='document_number' type='text' placeholder='Documento' />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor='create-email'>Email</Label>
              <Input id='create-email' name='email' type='email' placeholder='email@cliente.com' />
            </div>
            <div>
              <Label htmlFor='create-phone'>Teléfono</Label>
              <Input id='create-phone' name='phone' type='tel' placeholder='+57 ...' />
            </div>
            <div>
              <Label htmlFor='create-website'>Sitio Web</Label>
              <Input id='create-website' name='website' type='text' placeholder='www.cliente.com' />
            </div>
          </div>

          <div>
            <Label htmlFor='create-address'>Dirección</Label>
            <Input id='create-address' name='address' type='text' placeholder='Dirección completa' />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor='create-city'>Ciudad</Label>
              <Input id='create-city' name='city' type='text' placeholder='Ciudad' />
            </div>
            <div>
              <Label htmlFor='create-country'>País</Label>
              <Input id='create-country' name='country' type='text' placeholder='País' />
            </div>
            <div>
              <Label htmlFor='create-terms'>Términos de Pago (días)</Label>
              <Input id='create-terms' name='payment_terms' type='number' min='0' placeholder='30' />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor='create-segment'>Segmento</Label>
              <Select id='create-segment' name='segment' defaultValue='CORPORATIVO'>
                <option value='CORPORATIVO'>Corporativo</option>
                <option value='PYME'>PYME</option>
                <option value='PERSONA_NATURAL'>Persona Natural</option>
              </Select>
            </div>
            <div>
              <Label htmlFor='create-industry'>Industria</Label>
              <Select id='create-industry' name='industry' defaultValue='TECNOLOGIA'>
                <option value='TECNOLOGIA'>Tecnología</option>
                <option value='EDUCACION'>Educación</option>
                <option value='SALUD'>Salud</option>
                <option value='COMERCIO'>Comercio</option>
                <option value='MANUFACTURA'>Manufactura</option>
                <option value='SERVICIOS'>Servicios</option>
              </Select>
            </div>
            <div>
              <Label htmlFor='create-credit'>Límite de Crédito</Label>
              <Input id='create-credit' name='credit_limit' type='number' min='0' placeholder='0' />
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox id='create-active' name='is_active' checked={active} onChange={(e) => setActive(e.currentTarget.checked)} />
            <Label htmlFor='create-active'>Activo</Label>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <div className='flex justify-end space-x-2'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            color='emerald'
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById('createCustomerForm') as HTMLFormElement | null;
              if (form) onSubmit({ preventDefault: () => {}, currentTarget: form } as any);
            }}>
            Crear Cliente
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CrearCliente;

