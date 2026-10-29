import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import { IInventoryFilters } from '@/store/slices/inventory/inventorySlice';
import { useState, useCallback, useEffect, useRef } from 'react';

// Tipos de movimiento disponibles (según Enum MovementType del backend)
const MOVEMENT_TYPES = [
	{ value: '', label: 'Todos los tipos' },
	// Tipos Oficiales del Enum
	{ value: 'entry', label: 'Ingreso' },
	{ value: 'status_change', label: 'Cambio de Estado' },
	{ value: 'warehouse_transfer', label: 'Transferencia de Bodega' },
	{ value: 'reservation', label: 'Reserva' },
	{ value: 'sale', label: 'Venta' },
	{ value: 'return', label: 'Devolución' },
	{ value: 'adjustment', label: 'Ajuste de Inventario' },
	// Otros tipos utilizados en el código
	{ value: 'initial_balance', label: 'Balance Inicial' },
	{ value: 'manual_adjustment', label: 'Ajuste Manual' },
	{ value: 'import_adjustment', label: 'Ajuste por Importación' },
	{ value: 'reserve', label: 'Reserva (Stock)' },
	{ value: 'release', label: 'Liberación (Stock)' },
	{ value: 'transfer_in', label: 'Transferencia Entrada' },
	{ value: 'transfer_out', label: 'Transferencia Salida' },
	{ value: 'reconciliation', label: 'Reconciliación' },
];

const DEBOUNCE_MS = 600;

const toCleanFilters = (filters: IInventoryFilters): IInventoryFilters => {
	const cleanFilters: IInventoryFilters = {};
	if (filters.occurred_from) cleanFilters.occurred_from = filters.occurred_from;
	if (filters.occurred_to) cleanFilters.occurred_to = filters.occurred_to;
	if (filters.q) cleanFilters.q = filters.q;
	if (filters.movement_type) cleanFilters.movement_type = filters.movement_type;
	if (filters.warehouse_id) cleanFilters.warehouse_id = filters.warehouse_id;
	return cleanFilters;
};

interface TrazabilidadFiltersProps {
	filters: IInventoryFilters;
	onApplyFilters: (filters: IInventoryFilters) => void;
	onClearFilters: () => void;
	loading?: boolean;
}

export function TrazabilidadFilters({
	filters,
	onApplyFilters,
	onClearFilters,
	loading = false,
}: TrazabilidadFiltersProps) {
	const [localFilters, setLocalFilters] = useState<IInventoryFilters>(filters);
	const [isExpanded, setIsExpanded] = useState(true);
	const [isSearching, setIsSearching] = useState(false);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const onApplyFiltersRef = useRef(onApplyFilters);
	// Sólo se consulta cuando los filtros difieren de los últimos aplicados: así el montaje
	// (incluido el doble montaje de StrictMode) y «Limpiar filtros», que ya dispara su
	// propia consulta, no generan una petición extra que cancelaría la vigente.
	const lastAppliedRef = useRef(JSON.stringify(toCleanFilters(filters)));

	useEffect(() => {
		onApplyFiltersRef.current = onApplyFilters;
	}, [onApplyFilters]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}

		const cleanFilters = toCleanFilters(localFilters);
		const key = JSON.stringify(cleanFilters);
		if (key === lastAppliedRef.current) {
			setIsSearching(false);
			return;
		}

		setIsSearching(true);

		debounceRef.current = setTimeout(() => {
			lastAppliedRef.current = key;
			onApplyFiltersRef.current(cleanFilters);
			setIsSearching(false);
		}, DEBOUNCE_MS);
	}, [localFilters]);

	const handleChange = useCallback((field: keyof IInventoryFilters, value: string | number) => {
		setLocalFilters((prev) => ({
			...prev,
			[field]: value || undefined,
		}));
	}, []);

	const handleClear = useCallback(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}
		lastAppliedRef.current = JSON.stringify({});
		setLocalFilters({});
		onClearFilters();
		setIsSearching(false);
	}, [onClearFilters]);

	const hasActiveFilters = Object.values(localFilters).some((v) => v !== undefined && v !== '');

	return (
		<div className='mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-700 dark:bg-zinc-900'>
			<button
				type='button'
				onClick={() => setIsExpanded(!isExpanded)}
				className='flex w-full items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroFunnel' className='h-5 w-5 text-blue-500' />
					<Badge className='px-2 text-base font-semibold'>Filtros</Badge>
					{hasActiveFilters && (
						<Badge color='blue' variant='solid' className='px-2 text-xs'>
							Activos
						</Badge>
					)}
					{(isSearching || loading) && (
						<div className='flex items-center gap-1.5'>
							<div className='h-2 w-2 animate-pulse rounded-full bg-blue-500' />
							<span className='text-xs text-blue-600 dark:text-blue-400'>
								Buscando...
							</span>
						</div>
					)}
				</div>
				<Icon
					icon={isExpanded ? 'HeroChevronUp' : 'HeroChevronDown'}
					className='h-5 w-5 text-zinc-500'
				/>
			</button>

			<div
				className={`grid gap-4 overflow-hidden transition-all duration-300 ${
					isExpanded ? 'mt-4 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
				}`}>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div>
						<label
							htmlFor='trazabilidad-occurred-from'
							className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Desde
						</label>
						<Input
							id='trazabilidad-occurred-from'
							name='occurred_from'
							type='date'
							value={localFilters.occurred_from || ''}
							onChange={(e) => handleChange('occurred_from', e.target.value)}
							className='w-full'
						/>
					</div>
					<div>
						<label
							htmlFor='trazabilidad-occurred-to'
							className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Hasta
						</label>
						<Input
							id='trazabilidad-occurred-to'
							name='occurred_to'
							type='date'
							value={localFilters.occurred_to || ''}
							onChange={(e) => handleChange('occurred_to', e.target.value)}
							className='w-full'
						/>
					</div>
					<div>
						<label
							htmlFor='trazabilidad-q'
							className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Buscar producto
						</label>
						<div className='relative'>
							<Input
								id='trazabilidad-q'
								name='q'
								type='text'
								placeholder='Nombre o SKU...'
								value={localFilters.q || ''}
								onChange={(e) => handleChange('q', e.target.value)}
								className='w-full pr-8'
							/>
							{isSearching && localFilters.q && (
								<div className='absolute top-1/2 right-3 -translate-y-1/2'>
									<div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label
							htmlFor='trazabilidad-movement-type'
							className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Tipo de movimiento
						</label>
						<select
							id='trazabilidad-movement-type'
							value={localFilters.movement_type || ''}
							onChange={(e) => handleChange('movement_type', e.target.value)}
							className='w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden dark:border-zinc-600 dark:bg-zinc-800 dark:text-white'>
							{MOVEMENT_TYPES.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
					</div>
					<div className='flex items-end'>
						<Button
							variant='outline'
							color='zinc'
							size='sm'
							onClick={handleClear}
							disabled={loading || !hasActiveFilters}
							icon='HeroXMark'
							className='w-full md:w-auto'>
							Limpiar filtros
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TrazabilidadFilters;
