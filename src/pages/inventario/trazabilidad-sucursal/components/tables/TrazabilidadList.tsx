import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import Spinner from '@/components/ui/Spinner';
import { useUserBranches } from '@/hooks/permiso/userBranch';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchListaMovimientoSucursalThunk,
	selectMovimientosSucursal,
	selectInventarioPagination,
	selectInventarioLoading,
	selectInventarioError,
} from '@/store/slices/inventory/inventorySlice';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type FetchStatus = 'idle' | 'loading' | 'success' | 'timeout' | 'error';

const TIMEOUT_MS = 10000;

export function TrazabilidadList() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const listaMovimientoSucursal = useAppSelector(selectMovimientosSucursal);
	const pagination = useAppSelector(selectInventarioPagination);
	const loading = useAppSelector(selectInventarioLoading);
	const error = useAppSelector(selectInventarioError);

	const currentUser = useAppSelector((state) => state.auth.user);
	const { branchId } = useCurrentBranch();

	const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
	const [hasFetched, setHasFetched] = useState(false);
	const fetchedBranchRef = useRef<number | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const userId = currentUser?.id ?? (currentUser as any)?.pk ?? undefined;
	const { branches } = useUserBranches(userId, { enabled: Boolean(userId) });

	const currentBranchName = useMemo(() => {
		if (!branchId) return null;
		const branch = branches.find((b) => b.id === branchId);
		return branch?.name ?? null;
	}, [branchId, branches]);

	// Limpiar timeout y abort controller al desmontar
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	useEffect(() => {
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
	}, [branchId]);

	// Función para hacer fetch
	const fetchData = useCallback(
		async (page: number = 1) => {
			if (!branchId) return;

			// Evitar fetch duplicado para la misma sucursal en la misma página
			if (fetchedBranchRef.current === branchId && fetchStatus === 'loading') {
				return;
			}

			// Cancelar request anterior si existe
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			abortControllerRef.current = new AbortController();

			// Limpiar timeout anterior
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			fetchedBranchRef.current = branchId;
			setFetchStatus('loading');

			// Configurar timeout
			timeoutRef.current = setTimeout(() => {
				setFetchStatus('timeout');
				if (abortControllerRef.current) {
					abortControllerRef.current.abort();
				}
			}, TIMEOUT_MS);

			try {
				await dispatch(
					fetchListaMovimientoSucursalThunk({
						branch_id: branchId,
						page,
						per_page: 20,
					}),
				).unwrap();

				// Limpiar timeout si fue exitoso
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				setFetchStatus('success');
				setHasFetched(true);
			} catch (err) {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				// Solo marcar como error si no fue por abort
				if (!(err instanceof DOMException && err.name === 'AbortError')) {
					setFetchStatus('error');
				}
				setHasFetched(true);
			}
		},
		[branchId, dispatch, fetchStatus],
	);

	// Fetch inicial cuando cambia el branchId
	useEffect(() => {
		if (branchId && fetchedBranchRef.current !== branchId && fetchStatus !== 'loading') {
			fetchData(1);
		}
	}, [branchId, fetchData, fetchStatus]);

	// Handler para recargar
	const handleReload = useCallback(() => {
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
		fetchData(1);
	}, [fetchData]);

	// Handler para cambiar de página
	const handlePageChange = useCallback(
		(page: number) => {
			fetchData(page);
		},
		[fetchData],
	);

	const handleView = (movement: IInventoryMovement) => {
		navigate(`/inventario/trazabilidad-subsidiary/${movement.id}`);
	};

	const columns = useMemo<ColumnDef<IInventoryMovement, unknown>[]>(
		() => [
			{
				header: 'Fecha y Hora',
				accessorKey: 'occurred_at',
				cell: ({ row }) => <div>{row.original.occurred_at}</div>,
			},
			{
				header: 'Producto',
				accessorKey: 'product',
				cell: ({ row }) => <div>{row.original.product?.name ?? 'N/A'}</div>,
			},
			{
				header: 'Tipo de Movimiento',
				accessorKey: 'movement_type',
				cell: ({ row }) => <div>{row.original.movement_type}</div>,
			},
			{
				header: 'Usuario',
				accessorKey: 'user',
				cell: ({ row }) => <div>{row.original.performed_by?.name ?? 'N/A'}</div>,
			},
			{
				header: 'Acciones',
				cell: ({ row }) => (
					<div>
						<Button
							size='sm'
							variant='outline'
							onClick={() => handleView(row.original)}
							className='text-blue-600 hover:text-blue-900'>
							<Icon icon='HeroEye' className='h-4 w-4' />
						</Button>
					</div>
				),
			},
		],
		[],
	);

	if (!branchId) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50/50 py-20 text-center dark:border-amber-700 dark:bg-amber-950/20'>
				<Icon icon='HeroExclamationTriangle' className='mb-4 h-16 w-16 text-amber-500' />
				<Badge className='px-2 text-xl font-bold text-amber-600 dark:text-amber-400'>
					Sin sucursal seleccionada
				</Badge>
				<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
					Por favor selecciona una sucursal desde el menú superior.
				</p>
			</div>
		);
	}

	if (fetchStatus === 'loading' || (loading && !hasFetched)) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center py-20'>
				<Spinner nombre='Cargando movimientos...' />
				<p className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
					Obteniendo datos de la sucursal seleccionada.
				</p>
			</div>
		);
	}

	if (fetchStatus === 'timeout') {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50/50 py-20 text-center dark:border-red-700 dark:bg-red-950/20'>
				<Icon icon='HeroExclamationCircle' className='mb-4 h-16 w-16 text-red-500' />
				<Badge className='px-2 text-xl font-bold text-red-600 dark:text-red-400'>
					Tiempo de espera agotado
				</Badge>
				<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
					No se pudieron obtener los movimientos en el tiempo esperado.
				</p>
				<Button
					variant='solid'
					color='blue'
					className='mt-4'
					onClick={handleReload}
					icon='HeroArrowPath'>
					Reintentar
				</Button>
			</div>
		);
	}

	if (fetchStatus === 'error' || error) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50/50 py-20 text-center dark:border-red-700 dark:bg-red-950/20'>
				<Icon icon='HeroExclamationCircle' className='mb-4 h-16 w-16 text-red-500' />
				<Badge className='px-2 text-xl font-bold text-red-600 dark:text-red-400'>
					Error al cargar datos
				</Badge>
				<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
					{error || 'Ocurrió un error al obtener los movimientos.'}
				</p>
				<Button
					variant='solid'
					color='blue'
					className='mt-4'
					onClick={handleReload}
					icon='HeroArrowPath'>
					Reintentar
				</Button>
			</div>
		);
	}

	if (hasFetched && listaMovimientoSucursal.length === 0 && pagination.totalItems === 0) {
		return (
			<div className='flex min-h-[35vh] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 py-20 text-center dark:border-zinc-700 dark:bg-zinc-950/20'>
				<Icon icon='DuoBinocular' className='mb-4 h-16 w-16 text-zinc-400' />
				<Badge className='px-2 text-xl font-bold text-gray-600 dark:text-gray-300'>
					Sin movimientos registrados
				</Badge>
				<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
					No hay actividad registrada para esta sucursal.
				</p>
				<Button
					variant='outline'
					color='zinc'
					className='mt-4'
					onClick={handleReload}
					icon='HeroArrowPath'>
					Actualizar lista
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className='mb-4 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					{currentBranchName && (
						<Badge
							color='blue'
							variant='outline'
							className='flex items-center gap-2 px-2'>
							<Icon icon='HeroBuildingStorefront' className='h-4 w-4' />
							{currentBranchName}
						</Badge>
					)}
					<Badge color='zinc' variant='outline' className='px-2 text-xs'>
						{pagination.totalItems} resultado{pagination.totalItems !== 1 ? 's' : ''}
					</Badge>
				</div>
				<Button
					size='sm'
					variant='outline'
					onClick={handleReload}
					disabled={loading}
					icon='HeroArrowPath'>
					{loading ? 'Actualizando...' : 'Actualizar'}
				</Button>
			</div>

			<DataTable columns={columns} data={listaMovimientoSucursal} />
			{pagination.totalPages > 1 && (
				<div className='mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700'>
					<div className='px-2 text-sm text-gray-500 dark:text-gray-400'>
						Página {pagination.currentPage} de {pagination.totalPages}
					</div>
					<div className='flex gap-2'>
						<Button
							size='sm'
							variant='outline'
							onClick={() => handlePageChange(pagination.currentPage - 1)}
							disabled={!pagination.hasPrevPage || loading}
							icon='HeroChevronLeft'>
							Anterior
						</Button>
						<Button
							size='sm'
							variant='outline'
							onClick={() => handlePageChange(pagination.currentPage + 1)}
							disabled={!pagination.hasNextPage || loading}
							rightIcon='HeroChevronRight'>
							Siguiente
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
