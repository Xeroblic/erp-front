import React, { useState } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';

import { useUsersManagement } from '../../hooks/useUsersManagement';
import { UserDetailsModal, DeleteConfirmationModal } from '../modals';
import { IAdminUser } from '@/interface/users.interface';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Can from '@/components/auth/Can';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import Avatar from '@/components/Avatar';
import getUserAvatarUrl from '@/utils/getUserAvatarUrl';

interface UsersTableProps {
	users: IAdminUser[];
	isLoading: boolean;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	onUserUpdated: () => void;
}

const columnHelper = createColumnHelper<IAdminUser>();

const UsersTable: React.FC<UsersTableProps> = ({ users, isLoading, onUserUpdated }) => {
	const { handleToggleUserStatus, handleDeleteUser, isActionLoading } = useUsersManagement();

	// Estados para los modales
	const [selectedUser, setSelectedUser] = useState<IAdminUser | null>(null);
	const [modals, setModals] = useState({
		details: false,
		delete: false,
	});
	const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

	// Funciones para manejar modales
	const openModal = (
		type: 'details' | 'delete',
		user: IAdminUser,
		mode: 'view' | 'edit' = 'view',
	) => {
		setSelectedUser(user);
		if (type === 'details') {
			setModalMode(mode);
		}
		setModals((prev) => ({ ...prev, [type]: true }));
	};

	const closeModal = (type: 'details' | 'delete') => {
		setModals((prev) => ({ ...prev, [type]: false }));
		setSelectedUser(null);
		if (type === 'details') {
			setModalMode('view');
		}
	};

	// Handlers para las acciones
	const handleDeleteConfirm = async () => {
		if (selectedUser) {
			await handleDeleteUser(selectedUser.id);
			closeModal('delete');
			onUserUpdated();
		}
	};

	const handleToggleStatus = async (user: IAdminUser) => {
		await handleToggleUserStatus(user.id);
		onUserUpdated();
	};

	const columns = [
		columnHelper.display({
			id: 'usuario',
			header: 'Usuario',
			cell: (info) => {
				const user = info.row.original;
				const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
				const avatarUrl = getUserAvatarUrl(user as any);

				return (
					<div className='flex min-w-[200px] items-center space-x-3'>
						<Avatar src={avatarUrl} name={fullName} className='h-10 w-10' />
						<div className='flex min-w-0 flex-col'>
							<span className='truncate text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{fullName || 'Sin nombre'}
							</span>
							<span className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
								{user.email}
							</span>
						</div>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'cargo_empresa',
			header: 'Cargo y Empresa',
			cell: (info) => {
				const user = info.row.original;
				const position = user.cargo || 'Sin cargo';
				// Empresa primaria del array companies
				const primaryCompany =
					user.companies?.find((c) => c.is_primary) || user.companies?.[0];
				const company = primaryCompany?.name || 'Sin empresa';

				return (
					<div className='flex min-w-[150px] flex-col'>
						<span className='truncate text-sm font-medium text-zinc-900 dark:text-zinc-100'>
							{position}
						</span>
						<span className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
							{company}
						</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'rut_celular',
			header: 'RUT y Contacto',
			cell: (info) => {
				const user = info.row.original;
				const rut = user.rut || 'Sin RUT';
				const celular = user.celular || 'Sin teléfono';

				return (
					<div className='flex min-w-[120px] flex-col'>
						<span className='truncate text-sm font-medium text-zinc-900 dark:text-zinc-100'>
							{rut}
						</span>
						<span className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
							{celular}
						</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'sucursal',
			header: 'Sucursal',
			cell: (info) => {
				const user = info.row.original;
				// Adaptarse a la estructura del API que puede tener branch_name o name
				const branchData = (user as any).branch;
				const branchName = branchData?.branch_name || branchData?.name || 'Sin sucursal';
				const subsidiaryName = branchData?.subsidiary?.subsidiary_name || '';

				return (
					<div className='flex min-w-[140px] flex-col'>
						<span className='truncate text-sm font-medium text-zinc-900 dark:text-zinc-100'>
							{branchName}
						</span>
						{subsidiaryName && (
							<span className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
								{subsidiaryName}
							</span>
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor('is_active', {
			header: 'Estado',
			cell: (info) => {
				const isActive = info.getValue();
				return (
					<div className='flex min-w-[100px] items-center'>
						<div
							className={`mr-2 h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}
						/>
						<span className='text-sm text-zinc-900 dark:text-zinc-100'>
							{isActive ? 'Activo' : 'Inactivo'}
						</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: (info) => {
				const user = info.row.original;
				const isLoading = isActionLoading(user.id);

				return (
					<div className='flex min-w-[200px] items-center space-x-1'>
						<Can any={['view-user']}>
							<Button
								variant='outline'
								size='sm'
								onClick={() => openModal('details', user, 'view')}
								className='flex items-center gap-1 px-2 py-1 text-xs'
								title='Gestionar usuario'>
								<Icon icon='HeroShieldCheck' className='h-3 w-3' />
								Gestionar
							</Button>
						</Can>

						<Can any={['edit-user']}>
							<Button
								variant='outline'
								size='sm'
								color={user.is_active ? 'red' : 'emerald'}
								onClick={() => handleToggleStatus(user)}
								isDisable={isLoading}
								className='flex items-center gap-1 px-2 py-1 text-xs'
								title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}>
								<Icon
									icon={
										isLoading
											? 'HeroArrowPath'
											: user.is_active
												? 'HeroXMark'
												: 'HeroCheck'
									}
									className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
								/>
								{user.is_active ? 'Desactivar' : 'Activar'}
							</Button>
						</Can>

						<Can any={['delete-user']}>
							<Button
								variant='outline'
								size='sm'
								color='red'
								onClick={() => openModal('delete', user)}
								isDisable={isLoading}
								className='flex items-center gap-1 px-2 py-1 text-xs'
								title='Eliminar usuario'>
								<Icon icon='HeroTrash' className='h-3 w-3' />
								Eliminar
							</Button>
						</Can>
					</div>
				);
			},
		}),
	];

	const table = useReactTable({
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil(users.length / 10),
	});

	if (isLoading && users.length === 0) {
		return (
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='p-12 text-center'>
					<div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
						<Icon
							icon='HeroArrowPath'
							className='h-10 w-10 animate-spin text-blue-600 dark:text-blue-400'
						/>
					</div>
					<h3 className='mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						Cargando usuarios...
					</h3>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Por favor espera mientras cargamos la información.
					</p>
				</CardBody>
			</Card>
		);
	}

	if (!isLoading && users.length === 0) {
		return (
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='p-12 text-center'>
					<div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
						<Icon icon='HeroUsers' className='h-10 w-10 text-zinc-400' />
					</div>
					<h3 className='mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						No hay usuarios
					</h3>
					<p className='mb-4 text-sm text-zinc-500 dark:text-zinc-400'>
						No se encontraron usuarios registrados.
					</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<>
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='p-0'>
					{/* Contenedor con scroll horizontal */}
					<div className='overflow-x-auto'>
						<Table className='w-full min-w-[1000px]'>
							<THead className='bg-zinc-50 dark:bg-zinc-800/50'>
								{table.getHeaderGroups().map((headerGroup) => (
									<Tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<Th
												key={header.id}
												className='whitespace-nowrap px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</Th>
										))}
									</Tr>
								))}
							</THead>
							<TBody className='divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900'>
								{table.getRowModel().rows.map((row) => (
									<Tr
										key={row.id}
										className='transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
										{row.getVisibleCells().map((cell) => (
											<Td key={cell.id} className='px-6 py-4'>
												<div className='max-w-xs'>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</div>
											</Td>
										))}
									</Tr>
								))}
							</TBody>
						</Table>
					</div>
				</CardBody>
			</Card>

			{/* Modales */}
			<UserDetailsModal
				isOpen={modals.details}
				onClose={() => closeModal('details')}
				user={selectedUser}
				mode={modalMode}
				onModeChange={setModalMode}
				onUserUpdated={onUserUpdated}
			/>

			<DeleteConfirmationModal
				isOpen={modals.delete}
				onClose={() => closeModal('delete')}
				onConfirm={handleDeleteConfirm}
				user={selectedUser}
				isDeleting={selectedUser ? isActionLoading(selectedUser.id) : false}
			/>
		</>
	);
};

export default UsersTable;
