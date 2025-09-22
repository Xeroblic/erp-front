import React from 'react';
import Card, { CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Label from '@/components/form/Label';
import { ISupplierFilters } from '../types';

type SuppliersFiltersProps = {
  filters: ISupplierFilters;
  categoryOptions: TSelectOptions;
  ratingOptions: TSelectOptions;
  statusOptions: TSelectOptions;
  onFilterChange: (key: keyof ISupplierFilters, value: unknown) => void;
  onClear: () => void;
};

const SuppliersFilters: React.FC<SuppliersFiltersProps> = ({
  filters,
  categoryOptions,
  ratingOptions,
  statusOptions,
  onFilterChange,
  onClear,
}) => {
  const handleSelect = (key: keyof ISupplierFilters, option: TSelectOption | null) => {
    onFilterChange(key, option?.value ?? undefined);
  };

  return (
    <Card className='mb-6'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <Button variant='outline' size='sm' onClick={onClear}>
            <Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
            Limpiar Filtros
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
          <div>
            <Label htmlFor='filter-search'>Buscar</Label>
            <Input
              id='filter-search'
              name='search'
              placeholder='Nombre, código, documento...'
              value={filters.search || ''}
              onChange={(event) => onFilterChange('search', event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='filter-city'>Ciudad</Label>
            <Input
              id='filter-city'
              name='city'
              placeholder='Ciudad'
              value={filters.city || ''}
              onChange={(event) => onFilterChange('city', event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='filter-category'>Categoría</Label>
            <SelectReact
              name='category'
              options={categoryOptions}
              value={categoryOptions.find((option) => option.value === filters.category)}
              onChange={(option) => handleSelect('category', option as TSelectOption | null)}
              placeholder='Seleccionar categoría...'
            />
          </div>
          <div>
            <Label htmlFor='filter-rating'>Calificación</Label>
            <SelectReact
              name='rating'
              options={ratingOptions}
              value={ratingOptions.find((option) => option.value === filters.rating?.toString())}
              onChange={(option) => {
                const selected = option as TSelectOption | null;
                onFilterChange('rating', selected?.value ? Number(selected.value) : undefined);
              }}
              placeholder='Seleccionar rating...'
            />
          </div>
          <div>
            <Label htmlFor='filter-status'>Estado</Label>
            <SelectReact
              name='status'
              options={statusOptions}
              value={statusOptions.find((option) => option.value === filters.is_active?.toString())}
              onChange={(option) => {
                const selected = option as TSelectOption | null;
                if (!selected?.value) {
                  onFilterChange('is_active', undefined);
                  return;
                }
                onFilterChange('is_active', selected.value === 'true');
              }}
              placeholder='Seleccionar estado...'
            />
          </div>
        </div>
      </CardBody>
      <CardFooter className='flex justify-end'>
        <Button
          variant='outline'
          onClick={onClear}
          icon='HeroArrowPath'
          className='w-full md:w-auto'
        >
          Limpiar filtros
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuppliersFilters;