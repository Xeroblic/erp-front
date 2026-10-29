/* eslint-disable import/extensions */
/* eslint-disable no-console */
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInvitations,
	createInvitation,
	resendInvitation,
	cancelInvitation,
	setFilters,
	setPagination,
} from '@/store/slices/invitations/invitationsSlice';
import { fetchPermissions, fetchRoles } from '@/store/slices/permissions/permissionsSlice';
import type { InvitationFilters, CreateInvitationData } from '@/interface/invitacion.interface';

const INVITATION_REQUEST_ERROR = 'Error al enviar la invitación';

const resolveApiErrorMessage = (error: unknown): string => {
	if (!error) return INVITATION_REQUEST_ERROR;

	if (typeof error === 'string') return error;

	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (typeof error === 'object') {
		const payload = error as { message?: string; errors?: Record<string, string[]> };
		if (payload.message && payload.message.trim().length > 0) {
			return payload.message;
		}
		if (payload.errors) {
			for (const key of Object.keys(payload.errors)) {
				const messages = payload.errors[key];
				if (Array.isArray(messages) && messages.length > 0) {
					return messages[0];
				}
			}
		}
	}

	return INVITATION_REQUEST_ERROR;
};

export const useInvitationsManagement = () => {
	const dispatch = useAppDispatch();
	const { invitations, filteredInvitations, stats, loading, pagination, filters, error } =
		useAppSelector((state) => state.invitations);
	const {
		permissions,
		roles,
		loading: permissionsLoading,
	} = useAppSelector((state) => state.permissions);

	const isLoading = loading.invitations;
	const isLoadingRoles = permissionsLoading.roles;
	const isLoadingPermissions = permissionsLoading.permissions;

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null);
	const [loadingActions, setLoadingActions] = useState<Set<number>>(new Set());

	const ensureRolesAndPermissions = useCallback(() => {
		if (!roles.length && !permissionsLoading.roles) {
			void dispatch(fetchRoles());
		}
		if (!permissions.length && !permissionsLoading.permissions) {
			void dispatch(fetchPermissions());
		}
	}, [
		dispatch,
		roles.length,
		permissions.length,
		permissionsLoading.roles,
		permissionsLoading.permissions,
	]);

	useEffect(() => {
		ensureRolesAndPermissions();
	}, [ensureRolesAndPermissions]);

	const refreshInvitations = useCallback(async () => {
		try {
			await dispatch(fetchInvitations()).unwrap();
		} catch (err) {
			if (process.env.NODE_ENV !== 'production') {
				console.error('Error fetching invitations:', err);
			}
			toast.error('Error al cargar las invitaciones');
		}
	}, [dispatch]);

	const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
	const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

	const handleFilterChange = useCallback(
		(newFilters: Partial<InvitationFilters>) => {
			dispatch(setFilters(newFilters));
		},
		[dispatch],
	);

	const handlePageChange = useCallback(
		(page: number) => {
			dispatch(setPagination({ page }));
		},
		[dispatch],
	);

	const handlePageSizeChange = useCallback(
		(pageSize: number) => {
			dispatch(setPagination({ page: 1, pageSize }));
		},
		[dispatch],
	);

	const handleCreateInvitation = useCallback(
		async (data: CreateInvitationData) => {
			try {
				await dispatch(createInvitation(data)).unwrap();
				toast.success('Invitación enviada exitosamente');
				closeCreateModal();
				await refreshInvitations();
			} catch (err: any) {
				if (process.env.NODE_ENV !== 'production') {
					console.error('Error creating invitation:', err);
				}
				const message = resolveApiErrorMessage(err);
				toast.error(message);
				throw err;
			}
		},
		[dispatch, closeCreateModal, refreshInvitations],
	);

	const handleResendInvitation = useCallback(
		async (invitationId: number) => {
			if (loadingActions.has(invitationId)) return;

			setLoadingActions((prev) => new Set(prev).add(invitationId));
			try {
				await dispatch(resendInvitation(invitationId)).unwrap();
				toast.success('Invitación reenviada exitosamente');
				await refreshInvitations();
			} catch (err: any) {
				if (process.env.NODE_ENV !== 'production') {
					console.error('Error resending invitation:', err);
				}
				toast.error(err?.message || 'Error al reenviar la invitación');
			} finally {
				setLoadingActions((prev) => {
					const next = new Set(prev);
					next.delete(invitationId);
					return next;
				});
			}
		},
		[dispatch, loadingActions, refreshInvitations],
	);

	const handleCancelInvitation = useCallback(
		async (invitationId: number) => {
			if (loadingActions.has(invitationId)) return;

			setLoadingActions((prev) => new Set(prev).add(invitationId));
			try {
				await dispatch(cancelInvitation(invitationId)).unwrap();
				toast.success('Invitación cancelada exitosamente');
				await refreshInvitations();
			} catch (err: any) {
				if (process.env.NODE_ENV !== 'production') {
					console.error('Error cancelling invitation:', err);
				}
				toast.error(err?.message || 'Error al cancelar la invitación');
			} finally {
				setLoadingActions((prev) => {
					const next = new Set(prev);
					next.delete(invitationId);
					return next;
				});
			}
		},
		[dispatch, loadingActions, refreshInvitations],
	);

	const isActionLoading = useCallback(
		(invitationId: number) => loadingActions.has(invitationId),
		[loadingActions],
	);

	const getInvitationById = useCallback(
		(id: number) => filteredInvitations.find((invitation) => invitation.id === id),
		[filteredInvitations],
	);

	return {
		invitations,
		filteredInvitations,
		stats,
		isLoading,
		pagination,
		filters,
		error,
		roles,
		permissions,
		isLoadingRoles,
		isLoadingPermissions,

		isCreateModalOpen,
		selectedInvitation,

		openCreateModal,
		closeCreateModal,
		setSelectedInvitation,

		refreshInvitations,
		handleFilterChange,
		handlePageChange,
		handlePageSizeChange,

		handleCreateInvitation,
		handleResendInvitation,
		handleCancelInvitation,

		isActionLoading,
		getInvitationById,
	};
};
