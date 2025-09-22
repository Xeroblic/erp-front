import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import Textarea from '@/components/form/Textarea';

type CrearMarcaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const CrearMarca: React.FC<CrearMarcaProps> = ({ isOpen, setIsOpen, onSubmit }) => {
  const [isActive, setIsActive] = React.useState(true);
  const [isExclusive, setIsExclusive] = React.useState(false);

  const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = document.getElementById('createBrandForm') as HTMLFormElement | null;
    if (form) {
      onSubmit({ preventDefault: () => {}, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='2xl'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-100'>
            <Icon icon='HeroPlus' className='h-6 w-6 text-violet-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Nueva Marca</h2>
            <p className='text-sm text-gray-600'>Crear una nueva marca en el sistema</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <form id='createBrandForm' className='space-y-4' onSubmit={onSubmit}>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='brand-code' className='required'>Código</Label>
              <Input id='brand-code' name='code' type='text' placeholder='BR-XXX-001' required />
            </div>
            <div>
              <Label htmlFor='brand-name' className='required'>Nombre</Label>
              <Input id='brand-name' name='name' type='text' placeholder='Nombre de la marca' required />
            </div>
          </div>

          <div>
            <Label htmlFor='brand-description'>Descripción</Label>
            <Textarea id='brand-description' name='description' placeholder='Descripción de la marca' rows={3} />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='brand-origin'>País de Origen</Label>
              <Input id='brand-origin' name='origin_country' type='text' placeholder='Colombia' />
            </div>
            <div>
              <Label htmlFor='brand-manufacturer'>Fabricante</Label>
              <Input id='brand-manufacturer' name='manufacturer' type='text' placeholder='Nombre del fabricante' />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor='brand-market-position'>Posición de Mercado</Label>
              <Select id='brand-market-position' name='market_position' defaultValue='PREMIUM'>
                <option value='PREMIUM'>Premium</option>
                <option value='MEDIO'>Medio</option>
                <option value='ECONOMICO'>Económico</option>
              </Select>
            </div>
            <div>
              <Label htmlFor='brand-quality'>Rating de Calidad</Label>
              <Input
                id='brand-quality'
                name='quality_rating'
                type='number'
                min='1'
                max='5'
                step='0.1'
                placeholder='4.5'
              />
            </div>
            <div>
              <Label htmlFor='brand-margin'>Margen (%)</Label>
              <Input id='brand-margin' name='margin_percentage' type='number' min='0' max='100' placeholder='35' />
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='brand-is-active'
                name='is_active'
                checked={isActive}
                onChange={(event) => setIsActive(event.currentTarget.checked)}
              />
              <Label htmlFor='brand-is-active' className='!mb-0'>Marca activa</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='brand-is-exclusive'
                name='is_exclusive'
                checked={isExclusive}
                onChange={(event) => setIsExclusive(event.currentTarget.checked)}
              />
              <Label htmlFor='brand-is-exclusive' className='!mb-0'>Marca exclusiva</Label>
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <div className='flex justify-end space-x-3'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button color='violet' onClick={handleSubmitClick}>
            Crear Marca
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CrearMarca;