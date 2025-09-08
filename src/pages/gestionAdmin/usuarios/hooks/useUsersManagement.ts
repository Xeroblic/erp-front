import { useState, useCallback } from 'react';
import { useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';
import { IUserMe } from '@/interface/user.interface';

export const useUsersManagement = () => {
    const user = useAppSelector((s) => s.auth.user);
    const empresaId = user?.company?.id;

    // Estados para las acciones
    const [loadingActions, setLoadingActions] = useState<Set<number>>(new Set());

    // Verificar si una acción está cargando
    const isActionLoading = useCallback((userId: number) => {
        return loadingActions.has(userId);
    }, [loadingActions]);

    // Agregar/quitar acción de carga
    const setActionLoading = useCallback((userId: number, loading: boolean) => {
        setLoadingActions(prev => {
            const newSet = new Set(prev);
            if (loading) {
                newSet.add(userId);
            } else {
                newSet.delete(userId);
            }
            return newSet;
        });
    }, []);

    // Cargar todos los usuarios (super-admin)
    const fetchAllUsers = useCallback(async (): Promise<IUserMe[]> => {
        try {
            const { data } = await ApiService.fetchData<{
                data: IUserMe[];
                success: boolean;
                meta: any;
            }>({
                url: '/admin/users',
                method: 'get',
            });
            return data.data;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al cargar usuarios');
            throw error;
        }
    }, []);

    // Cargar usuarios de la empresa
    const fetchCompanyUsers = useCallback(async (): Promise<IUserMe[]> => {
        if (!empresaId) {
            toast.warn('Este usuario no tiene empresa asignada');
            return [];
        }

        try {
            const { data } = await ApiService.fetchData<{ usuarios: IUserMe[] }>({
                url: '/my-company/users',
                method: 'get',
            });
            return data.usuarios;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al cargar usuarios');
            throw error;
        }
    }, [empresaId]);

    // Cambiar estado de usuario (activar/desactivar)
    const handleToggleUserStatus = useCallback(async (userId: number): Promise<void> => {
        setActionLoading(userId, true);
        try {
            await ApiService.fetchData({
                url: `/admin/users/${userId}/toggle-status`,
                method: 'patch',
            });
            toast.success('Estado del usuario actualizado correctamente');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al cambiar estado del usuario');
            throw error;
        } finally {
            setActionLoading(userId, false);
        }
    }, [setActionLoading]);

    // Actualizar usuario
    const handleUpdateUser = useCallback(async (userId: number, userData: any): Promise<void> => {
        setActionLoading(userId, true);
        try {
            await ApiService.fetchData({
                url: `/admin/users/${userId}`,
                method: 'put',
                data: userData,
            });
            toast.success('Usuario actualizado correctamente');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al actualizar usuario');
            throw error;
        } finally {
            setActionLoading(userId, false);
        }
    }, [setActionLoading]);

    // Eliminar usuario
    const handleDeleteUser = useCallback(async (userId: number): Promise<void> => {
        setActionLoading(userId, true);
        try {
            await ApiService.fetchData({
                url: `/admin/users/${userId}`,
                method: 'delete',
            });
            toast.success('Usuario eliminado correctamente');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al eliminar usuario');
            throw error;
        } finally {
            setActionLoading(userId, false);
        }
    }, [setActionLoading]);

    return {
        // Datos
        user,
        empresaId,

        // Estados
        isActionLoading,

        // Funciones de carga
        fetchAllUsers,
        fetchCompanyUsers,

        // Funciones de acciones
        handleToggleUserStatus,
        handleUpdateUser,
        handleDeleteUser,
    };
};
