import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';

interface UseStockCatalogParams {
	branchId?: number | null;
	subsidiaryId?: number | null;
	filters?: Record<string, any>;
	page?: number;
	perPage?: number;
}

export const useStockCatalog = ({
	branchId,
	subsidiaryId,
	filters = {},
	page = 1,
	perPage = 50,
}: UseStockCatalogParams) => {
	const dispatch = useAppDispatch();
	const productsState = useAppSelector((state) => state.products);

	const fetchProducts = useCallback(() => {
		if (subsidiaryId) {
			dispatch(
				fetchProductsList({
					entityParam: 'subsidiaries',
					entityId: subsidiaryId,
					params: {
						...filters,
						page,
						per_page: perPage,
						...(branchId ? { branchId } : {}),
					},
				}),
			);
			return;
		}

		// Fallback: si no se puede resolver subsidiaria, usar endpoint de branch para no dejar vacío el catálogo
		if (branchId) {
			dispatch(
				fetchProductsList({
					entityParam: 'branches',
					entityId: branchId,
					params: { ...filters, page, per_page: perPage },
				}),
			);
		}
	}, [dispatch, subsidiaryId, branchId, page, perPage, filters]);

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
