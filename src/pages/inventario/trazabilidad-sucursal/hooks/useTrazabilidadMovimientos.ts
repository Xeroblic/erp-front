import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchListaMovimientoSucursalThunk,
	selectMovimientosSucursal,
	selectInventarioPagination,
	selectInventarioLoading,
	selectInventarioError,
	clearListaMovimientoSucursal,
	IInventoryFilters,
	FetchMovimientosParams,
} from '@/store/slices/inventory/inventorySlice';
import { selectUserBranches } from '@/store/selectors/userBranchesSelectors';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

type FetchStatus = 'idle' | 'loading' | 'loading-more' | 'success' | 'timeout' | 'error';

const TIMEOUT_MS = 15000;

interface UseTrazabilidadMovimientosOptions {
	autoFetch?: boolean;
	perPage?: number;
}

export function useTrazabilidadMovimientos(options: UseTrazabilidadMovimientosOptions = {}) {
	const { autoFetch = true, perPage = 20 } = options;

	const dispatch = useAppDispatch();

	// Selectores de Redux
	const movimientos = useAppSelector(selectMovimientosSucursal);
	const pagination = useAppSelector(selectInventarioPagination);
	const loading = useAppSelector(selectInventarioLoading);
	const error = useAppSelector(selectInventarioError);
	const { branchId } = useCurrentBranch();

	// Estados locales
	const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
	const [hasFetched, setHasFetched] = useState(false);
	const [filters, setFilters] = useState<IInventoryFilters>({});
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Refs
	const fetchedBranchRef = useRef<number | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const branches = useAppSelector(selectUserBranches);
	const branchesLoading = false;

	// Nombre de la sucursal actual
	const currentBranchName = useMemo(() => {
		if (!branchId) return null;
		const branch = branches.find((b) => b.id === branchId);
		return branch?.name ?? null;
	}, [branchId, branches]);

	// Limpiar timeout y abort controller al desmontar
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (abortControllerRef.current) abortControllerRef.current.abort();
			dispatch(clearListaMovimientoSucursal());
		};
	}, [dispatch]);

	useEffect(() => {
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
	}, [branchId]);

	// Función para hacer fetch
	const fetchData = useCallback(
		async (
			page: number = 1,
			currentFilters: IInventoryFilters = filters,
			append: boolean = false,
		) => {
			if (!branchId) return;

			// Evitar fetch duplicado (solo para carga inicial, no para append)
			if (!append && fetchedBranchRef.current === branchId && fetchStatus === 'loading') {
				return;
			}

			// Cancelar request anterior
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			abortControllerRef.current = new AbortController();

			// Limpiar timeout anterior
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			fetchedBranchRef.current = branchId;
			setFetchStatus(append ? 'loading-more' : 'loading');
			if (append) setIsLoadingMore(true);

			// Configurar timeout
			timeoutRef.current = setTimeout(() => {
				setFetchStatus('timeout');
				setIsLoadingMore(false);
				if (abortControllerRef.current) {
					abortControllerRef.current.abort();
				}
			}, TIMEOUT_MS);

			try {
				const params: FetchMovimientosParams & { append?: boolean } = {
					branch_id: branchId,
					page,
					per_page: perPage,
					append,
					...currentFilters,
				};

				await dispatch(fetchListaMovimientoSucursalThunk(params)).unwrap();

				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				setFetchStatus('success');
				setHasFetched(true);
				setIsLoadingMore(false);
			} catch (err) {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				if (!(err instanceof DOMException && err.name === 'AbortError')) {
					setFetchStatus('error');
				}
				setHasFetched(true);
				setIsLoadingMore(false);
			}
		},
		[branchId, dispatch, fetchStatus, filters, perPage],
	);

	// Fetch inicial cuando cambia el branchId
	useEffect(() => {
		if (
			autoFetch &&
			branchId &&
			fetchedBranchRef.current !== branchId &&
			fetchStatus !== 'loading'
		) {
			fetchData(1);
		}
	}, [autoFetch, branchId, fetchData, fetchStatus]);

	// Handler para recargar
	const reload = useCallback(() => {
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
		fetchData(1, filters, false);
	}, [fetchData, filters]);

	// Handler para cargar más (append)
	const loadMore = useCallback(() => {
		if (pagination.hasNextPage && !isLoadingMore && fetchStatus !== 'loading') {
			const nextPage = pagination.currentPage + 1;
			fetchData(nextPage, filters, true);
		}
	}, [
		pagination.hasNextPage,
		pagination.currentPage,
		isLoadingMore,
		fetchStatus,
		fetchData,
		filters,
	]);

	// Handler para cambiar de página (legacy - por si se necesita)
	const goToPage = useCallback(
		(page: number) => {
			fetchData(page, filters, false);
		},
		[fetchData, filters],
	);

	// Handler para aplicar filtros (resetea la paginación)
	const applyFilters = useCallback(
		(newFilters: IInventoryFilters) => {
			setFilters(newFilters);
			fetchedBranchRef.current = null;
			setFetchStatus('idle');
			setHasFetched(false);
			fetchData(1, newFilters, false);
		},
		[fetchData],
	);

	// Handler para limpiar filtros
	const clearFilters = useCallback(() => {
		setFilters({});
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
		fetchData(1, {}, false);
	}, [fetchData]);

	return {
		// Data
		movimientos,
		pagination,
		loading,
		error,

		// Branch info
		branchId,
		currentBranchName,
		branches,
		branchesLoading,

		// Status
		fetchStatus,
		hasFetched,
		isLoadingMore,

		// Filters
		filters,
		setFilters,
		applyFilters,
		clearFilters,

		// Actions
		reload,
		loadMore,
		goToPage,
		fetchData,
	};
}

export default useTrazabilidadMovimientos;
