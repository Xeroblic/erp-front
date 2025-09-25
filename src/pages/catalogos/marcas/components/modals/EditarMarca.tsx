import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import Textarea from '@/components/form/Textarea';
import { IBrand } from '../types';

type EditarMarcaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  brand: IBrand | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const EditarMarca: React.FC<EditarMarcaProps> = ({ isOpen, setIsOpen, brand, onSubmit }) => {
  const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = document.getElementById('editBrandForm') as HTMLFormElement | null;
    if (form) {
      onSubmit({ preventDefault: () => {}, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='2xl'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
            <Icon icon='HeroPencilSquare' className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Editar Marca</h2>
            <p className='text-sm text-gray-600'>Modificar informaci�n de la marca</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        {brand && (
          <form id='editBrandForm' className='space-y-4' onSubmit={onSubmit}>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-brand-code' className='required'>C�digo</Label>
                <Input id='edit-brand-code' name='code' type='text' defaultValue={brand.code} required />
              </div>
              <div>
                <Label htmlFor='edit-brand-name' className='required'>Nombre</Label>
                <Input id='edit-brand-name' name='name' type='text' defaultValue={brand.name} required />
              </div>
            </div>

            <div>
              <Label htmlFor='edit-brand-description'>Descripci�n</Label>
              <Textarea id='edit-brand-description' name='description' defaultValue={brand.description} rows={3} />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-brand-origin'>Pa�s de Origen</Label>
                <Input id='edit-brand-origin' name='origin_country' type='text' defaultValue={brand.origin_country} />
              </div>
              <div>
                <Label htmlFor='edit-brand-manufacturer'>Fabricante</Label>
                <Input id='edit-brand-manufacturer' name='manufacturer' type='text' defaultValue={brand.manufacturer} />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <Label htmlFor='edit-brand-market-position'>Posici�n de Mercado</Label>
                <Select id='edit-brand-market-position' name='market_position' defaultValue={brand.market_position}>
                  <option value='PREMIUM'>Premium</option>
                  <option value='MEDIO'>Medio</option>
                  <option value='ECONOMICO'>Econ�mico</option>
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-brand-quality'>Rating de Calidad</Label>
                <Input
                  id='edit-brand-quality'
                  name='quality_rating'
                  type='number'
                  min='1'
                  max='5'
                  step='0.1'
                  defaultValue={brand.quality_rating}
                />
              </div>
              <div>
                <Label htmlFor='edit-brand-margin'>Margen (%)</Label>
                <Input
                  id='edit-brand-margin'
                  name='margin_percentage'
                  type='number'
                  min='0'
                  max='100'
                  defaultValue={brand.margin_percentage}
                />
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <Checkbox id='edit-brand-is-active' name='is_active' defaultChecked={brand.is_active} />
                <Label htmlFor='edit-brand-is-active' className='!mb-0'>Marca activa</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox id='edit-brand-is-exclusive' name='is_exclusive' defaultChecked={brand.is_exclusive} />
                <Label htmlFor='edit-brand-is-exclusive' className='!mb-0'>Marca exclusiva</Label>
              </div>
            </div>
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        <div className='flex justify-end space-x-3'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button color='blue' onClick={handleSubmitClick} isDisable={!brand}>
            Guardar Cambios
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EditarMarca;