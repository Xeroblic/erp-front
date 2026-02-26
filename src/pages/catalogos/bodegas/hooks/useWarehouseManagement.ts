import { useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchWarehouses,
	fetchWarehouseDetail,
	createWarehouse,
	updateWarehouse,
	deleteWarehouse,
	attachWarehouseProducts,
	detachWarehouseProduct,
	clearWarehouseError,
	clearWarehouseDetail,
} from '@/store/slices/warehouses/warehouseSlice';
import type {
	ICreateWarehouseRequest,
	IUpdateWarehouseRequest,
	IAttachProductRequest,
	IDetachProductRequest,
	IFetchWarehousesParams,
} from '@/interface/warehouse.interface';

export interface IApiError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

const extractErrorMessage = (err: unknown, defaultMsg: string): string => {
	const error = err as IApiError;
	return error?.response?.data?.message || error?.message || defaultMsg;
};

export const useWarehouseManagement = (branchId?: number | null) => {
	const dispatch = useAppDispatch();
	const { warehouses, warehouseDetail, stats, loading, error } = useAppSelector((s) => s.warehouse);

	const loadWarehouses = useCallback(
		async (params?: IFetchWarehousesParams) => {
			if (!branchId) return;
			try {
				await dispatch(fetchWarehouses({ branchId, params })).unwrap();
			} catch (e: unknown) {
				toast.error(extractErrorMessage(e, 'Error al cargar bodegas'));
			}
		},
		[dispatch, branchId],
	);

	const loadWarehouseDetail = useCallback(
		async (warehouseId: number) => {
			if (!branchId) return;
			try {
				await dispatch(fetchWarehouseDetail({ branchId, warehouseId })).unwrap();
			} catch (e: unknown) {
				toast.error(extractErrorMessage(e, 'Error al cargar el detalle de la bodega'));
			}
		},
		[dispatch, branchId],
	);

	const handleCreateWarehouse = useCallback(
		async (data: ICreateWarehouseRequest) => {
			if (!branchId) return false;
			try {
				await dispatch(createWarehouse({ branchId, data })).unwrap();
				toast.success('Bodega creada exitosamente');
				return true;
			} catch (e: unknown) {
				toast.error(extractErrorMessage(e, 'Error al crear la bodega'));
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleUpdateWarehouse = useCallback(
		async (warehouseId: number, data: IUpdateWarehouseRequest) => {
			if (!branchId) return false;
			try {
				await dispatch(updateWarehouse({ branchId, warehouseId, data })).unwrap();
				toast.success('Bodega actualizada');
				return true;
			} catch (e: unknown) {
				toast.error(extractErrorMessage(e, 'Error al actualizar la bodega'));
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleDeleteWarehouse = useCallback(
		async (warehouseId: number) => {
			if (!branchId) return false;
			try {
				await dispatch(deleteWarehouse({ branchId, warehouseId })).unwrap();
				toast.success('Bodega eliminada');
				return true;
			} catch (e: unknown) {
				const msg = extractErrorMessage(e, 'Error al eliminar la bodega');
				if (msg.includes('productos asociados')) {
					toast.error('No se puede eliminar, tiene productos asociados');
				} else {
					toast.error(msg);
				}
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleAttachProducts = useCallback(
		async (warehouseId: number, data: IAttachProductRequest) => {
			if (!branchId) return false;
			try {
				await dispatch(attachWarehouseProducts({ branchId, warehouseId, data })).unwrap();
				toast.success('Producto asociado correctamente');
				return true;
			} catch (e: unknown) {
				const msg = extractErrorMessage(e, 'Error al asociar el producto');
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
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleDetachProduct = useCallback(
		async (warehouseId: number, data: IDetachProductRequest) => {
			if (!branchId) return false;
			try {
				await dispatch(detachWarehouseProduct({ branchId, warehouseId, data })).unwrap();
				await dispatch(fetchWarehouseDetail({ branchId, warehouseId })).unwrap();
				toast.success('Producto quitado correctamente');
				return true;
			} catch (e: unknown) {
				const msg = extractErrorMessage(e, 'Error al quitar el producto');
				if (msg.toLowerCase().includes('no está asociado')) {
					toast.error('El producto no existe en esta bodega');
				} else {
					toast.error(msg);
				}
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleClearError = useCallback(() => {
		dispatch(clearWarehouseError());
	}, [dispatch]);

	const handleClearDetail = useCallback(() => {
		dispatch(clearWarehouseDetail());
	}, [dispatch]);

	useEffect(() => {
		return () => {
			dispatch(clearWarehouseError());
		};
	}, [dispatch]);

	return {
		warehouses,
		warehouseDetail,
		stats,
		loading,
		error,
		loadWarehouses,
		loadWarehouseDetail,
		handleCreateWarehouse,
		handleUpdateWarehouse,
		handleDeleteWarehouse,
		handleAttachProducts,
		handleDetachProduct,
		handleClearError,
		handleClearDetail,
	};
};
