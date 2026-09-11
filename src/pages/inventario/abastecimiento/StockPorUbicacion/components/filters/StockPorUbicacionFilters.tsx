import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IWarehouseCompact } from '@/interface/procurement.interface';

interface IStockPorUbicacionFiltersProps {
	search: string;
	location: string;
	warehouses: IWarehouseCompact[];
	onFilterChange: (field: 'search' | 'location', value: string) => void;
	onClearFilters: () => void;
}

const StockPorUbicacionFilters = ({
	search,
	location,
	warehouses,
	onFilterChange,
	onClearFilters,
}: IStockPorUbicacionFiltersProps) => (
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
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				<div className='space-y-1'>
					<label
						htmlFor='stock-search'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
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
					<label
						htmlFor='stock-location'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Ubicación
					</label>
					<Select
						id='stock-location'
						name='location'
						value={location}
						onChange={(event) => onFilterChange('location', event.target.value)}>
						<option value='branch'>Sucursal completa</option>
						<option value='unlocated'>Sin ubicación</option>
						{warehouses.map((warehouse) => (
							<option key={warehouse.id} value={`warehouse:${warehouse.id}`}>
								{warehouse.name}
							</option>
						))}
					</Select>
				</div>
			</div>
		</CardBody>
	</Card>
);

export default StockPorUbicacionFilters;
