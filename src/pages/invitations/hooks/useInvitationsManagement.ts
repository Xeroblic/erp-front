import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    fetchInvitations,
    createInvitation,
    resendInvitation,
    cancelInvitation,
    setFilters,
    setPagination,
} from '@/store/slices/invitations/invitationsSlice';
import { toast } from 'react-toastify';
import {InvitationFilters, CreateInvitationData} from '@/interface/invitacion.interface';
export const useInvitationsManagement = () => {
    const dispatch = useAppDispatch();
    const {
        invitations,
        isLoading,
        pagination,
        filters,
        error
    } = useAppSelector((state) => state.invitations);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null);

    // Action states
    const [loadingActions, setLoadingActions] = useState<Set<number>>(new Set());

    // Modal handlers
    const openCreateModal = useCallback(() => {
        setIsCreateModalOpen(true);
    }, []);

    const closeCreateModal = useCallback(() => {
        setIsCreateModalOpen(false);
    }, []);

    // Data fetching
    const refreshInvitations = useCallback(async () => {
        try {
            await dispatch(fetchInvitations({
                page: pagination.page,
                per_page: pagination.pageSize,
                search: filters.search || undefined,
                status: filters.status || undefined,
                company_id: filters.company_id || undefined,
                branch_id: filters.branch_id || undefined,
            })).unwrap();
        } catch (error) {
            console.error('Error fetching invitations:', error);
            toast.error('Error al cargar las invitaciones');
        }
    }, [dispatch, pagination.page, pagination.pageSize, filters]);

    // Filter handlers
    const handleFilterChange = useCallback((newFilters: Partial<InvitationFilters>) => {
        dispatch(setFilters(newFilters));
        // Reset to first page when filters change
        dispatch(setPagination({ page: 1 }));
        // Refetch with new filters
        const updatedFilters = { ...filters, ...newFilters };
        dispatch(fetchInvitations({
            page: 1,
            per_page: pagination.pageSize,
            search: updatedFilters.search || undefined,
            status: updatedFilters.status || undefined,
            company_id: updatedFilters.company_id || undefined,
            branch_id: updatedFilters.branch_id || undefined,
        }));
    }, [dispatch, pagination.pageSize, filters]);

    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        dispatch(setPagination({ page }));
        dispatch(fetchInvitations({
            page,
            per_page: pagination.pageSize,
            search: filters.search || undefined,
            status: filters.status || undefined,
            company_id: filters.company_id || undefined,
            branch_id: filters.branch_id || undefined,
        }));
    }, [dispatch, pagination.pageSize, filters]);

    const handlePageSizeChange = useCallback((pageSize: number) => {
        dispatch(setPagination({ page: 1, pageSize }));
        dispatch(fetchInvitations({
            page: 1,
            per_page: pageSize,
            search: filters.search || undefined,
            status: filters.status || undefined,
            company_id: filters.company_id || undefined,
            branch_id: filters.branch_id || undefined,
        }));
    }, [dispatch, filters]);

    // Invitation actions
    const handleCreateInvitation = useCallback(async (data: CreateInvitationData) => {
        try {
            await dispatch(createInvitation(data)).unwrap();
            toast.success('Invitación enviada exitosamente');
            closeCreateModal();
            refreshInvitations();
        } catch (error: any) {
            console.error('Error creating invitation:', error);
            toast.error(error?.message || 'Error al enviar la invitación');
            throw error;
        }
    }, [dispatch, closeCreateModal, refreshInvitations]);

    const handleResendInvitation = useCallback(async (invitationId: number) => {
        if (loadingActions.has(invitationId)) return;

        setLoadingActions(prev => new Set(prev).add(invitationId));

        try {
            await dispatch(resendInvitation(invitationId)).unwrap();
            toast.success('Invitación reenviada exitosamente');
            refreshInvitations();
        } catch (error: any) {
            console.error('Error resending invitation:', error);
            toast.error(error?.message || 'Error al reenviar la invitación');
        } finally {
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(invitationId);
                return newSet;
            });
        }
    }, [dispatch, loadingActions, refreshInvitations]);

    const handleCancelInvitation = useCallback(async (invitationId: number) => {
        if (loadingActions.has(invitationId)) return;

        setLoadingActions(prev => new Set(prev).add(invitationId));

        try {
            await dispatch(cancelInvitation(invitationId)).unwrap();
            toast.success('Invitación cancelada exitosamente');
            refreshInvitations();
        } catch (error: any) {
            console.error('Error cancelling invitation:', error);
            toast.error(error?.message || 'Error al cancelar la invitación');
        } finally {
            setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(invitationId);
                return newSet;
            });
        }
    }, [dispatch, loadingActions, refreshInvitations]);

    // Helper functions
    const isActionLoading = useCallback((invitationId: number) => {
        return loadingActions.has(invitationId);
    }, [loadingActions]);

    const getInvitationById = useCallback((id: number) => {
        return invitations.find(invitation => invitation.id === id);
    }, [invitations]);

    return {
        // Data
        invitations,
        isLoading,
        pagination,
        filters,
        error,

        // Modal states
        isCreateModalOpen,
        selectedInvitation,

        // Modal handlers
        openCreateModal,
        closeCreateModal,
        setSelectedInvitation,

        // Data handlers
        refreshInvitations,
        handleFilterChange,
        handlePageChange,
        handlePageSizeChange,

        // Action handlers
        handleCreateInvitation,
        handleResendInvitation,
        handleCancelInvitation,

        // Helper functions
        isActionLoading,
        getInvitationById
    };
};
