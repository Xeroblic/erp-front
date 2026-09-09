import React from 'react';
import { procurementWarehouses } from '@/mocks/db/procurement.db';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { TStockReceiptStatusFilter } from '../../types';

interface IRecepcionesFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: TStockReceiptStatusFilter;
	statusOptions: { value: TStockReceiptStatusFilter; label: string }[];
	onStatusChange: (value: TStockReceiptStatusFilter) => void;
	warehouseId: number | '';
	onWarehouseIdChange: (value: number | '') => void;
	receivedFrom: string;
	onReceivedFromChange: (value: string) => void;
	receivedTo: string;
	onReceivedToChange: (value: string) => void;
	onClearFilters: () => void;
}

const RecepcionesFilters: React.FC<IRecepcionesFiltersProps> = ({
	search,
	onSearchChange,
	status,
	statusOptions,
	onStatusChange,
	warehouseId,
	onWarehouseIdChange,
	receivedFrom,
	onReceivedFromChange,
	receivedTo,
	onReceivedToChange,
	onClearFilters,
}) => (
	<Card>
		<CardHeader>
			<div className='flex items-center gap-2'>
				<Icon icon='DuoFilter' size='text-xl' />
				<CardTitle className='text-lg'>Filtros</CardTitle>
			</div>
			<Button variant='outline' size='sm' icon='HeroXMark' onClick={onClearFilters}>
				Limpiar filtros
			</Button>
		</CardHeader>
		<CardBody>
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
				<div className='space-y-1 xl:col-span-2'>
					<label
						htmlFor='recepciones-search'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Búsqueda
					</label>
					<Input
						id='recepciones-search'
						name='search'
						value={search}
						placeholder='Folio, proveedor o RUT'
						onChange={(event) => onSearchChange(event.target.value)}
					/>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='recepciones-status'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Estado
					</label>
					<Select
						id='recepciones-status'
						name='status'
						value={status}
						onChange={(event) =>
							onStatusChange(event.target.value as TStockReceiptStatusFilter)
						}>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='recepciones-warehouse'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Bodega
					</label>
					<Select
						id='recepciones-warehouse'
						name='warehouse_id'
						value={warehouseId}
						onChange={(event) =>
							onWarehouseIdChange(
								event.target.value === '' ? '' : Number(event.target.value),
							)
						}>
						<option value=''>Todas</option>
						{procurementWarehouses.map((warehouse) => (
							<option key={warehouse.id} value={warehouse.id}>
								{warehouse.name}
							</option>
						))}
					</Select>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='recepciones-received-from'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Recepción desde
					</label>
					<Input
						id='recepciones-received-from'
						name='received_from'
						type='date'
						value={receivedFrom}
						onChange={(event) => onReceivedFromChange(event.target.value)}
					/>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='recepciones-received-to'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Recepción hasta
					</label>
					<Input
						id='recepciones-received-to'
						name='received_to'
						type='date'
						value={receivedTo}
						onChange={(event) => onReceivedToChange(event.target.value)}
					/>
				</div>
			</div>
		</CardBody>
	</Card>
);

export default RecepcionesFilters;
