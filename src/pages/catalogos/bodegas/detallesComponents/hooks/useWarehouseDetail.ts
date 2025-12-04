import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchWarehouseDetail,
	attachWarehouseProducts,
	detachWarehouseProduct,
	clearWarehouseDetail,
} from '@/store/slices/warehouses/warehouseSlice';
import type { IAttachProductRequest, IDetachProductRequest } from '@/interface/warehouse.interface';

/**
 * Hook especializado para la página de detalle de bodega
 * Maneja solo las operaciones relacionadas con el detalle y productos asociados
 */
export const useWarehouseDetail = (branchId: number) => {
	const dispatch = useAppDispatch();
	const {
		warehouseDetail,
		warehouseDetailLoading,
		warehouseDetailError,
		attachingProducts,
		detachingProduct,
	} = useAppSelector((state) => state.warehouse);

	/**
	 * Cargar detalle de una bodega específica
	 */
	const loadWarehouseDetail = useCallback(
		async (warehouseId: number) => {
			try {
				await dispatch(fetchWarehouseDetail({ branchId, warehouseId })).unwrap();
			} catch (e: any) {
				toast.error(e?.message || 'Error al cargar el detalle de la bodega');
			}
		},
		[dispatch, branchId],
	);

	/**
	 * Asociar producto a la bodega
	 * Maneja diferentes escenarios de error con mensajes específicos
	 */
	const handleAttachProducts = useCallback(
		async (warehouseId: number, data: IAttachProductRequest) => {
			try {
				await dispatch(attachWarehouseProducts({ branchId, warehouseId, data })).unwrap();
				toast.success('Producto asociado correctamente');
				return true;
			} catch (e: any) {
				const msg = e?.response?.data?.message || e?.message;

				// Mensajes específicos según el error del backend
				if (msg?.includes('ya está asociado')) {
					toast.warning('El producto ya se encuentra en la bodega');
				} else if (msg?.includes('sucursal')) {
					toast.error('El producto pertenece a otra sucursal');
				} else if (msg?.includes('capacidad')) {
					toast.error('No hay capacidad suficiente en la bodega');
				} else if (msg?.includes('stock disponible')) {
					toast.error('No hay stock disponible para sincronizar');
				} else {
					toast.error('Error al asociar el producto');
				}

				return false;
			}
		},
		[dispatch, branchId],
	);

	/**
	 * Quitar producto de la bodega
	 * Maneja errores específicos
	 */
	const handleDetachProduct = useCallback(
		async (warehouseId: number, data: IDetachProductRequest) => {
			try {
				await dispatch(detachWarehouseProduct({ branchId, warehouseId, data })).unwrap();
				toast.success('Producto quitado correctamente');
				return true;
			} catch (e: any) {
				const msg = e?.response?.data?.message || e?.message;

				// Mensajes específicos según el error del backend
				if (msg?.includes('no está asociado')) {
					toast.error('El producto no existe en esta bodega');
				} else {
					toast.error('Error al quitar el producto');
				}

				return false;
			}
		},
		[dispatch, branchId],
	);

	/**
	 * Limpiar detalle de bodega del store
	 * Útil al desmontar el componente
	 */
	const handleClearDetail = useCallback(() => {
		dispatch(clearWarehouseDetail());
	}, [dispatch]);

	/**
	 * Refrescar detalle después de una operación
	 * Útil para sincronizar cambios
	 */
	const refreshDetail = useCallback(
		async (warehouseId: number) => {
			await loadWarehouseDetail(warehouseId);
		},
		[loadWarehouseDetail],
	);

	return {
		// State
		warehouse: warehouseDetail,
		loading: warehouseDetailLoading,
		error: warehouseDetailError,
		attachingProducts,
		detachingProduct,

		// Actions
		loadWarehouseDetail,
		handleAttachProducts,
		handleDetachProduct,
		handleClearDetail,
		refreshDetail,
	};
};
