import type { MultiValue, SingleValue } from 'react-select';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IWarehouseCompact } from '@/interface/procurement.interface';

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

interface IStockPorUbicacionFiltersProps {
	search: string;
	location: string;
	warehouses: IWarehouseCompact[];
	onFilterChange: (field: 'search' | 'location', value: string) => void;
	onClearFilters: () => void;
}

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

const StockPorUbicacionFilters = ({
	search,
	location,
	warehouses,
	onFilterChange,
	onClearFilters,
}: IStockPorUbicacionFiltersProps) => {
	/**
	 * «Sucursal completa» (`location === 'branch'`) es el default sin filtro
	 * de ubicación (`hasFilters` en `StockPorUbicacionView` lo trata así) —
	 * mismo criterio que «Todos» en Documentos de compra/Recepciones: no es
	 * una opción más de la lista, es `value=null` con `placeholder` gris e
	 * `isClearable`.
	 */
	const locationSelectOptions: TSelectOption[] = [
		{ value: 'unlocated', label: 'Sin ubicación' },
		...warehouses.map((warehouse) => ({
			value: `warehouse:${warehouse.id}`,
			label: warehouse.name,
		})),
	];

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
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2'>
					<div className='space-y-1'>
						<label htmlFor='stock-search' className={fieldLabelClass}>
							Buscar por nombre o SKU
						</label>
						<Input
							id='stock-search'
							name='search'
							value={search}
							placeholder='Nombre o SKU del producto'
							onChange={(event) => onFilterChange('search', event.target.value)}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='stock-location' className={fieldLabelClass}>
							Ubicación
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='stock-location'
							name='location'
							options={locationSelectOptions}
							value={
								locationSelectOptions.find((option) => option.value === location) ??
								null
							}
							placeholder='Sucursal completa'
							isClearable
							onChange={(selected) =>
								onFilterChange(
									'location',
									singleSelectValue(selected)?.value ?? 'branch',
								)
							}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default StockPorUbicacionFilters;
