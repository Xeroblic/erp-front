/**
 * Hook useBatchList - Modo A
 * Manejo de lista de lotes usando el slice existente de technicalReviews
 */
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBatches } from '@/store/slices/technicalReviews/thunks/batchesThunks';
import {
	selectBatches,
	selectBatchesLoading,
	selectBatchesError,
	selectBatchesMeta,
} from '@/store/slices/technicalReviews/slice/selectors';
import type { FetchBatchesParams } from '@/interface/technicalReviews.interface';

export const useBatchList = (branchId?: number | null) => {
	const dispatch = useAppDispatch();

	const batches = useAppSelector(selectBatches);
	const loading = useAppSelector(selectBatchesLoading);
	const error = useAppSelector(selectBatchesError);
	const meta = useAppSelector(selectBatchesMeta);

	/**
	 * Fetch batches from API usando el thunk existente
	 */
	const loadBatches = useCallback(async (params: FetchBatchesParams = {}) => {
		if (!branchId) return;

		try {
			await dispatch(fetchBatches({ branchId, params })).unwrap();
		} catch (err: any) {
			console.error('Error fetching batches:', err);
		}
	}, [branchId, dispatch]);

	/**
	 * Refresh current list
	 */
	const refresh = useCallback(() => {
		loadBatches();
	}, [loadBatches]);

	/**
	 * Load initial data
	 */
	useEffect(() => {
		if (branchId) {
			loadBatches();
		}
	}, [branchId]); // Solo en mount

	return {
		batches,
		meta,
		loading,
		error,
		fetchBatches: loadBatches,
		refresh,
	};
};

