import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import { IInventoryPagination } from '@/store/slices/inventory/inventorySlice';
import TimelineItem from './TimelineItem';

type FetchStatus = 'idle' | 'loading' | 'loading-more' | 'success' | 'timeout' | 'error';

interface TrazabilidadTimelineProps {
	movimientos: IInventoryMovement[];
	pagination: IInventoryPagination;
	loading: boolean;
	error: string | undefined;
	fetchStatus: FetchStatus;
	hasFetched: boolean;
	branchId: number | null;
	currentBranchName: string | null;
	isLoadingMore: boolean;
	onReload: () => void;
	onLoadMore: () => void;
}

export function TrazabilidadTimeline({
	movimientos,
	pagination,
	loading,
	error,
	fetchStatus,
	hasFetched,
	branchId,
	currentBranchName,
	isLoadingMore,
	onReload,
	onLoadMore,
}: TrazabilidadTimelineProps) {
	// Estado: Sin sucursal seleccionada
	if (!branchId) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/50 py-16 text-center dark:border-amber-700 dark:bg-amber-950/20'>
				<Icon icon='HeroExclamationTriangle' className='mb-4 h-16 w-16 text-amber-500' />
				<Badge className='px-2 text-xl font-bold text-amber-600 dark:text-amber-400'>
					Sin sucursal seleccionada
				</Badge>
				<p className='mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400'>
					Por favor selecciona una sucursal desde el menú superior para ver los
					movimientos de inventario.
				</p>
			</div>
		);
	}

	// Estado: Cargando inicial
	if (fetchStatus === 'loading' || (loading && !hasFetched)) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center py-16'>
				<Spinner nombre='Cargando movimientos...' />
				<p className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
					Obteniendo historial de inventario de la sucursal.
				</p>
			</div>
		);
	}

	// Estado: Timeout
	if (fetchStatus === 'timeout') {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50/50 py-16 text-center dark:border-red-700 dark:bg-red-950/20'>
				<Icon icon='HeroClock' className='mb-4 h-16 w-16 text-red-500' />
				<Badge className='px-2 text-xl font-bold text-red-600 dark:text-red-400'>
					Tiempo de espera agotado
				</Badge>
				<p className='mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400'>
					No se pudieron obtener los movimientos en el tiempo esperado. Verifica tu
					conexión e intenta de nuevo.
				</p>
				<Button
					variant='solid'
					color='blue'
					className='mt-4'
					onClick={onReload}
					icon='HeroArrowPath'>
					Reintentar
				</Button>
			</div>
		);
	}

	// Estado: Error
	if (fetchStatus === 'error' || error) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50/50 py-16 text-center dark:border-red-700 dark:bg-red-950/20'>
				<Icon icon='HeroExclamationCircle' className='mb-4 h-16 w-16 text-red-500' />
				<Badge className='px-2 text-xl font-bold text-red-600 dark:text-red-400'>
					Error al cargar datos
				</Badge>
				<p className='mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400'>
					{error || 'Ocurrió un error inesperado al obtener los movimientos.'}
				</p>
				<Button
					variant='solid'
					color='blue'
					className='mt-4'
					onClick={onReload}
					icon='HeroArrowPath'>
					Reintentar
				</Button>
			</div>
		);
	}

	// Estado: Sin movimientos
	if (hasFetched && movimientos.length === 0) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 py-16 text-center dark:border-zinc-700 dark:bg-zinc-950/20'>
				<Icon icon='DuoBinocular' className='mb-4 h-16 w-16 text-zinc-400' />
				<Badge className='px-2 text-xl font-bold text-gray-600 dark:text-gray-300'>
					Sin movimientos registrados
				</Badge>
				<p className='mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400'>
					No se encontraron movimientos de inventario con los filtros aplicados.
				</p>
				<Button
					variant='outline'
					color='zinc'
					className='mt-4'
					onClick={onReload}
					icon='HeroArrowPath'>
					Actualizar
				</Button>
			</div>
		);
	}

	// Estado: Con datos - Mostrar Timeline
	return (
		<div>
			{/* Header */}
			<div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex flex-wrap items-center gap-2'>
					{currentBranchName && (
						<Badge
							color='blue'
							variant='solid'
							className='flex items-center gap-2 px-3 py-1'>
							<Icon icon='HeroBuildingStorefront' className='h-4 w-4' />
							{currentBranchName}
						</Badge>
					)}
					<Badge color='zinc' variant='outline' className='px-2'>
						Mostrando {movimientos.length} de {pagination.totalItems} movimientos
					</Badge>
				</div>
				<Button
					size='sm'
					variant='outline'
					onClick={onReload}
					disabled={loading || isLoadingMore}
					icon='HeroArrowPath'>
					{loading ? 'Actualizando...' : 'Actualizar'}
				</Button>
			</div>

			{/* Timeline */}
			<div className='relative pl-2'>
				{movimientos.map((movement, index) => (
					<TimelineItem
						key={movement.id}
						movement={movement}
						isLast={index === movimientos.length - 1 && !pagination.hasNextPage}
					/>
				))}
			</div>

			{/* Load More Button */}
			{pagination.hasNextPage && (
				<div className='mt-6 flex flex-col items-center'>
					<Button
						variant='solid'
						color='blue'
						size='lg'
						onClick={onLoadMore}
						disabled={isLoadingMore}
						className='w-full max-w-md'>
						{isLoadingMore ? (
							<>
								<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
								Cargando más...
							</>
						) : (
							<>
								<Icon icon='HeroChevronDown' className='mr-2 h-5 w-5' />
								Cargar más movimientos
							</>
						)}
					</Button>
					<p className='mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400'>
						{movimientos.length} de {pagination.totalItems} movimientos cargados
					</p>
				</div>
			)}

			{/* All loaded message */}
			{!pagination.hasNextPage && movimientos.length > 0 && (
				<div className='mt-6 flex flex-col items-center rounded-lg border border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-700 dark:bg-zinc-900'>
					<Icon icon='HeroCheckCircle' className='mb-2 h-6 w-6 text-emerald-500' />
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						Has visto todos los movimientos ({pagination.totalItems})
					</p>
				</div>
			)}
		</div>
	);
}

export default TrazabilidadTimeline;
