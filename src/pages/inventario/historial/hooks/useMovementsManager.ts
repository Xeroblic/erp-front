/**
 * Hook para gestión de movimientos de inventario
 * Maneja el estado y operaciones del historial de inventario
 */
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    IInventoryMovement,
    MovementType,
    MovementStats,
    mockMovements,
    getMovementById,
    getMovementsByType,
    getMovementsByWarehouse,
    getMovementStats,
    getWarehouses
} from '../mocks/movements.mock';

export interface MovementFilters {
    type?: MovementType;
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
    stats: MovementStats;

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
    // Estados principales
    const [movements, setMovements] = useState<IInventoryMovement[]>(mockMovements);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros y paginación
    const [filters, setFilters] = useState<MovementFilters>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Estadísticas
    const stats = useMemo(() => getMovementStats(), [movements]);

    // Warehouses para filtros
    const warehouses = useMemo(() => getWarehouses(), []);

    // Aplicar filtros
    const filteredMovements = useMemo(() => {
        let filtered = [...movements];

        // Filtro por tipo
        if (filters.type) {
            filtered = filtered.filter(movement => movement.type === filters.type);
        }

        // Filtro por almacén
        if (filters.warehouseId) {
            filtered = filtered.filter(movement => movement.warehouse?.id === filters.warehouseId);
        }

        // Filtro de búsqueda global
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(movement =>
                movement.product?.name.toLowerCase().includes(searchLower) ||
                movement.product?.sku.toLowerCase().includes(searchLower) ||
                movement.warehouse?.name.toLowerCase().includes(searchLower) ||
                movement.performer?.name.toLowerCase().includes(searchLower) ||
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

        // Filtros de cantidad
        if (filters.minQuantity !== undefined) {
            filtered = filtered.filter(movement =>
                Math.abs(movement.quantity) >= filters.minQuantity!
            );
        }

        if (filters.maxQuantity !== undefined) {
            filtered = filtered.filter(movement =>
                Math.abs(movement.quantity) <= filters.maxQuantity!
            );
        }

        // Ordenar por fecha (más recientes primero)
        return filtered.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [movements, filters]);

    // Paginación
    const totalItems = filteredMovements.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Operaciones
    const refreshMovements = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMovements([...mockMovements]);
            toast.success('Movimientos actualizados correctamente');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            toast.error(`Error al actualizar movimientos: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []);

    const getMovementDetails = useCallback((id: number) => {
        return getMovementById(id);
    }, []);

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
        loading,
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
