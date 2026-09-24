import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { BODEGA_ESTADO_LABELS, type TBodegaEstadoFiltro } from '../types';

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

const isEstado = (value: string): value is TBodegaEstadoFiltro => value in BODEGA_ESTADO_LABELS;

const estadoSelectOptions: TSelectOption[] = (
	Object.keys(BODEGA_ESTADO_LABELS) as TBodegaEstadoFiltro[]
).map((estado) => ({ value: estado, label: BODEGA_ESTADO_LABELS[estado] }));

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

interface IBodegasFiltrosProps {
	search: string;
	type: string | null;
	typeOptions: string[];
	status: TBodegaEstadoFiltro | null;
	onSearch: (value: string) => void;
	onType: (value: string | null) => void;
	onStatus: (value: TBodegaEstadoFiltro | null) => void;
	onClear: () => void;
}

/**
 * Filtros del listado de bodegas, con la misma tarjeta que Inventario y
 * Proveedores. «Todos» y «Todas» son la ausencia de selección (`null`).
 */
const BodegasFiltros: React.FC<IBodegasFiltrosProps> = ({
	search,
	type,
	typeOptions,
	status,
	onSearch,
	onType,
	onStatus,
	onClear,
}) => {
	const typeSelectOptions: TSelectOption[] = typeOptions.map((value) => ({
		value,
		label: value,
	}));

	return (
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
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2 lg:grid-cols-4'>
					<div className='space-y-1 sm:col-span-2'>
						<label htmlFor='bodegas-busqueda' className={fieldLabelClass}>
							Búsqueda
						</label>
						<Input
							id='bodegas-busqueda'
							name='q'
							value={search}
							placeholder='Nombre o código de la bodega'
							onChange={(event) => onSearch(event.target.value)}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='bodegas-tipo' className={fieldLabelClass}>
							Tipo
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='bodegas-tipo'
							name='tipo'
							options={typeSelectOptions}
							value={
								typeSelectOptions.find((option) => option.value === type) ?? null
							}
							placeholder='Todos'
							isClearable
							onChange={(selected) =>
								onType(singleSelectValue(selected)?.value ?? null)
							}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='bodegas-estado' className={fieldLabelClass}>
							Estado
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='bodegas-estado'
							name='estado'
							options={estadoSelectOptions}
							value={
								estadoSelectOptions.find((option) => option.value === status) ??
								null
							}
							placeholder='Todas'
							isClearable
							onChange={(selected) => {
								const value = singleSelectValue(selected)?.value ?? '';
								onStatus(isEstado(value) ? value : null);
							}}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default BodegasFiltros;
