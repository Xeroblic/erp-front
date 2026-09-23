import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { TInventoryStockStatusFilter } from '@/interface/inventoryOverview.interface';
import type { IInventoryReportBranch } from '@/interface/inventoryReports.interface';
import { ESTADO_OPTIONS, isEstado } from '@/pages/reportes/inventory-reports/types';

/** Ningún select es `isMulti`, pero `SelectReact` tipa el `onChange` genérico. */
const isMultiValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
): value is MultiValue<TSelectOption> => Array.isArray(value);

const singleSelectValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
): TSelectOption | null => {
	if (value === null) return null;
	return isMultiValue(value) ? (value[0] ?? null) : value;
};

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

const estadoSelectOptions: TSelectOption[] = ESTADO_OPTIONS.map(({ value, label }) => ({
	value,
	label,
}));

interface IInventoryReportFiltersProps {
	branches: IInventoryReportBranch[];
	sucursal: number | null;
	onSucursal: (value: number | null) => void;
	onLimpiar: () => void;
	/** Sin `onBusqueda` no se muestra la búsqueda (Estadísticas no lista productos). */
	busqueda?: string;
	onBusqueda?: (value: string) => void;
	/** Sólo Umbrales filtra por estado. */
	estado?: TInventoryStockStatusFilter | null;
	onEstado?: (value: TInventoryStockStatusFilter | null) => void;
}

/**
 * Filtros de los reportes, con la misma tarjeta que los de Inventario. «Todas
 * las sucursales» y «Todos» no son opciones: son la ausencia de selección
 * (`value=null`, placeholder gris e `isClearable` para volver con la X).
 */
const InventoryReportFilters: React.FC<IInventoryReportFiltersProps> = ({
	branches,
	sucursal,
	onSucursal,
	onLimpiar,
	busqueda = '',
	onBusqueda,
	estado = null,
	onEstado,
}) => {
	const branchOptions: TSelectOption[] = branches.map((branch) => ({
		value: String(branch.id),
		label: branch.name,
	}));
	const fieldCount = 1 + (onBusqueda ? 2 : 0) + (onEstado ? 1 : 0);
	const gridClass =
		{
			1: 'sm:grid-cols-2 lg:grid-cols-3',
			3: 'sm:grid-cols-3',
			4: 'sm:grid-cols-2 lg:grid-cols-4',
		}[fieldCount] ?? 'sm:grid-cols-3';

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
					className={`grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 ${gridClass}`}>
					{onBusqueda && (
						<div className='space-y-1 sm:col-span-2'>
							<label
								htmlFor='reporte-inventario-busqueda'
								className={fieldLabelClass}>
								Búsqueda
							</label>
							<Input
								id='reporte-inventario-busqueda'
								name='q'
								value={busqueda}
								placeholder='Nombre o SKU del producto'
								onChange={(event) => onBusqueda(event.target.value)}
							/>
						</div>
					)}
					<div className='space-y-1'>
						<label htmlFor='reporte-inventario-sucursal' className={fieldLabelClass}>
							Sucursal
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='reporte-inventario-sucursal'
							name='sucursal'
							options={branchOptions}
							value={
								branchOptions.find((option) => option.value === String(sucursal)) ??
								null
							}
							placeholder='Todas las sucursales'
							isClearable
							onChange={(selected) => {
								const value = Number(singleSelectValue(selected)?.value);
								onSucursal(Number.isInteger(value) && value > 0 ? value : null);
							}}
						/>
					</div>
					{onEstado && (
						<div className='space-y-1'>
							<label htmlFor='reporte-inventario-estado' className={fieldLabelClass}>
								Estado
							</label>
							<SelectReact
								className={selectBackgroundClass}
								inputId='reporte-inventario-estado'
								name='estado'
								options={estadoSelectOptions}
								value={
									estadoSelectOptions.find((option) => option.value === estado) ??
									null
								}
								placeholder='Todos'
								isClearable
								onChange={(selected) => {
									const value = singleSelectValue(selected)?.value ?? null;
									onEstado(isEstado(value) ? value : null);
								}}
							/>
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default InventoryReportFilters;
