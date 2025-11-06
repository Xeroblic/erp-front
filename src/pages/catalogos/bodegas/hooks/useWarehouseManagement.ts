import { useCallback, useEffect } from 'react';
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
import { toast } from 'react-toastify';

/**
 * Hook personalizado para la gestión completa de bodegas
 * Centraliza toda la lógica de negocio y comunicación con Redux
 */
export const useWarehouseManagement = (branchId: number) => {
    const dispatch = useAppDispatch();
    const state = useAppSelector((s) => s.warehouse);

    /**
     * Cargar listado de bodegas
     */
    const loadWarehouses = useCallback(
        async (params?: IFetchWarehousesParams) => {
            try {
                await dispatch(fetchWarehouses({ branchId, params })).unwrap();
            } catch (e: any) {
                toast.error(e?.message || 'Error al cargar bodegas');
            }
        },
        [dispatch, branchId],
    );

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
     * Crear nueva bodega
     */
    const handleCreateWarehouse = useCallback(
        async (data: ICreateWarehouseRequest) => {
            try {
                await dispatch(createWarehouse({ branchId, data })).unwrap();
                toast.success('Bodega creada exitosamente');
                return true;
            } catch (e: any) {
                toast.error(e?.message || 'Error al crear la bodega');
                return false;
            }
        },
        [dispatch, branchId],
    );

    /**
     * Actualizar bodega existente
     */
    const handleUpdateWarehouse = useCallback(
        async (warehouseId: number, data: IUpdateWarehouseRequest) => {
            try {
                await dispatch(updateWarehouse({ branchId, warehouseId, data })).unwrap();
                toast.success('Bodega actualizada');
                return true;
            } catch (e: any) {
                toast.error(e?.message || 'Error al actualizar la bodega');
                return false;
            }
        },
        [dispatch, branchId],
    );

    /**
     * Eliminar bodega
     * Maneja validaciones específicas del backend
     */
    const handleDeleteWarehouse = useCallback(
        async (warehouseId: number) => {
            try {
                await dispatch(deleteWarehouse({ branchId, warehouseId })).unwrap();
                toast.success('Bodega eliminada');
                return true;
            } catch (e: any) {
                const msg = e?.response?.data?.message || e?.message;

                // Mensaje específico si tiene productos asociados
                if (msg?.includes('productos asociados')) {
                    toast.error('No se puede eliminar, tiene productos asociados');
                } else {
                    toast.error(msg || 'Error al eliminar la bodega');
                }

                return false;
            }
        },
        [dispatch, branchId],
    );

    /**
     * Asociar productos a la bodega
     * Maneja diferentes escenarios de error
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
     * Maneja validaciones específicas
     */
    const handleDetachProduct = useCallback(
        async (warehouseId: number, data: IDetachProductRequest) => {
            try {
                await dispatch(detachWarehouseProduct({ branchId, warehouseId, data })).unwrap();

                // Auto-reload: recargar el detalle de la bodega después de desasociar
                await dispatch(fetchWarehouseDetail({ branchId, warehouseId })).unwrap();

                toast.success('Producto quitado correctamente');
                return true;
            } catch (e: any) {
                const msg = e?.response?.data?.message || e?.message;

                // Mensaje específico si el producto no existe
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
     * Limpiar errores
     */
    const handleClearError = useCallback(() => {
        dispatch(clearWarehouseError());
    }, [dispatch]);

    /**
     * Limpiar detalle de bodega
     */
    const handleClearDetail = useCallback(() => {
        dispatch(clearWarehouseDetail());
    }, [dispatch]);

    // Limpiar errores cuando el componente se desmonte
    useEffect(() => {
        return () => {
            dispatch(clearWarehouseError());
        };
    }, [dispatch]);

    return {
        // Spread todo el state de Redux
        ...state,

        // Actions
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
