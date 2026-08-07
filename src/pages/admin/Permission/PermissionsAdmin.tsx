import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { MultiValue } from 'react-select';
import {
	getCoreRowModel,
	useReactTable,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	flexRender,
	SortingState,
} from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from '@/store';
import { type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { TSelectOption } from '@/components/form/SelectReact';

import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Table, { THead, Tr, Th, TBody, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

// Componentes modulares
import { PermissionsModal } from './components/modals/PermissionsModal';
import { createUserTableColumns } from './components/tables/UserTableColumns';
import { usePermissionsManagement } from './hooks/usePermissionsManagement';
import { resolveRoleLabel, resolvePermissionLabel } from './utils/formatters';
import { usePermissionLabels } from '@/hooks/usePermissionLabels';
import { Permission, Role } from '@/store/slices/permissions/permissionsSlice';

export default function PermissionsAdmin() {
	// Hook personalizado para gestión de permisos
	const {
		users,
		permissions,
		roles,
		usersLoading,
		permissionsLoading,
		filters,
		selectedUserForPermissions,
		selectedPermissionIds,
		selectedRoleIds,
		toggleUserLoading,
		permissionNameToId,
		roleNameToId,
		loadInitialData,
		openPermissionsModal,
		closePermissionsModal,
		toggleUser,
		savePermissions,
		setSelectedUserForPermissions,
		setSelectedPermissionIds,
		setSelectedRoleIds,
	} = usePermissionsManagement();

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
	const { getRoleLabel } = usePermissionLabels();

	useEffect(() => {
		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Solo ejecutar una vez al montar

	const { preselectedRoleIds, preselectedPermissionIds } = useMemo(() => {
		if (!selectedUserForPermissions || !roles.length || !permissions.length) {
			return {
				preselectedRoleIds: [],
				preselectedPermissionIds: [],
			};
		}
		const roleNames = [
			...(selectedUserForPermissions.global_roles || []),
			...(selectedUserForPermissions.contextual_roles?.map((cr) => cr.role) || []),
		];

		const uniqueRoleNames = Array.from(new Set(roleNames));
		const roleIds = uniqueRoleNames
			.map((name) => roleNameToId.get(name))
			.filter((id): id is number => typeof id === 'number');
		const directPermissionNames = selectedUserForPermissions.direct_permissions || [];
		const permissionIds = directPermissionNames
			.map((name) => permissionNameToId.get(name))
			.filter((id): id is number => typeof id === 'number');

		return {
			preselectedRoleIds: roleIds,
			preselectedPermissionIds: permissionIds,
		};
	}, [selectedUserForPermissions, roles, permissions, roleNameToId, permissionNameToId]);

	useEffect(() => {
		setSelectedRoleIds(preselectedRoleIds);
		setSelectedPermissionIds(preselectedPermissionIds);
	}, [
		preselectedRoleIds,
		preselectedPermissionIds,
		setSelectedRoleIds,
		setSelectedPermissionIds,
	]);

	const handleOpenPermissionsModal = useCallback(
		async (user: UserWithDetails) => {
			await openPermissionsModal(user);
			setIsPermissionsModalOpen(true);
		},
		[openPermissionsModal],
	);

	const handleClosePermissionsModal = useCallback(() => {
		setIsPermissionsModalOpen(false);
		closePermissionsModal();
	}, [closePermissionsModal]);

	const handleSavePermissions = useCallback(async () => {
		await savePermissions();
		setIsPermissionsModalOpen(false);
		closePermissionsModal();
	}, [savePermissions, closePermissionsModal]);

	const columns = createUserTableColumns(
		handleOpenPermissionsModal,
		toggleUser,
		toggleUserLoading,
		getRoleLabel,
	);

	const table = useReactTable({
		data: users,
		columns,
		state: { globalFilter, sorting },
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
	});

	const roleOptions = useMemo<TSelectOption[]>(
		() =>
			(roles || [])
				.map(
					(r: Role): TSelectOption => ({
						value: String(r.id),
						label: resolveRoleLabel(r),
					}),
				)
				.sort((a: TSelectOption, b: TSelectOption) => a.label.localeCompare(b.label, 'es')),
		[roles],
	);

	const permissionOptions = useMemo<TSelectOption[]>(
		() =>
			(permissions || [])
				.map(
					(p: Permission): TSelectOption => ({
						value: String(p.id),
						label: resolvePermissionLabel(p),
					}),
				)
				.sort((a: TSelectOption, b: TSelectOption) => a.label.localeCompare(b.label, 'es')),
		[permissions],
	);

	const handleRoleChange = useCallback(
		(selected: MultiValue<TSelectOption>) => {
			const ids = selected.map((option) => parseInt(String(option.value), 10));
			setSelectedRoleIds(ids);
		},
		[setSelectedRoleIds],
	);

	const handlePermissionChange = useCallback(
		(selected: MultiValue<TSelectOption>) => {
			const ids = selected.map((option) => parseInt(String(option.value), 10));
			setSelectedPermissionIds(ids);
		},
		[setSelectedPermissionIds],
	);

	// const selectedRoleOptions = useMemo(
	// 	() => roleOptions.filter((o) => selectedRoleIds.includes(parseInt(String(o.value), 10))),
	// 	[roleOptions, selectedRoleIds]
	// );

	// const selectedPermissionOptions = useMemo(
	// 	() => permissionOptions.filter((o) => selectedPermissionIds.includes(parseInt(String(o.value), 10))),
	// 	[permissionOptions, selectedPermissionIds]
	// );

	return (
		<PageWrapper isProtectedRoute title='Administración de Permisos' name='Permisos'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<Icon icon='HeroShieldCheck' className='h-8 w-8' />
						<div>
							<Badge className='text-lg font-semibold'>
								Gestión de Permisos de Usuarios
							</Badge>
							<p className='mt-1 text-sm text-zinc-600'>
								Administra roles y permisos de {users?.length || 0} usuarios
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex items-center gap-3'>
						<div className='hidden items-center gap-2 text-sm text-zinc-600 md:flex'>
							<Icon icon='HeroMagnifyingGlass' className='h-4 w-4' />
							<span>Buscar:</span>
						</div>
						<Input
							name='search'
							placeholder='Buscar por nombre, email...'
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className='w-64 rounded border md:w-80'
						/>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card>
					<CardHeader>
						<Subheader>
							<SubheaderLeft>
								<div className='flex items-center gap-4'>
									<div className='flex h-10 w-10 items-center justify-center rounded-lg'>
										<Icon icon='HeroUsers' className='h-5 w-5 text-blue-600' />
									</div>
									<div>
										<h2 className='text-xl font-semibold text-gray-800'>
											Lista de Usuarios
										</h2>
										<p className='mt-0.5 text-sm text-gray-500'>
											Gestiona permisos y roles de usuarios
										</p>
									</div>
								</div>
							</SubheaderLeft>
							<SubheaderRight>
								<div className='flex items-center gap-3'>
									<div className='flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 shadow-sm'>
										<div className='h-2 w-2 animate-pulse rounded-full bg-green-400' />
										<span className='text-sm font-medium text-gray-700'>
											{users?.length || 0} usuario
											{users?.length !== 1 ? 's' : ''} encontrado
											{users?.length !== 1 ? 's' : ''}
										</span>
									</div>
									{users && users.length > 0 && (
										<div className='hidden text-xs text-gray-400 sm:block'>
											Última actualización: {new Date().toLocaleDateString()}
										</div>
									)}
								</div>
							</SubheaderRight>
						</Subheader>
					</CardHeader>
					<CardBody className='overflow-auto p-0'>
						{usersLoading === 'loading' ? (
							<div className='p-12 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-4 h-8 w-8 animate-spin'
								/>
								<p className='text-zinc-600'>Cargando usuarios...</p>
							</div>
						) : !users || users.length === 0 ? (
							<div className='p-12 text-center text-zinc-600'>
								<Icon
									icon='HeroUsers'
									className='mx-auto mb-4 h-16 w-16 text-zinc-300'
								/>
								<p className='text-lg font-medium'>No hay usuarios registrados</p>
								<p className='mt-2 text-sm text-zinc-400'>
									Los usuarios aparecerán aquí cuando estén disponibles
								</p>
							</div>
						) : (
							<>
								<div className='overflow-x-auto'>
									<Table className='min-w-full'>
										<THead>
											{table.getHeaderGroups().map((hg) => (
												<Tr key={hg.id}>
													{hg.headers.map((header) => (
														<Th
															key={header.id}
															className='p-4 text-left font-semibold'>
															{flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
														</Th>
													))}
												</Tr>
											))}
										</THead>
										<TBody>
											{table.getRowModel().rows.map((row) => (
												<Tr
													key={row.id}
													className='border-b transition-colors'>
													{row.getVisibleCells().map((cell) => (
														<Td key={cell.id} className='p-4'>
															{flexRender(
																cell.column.columnDef.cell,
																cell.getContext(),
															)}
														</Td>
													))}
												</Tr>
											))}
										</TBody>
									</Table>
								</div>
								<div className='border-t p-4'>
									<TableCardFooterTemplateV2 table={table} />
								</div>
							</>
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal de Gestión de Permisos */}
			<PermissionsModal
				isOpen={isPermissionsModalOpen}
				onClose={handleClosePermissionsModal}
				selectedUser={selectedUserForPermissions}
				permissions={permissions}
				roles={roles}
				companies={[]} // TODO: Obtener de store
				subsidiaries={[]} // TODO: Obtener de store
				branches={[]} // TODO: Obtener de store
				selectedPermissionIds={selectedPermissionIds}
				selectedRoleIds={selectedRoleIds}
				onPermissionChange={handlePermissionChange}
				onRoleChange={handleRoleChange}
				onSave={handleSavePermissions}
				isLoading={
					permissionsLoading.permissions ||
					permissionsLoading.roles ||
					usersLoading === 'loading'
				}
			/>
		</PageWrapper>
	);
}
