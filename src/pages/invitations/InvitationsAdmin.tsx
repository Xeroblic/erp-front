import React, { useEffect } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import InvitationsTable from './components/tables/InvitationsTable';
import { CreateInvitationModal } from './components/modals';
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
        <PageWrapper name="Gestión de Invitaciones">
            <Subheader>
                <SubheaderLeft>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Icon icon="HeroEnvelope" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                Gestión de Invitaciones
                            </h1>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Administra las invitaciones del sistema para nuevos usuarios
                            </p>
                        </div>
                    </div>
                </SubheaderLeft>
                <SubheaderRight>
                    <Button
                        variant="solid"
                        icon="HeroPlus"
                        onClick={openCreateModal}
                    >
                        Nueva Invitación
                    </Button>
                </SubheaderRight>
            </Subheader>

            <Container>
                <div className="space-y-6">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total */}
                        <Card className="hover:shadow-md transition-shadow">
                            <CardBody className="p-6">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                                        <Icon icon="HeroClipboardDocumentList" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                            {pagination.total || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Pendientes */}
                        <Card className="hover:shadow-md transition-shadow">
                            <CardBody className="p-6">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mr-4">
                                        <Icon icon="HeroClock" className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pendientes</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                            {invitations.filter((inv: any) => inv && inv.status === 'pending').length}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Aceptadas */}
                        <Card className="hover:shadow-md transition-shadow">
                            <CardBody className="p-6">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mr-4">
                                        <Icon icon="HeroCheckCircle" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Aceptadas</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                            {invitations.filter((inv: any) => inv && inv.status === 'accepted').length}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Expiradas */}
                        <Card className="hover:shadow-md transition-shadow">
                            <CardBody className="p-6">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mr-4">
                                        <Icon icon="HeroXCircle" className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Expiradas</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                            {invitations.filter((inv: any) => inv && inv.status === 'expired').length}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Filtros */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Icon icon="HeroFunnel" className="h-5 w-5 " />
                                <h3 className="text-lg font-semibold ">Filtros</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Filtro de Estado */}
                                <div>
                                    <Label htmlFor="status-filter">Estado</Label>
                                    <Select
                                        id="status-filter"
                                        name="status-filter"
                                        placeholder="Todos los estados"
                                        value={filters.status || ''}
                                        onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                                    >
                                        <option value="">Todos los estados</option>
                                        <option value="pending">Pendientes</option>
                                        <option value="sent">Enviadas</option>
                                        <option value="accepted">Aceptadas</option>
                                        <option value="expired">Expiradas</option>
                                        <option value="cancelled">Canceladas</option>
                                    </Select>
                                </div>

                                {/* Filtro de Rol */}
                                <div>
                                    <Label htmlFor="role-filter">Rol</Label>
                                    <Select
                                        id="role-filter"
                                        name="role-filter"
                                        placeholder="Todos los roles"
                                        value={filters.role || ''}
                                        onChange={(e) => handleFilterChange({ role: e.target.value || undefined })}
                                    >
                                        <option value="">Todos los roles</option>
                                        <option value="admin">Administrador</option>
                                        <option value="hr">Recursos Humanos</option>
                                        <option value="employee">Empleado</option>
                                        <option value="manager">Gerente</option>
                                        <option value="supervisor">Supervisor</option>
                                    </Select>
                                </div>

                                {/* Campo de Búsqueda */}
                                <div>
                                    <Label htmlFor="search-filter">Buscar</Label>
                                    <Input
                                        id="search-filter"
                                        name="search-filter"
                                        type="text"
                                        placeholder="Buscar por email o nombre..."
                                        value={filters.search || ''}
                                        onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                                    />
                                </div>
                            </div>

                            {/* Filtros Activos */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {filters.status && (
                                    <button
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                        onClick={() => handleFilterChange({ status: undefined })}
                                    >
                                        Estado: {filters.status}
                                        <Icon icon="HeroXMark" className="h-3 w-3 ml-1" />
                                    </button>
                                )}
                                {filters.role && (
                                    <button
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                                        onClick={() => handleFilterChange({ role: undefined })}
                                    >
                                        Rol: {filters.role}
                                        <Icon icon="HeroXMark" className="h-3 w-3 ml-1" />
                                    </button>
                                )}
                                {filters.search && (
                                    <button
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                                        onClick={() => handleFilterChange({ search: undefined })}
                                    >
                                        "{filters.search}"
                                        <Icon icon="HeroXMark" className="h-3 w-3 ml-1" />
                                    </button>
                                )}
                                {(filters.status || filters.role || filters.search) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        color="zinc"
                                        onClick={() => handleFilterChange({ status: undefined, role: undefined, search: undefined })}
                                        icon="HeroXMark"
                                    >
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Tabla de Invitaciones */}
                    <InvitationsTable
                        invitations={invitations}
                        isLoading={isLoading}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>
            </Container>

            {/* Modales */}
            <CreateInvitationModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSuccess={refreshInvitations}
            />
        </PageWrapper>
    );
};

export default InvitationsAdmin;
