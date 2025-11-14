/**
 * Hook useBatchItems - Modo A
 * Manejo de items de un lote específico usando el slice existente de technicalReviews
 */
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBatchItems } from '@/store/slices/technicalReviews/thunks/batchesThunks';
import { fetchItemDetail } from '@/store/slices/technicalReviews/thunks/itemsThunks';
import {
	selectItems,
	selectItemsLoading,
	selectItemsError,
	selectItemsMeta,
	selectSelectedItem,
	selectItemDetailLoading,
} from '@/store/slices/technicalReviews/slice/selectors';
import type { FetchBatchItemsParams } from '@/interface/technicalReviews.interface';

export const useBatchItems = (branchId: number, batchId: number | null) => {
	const dispatch = useAppDispatch();
	
	const items = useAppSelector(selectItems);
	const loading = useAppSelector(selectItemsLoading);
	const error = useAppSelector(selectItemsError);
	const meta = useAppSelector(selectItemsMeta);
	
	const selectedItem = useAppSelector(selectSelectedItem);
	const selectedItemLoading = useAppSelector(selectItemDetailLoading);

	/**
	 * Fetch items from batch usando el thunk existente
	 */
	const loadBatchItems = useCallback(async (params: FetchBatchItemsParams = {}) => {
		if (!branchId || !batchId) return;

		try {
			await dispatch(fetchBatchItems({ branchId, batchId, params })).unwrap();
		} catch (err: any) {
			console.error('Error fetching batch items:', err);
		}
	}, [branchId, batchId, dispatch]);

	/**
	 * Fetch single item detail usando el thunk existente
	 */
	const loadItemDetail = useCallback(async (itemId: number) => {
		if (!branchId) return;

		try {
			await dispatch(fetchItemDetail({ branchId, itemId })).unwrap();
		} catch (err: any) {
			console.error('Error fetching item detail:', err);
		}
	}, [branchId, dispatch]);

	/**
	 * Refresh current list
	 */
	const refresh = useCallback(() => {
		loadBatchItems();
	}, [loadBatchItems]);

	/**
	 * Load initial data
	 */
	useEffect(() => {
		if (branchId && batchId) {
			loadBatchItems();
		}
	}, [branchId, batchId]); // Solo en mount o cambio de IDs

	return {
		items,
		loading,
		error,
		meta,
		selectedItem,
		selectedItemLoading,
		fetchBatchItems: loadBatchItems,
		fetchItemDetail: loadItemDetail,
		refresh,
	};
};

