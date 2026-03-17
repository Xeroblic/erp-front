import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';

interface UseStockCatalogParams {
	subsidiaryId?: number | null;
	filters?: Record<string, any>;
	page?: number;
	perPage?: number;
}

export const useStockCatalog = ({
	subsidiaryId,
	filters = {},
	page = 1,
	perPage = 50,
}: UseStockCatalogParams) => {
	const dispatch = useAppDispatch();
	const productsState = useAppSelector((state) => state.products);

	const fetchProducts = useCallback(() => {
		if (!subsidiaryId) return;

		dispatch(
			fetchProductsList({
				entityParam: 'subsidiaries',
				entityId: subsidiaryId,
				params: { ...filters, page, per_page: perPage },
			})
		);
	}, [dispatch, subsidiaryId, page, perPage, JSON.stringify(filters)]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	return {
		products: productsState?.items || [],
		loading: productsState?.loading || false,
		error: productsState?.error || null,
		refresh: fetchProducts,
	};
};
