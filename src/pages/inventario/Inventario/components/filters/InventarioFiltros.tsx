import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
	IInventoryWarehouseAggregate,
	TInventoryStockStatusFilter,
} from '@/interface/inventoryOverview.interface';
import {
	ESTADO_LABELS,
	type IInventarioFiltros,
	type TInventarioUbicacion,
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

const ESTADO_OPTIONS: TInventoryStockStatusFilter[] = [
	'critical',
	'out',
	'unconfigured',
	'healthy',
];

const estadoSelectOptions: TSelectOption[] = ESTADO_OPTIONS.map((estado) => ({
	value: estado,
	label: ESTADO_LABELS[estado],
}));

const isEstado = (value: string): value is TInventoryStockStatusFilter =>
	(ESTADO_OPTIONS as string[]).includes(value);

const isUbicacion = (value: string): value is TInventarioUbicacion =>
	value === 'unlocated' || /^warehouse:[1-9]\d*$/.test(value);

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

interface IInventarioFiltrosProps {
	filtros: IInventarioFiltros;
	warehouses: IInventoryWarehouseAggregate[];
	/** La ficha de bodega ya fija la ubicación: ahí se oculta el select. */
	showUbicacion?: boolean;
	onBusqueda: (value: string) => void;
	onUbicacion: (value: TInventarioUbicacion) => void;
	onEstado: (value: TInventoryStockStatusFilter | null) => void;
	onLimpiar: () => void;
}

/**
 * Filtros de la vista General, con la misma tarjeta que Recepciones,
 * Documentos de compra y Proveedores. «Toda la sucursal» y «Todos» no son
 * opciones de la lista: son la ausencia de selección — `value=null`,
 * `placeholder` gris e `isClearable` para volver a ese estado con la X.
 */
const InventarioFiltros: React.FC<IInventarioFiltrosProps> = ({
	filtros,
	warehouses,
	showUbicacion = true,
	onBusqueda,
	onUbicacion,
	onEstado,
	onLimpiar,
}) => {
	const ubicacionSelectOptions: TSelectOption[] = warehouses.map((aggregate) => ({
		value: aggregate.warehouse ? `warehouse:${aggregate.warehouse.id}` : 'unlocated',
		label: aggregate.warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL,
	}));
	// «Sin ubicación» siempre es elegible, aunque hoy no tenga saldo.
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
				<div
					className={`grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2 ${showUbicacion ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
					<div className='space-y-1 lg:col-span-2'>
						<label htmlFor='inventario-busqueda' className={fieldLabelClass}>
							Búsqueda
						</label>
						<Input
							id='inventario-busqueda'
							name='q'
							value={filtros.busqueda}
							placeholder='Nombre o SKU del producto'
							onChange={(event) => onBusqueda(event.target.value)}
						/>
					</div>
					{showUbicacion && (
						<div className='space-y-1'>
							<label htmlFor='inventario-ubicacion' className={fieldLabelClass}>
								Ubicación
							</label>
							<SelectReact
								className={selectBackgroundClass}
								inputId='inventario-ubicacion'
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
					)}
					<div className='space-y-1'>
						<label htmlFor='inventario-estado' className={fieldLabelClass}>
							Estado
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='inventario-estado'
							name='estado'
							options={estadoSelectOptions}
							value={
								estadoSelectOptions.find(
									(option) => option.value === filtros.estado,
								) ?? null
							}
							placeholder='Todos'
							isClearable
							onChange={(selected) => {
								const value = singleSelectValue(selected)?.value ?? '';
								onEstado(isEstado(value) ? value : null);
							}}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default InventarioFiltros;
