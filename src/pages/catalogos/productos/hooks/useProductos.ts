import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchProducts,
	fetchBranchInventorySummary,
	createProduct as createProductThunk,
	updateProduct as updateProductThunk,
	deleteProduct as deleteProductThunk,
	ProductsState,
} from '@/store/slices/products/productsSlice';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import type { IProduct, ProductFilters } from '@/interface/product.interface';
import { PRODUCT_EMPTY_INVENTORY_SUMMARY, PRODUCT_EMPTY_STATS } from '@/constants/product.constant';

interface UseProductosParams {
	branchId?: number | null;
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

export function useProductos({ branchId, filters, page = 1, perPage = 15 }: UseProductosParams) {
	const dispatch = useAppDispatch();

	const productsState = useAppSelector((state) => state.products ?? INITIAL_PRODUCTS_STATE);
	const { lista: branches, loading: branchesLoading } = useAppSelector(
		(state) => state.sucursales,
	);
	const brandsState = useAppSelector((state) => state.brands);
	const categoriesState = useAppSelector((state) => state.categories);

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
		if (!activeBranchId) return;
		void dispatch(
			fetchProducts({
				branchId: activeBranchId,
				params: { ...filters, page, per_page: perPage },
			}),
		);
	}, [dispatch, activeBranchId, filters, page, perPage]);

	useEffect(() => {
		if (!activeBranchId) return;
		void dispatch(fetchBranchInventorySummary({ branchId: activeBranchId }));
	}, [dispatch, activeBranchId]);

	useEffect(() => {
		if (!activeBranchId) return;
		void dispatch(fetchBrands({ branchId: activeBranchId, search: '' }));
	}, [dispatch, activeBranchId]);

	useEffect(() => {
		if (!categoriesState.items.length && !categoriesState.loading) {
			void dispatch(fetchCategories(undefined));
		}
	}, [dispatch, categoriesState.items.length, categoriesState.loading]);

	const refresh = useCallback(() => {
		if (!activeBranchId) return;
		void dispatch(
			fetchProducts({
				branchId: activeBranchId,
				params: { ...filters, page, per_page: perPage },
			}),
		);
		void dispatch(fetchBranchInventorySummary({ branchId: activeBranchId }));
	}, [dispatch, activeBranchId, filters, page, perPage]);

	const createProduct = useCallback(
		async (payload: { data: Partial<IProduct>; categoryIds: number[] }) => {
			const targetBranchId = payload.data.branch_id || activeBranchId;
			if (!targetBranchId) throw new Error('Debe seleccionar una sucursal');

			await dispatch(
				createProductThunk({
					branchId: targetBranchId,
					data: payload.data,
					categoryIds: payload.categoryIds,
				}),
			).unwrap();

			if (targetBranchId === activeBranchId) {
				refresh();
			}
		},
		[dispatch, activeBranchId, refresh],
	);

	const updateProduct = useCallback(
		async (productId: number, payload: { data: Partial<IProduct>; categoryIds?: number[] }) => {
			if (!activeBranchId) throw new Error('Debe seleccionar una sucursal');
			await dispatch(
				updateProductThunk({
					branchId: activeBranchId,
					productId,
					data: payload.data,
					categoryIds: payload.categoryIds,
				}),
			).unwrap();
			refresh();
		},
		[dispatch, activeBranchId, refresh],
	);

	const deleteProduct = useCallback(
		async (productId: number) => {
			if (!activeBranchId) throw new Error('Debe seleccionar una sucursal');
			await dispatch(deleteProductThunk({ branchId: activeBranchId, productId })).unwrap();
			refresh();
		},
		[dispatch, activeBranchId, refresh],
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
