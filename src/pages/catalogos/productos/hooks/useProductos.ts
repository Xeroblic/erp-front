import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchProducts,
	fetchProductsFromMultipleBranches,
	createProduct as createProductThunk,
	updateProduct as updateProductThunk,
	deleteProduct as deleteProductThunk,
	ProductsState,
} from '@/store/slices/products/productsSlice';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import type { IProduct, ProductFilters } from '@/interface/product.interface';
import { PRODUCT_EMPTY_STATS } from '@/constants/product.constant';

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
	current: null,
	loading: false,
	currentLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	currentError: null,
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
	const { lista: branches, loading: branchesLoading } = useAppSelector((state) => state.sucursales);
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

	const userBranchIds = useMemo(() => branches.map(b => b.id), [branches]);

	useEffect(() => {
		if (activeBranchId === null && userBranchIds.length > 0) {
			void dispatch(fetchProductsFromMultipleBranches({
				branchIds: userBranchIds,
				params: { ...filters, page, per_page: perPage }
			}));
		} else if (activeBranchId) {
			void dispatch(fetchProducts({ branchId: activeBranchId, params: { ...filters, page, per_page: perPage } }));
		}
	}, [dispatch, activeBranchId, userBranchIds, filters, page, perPage]);

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
		if (activeBranchId === null && userBranchIds.length > 0) {
			void dispatch(fetchProductsFromMultipleBranches({
				branchIds: userBranchIds,
				params: { ...filters, page, per_page: perPage }
			}));
		} else if (activeBranchId) {
			void dispatch(fetchProducts({ branchId: activeBranchId, params: { ...filters, page, per_page: perPage } }));
		}
	}, [dispatch, activeBranchId, userBranchIds, filters, page, perPage]);

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
		loading: productsState.loading || branchesLoading,
		creating: productsState.creating,
		updating: productsState.updating,
		deleting: productsState.deleting,
		error: productsState.error,
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
