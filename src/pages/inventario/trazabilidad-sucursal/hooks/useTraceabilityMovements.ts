import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
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
const LOAD_MORE_ERROR = 'No se pudieron cargar más movimientos. Intenta de nuevo.';
const LOAD_MORE_TIMEOUT = 'Tiempo de espera agotado al cargar más movimientos.';

interface UseTraceabilityMovementsOptions {
	autoFetch?: boolean;
	perPage?: number;
}

type TraceabilityRequest = ReturnType<ReturnType<typeof fetchListaMovimientoSucursalThunk>>;

export function useTraceabilityMovements(options: UseTraceabilityMovementsOptions = {}) {
	const { autoFetch = true, perPage = 20 } = options;

	const dispatch = useAppDispatch();

	const movimientos = useAppSelector(selectMovimientosSucursal);
	const pagination = useAppSelector(selectInventarioPagination);
	const loading = useAppSelector(selectInventarioLoading);
	const error = useAppSelector(selectInventarioError);
	const branches = useAppSelector(selectUserBranches);
	const { branchId } = useCurrentBranch();

	const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
	const [hasFetched, setHasFetched] = useState(false);
	const [filters, setFilters] = useState<IInventoryFilters>({});
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const fetchedBranchRef = useRef<number | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Sólo la petición guardada aquí puede escribir el estado local; las canceladas,
	// vencidas o de otra sucursal se descartan al resolver.
	const requestRef = useRef<TraceabilityRequest | null>(null);

	const currentBranchName = useMemo(() => {
		if (!branchId) return null;
		const branch = branches.find((b) => b.id === branchId);
		return branch?.name ?? null;
	}, [branchId, branches]);

	const clearRequestTimer = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const cancelInFlight = useCallback(() => {
		clearRequestTimer();
		const request = requestRef.current;
		requestRef.current = null;
		request?.abort();
	}, [clearRequestTimer]);

	useEffect(() => {
		return () => {
			cancelInFlight();
			dispatch(clearListaMovimientoSucursal());
		};
	}, [cancelInFlight, dispatch]);

	useEffect(() => {
		cancelInFlight();
		dispatch(clearListaMovimientoSucursal());
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
		setIsLoadingMore(false);
	}, [branchId, cancelInFlight, dispatch]);

	const fetchData = useCallback(
		async (
			page: number = 1,
			currentFilters: IInventoryFilters = filters,
			append: boolean = false,
		) => {
			if (!branchId) return;

			if (!append && fetchedBranchRef.current === branchId && fetchStatus === 'loading') {
				return;
			}

			cancelInFlight();

			fetchedBranchRef.current = branchId;
			setFetchStatus(append ? 'loading-more' : 'loading');
			setIsLoadingMore(append);

			const params: FetchMovimientosParams & { append?: boolean } = {
				branch_id: branchId,
				page,
				per_page: perPage,
				append,
				...currentFilters,
			};
			const request = dispatch(fetchListaMovimientoSucursalThunk(params));
			requestRef.current = request;

			timeoutRef.current = setTimeout(() => {
				if (requestRef.current !== request) return;
				cancelInFlight();
				setIsLoadingMore(false);
				if (append) {
					// Conserva las páginas ya cargadas: sólo falla la página siguiente.
					toast.error(LOAD_MORE_TIMEOUT);
					setFetchStatus('success');
					return;
				}
				setFetchStatus('timeout');
			}, TIMEOUT_MS);

			let failure: string | null = null;
			try {
				await request.unwrap();
			} catch (err) {
				failure = typeof err === 'string' ? err : LOAD_MORE_ERROR;
			}

			if (requestRef.current !== request) return;
			clearRequestTimer();
			requestRef.current = null;
			setHasFetched(true);
			setIsLoadingMore(false);
			if (failure !== null && append) {
				toast.error(failure);
				setFetchStatus('success');
				return;
			}
			setFetchStatus(failure === null ? 'success' : 'error');
		},
		[branchId, cancelInFlight, clearRequestTimer, dispatch, fetchStatus, filters, perPage],
	);

	useEffect(() => {
		if (
			autoFetch &&
			branchId &&
			fetchedBranchRef.current !== branchId &&
			fetchStatus !== 'loading'
		) {
			void fetchData(1);
		}
	}, [autoFetch, branchId, fetchData, fetchStatus]);

	const reload = useCallback(() => {
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
		void fetchData(1, filters, false);
	}, [fetchData, filters]);

	const loadMore = useCallback(() => {
		if (pagination.hasNextPage && !isLoadingMore && fetchStatus !== 'loading') {
			const nextPage = pagination.currentPage + 1;
			void fetchData(nextPage, filters, true);
		}
	}, [
		pagination.hasNextPage,
		pagination.currentPage,
		isLoadingMore,
		fetchStatus,
		fetchData,
		filters,
	]);

	const applyFilters = useCallback(
		(newFilters: IInventoryFilters) => {
			setFilters(newFilters);
			fetchedBranchRef.current = null;
			setFetchStatus('idle');
			setHasFetched(false);
			void fetchData(1, newFilters, false);
		},
		[fetchData],
	);

	const clearFilters = useCallback(() => {
		setFilters({});
		fetchedBranchRef.current = null;
		setFetchStatus('idle');
		setHasFetched(false);
		void fetchData(1, {}, false);
	}, [fetchData]);

	return {
		movimientos,
		pagination,
		loading,
		error,
		branchId,
		currentBranchName,
		fetchStatus,
		hasFetched,
		isLoadingMore,
		filters,
		applyFilters,
		clearFilters,
		reload,
		loadMore,
	};
}

export default useTraceabilityMovements;
