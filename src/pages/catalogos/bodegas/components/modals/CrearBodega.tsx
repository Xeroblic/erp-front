import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';

import { Dispatch, SetStateAction } from 'react';

type CrearBodegaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

const CrearBodega: React.FC<CrearBodegaProps> = ({ isOpen, setIsOpen, onSubmit }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100'>
            <Icon icon='HeroPlus' className='h-6 w-6 text-emerald-600' />
          </div>
          <div>|
            <h2 className='text-xl font-bold text-gray-900'>Crear Nueva Bodega</h2>
            <p className='text-sm text-gray-600'>Registra una nueva bodega en el sistema</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <form id='createWarehouseForm' className='space-y-4' onSubmit={onSubmit}>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='create-name' className='required'>
                Nombre
              </Label>
              <Input id='create-name' name='name' type='text' placeholder='Ej: Bodega Central' required />
            </div>
            <div>
              <Label htmlFor='create-code' className='required'>
                Código
              </Label>
              <Input id='create-code' name='code' type='text' placeholder='Ej: BOD001' required />
            </div>
          </div>

          <div>
            <Label htmlFor='create-description'>Descripción</Label>
            <Textarea id='create-description' name='description' rows={3} placeholder='Descripción detallada de la bodega...' />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='create-type' className='required'>
                Tipo
              </Label>
              <Select defaultValue='CENTRAL' id='create-type' name='warehouse_type'>
                <option value='CENTRAL'>Central</option>
                <option value='SUCURSAL'>Sucursal</option>
                <option value='DISTRIBUCION'>Distribución</option>
                <option value='TEMPORAL'>Temporal</option>
              </Select>
            </div>
            <div>
              <Label htmlFor='create-capacity'>Capacidad (m³)</Label>
              <Input id='create-capacity' name='capacity' type='number' min='0' step='0.01' placeholder='Ej: 1500.00' />
            </div>
          </div>

          <div>
            <Label htmlFor='create-address' className='required'>
              Dirección
            </Label>
            <Input id='create-address' name='address' type='text' placeholder='Dirección completa' required />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='create-city' className='required'>
                Ciudad
              </Label>
              <Input id='create-city' name='city' type='text' placeholder='Ciudad' required />
            </div>
            <div>
              <Label htmlFor='create-country' className='required'>
                País
              </Label>
              <Input id='create-country' name='country' type='text' placeholder='País' required />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='create-phone'>Teléfono</Label>
              <Input id='create-phone' name='phone' type='tel' placeholder='Teléfono de contacto' />
            </div>
            <div>
              <Label htmlFor='create-manager'>Gerente</Label>
              <Input id='create-manager' name='manager' type='text' placeholder='Nombre del gerente' />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='create-email'>Email</Label>
              <Input id='create-email' name='email' type='email' placeholder='email@ejemplo.com' />
            </div>
            <div>
              <Label htmlFor='create-operating-hours'>Horario</Label>
              <Input id='create-operating-hours' name='operating_hours' type='text' placeholder='Ej: 8:00 AM - 6:00 PM' />
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='font-medium text-gray-900'>Características</h4>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div className='flex items-center space-x-2'>
                <Checkbox id='create-climate-control' name='has_climate_control' />
                <Label htmlFor='create-climate-control'>Clima Controlado</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='create-security-system' name='has_security_system' />
                <Label htmlFor='create-security-system'>Sistema de Seguridad</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='create-loading-dock' name='has_loading_dock' />
                <Label htmlFor='create-loading-dock'>Muelle de Carga</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='create-active' name='is_active' defaultChecked />
                <Label htmlFor='create-active'>Activo</Label>
              </div>
            </div>
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
              const form = document.getElementById('createWarehouseForm') as HTMLFormElement | null;
              if (form) onSubmit({ preventDefault: () => {}, currentTarget: form } as any);
            }}>
            Crear Bodega
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CrearBodega;
