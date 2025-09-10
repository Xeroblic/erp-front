import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    SystemParameter,
    SystemParameterCreate,
    SystemParameterUpdate,
    SystemParameterFilters,
    SystemParametersState,
    SystemParameterStats
} from '@/interface';
import { systemParametersMock } from '../mocks/systemParameters.mock';

export const useSystemParametersManagement = () => {
    // Estado local (usando mocks en lugar de Redux)
    const [state, setState] = useState<SystemParametersState>({
        parameters: systemParametersMock,
        filteredParameters: systemParametersMock,
        isLoading: false,
        error: null,
        pagination: {
            page: 1,
            pageSize: 10,
            total: systemParametersMock.length,
            totalPages: Math.ceil(systemParametersMock.length / 10)
        },
        filters: {}
    });

    // Estados de modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedParameter, setSelectedParameter] = useState<SystemParameter | null>(null);

    // Estados de acciones
    const [loadingActions, setLoadingActions] = useState<Set<number>>(new Set());

    // Función para aplicar filtros
    const applyFilters = useCallback((parameters: SystemParameter[], filters: SystemParameterFilters) => {
        return parameters.filter(param => {
            if (filters.search && !param.key.toLowerCase().includes(filters.search.toLowerCase()) &&
                !param.description.toLowerCase().includes(filters.search.toLowerCase()) &&
                !param.value.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.category && param.category !== filters.category) {
                return false;
            }
            if (filters.data_type && param.data_type !== filters.data_type) {
                return false;
            }
            if (filters.is_editable !== undefined && param.is_editable !== filters.is_editable) {
                return false;
            }
            if (filters.is_visible !== undefined && param.is_visible !== filters.is_visible) {
                return false;
            }
            return true;
        });
    }, []);

    // Manejar cambios de filtros
    const handleFilterChange = useCallback((newFilters: Partial<SystemParameterFilters>) => {
        const updatedFilters = { ...state.filters, ...newFilters };
        const filteredParams = applyFilters(state.parameters, updatedFilters);

        setState(prev => ({
            ...prev,
            filters: updatedFilters,
            filteredParameters: filteredParams,
            pagination: {
                ...prev.pagination,
                page: 1,
                total: filteredParams.length,
                totalPages: Math.ceil(filteredParams.length / prev.pagination.pageSize)
            }
        }));
    }, [state.parameters, state.filters, applyFilters]);

    // Manejar cambios de paginación
    const handlePageChange = useCallback((page: number) => {
        setState(prev => ({
            ...prev,
            pagination: { ...prev.pagination, page }
        }));
    }, []);

    const handlePageSizeChange = useCallback((pageSize: number) => {
        setState(prev => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                page: 1,
                pageSize,
                totalPages: Math.ceil(prev.filteredParameters.length / pageSize)
            }
        }));
    }, []);

    // Manejadores de modales
    const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
    const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

    const openEditModal = useCallback((parameter: SystemParameter) => {
        setSelectedParameter(parameter);
        setIsEditModalOpen(true);
    }, []);
    const closeEditModal = useCallback(() => {
        setSelectedParameter(null);
        setIsEditModalOpen(false);
    }, []);

    const openDeleteModal = useCallback((parameter: SystemParameter) => {
        setSelectedParameter(parameter);
        setIsDeleteModalOpen(true);
    }, []);
    const closeDeleteModal = useCallback(() => {
        setSelectedParameter(null);
        setIsDeleteModalOpen(false);
    }, []);

    const openDetailsModal = useCallback((parameter: SystemParameter) => {
        setSelectedParameter(parameter);
        setIsDetailsModalOpen(true);
    }, []);
    const closeDetailsModal = useCallback(() => {
        setSelectedParameter(null);
        setIsDetailsModalOpen(false);
    }, []);

    // Acciones CRUD
    const handleCreateParameter = useCallback(async (data: SystemParameterCreate) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newParameter: SystemParameter = {
                ...data,
                id: Math.max(...state.parameters.map(p => p.id)) + 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                updated_by: 'current_user@zentria.com',
                is_editable: data.is_editable ?? true,
                is_visible: data.is_visible ?? true
            };

            const updatedParameters = [...state.parameters, newParameter];
            const filteredParams = applyFilters(updatedParameters, state.filters);

            setState(prev => ({
                ...prev,
                parameters: updatedParameters,
                filteredParameters: filteredParams,
                pagination: {
                    ...prev.pagination,
                    total: filteredParams.length,
                    totalPages: Math.ceil(filteredParams.length / prev.pagination.pageSize)
                },
                isLoading: false
            }));

            closeCreateModal();
            toast.success('Parámetro creado exitosamente');
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false, error: 'Error al crear el parámetro' }));
            toast.error('Error al crear el parámetro');
        }
    }, [state.parameters, state.filters, applyFilters, closeCreateModal]);

    const handleUpdateParameter = useCallback(async (id: number, data: SystemParameterUpdate) => {
        if (!loadingActions.has(id)) {
            setLoadingActions(prev => new Set(prev).add(id));

            try {
                await new Promise(resolve => setTimeout(resolve, 800));

                const updatedParameters = state.parameters.map(param =>
                    param.id === id
                        ? { ...param, ...data, updated_at: new Date().toISOString(), updated_by: 'current_user@zentria.com' }
                        : param
                );
                const filteredParams = applyFilters(updatedParameters, state.filters);

                setState(prev => ({
                    ...prev,
                    parameters: updatedParameters,
                    filteredParameters: filteredParams
                }));

                closeEditModal();
                toast.success('Parámetro actualizado exitosamente');
            } catch (error) {
                toast.error('Error al actualizar el parámetro');
            } finally {
                setLoadingActions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            }
        }
    }, [state.parameters, state.filters, applyFilters, closeEditModal, loadingActions]);

    const handleDeleteParameter = useCallback(async (id: number) => {
        if (!loadingActions.has(id)) {
            setLoadingActions(prev => new Set(prev).add(id));

            try {
                await new Promise(resolve => setTimeout(resolve, 600));

                const updatedParameters = state.parameters.filter(param => param.id !== id);
                const filteredParams = applyFilters(updatedParameters, state.filters);

                setState(prev => ({
                    ...prev,
                    parameters: updatedParameters,
                    filteredParameters: filteredParams,
                    pagination: {
                        ...prev.pagination,
                        total: filteredParams.length,
                        totalPages: Math.ceil(filteredParams.length / prev.pagination.pageSize)
                    }
                }));

                closeDeleteModal();
                toast.success('Parámetro eliminado exitosamente');
            } catch (error) {
                toast.error('Error al eliminar el parámetro');
            } finally {
                setLoadingActions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            }
        }
    }, [state.parameters, state.filters, applyFilters, closeDeleteModal, loadingActions]);

    // Refrescar datos
    const refreshParameters = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            // En un escenario real, aquí haríamos fetch de la API
            const filteredParams = applyFilters(systemParametersMock, state.filters);
            setState(prev => ({
                ...prev,
                parameters: systemParametersMock,
                filteredParameters: filteredParams,
                isLoading: false
            }));
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false, error: 'Error al cargar parámetros' }));
        }
    }, [state.filters, applyFilters]);

    // Datos paginados
    const paginatedParameters = useMemo(() => {
        const startIndex = (state.pagination.page - 1) * state.pagination.pageSize;
        const endIndex = startIndex + state.pagination.pageSize;
        return state.filteredParameters.slice(startIndex, endIndex);
    }, [state.filteredParameters, state.pagination.page, state.pagination.pageSize]);

    // Estadísticas
    const stats = useMemo((): SystemParameterStats => {
        const parameters = state.filteredParameters;
        return {
            total: parameters.length,
            byCategory: parameters.reduce((acc, param) => {
                acc[param.category] = (acc[param.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            editable: parameters.filter(p => p.is_editable).length,
            systemControlled: parameters.filter(p => !p.is_editable).length
        };
    }, [state.filteredParameters]);

    return {
        // Estado
        parameters: paginatedParameters,
        allParameters: state.parameters,
        isLoading: state.isLoading,
        error: state.error,
        pagination: state.pagination,
        filters: state.filters,
        stats,

        // Estados de modales
        isCreateModalOpen,
        isEditModalOpen,
        isDeleteModalOpen,
        isDetailsModalOpen,
        selectedParameter,

        // Manejadores de modales
        openCreateModal,
        closeCreateModal,
        openEditModal,
        closeEditModal,
        openDeleteModal,
        closeDeleteModal,
        openDetailsModal,
        closeDetailsModal,

        // Manejadores de filtros y paginación
        handleFilterChange,
        handlePageChange,
        handlePageSizeChange,

        // Acciones CRUD
        handleCreateParameter,
        handleUpdateParameter,
        handleDeleteParameter,
        refreshParameters,

        // Estados de carga
        loadingActions
    };
};
