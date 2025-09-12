import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/Badge';
import InvitationsTable from './components/tables/InvitationsTable';
import { CreateInvitationModal, InvitationDetailsModal } from './components/modals';
import { useInvitationsManagement } from './hooks/useInvitationsManagement';
import {
	mockInvitations,
	mockInvitationStats,
	mockAvailableRoles,
	mockInvitationStatuses,
} from './mocks/invitations.mock';
import { Invitation } from '@/interface/invitacion.interface';

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
		refreshInvitations,
	} = useInvitationsManagement();

	// CU019 - Estados para mocks y funcionalidades adicionales
	const [localInvitations, setLocalInvitations] = useState<Invitation[]>(mockInvitations);
	const [selectedInvitationDetail, setSelectedInvitationDetail] = useState<Invitation | null>(
		null,
	);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [localStats, setLocalStats] = useState(mockInvitationStats);

	// CU019.4 - Estados para filtros locales
	const [localFilters, setLocalFilters] = useState({
		search: '',
		status: '',
		role: '',
	});

	// Usar invitaciones reales si existen, sino usar mocks
    const invitations = localInvitations;

    // CU019.4 - Aplicar filtros locales
    const filteredInvitations = React.useMemo(() => {
        let filtered = [...invitations];

        if (localFilters.search) {
            const searchLower = localFilters.search.toLowerCase();
            filtered = filtered.filter(
                (inv) =>
                    inv.email.toLowerCase().includes(searchLower) ||
                    inv.first_name.toLowerCase().includes(searchLower) ||
                    inv.last_name.toLowerCase().includes(searchLower),
            );
        }

        if (localFilters.status) {
            filtered = filtered.filter((inv) => inv.status === localFilters.status);
        }

        if (localFilters.role) {
            filtered = filtered.filter((inv) => inv.role === localFilters.role);
        }

        return filtered;
    }, [invitations, localFilters]);

    // CU019.4 - Actualizar estadísticas
    const currentStats = React.useMemo(
        () => ({
            total: filteredInvitations.length,
            pending: filteredInvitations.filter((inv) => inv.status === 'pending').length,
            sent: filteredInvitations.filter((inv) => inv.status === 'sent').length,
            accepted: filteredInvitations.filter((inv) => inv.status === 'accepted').length,
            expired: filteredInvitations.filter((inv) => inv.status === 'expired').length,
            cancelled: filteredInvitations.filter((inv) => inv.status === 'cancelled').length,
        }),
        [filteredInvitations],
    );

	// CU019.5 - Abrir modal de detalle
	const handleViewDetails = (invitation: Invitation) => {
		setSelectedInvitationDetail(invitation);
		setIsDetailModalOpen(true);
	};

	// CU019.2 - Función para editar invitación
	const handleEditInvitation = (invitation: Invitation) => {
		// Aquí se abriría un modal de edición similar al de creación
		console.log('Edit invitation:', invitation);
		// Por ahora solo mostrar en consola
	};

	// CU019.3 - Función para eliminar invitación con mock
	const handleDeleteInvitation = (invitationId: number) => {
		setLocalInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
		setLocalStats((prev) => ({
			...prev,
			total: prev.total - 1,
		}));
	};

	// CU019.2 - Función para reenviar invitación con mock
	const handleResendInvitation = (invitationId: number) => {
		setLocalInvitations((prev) =>
			prev.map((inv) =>
				inv.id === invitationId
					? {
							...inv,
							sent_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						}
					: inv,
			),
		);
	};

	// useEffect(() => {
	//     refreshInvitations();
	// }, []);

	return (
		<PageWrapper
			title='Gestión de Invitaciones'
			isProtectedRoute
			name='Gestión de Invitaciones'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30'>
							<Icon
								icon='HeroEnvelope'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h1 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
								Gestión de Invitaciones
							</h1>
							<p className='text-sm text-zinc-600 dark:text-zinc-400'>
								Administra las invitaciones enviadas a nuevos usuarios
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					{/* CU019.1 - Botón para nueva invitación */}
					<Button variant='solid' color='blue' icon='HeroPlus' onClick={openCreateModal}>
						Nueva Invitación
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-6'>
					{/* CU019.1 y CU019.4 - Tarjetas de estadísticas con contadores */}
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
						<Card className='border-gray-200 transition-shadow hover:shadow-md dark:border-gray-700'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
										<Icon
											icon='HeroClipboardDocumentList'
											className='h-6 w-6 text-blue-600 dark:text-blue-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
											Total
										</p>
										<p className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
											{currentStats.total}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-amber-200 bg-amber-50 transition-shadow hover:shadow-md dark:border-amber-800 dark:bg-amber-900/10'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30'>
										<Icon
											icon='HeroClock'
											className='h-6 w-6 text-amber-600 dark:text-amber-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-amber-700 dark:text-amber-400'>
											Pendientes
										</p>
										<p className='text-2xl font-bold text-amber-900 dark:text-amber-100'>
											{currentStats.pending}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-blue-200 bg-blue-50 transition-shadow hover:shadow-md dark:border-blue-800 dark:bg-blue-900/10'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
										<Icon
											icon='HeroPaperAirplane'
											className='h-6 w-6 text-blue-600 dark:text-blue-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-blue-700 dark:text-blue-400'>
											Enviadas
										</p>
										<p className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
											{currentStats.sent}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-emerald-200 bg-emerald-50 transition-shadow hover:shadow-md dark:border-emerald-800 dark:bg-emerald-900/10'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30'>
										<Icon
											icon='HeroCheckCircle'
											className='h-6 w-6 text-emerald-600 dark:text-emerald-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
											Aceptadas
										</p>
										<p className='text-2xl font-bold text-emerald-900 dark:text-emerald-100'>
											{currentStats.accepted}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-red-200 bg-red-50 transition-shadow hover:shadow-md dark:border-red-800 dark:bg-red-900/10'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30'>
										<Icon
											icon='HeroXCircle'
											className='h-6 w-6 text-red-600 dark:text-red-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-red-700 dark:text-red-400'>
											Expiradas
										</p>
										<p className='text-2xl font-bold text-red-900 dark:text-red-100'>
											{currentStats.expired}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>

					{/* CU019.4 - Filtros mejorados */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Icon
										icon='HeroFunnel'
										className='h-5 w-5 text-gray-600 dark:text-gray-400'
									/>
									<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
										Filtros y Búsqueda
									</h3>
								</div>
								<Badge color='blue' className='text-xs'>
									{filteredInvitations.length} resultados
								</Badge>
							</div>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
								{/* Búsqueda por email o nombre */}
								<div>
									<Label htmlFor='search-filter'>Buscar por email o nombre</Label>
									<Input
										id='search-filter'
										name='search-filter'
										placeholder='Escriba para buscar...'
										value={localFilters.search}
										onChange={(e) =>
											setLocalFilters((prev) => ({
												...prev,
												search: e.target.value,
											}))
										}
										className='w-full'
									/>
								</div>

								{/* Filtro por Estado */}
								<div>
									<Label htmlFor='status-filter'>Estado</Label>
									<Select
										id='status-filter'
										name='status-filter'
										placeholder='Todos los estados'
										value={localFilters.status}
										onChange={(e) =>
											setLocalFilters((prev) => ({
												...prev,
												status: e.target.value,
											}))
										}>
										{mockInvitationStatuses.map((status) => (
											<option key={status.value} value={status.value}>
												{status.label}
											</option>
										))}
									</Select>
								</div>

								{/* Filtro por Rol */}
								<div>
									<Label htmlFor='role-filter'>Rol</Label>
									<Select
										id='role-filter'
										name='role-filter'
										placeholder='Todos los roles'
										value={localFilters.role}
										onChange={(e) =>
											setLocalFilters((prev) => ({
												...prev,
												role: e.target.value,
											}))
										}>
										<option value=''>Todos los roles</option>
										{mockAvailableRoles.map((role) => (
											<option key={role.value} value={role.value}>
												{role.label}
											</option>
										))}
									</Select>
								</div>

								{/* Botón para limpiar filtros */}
								<div className='flex items-end'>
									<Button
										variant='outline'
										color='gray'
										onClick={() =>
											setLocalFilters({ search: '', status: '', role: '' })
										}
										className='w-full'>
										<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
										Limpiar Filtros
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* CU019.5 - Tabla mejorada con acciones por estado */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
									Invitaciones
								</h3>
								<div className='flex items-center space-x-3'>
									<Badge color='blue' className='text-xs'>
										{filteredInvitations.length} de {mockInvitations.length}
									</Badge>
									<Button
										color='blue'
										size='sm'
										onClick={openCreateModal}
										icon='HeroPlus'>
										Nueva Invitación
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardBody>
							<InvitationsTable
								invitations={filteredInvitations}
								isLoading={isLoading}
								pagination={pagination}
								onPageChange={handlePageChange}
								onPageSizeChange={handlePageSizeChange}
							/>
						</CardBody>
					</Card>
				</div>
			</Container>

			<CreateInvitationModal
				isOpen={isCreateModalOpen}
				onClose={closeCreateModal}
				onSuccess={refreshInvitations}
			/>
		</PageWrapper>
	);
};

export default InvitationsAdmin;
