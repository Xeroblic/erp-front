import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import {
	clearCurrentProduct,
	fetchProductById,
	fetchProductAttributes,
	patchProductAttributes,
	updateProduct as updateProductThunk,
	type ProductAttributesPatchPayload,
	type ProductEntityParam,
} from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';
import type { ProductsViewMode } from './useProductos';

interface UseProductDetailParams {
	productId: number | null;
	branchId?: number | null;
	subsidiaryId?: number | null;
	mode?: ProductsViewMode;
}

export const useProductDetail = ({
	productId,
	branchId,
	subsidiaryId,
	mode = 'branches',
}: UseProductDetailParams) => {
	const dispatch = useAppDispatch();

	const entityParam: ProductEntityParam = mode === 'subsidiaries' ? 'subsidiaries' : 'branches';

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
		// 1) Producto ya cargado en el detalle (cubre el deep-link a /productos/:id,
		//    donde la lista aún no contiene el producto). Usa la sucursal consultada
		//    o, en su defecto, la sucursal de origen del producto.
		const current = productsState.current;
		if (current && current.id === productId) {
			const fromCurrent = current.branch_id ?? current.origin_branch_id ?? null;
			if (fromCurrent != null) return fromCurrent;
		}
		// 2) Fallback a la lista (navegación desde el listado).
		const found = productsState.items.find((item) => item.id === productId);
		return found?.branch_id ?? null;
	}, [productId, productsState.current, productsState.items]);

	// effectiveBranchId: siempre apunta a una sucursal real (para cargar brands, etc.)
	const effectiveBranchId = useMemo(
		() => branchId ?? fallbackBranchId ?? null,
		[branchId, fallbackBranchId],
	);

	// entityId: el ID correcto para la URL según el modo
	const entityId = useMemo(() => {
		if (mode === 'subsidiaries') return subsidiaryId ?? null;
		return effectiveBranchId;
	}, [mode, subsidiaryId, effectiveBranchId]);

	useEffect(() => {
		if (!effectiveBranchId) return;
		void dispatch(fetchBrands({ branchId: effectiveBranchId, search: '' }));
	}, [dispatch, effectiveBranchId]);

	// Carga del producto. No depende de `effectiveBranchId`: en modo subsidiaria el
	// producto se consulta por `subsidiaryId` (entityId), y `effectiveBranchId` se
	// resuelve a partir del producto ya cargado. Incluirlo aquí, junto con el
	// `clearCurrentProduct()`, provocaría un ciclo de recarga infinito.
	useEffect(() => {
		if (!productId || !entityId) return;
		dispatch(clearCurrentProduct());
		void dispatch(fetchProductById({ entityParam, entityId, productId }));
		return () => {
			dispatch(clearCurrentProduct());
		};
	}, [dispatch, productId, entityId, entityParam]);

	// Carga de atributos una vez que se conoce la sucursal efectiva.
	useEffect(() => {
		if (!productId || !effectiveBranchId) return;
		void dispatch(
			fetchProductAttributes({
				entityParam: 'branches',
				entityId: effectiveBranchId,
				productId,
			}),
		);
	}, [dispatch, productId, effectiveBranchId]);

	const refresh = useCallback(() => {
		if (!productId || !entityId) return;
		void dispatch(fetchProductById({ entityParam, entityId, productId }));
		if (effectiveBranchId) {
			void dispatch(
				fetchProductAttributes({
					entityParam: 'branches',
					entityId: effectiveBranchId,
					productId,
				}),
			);
		}
	}, [dispatch, productId, entityId, entityParam, effectiveBranchId]);

	const updateProduct = useCallback(
		async (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => {
			if (!productId || !entityId) {
				throw new Error('No se pudo determinar la entidad del producto');
			}
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
		[dispatch, entityParam, entityId, productId, refresh],
	);

	const updateProductAttributes = useCallback(
		async (payload: ProductAttributesPatchPayload) => {
			if (!productId || !effectiveBranchId) {
				throw new Error('No se pudo determinar la entidad del producto');
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
					entityParam: 'branches',
					entityId: effectiveBranchId,
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
		entityId,
		refresh,
		updateProduct,
		updateProductAttributes,
	};
};

export default useProductDetail;
