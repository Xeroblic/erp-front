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
 * Hook personalizado para la gestión de bodegas
 * Centraliza toda la lógica de negocio y comunicación con Redux
 */
export const useWarehouseManagement = (branchId: number) => {
    const dispatch = useAppDispatch();
    const {
        warehouses,
        warehouseDetail,
        meta,
        stats,
        loading,
        warehouseDetailLoading,
        creating,
        updating,
        deleting,
        attachingProducts,
        detachingProduct,
        error,
        warehouseDetailError,
    } = useAppSelector((state) => state.warehouse);

    /**
     * Cargar listado de bodegas
     */
    const loadWarehouses = useCallback(
        async (params?: IFetchWarehousesParams) => {
            try {
                await dispatch(fetchWarehouses({ branchId, params })).unwrap();
            } catch (error: any) {
                toast.error(error || 'Error al cargar las bodegas');
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
            } catch (error: any) {
                toast.error(error || 'Error al cargar el detalle de la bodega');
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
            } catch (error: any) {
                const message = error?.message || 'Error al crear la bodega';
                toast.error(message);
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
                toast.success('Bodega actualizada exitosamente');
                return true;
            } catch (error: any) {
                const message = error?.message || 'Error al actualizar la bodega';
                toast.error(message);
                return false;
            }
        },
        [dispatch, branchId],
    );

    /**
     * Eliminar bodega
     */
    const handleDeleteWarehouse = useCallback(
        async (warehouseId: number) => {
            try {
                await dispatch(deleteWarehouse({ branchId, warehouseId })).unwrap();
                toast.success('Bodega eliminada exitosamente');
                return true;
            } catch (error: any) {
                const message = error?.message || 'Error al eliminar la bodega';
                toast.error(message);
                return false;
            }
        },
        [dispatch, branchId],
    );

    /**
     * Agregar productos a la bodega
     */
    const handleAttachProducts = useCallback(
        async (warehouseId: number, data: IAttachProductRequest) => {
            try {
                await dispatch(attachWarehouseProducts({ branchId, warehouseId, data })).unwrap();
                toast.success('Productos agregados exitosamente');
                return true;
            } catch (error: any) {
                const message = error?.message || 'Error al agregar productos';
                toast.error(message);
                return false;
            }
        },
        [dispatch, branchId],
    );

    /**
     * Quitar producto de la bodega
     */
    const handleDetachProduct = useCallback(
        async (warehouseId: number, data: IDetachProductRequest) => {
            try {
                await dispatch(detachWarehouseProduct({ branchId, warehouseId, data })).unwrap();
                toast.success('Producto quitado exitosamente');
                return true;
            } catch (error: any) {
                const message = error?.message || 'Error al quitar el producto';
                toast.error(message);
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
        // State
        warehouses,
        warehouseDetail,
        meta,
        stats,
        loading,
        warehouseDetailLoading,
        creating,
        updating,
        deleting,
        attachingProducts,
        detachingProduct,
        error,
        warehouseDetailError,

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
