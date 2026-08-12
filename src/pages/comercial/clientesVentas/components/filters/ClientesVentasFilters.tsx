import React from 'react';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

interface ClientesVentasFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	onClear: () => void;
}

const ClientesVentasFilters: React.FC<ClientesVentasFiltersProps> = ({
	search,
	onSearchChange,
	onClear,
}) => (
	<Card>
		<CardHeader>
			<div className='flex items-center gap-2'>
				<Icon icon='DuoFilter' size='text-xl' />
				<CardTitle className='text-lg'>Filtros</CardTitle>
			</div>
			<Button variant='outline' size='sm' icon='HeroXMark' onClick={onClear}>
				Limpiar
			</Button>
		</CardHeader>
		<CardBody>
			<div className='max-w-xl rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30'>
				<label
					htmlFor='customer-sales-search'
					className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
					Búsqueda
				</label>
				<Input
					id='customer-sales-search'
					name='search'
					value={search}
					placeholder='Cliente, RUT, email o contacto'
					onChange={(event) => onSearchChange(event.target.value)}
				/>
				<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
					La búsqueda se aplica automáticamente.
				</p>
			</div>
		</CardBody>
	</Card>
);

export default ClientesVentasFilters;
