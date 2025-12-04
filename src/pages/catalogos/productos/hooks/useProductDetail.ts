import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import {
	fetchProductById,
	fetchProductAttributes,
	patchProductAttributes,
	updateProduct as updateProductThunk,
	type ProductAttributesPatchPayload,
} from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';

interface UseProductDetailParams {
	productId: number | null;
	branchId?: number | null;
}

export const useProductDetail = ({ productId, branchId }: UseProductDetailParams) => {
	const dispatch = useAppDispatch();

	const productsState = useAppSelector((state) => state.products);
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

	useEffect(() => {
		if (!categoriesState.items.length && !categoriesState.loading) {
			void dispatch(fetchCategories(undefined));
		}
	}, [categoriesState.items.length, categoriesState.loading, dispatch]);

	const fallbackBranchId = useMemo(() => {
		if (!productId) return null;
		const found = productsState.items.find((item) => item.id === productId);
		return found?.branch_id ?? null;
	}, [productId, productsState.items]);

	const effectiveBranchId = useMemo(() => {
		return branchId ?? fallbackBranchId ?? null;
	}, [branchId, fallbackBranchId]);

	useEffect(() => {
		if (!effectiveBranchId) return;
		void dispatch(fetchBrands({ branchId: effectiveBranchId, search: '' }));
	}, [dispatch, effectiveBranchId]);

	useEffect(() => {
		if (!productId || !effectiveBranchId) return;
		void dispatch(fetchProductById({ branchId: effectiveBranchId, productId }));
	}, [dispatch, productId, effectiveBranchId]);

	useEffect(() => {
		if (!productId || !effectiveBranchId) return;
		void dispatch(fetchProductAttributes({ branchId: effectiveBranchId, productId }));
	}, [dispatch, productId, effectiveBranchId]);

	const refresh = useCallback(() => {
		if (!productId || !effectiveBranchId) return;
		void dispatch(fetchProductById({ branchId: effectiveBranchId, productId }));
		void dispatch(fetchProductAttributes({ branchId: effectiveBranchId, productId }));
	}, [dispatch, productId, effectiveBranchId]);

	const updateProduct = useCallback(
		async (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => {
			if (!productId || !effectiveBranchId) {
				throw new Error('No se pudo determinar la sucursal del producto');
			}
			await dispatch(
				updateProductThunk({
					branchId: effectiveBranchId,
					productId,
					data: payload.data,
					categoryIds: payload.categoryIds,
				}),
			).unwrap();
			refresh();
		},
		[dispatch, effectiveBranchId, productId, refresh],
	);

	const updateProductAttributes = useCallback(
		async (payload: ProductAttributesPatchPayload) => {
			if (!productId || !effectiveBranchId) {
				throw new Error('No se pudo determinar la sucursal del producto');
			}

			const body: ProductAttributesPatchPayload = {};
			if (payload.set && Object.keys(payload.set).length) {
				body.set = payload.set;
			}
			if (payload.unset && payload.unset.length) {
				body.unset = payload.unset;
			}
			if (!body.set && !body.unset) return;

			await dispatch(
				patchProductAttributes({
					branchId: effectiveBranchId,
					productId,
					payload: body,
				}),
			).unwrap();
		},
		[dispatch, effectiveBranchId, productId],
	);

	return {
		product: productsState.current,
		productLoading: productsState.currentLoading || branchesLoading,
		productError: productsState.currentError ?? productsState.error,
		updating: productsState.updating,
		attributesLoading: productsState.attributesLoading,
		attributesUpdating: productsState.attributesUpdating,
		attributesError: productsState.attributesError,
		branches,
		brands: brandsState.items,
		brandsLoading: brandsState.loading,
		categories: categoriesState.items,
		categoriesLoading: categoriesState.loading,
		effectiveBranchId,
		refresh,
		updateProduct,
		updateProductAttributes,
	};
};

export default useProductDetail;
