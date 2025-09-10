/**
 * Hook personalizado para gestión de ventas
 * Maneja estado, filtros, CRUD y operaciones específicas de ventas
 */
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ISale, SalesFilters, SalesStats, SaleStatus, ISalePayment } from '../types/sales.types';

// Mock data temporal - reemplazar con llamadas reales al API
const mockSales: ISale[] = [
    {
        id: 1,
        sale_number: 'VE-2024-001',
        customer_id: 1,
        customer: {
            id: 1,
            first_name: 'Juan',
            last_name: 'Pérez',
            company_name: 'Empresa ABC',
            email: 'juan@empresa.com',
            phone: '+56912345678',
            tax_id: '12345678-9',
        },
        salesperson_id: 1,
        salesperson: {
            id: 1,
            first_name: 'María',
            last_name: 'González',
        },
        sale_date: '2024-12-01',
        status: 'COMPLETED',
        subtotal: 100000,
        discount_total: 5000,
        tax_total: 19000,
        total_amount: 114000,
        items: [],
        payments: [],
        documents: [],
        stock_movements: [],
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-01T10:00:00Z',
    },
    {
        id: 2,
        sale_number: 'VE-2024-002',
        customer_id: 2,
        customer: {
            id: 2,
            first_name: 'Ana',
            last_name: 'Silva',
            email: 'ana@email.com',
            phone: '+56987654321',
        },
        salesperson_id: 1,
        salesperson: {
            id: 1,
            first_name: 'María',
            last_name: 'González',
        },
        sale_date: '2024-12-02',
        status: 'PENDING',
        subtotal: 50000,
        discount_total: 0,
        tax_total: 9500,
        total_amount: 59500,
        items: [],
        payments: [],
        documents: [],
        stock_movements: [],
        created_at: '2024-12-02T14:00:00Z',
        updated_at: '2024-12-02T14:00:00Z',
    },
];

export interface UseSalesManagerReturn {
    // Estado
    sales: ISale[];
    filteredSales: ISale[];
    loading: boolean;
    error: string | null;

    // Paginación
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
    setItemsPerPage: (items: number) => void;
    totalItems: number;

    // Filtros
    filters: SalesFilters;
    setFilters: (filters: SalesFilters) => void;
    resetFilters: () => void;

    // Estadísticas
    stats: SalesStats;

    // CRUD Operations
    createSale: (saleData: Omit<ISale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateSale: (id: number, saleData: Partial<ISale>) => Promise<void>;
    getSaleById: (id: number) => Promise<ISale | null>;

    // Operaciones específicas
    createSaleFromQuotation: (quotationId: number) => Promise<void>;
    recordPayment: (saleId: number, payment: Omit<ISalePayment, 'id' | 'sale_id'>) => Promise<void>;
    generateDocument: (saleId: number, documentType: 'BOLETA' | 'FACTURA') => Promise<void>;
    sendDocument: (saleId: number, documentId: number, email: string) => Promise<void>;
    cancelSale: (saleId: number, reason: string) => Promise<void>;

    // Utilidades
    refreshData: () => Promise<void>;
    exportSales: () => Promise<void>;
}

const useSalesManager = (): UseSalesManagerReturn => {
    // Estados
    const [sales, setSales] = useState<ISale[]>(mockSales);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filters, setFilters] = useState<SalesFilters>({});

    // Datos filtrados
    const filteredSales = useMemo(() => {
        let filtered = [...sales];

        // Filtro por búsqueda
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(
                (sale) =>
                    sale.sale_number.toLowerCase().includes(searchTerm) ||
                    sale.customer?.first_name?.toLowerCase().includes(searchTerm) ||
                    sale.customer?.last_name?.toLowerCase().includes(searchTerm) ||
                    sale.customer?.company_name?.toLowerCase().includes(searchTerm) ||
                    sale.notes?.toLowerCase().includes(searchTerm),
            );
        }

        // Filtro por estado
        if (filters.status) {
            filtered = filtered.filter((sale) => sale.status === filters.status);
        }

        // Filtro por cliente
        if (filters.customer_id) {
            filtered = filtered.filter((sale) => sale.customer_id === filters.customer_id);
        }

        // Filtro por vendedor
        if (filters.salesperson_id) {
            filtered = filtered.filter((sale) => sale.salesperson_id === filters.salesperson_id);
        }

        // Filtro por fechas
        if (filters.date_from) {
            filtered = filtered.filter((sale) => sale.sale_date >= filters.date_from!);
        }
        if (filters.date_to) {
            filtered = filtered.filter((sale) => sale.sale_date <= filters.date_to!);
        }

        // Filtro por montos
        if (filters.min_amount) {
            filtered = filtered.filter((sale) => sale.total_amount >= filters.min_amount!);
        }
        if (filters.max_amount) {
            filtered = filtered.filter((sale) => sale.total_amount <= filters.max_amount!);
        }

        return filtered;
    }, [sales, filters]);

    // Estadísticas
    const stats = useMemo((): SalesStats => {
        const total = filteredSales.length;
        const byStatus = filteredSales.reduce(
            (acc, sale) => {
                acc[sale.status] = (acc[sale.status] || 0) + 1;
                return acc;
            },
            {} as Record<SaleStatus, number>,
        );

        const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const averageAmount = total > 0 ? totalAmount / total : 0;
        const pendingPayments = filteredSales.filter((sale) => sale.status === 'PENDING').length;

        return {
            total,
            byStatus: {
                PENDING: byStatus.PENDING || 0,
                COMPLETED: byStatus.COMPLETED || 0,
                CANCELLED: byStatus.CANCELLED || 0,
            },
            totalAmount,
            averageAmount,
            pendingPayments,
        };
    }, [filteredSales]);

    // Operaciones CRUD
    const createSale = useCallback(async (saleData: Omit<ISale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>) => {
        setLoading(true);
        try {
            // TODO: Implementar llamada real al API
            const newSale: ISale = {
                ...saleData,
                id: Math.max(...sales.map(s => s.id)) + 1,
                sale_number: `VE-2024-${(sales.length + 1).toString().padStart(3, '0')}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setSales(prev => [...prev, newSale]);
            toast.success('Venta creada exitosamente');
        } catch (error) {
            console.error('Error creating sale:', error);
            toast.error('Error al crear la venta');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [sales]);

    const updateSale = useCallback(async (id: number, saleData: Partial<ISale>) => {
        setLoading(true);
        try {
            // TODO: Implementar llamada real al API
            setSales(prev => prev.map(sale =>
                sale.id === id
                    ? { ...sale, ...saleData, updated_at: new Date().toISOString() }
                    : sale
            ));
            toast.success('Venta actualizada exitosamente');
        } catch (error) {
            console.error('Error updating sale:', error);
            toast.error('Error al actualizar la venta');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSaleById = useCallback(async (id: number): Promise<ISale | null> => {
        // TODO: Implementar llamada real al API
        return sales.find(sale => sale.id === id) || null;
    }, [sales]);

    // Operaciones específicas
    const createSaleFromQuotation = useCallback(async (quotationId: number) => {
        setLoading(true);
        try {
            // TODO: Implementar lógica para crear venta desde cotización
            toast.success('Venta creada desde cotización exitosamente');
        } catch (error) {
            console.error('Error creating sale from quotation:', error);
            toast.error('Error al crear la venta desde cotización');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const recordPayment = useCallback(async (saleId: number, payment: Omit<ISalePayment, 'id' | 'sale_id'>) => {
        setLoading(true);
        try {
            // TODO: Implementar registro de pago
            toast.success('Pago registrado exitosamente');
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error('Error al registrar el pago');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateDocument = useCallback(async (saleId: number, documentType: 'BOLETA' | 'FACTURA') => {
        setLoading(true);
        try {
            // TODO: Implementar generación de documento
            toast.success(`${documentType.toLowerCase()} generada exitosamente`);
        } catch (error) {
            console.error('Error generating document:', error);
            toast.error('Error al generar el documento');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const sendDocument = useCallback(async (saleId: number, documentId: number, email: string) => {
        setLoading(true);
        try {
            // TODO: Implementar envío de documento
            toast.success(`Documento enviado a ${email} exitosamente`);
        } catch (error) {
            console.error('Error sending document:', error);
            toast.error('Error al enviar el documento');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelSale = useCallback(async (saleId: number, reason: string) => {
        setLoading(true);
        try {
            setSales(prev => prev.map(sale =>
                sale.id === saleId
                    ? { ...sale, status: 'CANCELLED' as SaleStatus, updated_at: new Date().toISOString() }
                    : sale
            ));
            toast.success('Venta cancelada exitosamente');
        } catch (error) {
            console.error('Error cancelling sale:', error);
            toast.error('Error al cancelar la venta');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Utilidades
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            // TODO: Recargar datos desde API
            toast.success('Datos actualizados');
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Error al actualizar los datos');
        } finally {
            setLoading(false);
        }
    }, []);

    const exportSales = useCallback(async () => {
        try {
            // TODO: Implementar exportación
            toast.success('Exportación iniciada');
        } catch (error) {
            console.error('Error exporting sales:', error);
            toast.error('Error al exportar las ventas');
        }
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(1);
    }, []);

    return {
        // Estado
        sales,
        filteredSales,
        loading,
        error,

        // Paginación
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalItems: filteredSales.length,

        // Filtros
        filters,
        setFilters,
        resetFilters,

        // Estadísticas
        stats,

        // CRUD Operations
        createSale,
        updateSale,
        getSaleById,

        // Operaciones específicas
        createSaleFromQuotation,
        recordPayment,
        generateDocument,
        sendDocument,
        cancelSale,

        // Utilidades
        refreshData,
        exportSales,
    };
};

export default useSalesManager;
