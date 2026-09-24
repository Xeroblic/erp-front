import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import {
	fetchWarehouseDetail,
	attachWarehouseProducts,
	detachWarehouseProduct,
	clearWarehouseDetail,
	type IWarehouseApiError,
} from '@/store/slices/warehouses/warehouseSlice';
import type { IAttachProductRequest, IWarehouseProduct } from '@/interface/warehouse.interface';
import type { IProduct } from '@/interface/product.interface';
import type { IFichaBodegaResumen } from '../types';

type UnknownRecord = Record<string, unknown>;

const getErrorMessage = (error: unknown, fallback: string): string => {
	const errorRecord =
		typeof error === 'object' && error !== null ? (error as UnknownRecord) : undefined;
	const responseRecord =
		typeof errorRecord?.response === 'object' && errorRecord.response !== null
			? (errorRecord.response as UnknownRecord)
			: undefined;
	const data =
		typeof responseRecord?.data === 'object' && responseRecord.data !== null
			? (responseRecord.data as UnknownRecord)
			: undefined;
	const msg = data?.message;
	if (typeof msg === 'string' && msg.trim()) return msg;
	if (error instanceof Error && error.message.trim()) return error.message;
	return fallback;
};

export const useBodegaDetail = () => {
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const parsedId = Number(id);
	const warehouseId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;

	const warehouse = useAppSelector((s) => s.warehouse.warehouseDetail);
	const warehouseDetailLoading = useAppSelector((s) => s.warehouse.warehouseDetailLoading);
	const warehouseDetailError = useAppSelector((s) => s.warehouse.warehouseDetailError);
	const allProducts = useAppSelector((s) => s.products.items);
	const productsLoading = useAppSelector((s) => s.products.loading);

	// UI state
	const [showAvailable, setShowAvailable] = useState(false);
	const [productToRemove, setProductToRemove] = useState<IWarehouseProduct | null>(null);
	const [attachProduct, setAttachProduct] = useState<IProduct | null>(null);
	const [isAttaching, setIsAttaching] = useState(false);

	// Load detail: el error queda en `warehouseDetailError` y la vista lo muestra con «Reintentar».
	const refresh = useCallback(() => {
		if (!branchId || warehouseId === null) return;
		void dispatch(fetchWarehouseDetail({ branchId, warehouseId }));
	}, [branchId, warehouseId, dispatch]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// Load products for the branch
	useEffect(() => {
		if (warehouseId === null || !branchId) return;
		void dispatch(
			fetchProductsList({
				entityParam: 'branches',
				entityId: branchId,
				params: { per_page: 50 },
			}),
		);
	}, [dispatch, branchId, warehouseId]);

	// Cleanup
	useEffect(() => {
		return () => {
			dispatch(clearWarehouseDetail());
		};
	}, [dispatch]);

	// Derived data
	const associatedProductIds = useMemo(
		() => new Set(warehouse?.products?.map((wp) => wp.id) ?? []),
		[warehouse?.products],
	);

	const availableProducts = useMemo(() => {
		if (!warehouse?.products) return [];
		const targetBranchId = warehouse?.branch_id ?? branchId ?? null;
		return allProducts.filter((product: IProduct) => {
			const matchesBranch = targetBranchId ? product.branch_id === targetBranchId : true;
			return matchesBranch && !associatedProductIds.has(product.id);
		});
	}, [allProducts, warehouse?.products, branchId, warehouse?.branch_id, associatedProductIds]);

	// Sólo cuentan los productos asociados; las unidades salen de `current_capacity`.
	const summary = useMemo<IFichaBodegaResumen>(() => {
		const products = warehouse?.products ?? [];
		const synced = products.filter((product) => product.sync_stock).length;
		return {
			products: products.length,
			units: warehouse?.current_capacity ?? 0,
			synced,
			manual: products.length - synced,
		};
	}, [warehouse?.products, warehouse?.current_capacity]);

	const isProductAssociated = useCallback(
		(productId: number): boolean => associatedProductIds.has(productId),
		[associatedProductIds],
	);

	// Actions
	const loadWarehouseDetail = useCallback(
		async (targetId: number) => {
			if (!branchId) return;
			try {
				await dispatch(fetchWarehouseDetail({ branchId, warehouseId: targetId })).unwrap();
			} catch (e: unknown) {
				toast.error(getErrorMessage(e, 'Error al cargar el detalle de la bodega'));
			}
		},
		[dispatch, branchId],
	);

	const onSelectProductToAttach = useCallback(
		(product: IProduct) => {
			if (isProductAssociated(product.id)) {
				return;
			}
			setAttachProduct(product);
		},
		[isProductAssociated],
	);

	const onConfirmAttach = useCallback(
		async (productId: number, sync: boolean, quantity: number) => {
			if (!warehouse || !branchId) return;
			if (isProductAssociated(productId)) {
				setAttachProduct(null);
				return;
			}

			setIsAttaching(true);
			try {
				const payload: IAttachProductRequest = {
					product_id: productId,
					quantity: sync ? undefined : quantity,
					sync_stock: sync,
				};
				await dispatch(
					attachWarehouseProducts({ branchId, warehouseId: warehouse.id, data: payload }),
				).unwrap();
				await loadWarehouseDetail(warehouse.id);
				setAttachProduct(null);
			} catch (e: unknown) {
				const apiError = e as IWarehouseApiError;
				const fields = apiError.fields;
				if (fields?.quantity) {
					toast.error('No hay capacidad suficiente en la bodega');
				} else if (fields?.sync_stock) {
					toast.error('No hay stock disponible para sincronizar');
				} else if (fields?.product_id) {
					const msg = apiError.message.toLowerCase();
					if (msg.includes('ya está asociado')) {
						toast.warning('El producto ya se encuentra en la bodega');
					} else if (msg.includes('sucursal')) {
						toast.error('El producto pertenece a otra sucursal');
					} else {
						toast.error(apiError.message);
					}
				} else {
					toast.error(apiError.message || 'Error al asociar el producto');
				}
			} finally {
				setIsAttaching(false);
			}
		},
		[warehouse, branchId, isProductAssociated, dispatch, loadWarehouseDetail],
	);

	const onConfirmRemove = useCallback(
		async (productId: number) => {
			if (!warehouse || !branchId) return;
			try {
				await dispatch(
					detachWarehouseProduct({
						branchId,
						warehouseId: warehouse.id,
						data: { product_id: productId },
					}),
				).unwrap();
				await loadWarehouseDetail(warehouse.id);
				setProductToRemove(null);
			} catch (e: unknown) {
				const apiError = e as IWarehouseApiError;
				if (apiError.fields?.product_id) {
					toast.error('El producto no existe en esta bodega');
				} else {
					toast.error(apiError.message || 'Error al quitar el producto');
				}
			}
		},
		[warehouse, branchId, dispatch, loadWarehouseDetail],
	);

	const closeAttachModal = useCallback(() => setAttachProduct(null), []);

	const state = useMemo(
		() => ({
			warehouseId,
			warehouse,
			warehouseDetailLoading,
			warehouseDetailError,
			allProducts,
			productsLoading,
			showAvailable,
			productToRemove,
			attachProduct,
			isAttaching,
			branchId,
		}),
		[
			warehouseId,
			warehouse,
			warehouseDetailLoading,
			warehouseDetailError,
			allProducts,
			productsLoading,
			showAvailable,
			productToRemove,
			attachProduct,
			isAttaching,
			branchId,
		],
	);

	const derived = useMemo(
		() => ({
			associatedProductIds,
			availableProducts,
			isProductAssociated,
			summary,
		}),
		[associatedProductIds, availableProducts, isProductAssociated, summary],
	);

	const actions = useMemo(
		() => ({
			refresh,
			setShowAvailable,
			setProductToRemove,
			closeAttachModal,
			onSelectProductToAttach,
			onConfirmAttach,
			onConfirmRemove,
		}),
		[
			refresh,
			setShowAvailable,
			setProductToRemove,
			closeAttachModal,
			onSelectProductToAttach,
			onConfirmAttach,
			onConfirmRemove,
		],
	);

	return { state, derived, actions };
};
