import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchListaMovimientoSucursalThunk,
	selectMovimientosSucursal,
	selectInventarioPagination,
	selectInventarioLoading,
	selectInventarioError,
	selectInventarioListBranchId,
	clearListaMovimientoSucursal,
	EMPTY_INVENTORY_PAGINATION,
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

/** Estado local de la consulta, etiquetado con la sucursal que lo produjo. */
interface IRequestState {
	branchId: number | null;
	status: FetchStatus;
	hasFetched: boolean;
	isLoadingMore: boolean;
}

const EMPTY_MOVEMENTS: ReturnType<typeof selectMovimientosSucursal> = [];

export function useTraceabilityMovements(options: UseTraceabilityMovementsOptions = {}) {
	const { autoFetch = true, perPage = 20 } = options;

	const dispatch = useAppDispatch();

	const rawMovimientos = useAppSelector(selectMovimientosSucursal);
	const rawPagination = useAppSelector(selectInventarioPagination);
	const rawLoading = useAppSelector(selectInventarioLoading);
	const rawError = useAppSelector(selectInventarioError);
	const listBranchId = useAppSelector(selectInventarioListBranchId);
	const branches = useAppSelector(selectUserBranches);
	const { branchId } = useCurrentBranch();

	const [requestState, setRequestState] = useState<IRequestState>({
		branchId,
		status: 'idle',
		hasFetched: false,
		isLoadingMore: false,
	});
	const [filters, setFilters] = useState<IInventoryFilters>({});

	// La limpieza al cambiar de sucursal corre en un efecto, después del primer render con la
	// sucursal nueva: hasta entonces sólo se expone lo que pertenece a la sucursal vigente.
	const ownsList = branchId !== null && listBranchId === branchId;
	const ownsRequestState = requestState.branchId === branchId;
	const movimientos = ownsList ? rawMovimientos : EMPTY_MOVEMENTS;
	const pagination = ownsList ? rawPagination : EMPTY_INVENTORY_PAGINATION;
	const loading = ownsList && rawLoading;
	const error = ownsList ? rawError : undefined;
	const fetchStatus: FetchStatus = ownsRequestState ? requestState.status : 'idle';
	const hasFetched = ownsRequestState && requestState.hasFetched;
	const isLoadingMore = ownsRequestState && requestState.isLoadingMore;

	const updateRequestState = useCallback(
		(owner: number | null, patch: Partial<Omit<IRequestState, 'branchId'>>) => {
			setRequestState((prev) => {
				const base: IRequestState =
					prev.branchId === owner
						? prev
						: {
								branchId: owner,
								status: 'idle',
								hasFetched: false,
								isLoadingMore: false,
							};
				return { ...base, ...patch };
			});
		},
		[],
	);

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
		setRequestState({ branchId, status: 'idle', hasFetched: false, isLoadingMore: false });
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
			updateRequestState(branchId, {
				status: append ? 'loading-more' : 'loading',
				isLoadingMore: append,
			});

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
				if (append) {
					// Conserva las páginas ya cargadas: sólo falla la página siguiente.
					toast.error(LOAD_MORE_TIMEOUT);
					updateRequestState(branchId, { status: 'success', isLoadingMore: false });
					return;
				}
				updateRequestState(branchId, { status: 'timeout', isLoadingMore: false });
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
			if (failure !== null && append) {
				toast.error(failure);
				updateRequestState(branchId, {
					status: 'success',
					hasFetched: true,
					isLoadingMore: false,
				});
				return;
			}
			updateRequestState(branchId, {
				status: failure === null ? 'success' : 'error',
				hasFetched: true,
				isLoadingMore: false,
			});
		},
		[
			branchId,
			cancelInFlight,
			clearRequestTimer,
			dispatch,
			fetchStatus,
			filters,
			perPage,
			updateRequestState,
		],
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
		updateRequestState(branchId, { status: 'idle', hasFetched: false });
		void fetchData(1, filters, false);
	}, [branchId, fetchData, filters, updateRequestState]);

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
			updateRequestState(branchId, { status: 'idle', hasFetched: false });
			void fetchData(1, newFilters, false);
		},
		[branchId, fetchData, updateRequestState],
	);

	const clearFilters = useCallback(() => {
		setFilters({});
		fetchedBranchRef.current = null;
		updateRequestState(branchId, { status: 'idle', hasFetched: false });
		void fetchData(1, {}, false);
	}, [branchId, fetchData, updateRequestState]);

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
