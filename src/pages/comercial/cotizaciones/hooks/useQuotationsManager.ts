/**
 * Hook para gestión de cotizaciones
 * Maneja el estado y operaciones CRUD del módulo de cotizaciones
 */
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { IQuote, QuoteStatus } from '../../../../interface';
import {
    mockQuotations,
    getQuotationById,
    getQuotationsByStatus,
    getQuotationStats
} from '../mocks/quotations.mock';

export interface QuotationsFilters {
    status?: QuoteStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    customerId?: number;
    minAmount?: number;
    maxAmount?: number;
}

export interface UseQuotationsManagerReturn {
    // Estado
    quotations: IQuote[];
    filteredQuotations: IQuote[];
    loading: boolean;
    error: string | null;
    totalItems: number;

    // Filtros y paginación
    filters: QuotationsFilters;
    setFilters: (filters: QuotationsFilters) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
    setItemsPerPage: (items: number) => void;

    // Estadísticas
    stats: ReturnType<typeof getQuotationStats>;

    // Operaciones CRUD
    createQuotation: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateQuotation: (id: number, quotation: Partial<IQuote>) => Promise<void>;
    deleteQuotation: (id: number) => Promise<void>;
    duplicateQuotation: (id: number) => Promise<void>;
    changeStatus: (id: number, status: QuoteStatus) => Promise<void>;
    convertToSale: (id: number) => Promise<void>;

    // Utilidades
    refreshData: () => void;
    exportQuotations: () => void;
    getQuotationById: (id: number) => IQuote | undefined;
    resetFilters: () => void;
}

const initialFilters: QuotationsFilters = {
    status: undefined,
    search: '',
    dateFrom: '',
    dateTo: '',
    customerId: undefined,
    minAmount: undefined,
    maxAmount: undefined,
};

export const useQuotationsManager = (): UseQuotationsManagerReturn => {
    // Estado local
    const [quotations, setQuotations] = useState<IQuote[]>(mockQuotations);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<QuotationsFilters>(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filtros aplicados
    const filteredQuotations = useMemo(() => {
        let filtered = [...quotations];

        // Filtro por estado
        if (filters.status) {
            filtered = filtered.filter(q => q.status === filters.status);
        }

        // Filtro por búsqueda (número de cotización, notas)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(q =>
                q.quote_number.toLowerCase().includes(searchTerm) ||
                (q.notes && q.notes.toLowerCase().includes(searchTerm))
            );
        }

        // Filtro por rango de fechas
        if (filters.dateFrom) {
            filtered = filtered.filter(q => q.quote_date >= filters.dateFrom!);
        }
        if (filters.dateTo) {
            filtered = filtered.filter(q => q.quote_date <= filters.dateTo!);
        }

        // Filtro por cliente
        if (filters.customerId) {
            filtered = filtered.filter(q => q.customer_id === filters.customerId);
        }

        // Filtro por monto
        if (filters.minAmount) {
            filtered = filtered.filter(q => q.total_amount >= filters.minAmount!);
        }
        if (filters.maxAmount) {
            filtered = filtered.filter(q => q.total_amount <= filters.maxAmount!);
        }

        // Ordenar por fecha más reciente
        return filtered.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [quotations, filters]);

    // Estadísticas
    const stats = useMemo(() => getQuotationStats(), [quotations]);

    // Operaciones CRUD
    const createQuotation = useCallback(async (
        quotationData: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>
    ) => {
        setLoading(true);
        try {
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newQuotation: IQuote = {
                ...quotationData,
                id: Math.max(...quotations.map(q => q.id)) + 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setQuotations(prev => [newQuotation, ...prev]);
            toast.success('Cotización creada exitosamente');
            setError(null);
        } catch (err) {
            const errorMessage = 'Error al crear la cotización';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [quotations]);

    const updateQuotation = useCallback(async (id: number, updates: Partial<IQuote>) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            setQuotations(prev => prev.map(q =>
                q.id === id
                    ? { ...q, ...updates, updated_at: new Date().toISOString() }
                    : q
            ));

            toast.success('Cotización actualizada exitosamente');
            setError(null);
        } catch (err) {
            const errorMessage = 'Error al actualizar la cotización';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteQuotation = useCallback(async (id: number) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));

            setQuotations(prev => prev.filter(q => q.id !== id));
            toast.success('Cotización eliminada exitosamente');
            setError(null);
        } catch (err) {
            const errorMessage = 'Error al eliminar la cotización';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const duplicateQuotation = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const originalQuotation = quotations.find(q => q.id === id);
            if (!originalQuotation) {
                throw new Error('Cotización no encontrada');
            }

            await new Promise(resolve => setTimeout(resolve, 800));

            const duplicatedQuotation: IQuote = {
                ...originalQuotation,
                id: Math.max(...quotations.map(q => q.id)) + 1,
                quote_number: `${originalQuotation.quote_number}-COPY`,
                status: 'DRAFT',
                quote_date: new Date().toISOString().split('T')[0],
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                approved_by: undefined,
                converted_sale: undefined,
                can_convert: true,
                is_expired: false,
            };

            setQuotations(prev => [duplicatedQuotation, ...prev]);
            toast.success('Cotización duplicada exitosamente');
            setError(null);
        } catch (err) {
            const errorMessage = 'Error al duplicar la cotización';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [quotations]);

    const changeStatus = useCallback(async (id: number, status: QuoteStatus) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));

            setQuotations(prev => prev.map(q =>
                q.id === id
                    ? {
                        ...q,
                        status,
                        updated_at: new Date().toISOString(),
                        approved_by: status === 'APPROVED' ? 1 : q.approved_by,
                        can_convert: status === 'APPROVED',
                    }
                    : q
            ));

            toast.success(`Estado cambiado a ${status} exitosamente`);
            setError(null);
        } catch (err) {
            const errorMessage = 'Error al cambiar el estado';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const convertToSale = useCallback(async (id: number) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            setQuotations(prev => prev.map(q =>
                q.id === id
                    ? {
                        ...q,
                        status: 'CONVERTED',
                        updated_at: new Date().toISOString(),
                        can_convert: false,
                        converted_sale: { id: Date.now() } as any, // Mock sale
                    }
                    : q
            ));

            toast.success('Cotización convertida a venta exitosamente');
            setError(null);
        } catch (err) {
            const errorMessage = 'Error al convertir la cotización';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Utilidades
    const refreshData = useCallback(() => {
        setQuotations(mockQuotations);
        setError(null);
        toast.info('Datos actualizados');
    }, []);

    const exportQuotations = useCallback(() => {
        // Simular exportación
        const csvContent = filteredQuotations.map(q =>
            `${q.quote_number},${q.customer_id},${q.quote_date},${q.status},${q.total_amount}`
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizaciones_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        toast.success('Cotizaciones exportadas exitosamente');
    }, [filteredQuotations]);

    const getQuotationByIdLocal = useCallback((id: number) => {
        return quotations.find(q => q.id === id);
    }, [quotations]);

    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
        setCurrentPage(1);
    }, []);

    return {
        // Estado
        quotations,
        filteredQuotations,
        loading,
        error,
        totalItems: filteredQuotations.length,

        // Filtros y paginación
        filters,
        setFilters,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,

        // Estadísticas
        stats,

        // Operaciones CRUD
        createQuotation,
        updateQuotation,
        deleteQuotation,
        duplicateQuotation,
        changeStatus,
        convertToSale,

        // Utilidades
        refreshData,
        exportQuotations,
        getQuotationById: getQuotationByIdLocal,
        resetFilters,
    };
};

export default useQuotationsManager;
