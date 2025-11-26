/**
 * Hook para gestión de movimientos de inventario
 * Maneja el estado y operaciones del historial de inventario
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IInventoryMovement } from '@/interface/inventory.interface';
import {
    fetchInventoryMovements,
    fetchInventoryStatistics,
    selectInventoryLoading,
    selectInventoryMovements,
    selectInventoryPagination,
    selectInventoryStatistics,
} from '@/store/slices/inventory/inventorySlice';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { normalizeMovementType, NormalizedMovementType } from '../utils/movementType.utils';

export interface MovementFilters {
    type?: NormalizedMovementType;
    search?: string;
    warehouseId?: number;
    dateFrom?: string;
    dateTo?: string;
    minQuantity?: number;
    maxQuantity?: number;
}

export interface UseMovementsManagerReturn {
    // Estado
    movements: IInventoryMovement[];
    filteredMovements: IInventoryMovement[];
    loading: boolean;
    error: string | null;
    stats: {
        totalMovements: number;
        totalEntries: number;
        totalExits: number;
        totalTransfers: number;
    };

    // Filtros y paginación
    filters: MovementFilters;
    setFilters: (filters: MovementFilters) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;

    // Operaciones
    refreshMovements: () => Promise<void>;
    getMovementDetails: (id: number) => IInventoryMovement | undefined;
    clearFilters: () => void;

    // Utilidades
    warehouses: Array<{ id: number; name: string }>;
}

const useMovementsManager = (): UseMovementsManagerReturn => {
    const dispatch = useAppDispatch();
    const movements = useAppSelector(selectInventoryMovements);
    const loadingState = useAppSelector(selectInventoryLoading);
    const pagination = useAppSelector(selectInventoryPagination);
    const statistics = useAppSelector(selectInventoryStatistics);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros y paginación
    const [filters, setFilters] = useState<MovementFilters>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Cargar estadísticas generales al montar
    useEffect(() => {
        dispatch(fetchInventoryStatistics()).catch(() => null);
    }, [dispatch]);

    const requestMovements = useCallback(
        async (page: number, filtersParam: MovementFilters) => {
            setLoading(true);
            setError(null);

            try {
                await dispatch(
                    fetchInventoryMovements({
                        page,
                        perPage: itemsPerPage,
                        filters: {
                            movement_type: filtersParam.type,
                            warehouse_id: filtersParam.warehouseId
                                ? filtersParam.warehouseId.toString()
                                : undefined,
                            date_from: filtersParam.dateFrom,
                            date_to: filtersParam.dateTo,
                        },
                    }),
                ).unwrap();
                return true;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Error al cargar movimientos';
                setError(errorMessage);
                toast.error(errorMessage);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [dispatch, itemsPerPage],
    );

    useEffect(() => {
        requestMovements(currentPage, filters);
    }, [currentPage, filters, requestMovements]);

    // Aplicar filtros
    const filteredMovements = useMemo(() => {
        let filtered = [...movements];

        // Filtro por tipo
        if (filters.type) {
            filtered = filtered.filter(
                (movement) => normalizeMovementType(movement.movement_type) === filters.type,
            );
        }

        // Filtro por almacén
        if (filters.warehouseId) {
            filtered = filtered.filter(
                (movement) =>
                    movement.warehouse_id === filters.warehouseId ||
                    movement.warehouse?.id === filters.warehouseId ||
                    movement.warehouse_location?.warehouse_id === filters.warehouseId,
            );
        }

        // Filtro de búsqueda global
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(movement =>
                movement.product?.name?.toLowerCase().includes(searchLower) ||
                movement.inventory_item?.product?.name?.toLowerCase().includes(searchLower) ||
                movement.product?.sku?.toLowerCase().includes(searchLower) ||
                movement.inventory_item?.product?.sku?.toLowerCase().includes(searchLower) ||
                movement.movement_number?.toLowerCase().includes(searchLower) ||
                movement.warehouse?.name?.toLowerCase().includes(searchLower) ||
                movement.warehouse_location?.name?.toLowerCase().includes(searchLower) ||
                movement.performer?.name?.toLowerCase().includes(searchLower) ||
                movement.notes?.toLowerCase().includes(searchLower)
            );
        }

        // Filtros de fecha
        if (filters.dateFrom) {
            filtered = filtered.filter(movement =>
                new Date(movement.created_at) >= new Date(filters.dateFrom!)
            );
        }

        if (filters.dateTo) {
            filtered = filtered.filter(movement =>
                new Date(movement.created_at) <= new Date(filters.dateTo! + 'T23:59:59')
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }, [movements, filters]);

    // Paginación (combina paginación API y filtros locales)
    const totalItems =
        filters.search || filters.type || filters.warehouseId || filters.dateFrom || filters.dateTo
            ? filteredMovements.length
            : pagination.movements.total || filteredMovements.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // Warehouses para filtros
    const warehouses = useMemo(() => {
        const map = new Map<number, string>();
        movements.forEach((movement) => {
            const warehouseId =
                movement.warehouse_id ||
                movement.warehouse?.id ||
                movement.warehouse_location?.warehouse_id;
            if (warehouseId) {
                const warehouseName =
                    movement.warehouse?.name ||
                    movement.warehouse_location?.name ||
                    `Almacén #${warehouseId}`;
                map.set(warehouseId, warehouseName);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [movements]);

    // Estadísticas básicas a partir de los datos disponibles
    const stats = useMemo(() => {
        const dataset = filteredMovements.length ? filteredMovements : movements;
        const totalMovements = statistics.totalMovements || totalItems;

        const countByType = (normalizedType: NormalizedMovementType) =>
            dataset.filter((movement) => normalizeMovementType(movement.movement_type) === normalizedType).length;

        return {
            totalMovements,
            totalEntries: countByType('IN') + countByType('RETURN'),
            totalExits: countByType('OUT'),
            totalTransfers: countByType('TRANSFER'),
        };
    }, [filteredMovements, movements, statistics.totalMovements, totalItems]);

    // Operaciones
    const refreshMovements = useCallback(async () => {
        const success = await requestMovements(currentPage, filters);
        if (success) {
            toast.success('Movimientos actualizados correctamente');
        }
    }, [requestMovements, currentPage, filters]);

    const getMovementDetails = useCallback(
        (id: number) => {
            return movements.find((movement) => movement.id === id);
        },
        [movements],
    );

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(1);
    }, []);

    // Actualizar filtros con reset de página
    const handleSetFilters = useCallback((newFilters: MovementFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    }, []);

    return {
        // Estado
        movements,
        filteredMovements,
        loading: loading || loadingState.movements,
        error,
        stats,

        // Filtros y paginación
        filters,
        setFilters: handleSetFilters,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        totalItems,
        totalPages,

        // Operaciones
        refreshMovements,
        getMovementDetails,
        clearFilters,

        // Utilidades
        warehouses
    };
};

export default useMovementsManager;
