import React from 'react';
import Card, { CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import { ISupplierFilters } from '../components/types';

type SuppliersFiltersProps = {
	filters: ISupplierFilters;
	onFilterChange: (key: keyof ISupplierFilters, value: unknown) => void;
	onClear: () => void;
};

const SuppliersFilters: React.FC<SuppliersFiltersProps> = ({
	filters,
	onFilterChange,
	onClear,
}) => {
	return (
		<Card className='mb-6'>
			<CardHeader>
				<div className='flex items-center justify-between space-x-2 md:flex-row md:space-y-0'>
					<CardTitle>Filtros de Búsqueda</CardTitle>
					<Button variant='outline' size='sm' onClick={onClear}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Limpiar Filtros
					</Button>
				</div>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2'>
					<div className='p-2'>
						<Label htmlFor='filter-search'>Buscar</Label>
						<Input
							id='filter-search'
							name='search'
							placeholder='Nombre del proveedor'
							value={filters.search || ''}
							onChange={(event) => onFilterChange('search', event.target.value)}
						/>
					</div>
				</div>
			</CardBody>
			<CardFooter className='flex justify-end'>
				<Button
					variant='outline'
					onClick={onClear}
					icon='HeroArrowPath'
					className='w-full md:w-auto'>
					Limpiar filtros
				</Button>
			</CardFooter>
		</Card>
	);
};

export default SuppliersFilters;
