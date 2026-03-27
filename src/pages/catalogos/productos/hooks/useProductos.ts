import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchProductsList,
	fetchInventorySummary,
	createProduct as createProductThunk,
	updateProduct as updateProductThunk,
	deleteProduct as deleteProductThunk,
	type ProductsState,
	type ProductEntityParam,
} from '@/store/slices/products/productsSlice';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import type { IProduct, ProductFilters } from '@/interface/product.interface';
import { PRODUCT_EMPTY_INVENTORY_SUMMARY, PRODUCT_EMPTY_STATS } from '@/constants/product.constant';

export type ProductsViewMode = 'branches' | 'subsidiaries';

interface UseProductosParams {
	branchId?: number | null;
	subsidiaryId?: number | null;
	mode?: ProductsViewMode;
	enabled?: boolean;
	filters: ProductFilters;
	page?: number;
	perPage?: number;
}

const INITIAL_PRODUCTS_STATE: ProductsState = {
	items: [],
	meta: {
		total: 0,
		current_page: 1,
		per_page: 15,
		last_page: 1,
	},
	stats: { ...PRODUCT_EMPTY_STATS },
	inventory: { ...PRODUCT_EMPTY_INVENTORY_SUMMARY },
	criticalProducts: [],
	current: null,
	loading: false,
	inventoryLoading: false,
	currentLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	currentError: null,
	inventoryError: null,
	attributesLoading: false,
	attributesUpdating: false,
	attributesError: null,
	mediaUploading: false,
	libraryLoading: false,
	mediaError: null,
};

export function useProductos({
	branchId,
	subsidiaryId,
	mode = 'branches',
	enabled = true,
	filters,
	page = 1,
	perPage = 15,
}: UseProductosParams) {
	const dispatch = useAppDispatch();

	const entityParam: ProductEntityParam = mode === 'subsidiaries' ? 'subsidiaries' : 'branches';
	const entityId = mode === 'subsidiaries' ? (subsidiaryId ?? null) : (branchId ?? null);

	const productsState = useAppSelector((state) => state.products ?? INITIAL_PRODUCTS_STATE);
	const { lista: branches, loading: branchesLoading } = useAppSelector(
		(state) => state.sucursales,
	);
	const brandsState = useAppSelector((state) => state.brands);
	const categoriesState = useAppSelector((state) => state.categories);
	const brandsLoadedForBranchId = useAppSelector((state) => {
		const branchState = state.brands as typeof brandsState & {
			lastBranchId?: number | null;
		};
		return branchState.lastBranchId ?? null;
	});

	useEffect(() => {
		if (!branches.length && !branchesLoading) {
			void dispatch(fetchMisSucursales());
		}
	}, [branches.length, branchesLoading, dispatch]);

	const activeBranchId = useMemo<number | null>(() => {
		if (branchId === null) return null;
		if (branchId) return branchId;
		return branches[0]?.id ?? null;
	}, [branchId, branches]);

	useEffect(() => {
		if (!enabled) return;
		if (mode === 'subsidiaries') {
			if (!subsidiaryId) return;
			void dispatch(
				fetchProductsList({
					entityParam: 'subsidiaries',
					entityId: subsidiaryId,
					params: { ...filters, page, per_page: perPage },
				}),
			);
			return;
		}
		if (!activeBranchId) return;
		void dispatch(
			fetchProductsList({
				entityParam: 'branches',
				entityId: activeBranchId,
				params: { ...filters, page, per_page: perPage },
			}),
		);
	}, [dispatch, enabled, mode, subsidiaryId, activeBranchId, filters, page, perPage]);

	useEffect(() => {
		if (!enabled) return;
		if (mode === 'subsidiaries') {
			if (!subsidiaryId) return;
			void dispatch(fetchInventorySummary({ entityParam: 'subsidiaries', entityId: subsidiaryId }));
			return;
		}
		if (!activeBranchId) return;
		void dispatch(fetchInventorySummary({ entityParam: 'branches', entityId: activeBranchId }));
	}, [dispatch, enabled, mode, subsidiaryId, activeBranchId]);

	useEffect(() => {
		if (!enabled) return;
		if (!activeBranchId) return;
		if (brandsLoadedForBranchId === activeBranchId && brandsState.items.length > 0) return;
		void dispatch(fetchBrands({ branchId: activeBranchId, search: '' }));
	}, [dispatch, enabled, activeBranchId, brandsLoadedForBranchId, brandsState.items.length]);

	useEffect(() => {
		if (!categoriesState.items.length && !categoriesState.loading) {
			void dispatch(fetchCategories(undefined));
		}
	}, [dispatch, categoriesState.items.length, categoriesState.loading]);

	const refresh = useCallback(() => {
		if (!enabled) return;
		if (!entityId) return;
		void dispatch(
			fetchProductsList({
				entityParam,
				entityId,
				params: { ...filters, page, per_page: perPage },
			}),
		);
		void dispatch(fetchInventorySummary({ entityParam, entityId }));
	}, [dispatch, enabled, entityParam, entityId, filters, page, perPage]);

	const createProduct = useCallback(
		async (payload: { data: Partial<IProduct>; categoryIds: number[] }) => {
			if (!entityId) throw new Error('Debe seleccionar una entidad (sucursal o subempresa)');
			await dispatch(
				createProductThunk({
					entityParam,
					entityId,
					data: payload.data,
					categoryIds: payload.categoryIds,
				}),
			).unwrap();
			refresh();
		},
		[dispatch, entityParam, entityId, refresh],
	);

	const updateProduct = useCallback(
		async (productId: number, payload: { data: Partial<IProduct>; categoryIds?: number[] }) => {
			if (!entityId) throw new Error('Debe seleccionar una entidad (sucursal o subempresa)');
			await dispatch(
				updateProductThunk({
					entityParam,
					entityId,
					productId,
					data: payload.data,
					categoryIds: payload.categoryIds,
				}),
			).unwrap();
			refresh();
		},
		[dispatch, entityParam, entityId, refresh],
	);

	const deleteProduct = useCallback(
		async (productId: number) => {
			if (!entityId) throw new Error('Debe seleccionar una entidad (sucursal o subempresa)');
			await dispatch(deleteProductThunk({ entityParam, entityId, productId })).unwrap();
			refresh();
		},
		[dispatch, entityParam, entityId, refresh],
	);

	return {
		products: productsState.items,
		meta: productsState.meta,
		stats: productsState.stats,
		inventory: productsState.inventory,
		criticalProducts: productsState.criticalProducts,
		loading: productsState.loading || branchesLoading,
		inventoryLoading: productsState.inventoryLoading,
		creating: productsState.creating,
		updating: productsState.updating,
		deleting: productsState.deleting,
		error: productsState.error,
		inventoryError: productsState.inventoryError,
		branches,
		activeBranchId,
		brands: brandsState.items,
		brandsLoading: brandsState.loading,
		categories: categoriesState.items,
		categoriesLoading: categoriesState.loading,
		createProduct,
		updateProduct,
		deleteProduct,
		refresh,
	};
}
