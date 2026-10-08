import React from 'react';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IWarehouseCompact } from '@/interface/procurement.interface';
import { allOptionLabel, singleSelectValue, withoutAllOption } from '@/utils/selectFilter.util';
import type { TStockReceiptStatusFilter } from '../../types';

interface IRecepcionesFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: TStockReceiptStatusFilter;
	statusOptions: { value: TStockReceiptStatusFilter; label: string }[];
	onStatusChange: (value: TStockReceiptStatusFilter) => void;
	warehouseId: number | '';
	/** Bodegas de las sucursales autorizadas, desde la fachada de recepciones. */
	warehouseOptions: IWarehouseCompact[];
	onWarehouseIdChange: (value: number | '') => void;
	receivedFrom: string;
	onReceivedFromChange: (value: string) => void;
	receivedTo: string;
	onReceivedToChange: (value: string) => void;
	onClearFilters: () => void;
}

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

const RecepcionesFilters: React.FC<IRecepcionesFiltersProps> = ({
	search,
	onSearchChange,
	status,
	statusOptions,
	onStatusChange,
	warehouseId,
	warehouseOptions,
	onWarehouseIdChange,
	receivedFrom,
	onReceivedFromChange,
	receivedTo,
	onReceivedToChange,
	onClearFilters,
}) => {
	const statusSelectOptions = withoutAllOption(statusOptions);
	const warehouseSelectOptions: TSelectOption[] = warehouseOptions.map((warehouse) => ({
		value: String(warehouse.id),
		label: warehouse.name,
	}));
	// Una bodega de la URL que no está entre las ofrecidas sigue filtrando:
	// se muestra igual para que el select no diga «Todas» mientras filtra.
	const selectedWarehouseOption =
		warehouseId === ''
			? null
			: (warehouseSelectOptions.find((option) => option.value === String(warehouseId)) ?? {
					value: String(warehouseId),
					label: `Bodega #${warehouseId}`,
				});

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='DuoFilter' size='text-xl' />
					<CardTitle className='text-lg'>Filtros</CardTitle>
				</div>
				<Button variant='outline' size='sm' icon='HeroXMark' onClick={onClearFilters}>
					Limpiar
				</Button>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
					<div className='space-y-1 xl:col-span-2'>
						<label htmlFor='recepciones-search' className={fieldLabelClass}>
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
						<label htmlFor='recepciones-status' className={fieldLabelClass}>
							Estado
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='recepciones-status'
							name='status'
							options={statusSelectOptions}
							value={
								statusSelectOptions.find((option) => option.value === status) ??
								null
							}
							placeholder={allOptionLabel(statusOptions, 'Todos')}
							isClearable
							onChange={(selected) =>
								onStatusChange(
									(singleSelectValue(selected)?.value ??
										'all') as TStockReceiptStatusFilter,
								)
							}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='recepciones-warehouse' className={fieldLabelClass}>
							Bodega
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='recepciones-warehouse'
							name='warehouse_id'
							options={warehouseSelectOptions}
							value={selectedWarehouseOption}
							placeholder='Todas'
							isClearable
							onChange={(selected) => {
								const option = singleSelectValue(selected);
								onWarehouseIdChange(option ? Number(option.value) : '');
							}}
						/>
					</div>
					{/* Un solo ítem del grid exterior, a todo el ancho: si «desde» y
					    «hasta» compitieran por una sola columna del grid exterior
					    quedaban demasiado angostos; a todo el ancho pasan juntos a su
					    propia fila con espacio real para el DateInput. */}
					<div className='col-span-full grid grid-cols-2 gap-3 sm:max-w-md'>
						<div className='space-y-1'>
							<label htmlFor='recepciones-received-from' className={fieldLabelClass}>
								Recepción desde
							</label>
							<DateInput
								commitOnComplete
								id='recepciones-received-from'
								name='received_from'
								value={receivedFrom}
								onChange={(event) => onReceivedFromChange(event.target.value)}
							/>
						</div>
						<div className='space-y-1'>
							<label htmlFor='recepciones-received-to' className={fieldLabelClass}>
								Recepción hasta
							</label>
							<DateInput
								commitOnComplete
								id='recepciones-received-to'
								name='received_to'
								value={receivedTo}
								onChange={(event) => onReceivedToChange(event.target.value)}
							/>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default RecepcionesFilters;
