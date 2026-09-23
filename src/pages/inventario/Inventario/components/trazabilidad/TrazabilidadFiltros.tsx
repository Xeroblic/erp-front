import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IInventoryWarehouseAggregate } from '@/interface/inventoryOverview.interface';
import {
	isOperacionTipo,
	OPERACION_TIPOS,
	type IInventarioFiltros,
	type TInventarioUbicacion,
	type TOperacionTipo,
} from '@/pages/inventario/Inventario/types';

/** Ninguno de estos selects es `isMulti`, pero `SelectReact` tipa el `onChange` genérico. */
const isMultiValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
): value is MultiValue<TSelectOption> => Array.isArray(value);

const singleSelectValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
): TSelectOption | null => {
	if (value === null) return null;
	return isMultiValue(value) ? (value[0] ?? null) : value;
};

const tipoSelectOptions: TSelectOption[] = Object.entries(OPERACION_TIPOS).map(([value, info]) => ({
	value,
	label: info.label,
}));

const isUbicacion = (value: string): value is TInventarioUbicacion =>
	value === 'unlocated' || /^warehouse:[1-9]\d*$/.test(value);

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

interface ITrazabilidadFiltrosProps {
	filtros: IInventarioFiltros;
	warehouses: IInventoryWarehouseAggregate[];
	onBusqueda: (value: string) => void;
	onTipo: (value: TOperacionTipo | null) => void;
	onUbicacion: (value: TInventarioUbicacion) => void;
	onDesde: (value: string) => void;
	onHasta: (value: string) => void;
	onLimpiar: () => void;
}

/**
 * Filtros de la pestaña Trazabilidad, con la misma tarjeta que la vista
 * General. «Todas las operaciones» y «Toda la sucursal» son la ausencia de
 * selección (`isClearable`), no opciones de la lista.
 */
const TrazabilidadFiltros: React.FC<ITrazabilidadFiltrosProps> = ({
	filtros,
	warehouses,
	onBusqueda,
	onTipo,
	onUbicacion,
	onDesde,
	onHasta,
	onLimpiar,
}) => {
	const ubicacionSelectOptions: TSelectOption[] = warehouses.map((aggregate) => ({
		value: aggregate.warehouse ? `warehouse:${aggregate.warehouse.id}` : 'unlocated',
		label: aggregate.warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL,
	}));
	// «Sin ubicación» siempre es elegible: pudo tener movimientos aunque hoy esté vacía.
	if (!ubicacionSelectOptions.some((option) => option.value === 'unlocated'))
		ubicacionSelectOptions.unshift({ value: 'unlocated', label: UNLOCATED_WAREHOUSE_LABEL });

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='DuoFilter' size='text-xl' />
					<CardTitle className='text-lg'>Filtros</CardTitle>
				</div>
				<Button variant='outline' size='sm' icon='HeroXMark' onClick={onLimpiar}>
					Limpiar
				</Button>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2 lg:grid-cols-4'>
					<div className='space-y-1 lg:col-span-2'>
						<label htmlFor='trazabilidad-busqueda' className={fieldLabelClass}>
							Búsqueda
						</label>
						<Input
							id='trazabilidad-busqueda'
							name='q'
							value={filtros.busqueda}
							placeholder='Producto, SKU, proveedor, RUT o folio'
							onChange={(event) => onBusqueda(event.target.value)}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='trazabilidad-tipo' className={fieldLabelClass}>
							Operación
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='trazabilidad-tipo'
							name='tipo'
							options={tipoSelectOptions}
							value={
								tipoSelectOptions.find((option) => option.value === filtros.tipo) ??
								null
							}
							placeholder='Todas'
							isClearable
							onChange={(selected) => {
								const value = singleSelectValue(selected)?.value ?? null;
								onTipo(isOperacionTipo(value) ? value : null);
							}}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='trazabilidad-ubicacion' className={fieldLabelClass}>
							Ubicación
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='trazabilidad-ubicacion'
							name='ubicacion'
							options={ubicacionSelectOptions}
							value={
								ubicacionSelectOptions.find(
									(option) => option.value === filtros.ubicacion,
								) ?? null
							}
							placeholder='Toda la sucursal'
							isClearable
							onChange={(selected) => {
								const value = singleSelectValue(selected)?.value ?? '';
								onUbicacion(isUbicacion(value) ? value : 'branch');
							}}
						/>
					</div>
					{/* «Desde» y «Hasta» van juntos en su propia fila: en una sola
					    columna del grid quedaban demasiado angostos. */}
					<div className='col-span-full grid grid-cols-2 gap-3 sm:max-w-md'>
						<div className='space-y-1'>
							<label htmlFor='trazabilidad-desde' className={fieldLabelClass}>
								Desde
							</label>
							<DateInput
								commitOnComplete
								id='trazabilidad-desde'
								name='desde'
								value={filtros.desde}
								onChange={(event) => onDesde(event.target.value)}
							/>
						</div>
						<div className='space-y-1'>
							<label htmlFor='trazabilidad-hasta' className={fieldLabelClass}>
								Hasta
							</label>
							<DateInput
								commitOnComplete
								id='trazabilidad-hasta'
								name='hasta'
								value={filtros.hasta}
								onChange={(event) => onHasta(event.target.value)}
							/>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default TrazabilidadFiltros;
