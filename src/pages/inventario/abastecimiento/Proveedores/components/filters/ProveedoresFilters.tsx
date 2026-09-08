import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ISupplierStatusFilterOption, TSupplierStatusFilter } from '../../types';

interface IProveedoresFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	status: TSupplierStatusFilter;
	statusOptions: ISupplierStatusFilterOption[];
	onStatusChange: (value: TSupplierStatusFilter) => void;
}

const ProveedoresFilters: React.FC<IProveedoresFiltersProps> = ({
	search,
	onSearchChange,
	onClearSearch,
	status,
	statusOptions,
	onStatusChange,
}) => (
	<Card>
		<CardHeader>
			<div className='flex items-center gap-2'>
				<Icon icon='DuoFilter' size='text-xl' />
				<CardTitle className='text-lg'>Filtros</CardTitle>
			</div>
			<Button variant='outline' size='sm' icon='HeroXMark' onClick={onClearSearch}>
				Limpiar búsqueda
			</Button>
		</CardHeader>
		<CardBody>
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_200px]'>
				<div className='space-y-1'>
					<label
						htmlFor='proveedores-search'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Búsqueda
					</label>
					<Input
						id='proveedores-search'
						name='search'
						value={search}
						placeholder='Nombre, contacto, RUT o giro'
						onChange={(event) => onSearchChange(event.target.value)}
					/>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='proveedores-status'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Estado
					</label>
					<Select
						id='proveedores-status'
						name='status'
						value={status}
						onChange={(event) =>
							onStatusChange(event.target.value as TSupplierStatusFilter)
						}>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
			</div>
		</CardBody>
	</Card>
);

export default ProveedoresFilters;
