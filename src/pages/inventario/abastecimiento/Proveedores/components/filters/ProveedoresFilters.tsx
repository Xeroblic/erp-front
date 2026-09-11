import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ISupplierStatusFilterOption, TSupplierStatusFilter } from '../../types';

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

interface IProveedoresFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	status: TSupplierStatusFilter;
	statusOptions: ISupplierStatusFilterOption[];
	onStatusChange: (value: TSupplierStatusFilter) => void;
}

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

const ProveedoresFilters: React.FC<IProveedoresFiltersProps> = ({
	search,
	onSearchChange,
	onClearSearch,
	status,
	statusOptions,
	onStatusChange,
}) => {
	/**
	 * A diferencia de Documentos de compra/Recepciones, acá «Todos» no es la
	 * ausencia de filtro: el default es «Activos» (sección 5 del contrato,
	 * `useProveedores`), y «Todos» es una elección tan real como cualquier
	 * otra. Las tres opciones quedan en la lista, sin `placeholder` ni
	 * `isClearable`.
	 */
	const statusSelectOptions: TSelectOption[] = statusOptions.map((option) => ({
		value: option.value,
		label: option.label,
	}));

	return (
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
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-[minmax(0,1fr)_200px]'>
					<div className='space-y-1'>
						<label htmlFor='proveedores-search' className={fieldLabelClass}>
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
						<label htmlFor='proveedores-status' className={fieldLabelClass}>
							Estado
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='proveedores-status'
							name='status'
							options={statusSelectOptions}
							value={
								statusSelectOptions.find((option) => option.value === status) ??
								null
							}
							onChange={(selected) =>
								onStatusChange(
									(singleSelectValue(selected)?.value ??
										'active') as TSupplierStatusFilter,
								)
							}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default ProveedoresFilters;
