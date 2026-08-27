import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import type { ProductFilters, ProductListMeta } from '@/interface/product.interface';

interface UseStockCatalogParams {
	branchId?: number | null;
	subsidiaryId?: number | null;
	filters?: ProductFilters;
	page?: number;
	perPage?: number;
}

const EMPTY_META: ProductListMeta = {
	total: 0,
	current_page: 1,
	per_page: 0,
	last_page: 1,
};

export const useStockCatalog = ({
	branchId,
	subsidiaryId,
	filters,
	page = 1,
	perPage = 50,
}: UseStockCatalogParams) => {
	const dispatch = useAppDispatch();
	const productsState = useAppSelector((state) => state.products);

	// Serializamos los filtros para que la identidad del objeto no dispare un refetch
	// en cada render cuando el llamador pasa un literal inline.
	const filtersKey = JSON.stringify(filters ?? {});

	const fetchProducts = useCallback(() => {
		const activeFilters = JSON.parse(filtersKey) as ProductFilters;

		if (subsidiaryId) {
			dispatch(
				fetchProductsList({
					entityParam: 'subsidiaries',
					entityId: subsidiaryId,
					params: {
						...activeFilters,
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
					params: { ...activeFilters, page, per_page: perPage },
				}),
			);
		}
	}, [dispatch, subsidiaryId, branchId, page, perPage, filtersKey]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	return {
		products: productsState?.items ?? [],
		meta: productsState?.meta ?? EMPTY_META,
		loading: productsState?.loading ?? false,
		error: productsState?.error ?? null,
		refresh: fetchProducts,
	};
};
