import { useState, useCallback, useMemo } from 'react';
import { ITransfer, TransferStatus } from '@/interface/transfers.interface';
import {
    ITransferFilters,
    ITransferStats,
    ICreateTransferRequest,
    IReceiveTransferRequest,
} from '../types/transfers.types';

interface UseTransfersManagerReturn {
    // Estado principal
    transfers: ITransfer[];
    isLoading: boolean;
    error: string | null;

    // Paginación
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;

    // Filtros
    filters: ITransferFilters;

    // Estadísticas
    stats: ITransferStats;

    // Estados de modales
    modals: {
        createModal: boolean;
        editModal: boolean;
        receiveModal: boolean;
        detailModal: boolean;
        cancelModal: boolean;
    };

    // Transferencia seleccionada
    selectedTransfer: ITransfer | null;

    // Operaciones CRUD
    createTransfer: (transferData: ICreateTransferRequest) => Promise<void>;
    updateTransfer: (id: number, transferData: ICreateTransferRequest) => Promise<void>;
    receiveTransfer: (receiveData: IReceiveTransferRequest) => Promise<void>;
    cancelTransfer: (id: number, reason?: string) => Promise<void>;
    deleteTransfer: (id: number) => Promise<void>;

    // Gestión de filtros
    updateFilter: <K extends keyof ITransferFilters>(key: K, value: ITransferFilters[K]) => void;
    clearFilters: () => void;
    applyFilters: () => void;

    // Gestión de paginación
    setPage: (page: number) => void;
    setItemsPerPage: (items: number) => void;

    // Gestión de modales
    openModal: (modalType: keyof UseTransfersManagerReturn['modals'], transfer?: ITransfer) => void;
    closeModal: (modalType: keyof UseTransfersManagerReturn['modals']) => void;
    closeAllModals: () => void;

    // Utilidades
    refreshData: () => Promise<void>;
    selectTransfer: (transfer: ITransfer | null) => void;
    getTransfersByStatus: (status: TransferStatus) => ITransfer[];
    calculateProgress: (transfer: ITransfer) => number;
    formatTransferNumber: (transfer: ITransfer) => string;
    canEditTransfer: (transfer: ITransfer) => boolean;
    canCancelTransfer: (transfer: ITransfer) => boolean;
    canReceiveTransfer: (transfer: ITransfer) => boolean;
}

const useTransfersManager = (initialItemsPerPage = 10): UseTransfersManagerReturn => {
    // Estados principales
    const [transfers, setTransfers] = useState<ITransfer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

    // Estados de filtros
    const [filters, setFilters] = useState<ITransferFilters>({
        search: '',
        status: undefined,
        from_warehouse_id: '',
        to_warehouse_id: '',
        date_from: '',
        date_to: '',
    });

    // Estados de estadísticas
    const [stats, setStats] = useState<ITransferStats>({
        total_transfers: 0,
        pending_transfers: 0,
        in_transit_transfers: 0,
        completed_transfers: 0,
        total_items_transferred: 0,
        total_value_transferred: 0,
    });

    // Estados de modales
    const [modals, setModals] = useState({
        createModal: false,
        editModal: false,
        receiveModal: false,
        detailModal: false,
        cancelModal: false,
    });

    // Transferencia seleccionada
    const [selectedTransfer, setSelectedTransfer] = useState<ITransfer | null>(null);

    // Cálculo de páginas totales
    const totalPages = useMemo(() => {
        return Math.ceil(totalItems / itemsPerPage);
    }, [totalItems, itemsPerPage]);

    // Función para cargar transferencias (mock - reemplazar con API real)
    const loadTransfers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 800));

            // Mock data - reemplazar con llamada real
            const mockTransfers: ITransfer[] = [
                {
                    id: 1,
                    company_id: 1,
                    transfer_number: 'TR-2024-001',
                    from_warehouse_id: 1,
                    to_warehouse_id: 2,
                    status: 'PENDING' as TransferStatus,
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T10:00:00Z',
                    from_warehouse: { id: 1, name: 'Almacén Central', company_id: 1, is_active: true, created_at: '', updated_at: '' },
                    to_warehouse: { id: 2, name: 'Sucursal Norte', company_id: 1, is_active: true, created_at: '', updated_at: '' },
                    items: [],
                    total_quantity: 50,
                    items_count: 3,
                },
                {
                    id: 2,
                    company_id: 1,
                    transfer_number: 'TR-2024-002',
                    from_warehouse_id: 2,
                    to_warehouse_id: 3,
                    status: 'SHIPPED' as TransferStatus,
                    created_at: '2024-01-14T08:30:00Z',
                    updated_at: '2024-01-14T14:30:00Z',
                    shipped_at: '2024-01-14T14:30:00Z',
                    from_warehouse: { id: 2, name: 'Sucursal Norte', company_id: 1, is_active: true, created_at: '', updated_at: '' },
                    to_warehouse: { id: 3, name: 'Sucursal Sur', company_id: 1, is_active: true, created_at: '', updated_at: '' },
                    items: [],
                    total_quantity: 25,
                    items_count: 2,
                },
            ];

            setTransfers(mockTransfers);
            setTotalItems(mockTransfers.length);
        } catch (err) {
            setError('Error al cargar las transferencias');
            console.error('Error loading transfers:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage, itemsPerPage]);

    // Función para cargar estadísticas
    const loadStats = useCallback(async () => {
        try {
            // Mock stats - reemplazar con llamada real a API
            const mockStats: ITransferStats = {
                total_transfers: 45,
                pending_transfers: 12,
                in_transit_transfers: 8,
                completed_transfers: 23,
                total_items_transferred: 1250,
                total_value_transferred: 35000000,
            };

            setStats(mockStats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }, []);

    // Operaciones CRUD
    const createTransfer = useCallback(async (transferData: ICreateTransferRequest) => {
        setIsLoading(true);
        try {
            // Mock - reemplazar con llamada real a API
            console.log('Creating transfer:', transferData);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar datos
            await Promise.all([loadTransfers(), loadStats()]);
        } catch (err) {
            setError('Error al crear la transferencia');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadTransfers, loadStats]);

    const updateTransfer = useCallback(async (id: number, transferData: ICreateTransferRequest) => {
        setIsLoading(true);
        try {
            // Mock - reemplazar con llamada real a API
            console.log('Updating transfer:', id, transferData);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar datos
            await Promise.all([loadTransfers(), loadStats()]);
        } catch (err) {
            setError('Error al actualizar la transferencia');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadTransfers, loadStats]);

    const receiveTransfer = useCallback(async (receiveData: IReceiveTransferRequest) => {
        setIsLoading(true);
        try {
            // Mock - reemplazar con llamada real a API
            console.log('Receiving transfer:', receiveData);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar datos
            await Promise.all([loadTransfers(), loadStats()]);
        } catch (err) {
            setError('Error al recibir la transferencia');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadTransfers, loadStats]);

    const cancelTransfer = useCallback(async (id: number, reason?: string) => {
        setIsLoading(true);
        try {
            // Mock - reemplazar con llamada real a API
            console.log('Cancelling transfer:', id, reason);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar datos
            await Promise.all([loadTransfers(), loadStats()]);
        } catch (err) {
            setError('Error al cancelar la transferencia');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadTransfers, loadStats]);

    const deleteTransfer = useCallback(async (id: number) => {
        setIsLoading(true);
        try {
            // Mock - reemplazar con llamada real a API
            console.log('Deleting transfer:', id);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar datos
            await Promise.all([loadTransfers(), loadStats()]);
        } catch (err) {
            setError('Error al eliminar la transferencia');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadTransfers, loadStats]);

    // Gestión de filtros
    const updateFilter = useCallback(<K extends keyof ITransferFilters>(
        key: K,
        value: ITransferFilters[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset página al cambiar filtros
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            search: '',
            status: undefined,
            from_warehouse_id: '',
            to_warehouse_id: '',
            date_from: '',
            date_to: '',
        });
        setCurrentPage(1);
    }, []);

    const applyFilters = useCallback(() => {
        loadTransfers();
    }, [loadTransfers]);

    // Gestión de paginación
    const setPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const setItemsPerPage = useCallback((items: number) => {
        setItemsPerPageState(items);
        setCurrentPage(1);
    }, []);

    // Gestión de modales
    const openModal = useCallback((
        modalType: keyof UseTransfersManagerReturn['modals'],
        transfer?: ITransfer
    ) => {
        setModals(prev => ({ ...prev, [modalType]: true }));
        if (transfer) {
            setSelectedTransfer(transfer);
        }
    }, []);

    const closeModal = useCallback((modalType: keyof UseTransfersManagerReturn['modals']) => {
        setModals(prev => ({ ...prev, [modalType]: false }));
        if (modalType !== 'createModal') {
            setSelectedTransfer(null);
        }
    }, []);

    const closeAllModals = useCallback(() => {
        setModals({
            createModal: false,
            editModal: false,
            receiveModal: false,
            detailModal: false,
            cancelModal: false,
        });
        setSelectedTransfer(null);
    }, []);

    // Utilidades
    const refreshData = useCallback(async () => {
        await Promise.all([loadTransfers(), loadStats()]);
    }, [loadTransfers, loadStats]);

    const selectTransfer = useCallback((transfer: ITransfer | null) => {
        setSelectedTransfer(transfer);
    }, []);

    const getTransfersByStatus = useCallback((status: TransferStatus) => {
        return transfers.filter(transfer => transfer.status === status);
    }, [transfers]);

    const calculateProgress = useCallback((transfer: ITransfer) => {
        if (!transfer.items || transfer.items.length === 0) return 0;

        const totalReceived = transfer.items.reduce(
            (sum, item) => sum + (item.received_quantity || 0),
            0
        );
        const totalRequested = transfer.items.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        return totalRequested > 0 ? (totalReceived / totalRequested) * 100 : 0;
    }, []);

    const formatTransferNumber = useCallback((transfer: ITransfer) => {
        return transfer.transfer_number || `TR-${transfer.id}`;
    }, []);

    const canEditTransfer = useCallback((transfer: ITransfer) => {
        return transfer.status === 'PENDING';
    }, []);

    const canCancelTransfer = useCallback((transfer: ITransfer) => {
        return ['PENDING', 'SHIPPED'].includes(transfer.status);
    }, []);

    const canReceiveTransfer = useCallback((transfer: ITransfer) => {
        return transfer.status === 'SHIPPED';
    }, []);

    return {
        // Estado principal
        transfers,
        isLoading,
        error,

        // Paginación
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,

        // Filtros
        filters,

        // Estadísticas
        stats,

        // Estados de modales
        modals,

        // Transferencia seleccionada
        selectedTransfer,

        // Operaciones CRUD
        createTransfer,
        updateTransfer,
        receiveTransfer,
        cancelTransfer,
        deleteTransfer,

        // Gestión de filtros
        updateFilter,
        clearFilters,
        applyFilters,

        // Gestión de paginación
        setPage,
        setItemsPerPage,

        // Gestión de modales
        openModal,
        closeModal,
        closeAllModals,

        // Utilidades
        refreshData,
        selectTransfer,
        getTransfersByStatus,
        calculateProgress,
        formatTransferNumber,
        canEditTransfer,
        canCancelTransfer,
        canReceiveTransfer,
    };
};

export default useTransfersManager;
