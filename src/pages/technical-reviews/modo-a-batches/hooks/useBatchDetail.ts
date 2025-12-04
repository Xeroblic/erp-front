/**
 * Hook useBatchDetail - Modo A
 * Manejo de detalle de un lote específico usando el slice existente de technicalReviews
 */
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBatchById } from '@/store/slices/technicalReviews/thunks/batchesThunks';
import {
	selectSelectedBatch,
	selectBatchesLoading,
	selectBatchesError,
} from '@/store/slices/technicalReviews/slice/selectors';

export const useBatchDetail = (branchId: number, batchId: number | null) => {
	const dispatch = useAppDispatch();

	const batch = useAppSelector(selectSelectedBatch);
	const loading = useAppSelector(selectBatchesLoading);
	const error = useAppSelector(selectBatchesError);

	/**
	 * Fetch batch detail usando el thunk existente
	 */
	const loadBatchDetail = useCallback(
		async (id?: number) => {
			const targetId = id || batchId;
			if (!branchId || !targetId) return;

			try {
				await dispatch(fetchBatchById({ branchId, batchId: targetId })).unwrap();
			} catch (err: any) {
				console.error('Error fetching batch detail:', err);
			}
		},
		[branchId, batchId, dispatch],
	);

	/**
	 * Load initial data
	 */
	useEffect(() => {
		if (branchId && batchId) {
			loadBatchDetail();
		}
	}, [branchId, batchId]); // Solo en mount o cambio de ID

	return {
		batch,
		loading,
		error,
		fetchBatchDetail: loadBatchDetail,
		refresh: () => loadBatchDetail(),
	};
};
