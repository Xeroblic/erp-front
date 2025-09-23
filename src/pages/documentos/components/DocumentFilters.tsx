import React from 'react';
import Card, { CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Label from '@/components/form/Label';
import { IDocumentFilters } from '../types/documentos.types';

type DocumentFiltersProps = {
  filters: IDocumentFilters;
  documentTypeOptions: TSelectOptions;
  fileTypeOptions: TSelectOptions;
  moduleOptions: TSelectOptions;
  statusOptions: TSelectOptions;
  onFilterChange: (key: keyof IDocumentFilters, value: unknown) => void;
  onClear: () => void;
};

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  documentTypeOptions,
  fileTypeOptions,
  moduleOptions,
  statusOptions,
  onFilterChange,
  onClear,
}) => (
  <Card className='mb-6'>
    <CardHeader>
      <div className='flex items-center justify-between'>
        <CardTitle>Filtros de búsqueda</CardTitle>
        <Button variant='outline' size='sm' onClick={onClear}>
          <Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
          Limpiar filtros
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
            placeholder='Nombre, descripción, usuario...'
            value={filters.search || ''}
            onChange={(event) => onFilterChange('search', event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor='filter-document-type'>Tipo de documento</Label>
          <SelectReact
            name='document_type'
            options={documentTypeOptions}
            value={documentTypeOptions.find((option) => option.value === filters.document_type)}
            onChange={(option) => {
              const selected = option as TSelectOption | null;
              onFilterChange('document_type', selected?.value || undefined);
            }}
            isClearable
            placeholder='Todos los tipos'
          />
        </div>
        <div>
          <Label htmlFor='filter-file-type'>Tipo de archivo</Label>
          <SelectReact
            name='file_type'
            options={fileTypeOptions}
            value={fileTypeOptions.find((option) => option.value === filters.file_type)}
            onChange={(option) => {
              const selected = option as TSelectOption | null;
              onFilterChange('file_type', selected?.value || undefined);
            }}
            isClearable
            placeholder='Todos los formatos'
          />
        </div>
        <div>
          <Label htmlFor='filter-module'>Módulo relacionado</Label>
          <SelectReact
            name='related_module'
            options={moduleOptions}
            value={moduleOptions.find((option) => option.value === filters.related_module)}
            onChange={(option) => {
              const selected = option as TSelectOption | null;
              onFilterChange('related_module', selected?.value || undefined);
            }}
            isClearable
            placeholder='Todos los módulos'
          />
        </div>
        <div>
          <Label htmlFor='filter-status'>Estado</Label>
          <SelectReact
            name='is_active'
            options={statusOptions}
            value={statusOptions.find((option) => option.value === (filters.is_active ?? '').toString())}
            onChange={(option) => {
              const selected = option as TSelectOption | null;
              if (!selected?.value) {
                onFilterChange('is_active', undefined);
                return;
              }
              onFilterChange('is_active', selected.value === 'true');
            }}
            isClearable
            placeholder='Todos los estados'
          />
        </div>
      </div>
    </CardBody>
    <CardFooter className='flex justify-end'>
      <Button variant='outline' onClick={onClear} icon='HeroArrowPath' className='w-full md:w-auto'>
        Restablecer filtros
      </Button>
    </CardFooter>
  </Card>
);

export default DocumentFilters;
