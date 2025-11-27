import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import {
	fetchTransfers,
	selectTransfers,
	selectTransfersLoading,
	selectTransfersPagination,
	selectTransferFilters,
	setFilters as setTransferFilters,
	clearFilters as clearTransferFilters,
} from '@/store/slices/transfers/transfersSlice';
import type { ITransfer, TransferDirection } from '@/interface/transfers.interface';

export type MovementFilters = {
	direction?: TransferDirection;
	search?: string;
};

export interface UseMovementsManagerReturn {
	transfers: ITransfer[];
	loading: boolean;
	error?: string;
	filters: MovementFilters;
	pagination: {
		currentPage: number;
		totalPages: number;
		perPage: number;
		totalTransfers: number;
	};
	stats: {
		total: number;
		sent: number;
		received: number;
		pending: number;
	};
	setFilters: (filters: MovementFilters) => void;
	refreshTransfers: () => Promise<void>;
	changePage: (page: number) => Promise<void>;
	clearFilters: () => void;
}

const useMovementsManager = (): UseMovementsManagerReturn => {
	const dispatch = useAppDispatch();

	const transfers = useAppSelector(selectTransfers);
	const loading = useAppSelector(selectTransfersLoading);
	const pagination = useAppSelector(selectTransfersPagination);
	const sliceFilters = useAppSelector(selectTransferFilters);
	const error = useAppSelector((state) => state.transferencias.error);

	const [localLoading, setLocalLoading] = useState(false);

	const currentFilters: MovementFilters = useMemo(
		() => ({
			direction: sliceFilters.direction,
			search: sliceFilters.q,
		}),
		[sliceFilters],
	);

	const requestTransfers = useCallback(
		async (page?: number, overrides: MovementFilters = {}) => {
			setLocalLoading(true);
			try {
				await dispatch(
					fetchTransfers({
						page,
						direction: overrides.direction ?? currentFilters.direction,
						q: overrides.search ?? currentFilters.search ?? '',
					}),
				).unwrap();
				return true;
			} catch {
				return false;
			} finally {
				setLocalLoading(false);
			}
		},
		[dispatch, currentFilters],
	);

	useEffect(() => {
		requestTransfers(pagination.currentPage || 1, currentFilters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const setFilters = useCallback(
		(filters: MovementFilters) => {
			dispatch(
				setTransferFilters({
					direction: filters.direction,
					q: filters.search ?? '',
				}),
			);
			requestTransfers(1, filters);
		},
		[dispatch, requestTransfers],
	);

	const clearFilters = useCallback(() => {
		dispatch(clearTransferFilters());
		requestTransfers(1, {});
	}, [dispatch, requestTransfers]);

	const changePage = useCallback(
		async (page: number) => {
			const targetPage = Math.max(1, page);
			await requestTransfers(targetPage, currentFilters);
		},
		[requestTransfers, currentFilters],
	);

	const refreshTransfers = useCallback(async () => {
		await requestTransfers(pagination.currentPage || 1, currentFilters);
	}, [requestTransfers, pagination.currentPage, currentFilters]);

	const stats = useMemo(() => {
		const total = pagination.totalTransfers || transfers.length;
		const sent = transfers.filter((t) => t.direction === 'sent' || t.status === 'sent').length;
		const received = transfers.filter((t) => t.direction === 'received' || t.status === 'received').length;
		const pending = transfers.filter((t) => t.status === 'pending' || t.status === 'draft').length;

		return { total, sent, received, pending };
	}, [pagination.totalTransfers, transfers]);

	return {
		transfers,
		loading: loading || localLoading,
		error,
		filters: currentFilters,
		pagination,
		stats,
		setFilters,
		refreshTransfers,
		changePage,
		clearFilters,
	};
};

export default useMovementsManager;
