import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import {
	fetchWarehouseDetail,
	attachWarehouseProducts,
	detachWarehouseProduct,
	clearWarehouseDetail,
} from '@/store/slices/warehouses/warehouseSlice';
import type {
	IAttachProductRequest,
	IWarehouseProduct,
} from '@/interface/warehouse.interface';
import type { IProduct } from '@/interface/product.interface';
import type { IWarehouseDetail } from '@/interface/warehouse.interface';

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
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const warehouse = useAppSelector((s) => s.warehouse.warehouseDetail);
	const { items: allProducts, loading: productsLoading } = useAppSelector((s) => s.products);

	// UI state
	const [isEditable, setIsEditable] = useState(false);
	const [productToRemove, setProductToRemove] = useState<IWarehouseProduct | null>(null);
	const [attachProduct, setAttachProduct] = useState<IProduct | null>(null);
	const [showCharts, setShowCharts] = useState(false);
	const [isAttaching, setIsAttaching] = useState(false);

	// Load detail
	useEffect(() => {
		if (branchId && id) {
			dispatch(fetchWarehouseDetail({ branchId, warehouseId: Number(id) })).catch(
				(e: unknown) => {
					toast.error(getErrorMessage(e, 'Error al cargar el detalle de la bodega'));
				},
			);
		}
	}, [branchId, id, dispatch]);

	// Load products for the branch
	useEffect(() => {
		if (!id || !branchId) return;
		dispatch(
			fetchProductsList({ entityParam: 'branches', entityId: branchId, params: { per_page: 50 } }),
		);
	}, [dispatch, branchId, id]);

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

	const isProductAssociated = useCallback(
		(productId: number): boolean => associatedProductIds.has(productId),
		[associatedProductIds],
	);

	// Actions
	const loadWarehouseDetail = useCallback(
		async (warehouseId: number) => {
			if (!branchId) return;
			try {
				await dispatch(fetchWarehouseDetail({ branchId, warehouseId })).unwrap();
			} catch (e: unknown) {
				toast.error(getErrorMessage(e, 'Error al cargar el detalle de la bodega'));
			}
		},
		[dispatch, branchId],
	);

	const onSelectProductToAttach = useCallback(
		(product: IProduct) => {
			if (isProductAssociated(product.id)) {
				console.warn(`[UX Safety] Producto ${product.id} ya está asociado a la bodega`);
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
				console.warn(`[Backend Safety] Evitando POST duplicado para producto ${productId}`);
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
				const result = await dispatch(
					attachWarehouseProducts({ branchId, warehouseId: warehouse.id, data: payload }),
				).unwrap();
				if (result) {
					await loadWarehouseDetail(warehouse.id);
					setAttachProduct(null);
				}
			} catch (e: unknown) {
				const msg = getErrorMessage(e, 'Error al asociar el producto');
				if (msg.toLowerCase().includes('ya está asociado')) {
					toast.warning('El producto ya se encuentra en la bodega');
				} else if (msg.toLowerCase().includes('sucursal')) {
					toast.error('El producto pertenece a otra sucursal');
				} else if (msg.toLowerCase().includes('capacidad')) {
					toast.error('No hay capacidad suficiente en la bodega');
				} else if (msg.toLowerCase().includes('stock disponible')) {
					toast.error('No hay stock disponible para sincronizar');
				} else {
					toast.error(msg);
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
				const msg = getErrorMessage(e, 'Error al quitar el producto');
				if (msg.toLowerCase().includes('no está asociado')) {
					toast.error('El producto no existe en esta bodega');
				} else {
					toast.error(msg);
				}
			}
		},
		[warehouse, branchId, dispatch, loadWarehouseDetail],
	);

	return {
		state: {
			warehouse,
			allProducts,
			productsLoading,
			isEditable,
			productToRemove,
			attachProduct,
			showCharts,
			isAttaching,
			branchId,
		},
		derived: {
			associatedProductIds,
			availableProducts,
			isProductAssociated,
		},
		actions: {
			setIsEditable,
			setShowCharts,
			setProductToRemove,
			closeAttachModal: () => setAttachProduct(null),
			onSelectProductToAttach,
			onConfirmAttach,
			onConfirmRemove,
		},
	};
};
