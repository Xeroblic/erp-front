import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import { IWarehouse } from '../types';

type EditarBodegaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  warehouse: IWarehouse | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

const EditarBodega: React.FC<EditarBodegaProps> = ({ isOpen, setIsOpen, warehouse, onSubmit }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100'>
            <Icon icon='HeroPencilSquare' className='h-6 w-6 text-indigo-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Editar Bodega</h2>
            <p className='text-sm text-gray-600'>Actualiza la información de la bodega</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {warehouse && (
          <form id='editWarehouseForm' className='space-y-4' onSubmit={onSubmit}>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-name' className='required'>Nombre</Label>
                <Input id='edit-name' name='name' type='text' defaultValue={warehouse.name} required />
              </div>
              <div>
                <Label htmlFor='edit-code' className='required'>Código</Label>
                <Input id='edit-code' name='code' type='text' defaultValue={warehouse.code} required />
              </div>
            </div>

            <div>
              <Label htmlFor='edit-description'>Descripción</Label>
              <Textarea id='edit-description' name='description' rows={3} defaultValue={warehouse.description} />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-type' className='required'>Tipo</Label>
                <Select id='edit-type' name='warehouse_type' defaultValue={warehouse.warehouse_type}>
                  <option value='CENTRAL'>Central</option>
                  <option value='SUCURSAL'>Sucursal</option>
                  <option value='DISTRIBUCION'>Distribución</option>
                  <option value='TEMPORAL'>Temporal</option>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-capacity'>Capacidad (m³)</Label>
                <Input id='edit-capacity' name='capacity' type='number' min='0' step='0.01' defaultValue={warehouse.max_capacity} />
              </div>
            </div>

            <div>
              <Label htmlFor='edit-address' className='required'>Dirección</Label>
              <Input id='edit-address' name='address' type='text' defaultValue={warehouse.address} required />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-city' className='required'>Ciudad</Label>
                <Input id='edit-city' name='city' type='text' defaultValue={warehouse.city} required />
              </div>
              <div>
                <Label htmlFor='edit-country' className='required'>País</Label>
                <Input id='edit-country' name='country' type='text' defaultValue={warehouse.country} required />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-phone'>Teléfono</Label>
                <Input id='edit-phone' name='phone' type='tel' defaultValue={warehouse.phone} />
              </div>
              <div>
                <Label htmlFor='edit-manager'>Gerente</Label>
                <Input id='edit-manager' name='manager' type='text' defaultValue={warehouse.manager_name} />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-email'>Email</Label>
                <Input id='edit-email' name='email' type='email' defaultValue={warehouse.email} />
              </div>
              <div>
                <Label htmlFor='edit-operating-hours'>Horario</Label>
                <Input id='edit-operating-hours' name='operating_hours' type='text' defaultValue={warehouse.operating_hours} />
              </div>
            </div>

            <div className='space-y-3'>
              <h4 className='font-medium text-gray-900'>Características</h4>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='edit-climate-control' name='has_climate_control' defaultChecked={warehouse.has_climate_control} />
                  <Label htmlFor='edit-climate-control'>Clima Controlado</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='edit-security-system' name='has_security_system' defaultChecked={warehouse.has_security_system} />
                  <Label htmlFor='edit-security-system'>Sistema de Seguridad</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='edit-loading-dock' name='has_loading_dock' defaultChecked={warehouse.has_loading_dock} />
                  <Label htmlFor='edit-loading-dock'>Muelle de Carga</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='edit-active' name='is_active' defaultChecked={warehouse.is_active} />
                  <Label htmlFor='edit-active'>Activo</Label>
                </div>
              </div>
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
              const form = document.getElementById('editWarehouseForm') as HTMLFormElement | null;
              if (form) onSubmit({ preventDefault: () => {}, currentTarget: form } as any);
            }}>
            Guardar Cambios
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EditarBodega;
