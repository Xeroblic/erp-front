import React, { useEffect } from 'react';
import Icon from '@/components/icon/Icon';
import InvitationsTable from './components/tables/InvitationsTable';
import CreateInvitationModal from './components/modals/CreateInvitationModal';
import { useInvitationsManagement } from './hooks/useInvitationsManagement';

const InvitationsAdmin: React.FC = () => {
    const {
        invitations: rawInvitations,
        isLoading,
        pagination,
        filters,
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        handleFilterChange,
        handlePageChange,
        handlePageSizeChange,
        refreshInvitations
    } = useInvitationsManagement();

    // Validación defensiva para asegurar que invitations es siempre un array válido
    const invitations = Array.isArray(rawInvitations) ? rawInvitations.filter(Boolean) : [];

    useEffect(() => {
        refreshInvitations();
    }, []);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Gestión de Invitaciones
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Administra las invitaciones del sistema para nuevos usuarios
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    <Icon icon="HeroPlus" className="h-5 w-5 mr-2" />
                    Nueva Invitación
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className=" dark:bg-gray-800 p-4 rounded-lg border border-zinc-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Icon icon="HeroClipboardDocumentList" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</p>
                            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {pagination.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className=" dark:bg-gray-800 p-4 rounded-lg border border-zinc-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                                <Icon icon="HeroClock" className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pendientes</p>
                            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {invitations.filter((inv: any) => inv && inv.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-zinc-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                                <Icon icon="HeroCheckCircle" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Aceptadas</p>
                            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {invitations.filter((inv: any) => inv && inv.status === 'accepted').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-zinc-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                <Icon icon="HeroXCircle" className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Expiradas</p>
                            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {invitations.filter((inv: any) => inv && inv.status === 'expired').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Estado
                        </label>
                        <select
                            id="status-filter"
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="sent">Enviadas</option>
                            <option value="accepted">Aceptadas</option>
                            <option value="expired">Expiradas</option>
                            <option value="cancelled">Canceladas</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="role-filter" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Rol
                        </label>
                        <select
                            id="role-filter"
                            value={filters.role || ''}
                            onChange={(e) => handleFilterChange({ role: e.target.value || undefined })}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Todos los roles</option>
                            <option value="admin">Administrador</option>
                            <option value="hr">Recursos Humanos</option>
                            <option value="employee">Empleado</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="search-filter" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Buscar
                        </label>
                        <input
                            id="search-filter"
                            type="text"
                            placeholder="Buscar por email o nombre..."
                            value={filters.search || ''}
                            onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de Invitaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-zinc-200 dark:border-gray-700">
                <InvitationsTable
                    invitations={invitations}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {/* Modales */}
            <CreateInvitationModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSuccess={refreshInvitations}
            />
        </div>
    );
};

export default InvitationsAdmin;
