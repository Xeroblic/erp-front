/* eslint-disable import/extensions */
import React, { useEffect, useMemo, useRef } from 'react';
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
import { CreateInvitationModal } from './components/modals';
import { useInvitationsManagement } from './hooks/useInvitationsManagement';
import { Invitation, InvitationStats } from '@/interface/invitacion.interface';
import EstadisticasInvitations from './components/grids/EstadisticasInvitations';
import { formatRoleName } from '@/pages/admin/Permission/utils/formatters';

const STATUS_LABELS: Record<Invitation['status'], string> = {
	pending: 'Pendientes',
	sent: 'Enviadas',
	accepted: 'Aceptadas',
	expired: 'Expiradas',
	cancelled: 'Canceladas',
};

const STATUS_ORDER: Invitation['status'][] = [
	'pending',
	'sent',
	'accepted',
	'expired',
	'cancelled',
];

const formatStatusLabel = (status: string) =>
	status
		.split(/[-_]/)
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');

const InvitationsAdmin: React.FC = () => {
	const {
		invitations,
		filteredInvitations,
		stats,
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
		handleCreateInvitation,
		roles,
		permissions,
		isLoadingRoles,
		isLoadingPermissions,
	} = useInvitationsManagement();

	const initializedRef = useRef(false);

	useEffect(() => {
		if (initializedRef.current) {
			return;
		}
		initializedRef.current = true;
		refreshInvitations().catch(() => undefined);
	}, [refreshInvitations]);

	const currentStats = useMemo<InvitationStats>(() => stats, [stats]);

	const statusOptions = useMemo(() => {
		const collected = new Set<Invitation['status']>(STATUS_ORDER);
		filteredInvitations.forEach((invitation) => {
			if (invitation?.status) {
				collected.add(invitation.status);
			}
		});

		return Array.from(collected).map((status) => ({
			value: status,
			label: STATUS_LABELS[status] ?? formatStatusLabel(status),
		}));
	}, [filteredInvitations]);

	const roleOptions = useMemo(() => {
		if (roles.length > 0) {
			return roles
				.map((role) => ({
					value: role.name,
					label: formatRoleName(role.display_name || role.name),
				}))
				.sort((a, b) => a.label.localeCompare(b.label, 'es'));
		}

		const fallbackRoles = new Set<string>();
		filteredInvitations.forEach((invitation) => {
			const role = invitation?.role ?? invitation?.role_name;
			if (role) {
				fallbackRoles.add(role);
			}
		});

		return Array.from(fallbackRoles)
			.sort((a, b) => a.localeCompare(b, 'es'))
			.map((roleName) => ({
				value: roleName,
				label: formatRoleName(roleName),
			}));
	}, [roles, filteredInvitations]);

	const totalResults = filteredInvitations.length;

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>
						Gestión de Invitaciones
					</h2>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Administra las invitaciones enviadas a nuevos usuarios
					</p>
				</SubheaderLeft>

				<SubheaderRight>
					<Button variant='solid' color='blue' icon='HeroPlus' onClick={openCreateModal}>
						Nueva Invitación
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-6'>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
						<EstadisticasInvitations currentStats={currentStats} />
					</div>

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
								<div>
									<Label htmlFor='search-filter'>Buscar por email o nombre</Label>
									<Input
										id='search-filter'
										name='search-filter'
										placeholder='Escriba para buscar...'
										value={filters.search ?? ''}
										onChange={(event) =>
											handleFilterChange({ search: event.target.value })
										}
										className='w-full'
									/>
								</div>

								<div>
									<Label htmlFor='status-filter'>Estado</Label>
									<Select
										id='status-filter'
										name='status-filter'
										value={filters.status ?? ''}
										onChange={(event) =>
											handleFilterChange({ status: event.target.value })
										}>
										<option value=''>Todos los estados</option>
										{statusOptions.map((status) => (
											<option key={status.value} value={status.value}>
												{status.label}
											</option>
										))}
									</Select>
								</div>

								<div>
									<Label htmlFor='role-filter'>Rol</Label>
									<Select
										id='role-filter'
										name='role-filter'
										value={filters.role ?? ''}
										onChange={(event) =>
											handleFilterChange({ role: event.target.value })
										}>
										<option value=''>Todos los roles</option>
										{roleOptions.map((role) => (
											<option key={role.value} value={role.value}>
												{role.label}
											</option>
										))}
									</Select>
								</div>

								<div className='flex items-end'>
									<Button
										variant='outline'
										color='gray'
										onClick={() =>
											handleFilterChange({
												search: '',
												status: '',
												role: '',
											})
										}
										className='w-full'>
										<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
										Limpiar filtros
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
									Invitaciones
								</h3>
							</div>
						</CardHeader>
						<CardBody>
							<InvitationsTable
								invitations={invitations}
								isLoading={isLoading}
								pagination={pagination}
								onPageChange={handlePageChange}
								onPageSizeChange={handlePageSizeChange}
								openCreateModal={openCreateModal}
							/>
						</CardBody>
					</Card>
				</div>
			</Container>

			<CreateInvitationModal
				isOpen={isCreateModalOpen}
				onClose={closeCreateModal}
				onSuccess={refreshInvitations}
				onSubmit={handleCreateInvitation}
				roles={roles}
				permissions={permissions}
				isLoadingRoles={isLoadingRoles}
				isLoadingPermissions={isLoadingPermissions}
			/>
		</PageWrapper>
	);
};

export default InvitationsAdmin;
