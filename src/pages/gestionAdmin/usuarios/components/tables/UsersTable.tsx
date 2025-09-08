import React, { useState } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';

import { useUsersManagement } from '../../hooks/useUsersManagement';
import { UserDetailsModal, DeleteConfirmationModal } from '../modals';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import { IUserMe } from '@/interface/user.interface';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';

interface UsersTableProps {
	users: IUserMe[];
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

const columnHelper = createColumnHelper<IUserMe>();

const UsersTable: React.FC<UsersTableProps> = ({ users, isLoading, pagination, onUserUpdated }) => {
	const { handleToggleUserStatus, handleDeleteUser, isActionLoading } = useUsersManagement();

	// Estados para los modales
	const [selectedUser, setSelectedUser] = useState<IUserMe | null>(null);
	const [modals, setModals] = useState({
		details: false,
		delete: false,
	});
	const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

	// Funciones para manejar modales
	const openModal = (
		type: 'details' | 'delete',
		user: IUserMe,
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

	const handleToggleStatus = async (user: IUserMe) => {
		await handleToggleUserStatus(user.id);
		onUserUpdated();
	};

	const columns = [
		columnHelper.display({
			id: 'full_name',
			header: 'Nombre Completo',
			cell: (info) => {
				const user = info.row.original;
				const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
				const email = user.email;

				return (
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700'>
							<Icon
								icon='HeroUser'
								className='h-5 w-5 text-zinc-600 dark:text-zinc-300'
							/>
						</div>
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{fullName || 'Sin nombre'}
							</span>
							<span className='text-xs text-zinc-500 dark:text-zinc-400'>
								{email}
							</span>
						</div>
					</div>
				);
			},
		}),
		columnHelper.accessor('position', {
			header: 'Cargo',
			cell: (info) => {
				const position = info.getValue();
				return (
					<span className='text-sm text-zinc-900 dark:text-zinc-100'>
						{position || '—'}
					</span>
				);
			},
		}),
		columnHelper.display({
			id: 'branch',
			header: 'Sucursal',
			cell: (info) => {
				const user = info.row.original;
				const branchName = user.branch?.name;

				if (!branchName) {
					return <span className='text-zinc-500 dark:text-zinc-400'>—</span>;
				}

				return (
					<div className='flex items-center space-x-2'>
						<Icon icon='HeroOfficeBuilding' className='h-4 w-4 text-zinc-500' />
						<span className='text-sm text-zinc-900 dark:text-zinc-100'>
							{branchName}
						</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'roles',
			header: 'Roles',
			cell: (info) => {
				const user = info.row.original;
				const roles = user.roles || [];

				if (roles.length === 0) {
					return <span className='text-zinc-500 dark:text-zinc-400'>—</span>;
				}

				const roleLabels: Record<string, string> = {
					'super-admin': 'Super Admin',
					admin: 'Administrador',
					hr: 'RRHH',
					employee: 'Empleado',
					manager: 'Gerente',
					supervisor: 'Supervisor',
				};

				const roleColors: Record<string, { color: any; variant: any }> = {
					'super-admin': { color: 'purple', variant: 'solid' },
					admin: { color: 'blue', variant: 'solid' },
					hr: { color: 'emerald', variant: 'solid' },
					employee: { color: 'zinc', variant: 'outline' },
					manager: { color: 'amber', variant: 'solid' },
					supervisor: { color: 'orange', variant: 'solid' },
				};

				return (
					<div className='flex flex-wrap gap-1'>
						{roles.slice(0, 2).map((role) => {
							const config = roleColors[role] || {
								color: 'zinc',
								variant: 'outline',
							};
							const label = roleLabels[role] || role;

							return (
								<Badge
									key={role}
									color={config.color}
									variant={config.variant}
									className='text-xs'>
									{label}
								</Badge>
							);
						})}
						{roles.length > 2 && (
							<Badge variant='outline' className='text-xs'>
								+{roles.length - 2}
							</Badge>
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
					<Badge
						color={isActive ? 'emerald' : 'red'}
						variant={isActive ? 'solid' : 'outline'}
						className='inline-flex items-center text-xs font-medium'>
						<Icon
							icon={isActive ? 'HeroCheckCircle' : 'HeroXCircle'}
							className='me-1.5 h-4 w-4'
						/>
						{isActive ? 'Activo' : 'Inactivo'}
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'company',
			header: 'Empresa',
			cell: (info) => {
				const user = info.row.original;
				const company = user.company;

				if (!company) {
					return <span className='text-zinc-500 dark:text-zinc-400'>—</span>;
				}

				return (
					<div className='flex items-center space-x-2'>
						<Icon icon='HeroBuilding2' className='h-4 w-4 text-zinc-500' />
						<span className='text-sm text-zinc-900 dark:text-zinc-100'>
							{company.name}
						</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'user_info',
			header: 'Información Adicional',
			cell: (info) => {
				const user = info.row.original;

				return (
					<div className='flex flex-col space-y-1'>
						{user.phone_number && (
							<div className='flex items-center space-x-1'>
								<Icon icon='HeroPhone' className='h-3 w-3 text-zinc-400' />
								<span className='text-xs text-zinc-500 dark:text-zinc-400'>
									{user.phone_number}
								</span>
							</div>
						)}
						{user.rut && (
							<div className='flex items-center space-x-1'>
								<Icon icon='HeroIdentification' className='h-3 w-3 text-zinc-400' />
								<span className='text-xs text-zinc-500 dark:text-zinc-400'>
									{user.rut}
								</span>
							</div>
						)}
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Acciones',
			cell: (info) => {
				const user = info.row.original;
				const isLoading = isActionLoading(user.id);

				return (
					<div className='flex items-center justify-end space-x-2'>
						{/* Ver Detalles */}
						<Button
							variant='outline'
							size='sm'
							onClick={() => openModal('details', user, 'view')}
							className='flex items-center justify-center p-0 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20'
							title='Ver detalles'>
							<Icon icon='HeroEye' />
						</Button>

						{/* Editar */}
						<Button
							variant='outline'
							size='sm'
							onClick={() => openModal('details', user, 'edit')}
							isDisable={isLoading}
							className='flex items-center justify-center p-0 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
							title='Editar usuario'>
							{isLoading ? (
								<Icon icon='HeroArrowPath' className='animate-spin' />
							) : (
								<Icon icon='HeroPencilSquare' />
							)}
						</Button>

						{/* Activar/Desactivar */}
						<Button
							variant='outline'
							size='sm'
							color={user.is_active ? 'red' : 'emerald'}
							onClick={() => handleToggleStatus(user)}
							isDisable={isLoading}
							className='flex items-center justify-center p-0 transition-colors'
							title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}>
							{isLoading ? (
								<Icon icon='HeroArrowPath' className='animate-spin' />
							) : (
								<Icon icon={user.is_active ? 'HeroXMark' : 'HeroCheck'} />
							)}
						</Button>

						{/* Eliminar */}
						<Button
							variant='outline'
							size='sm'
							color='red'
							onClick={() => openModal('delete', user)}
							isDisable={isLoading}
							className='flex items-center justify-center p-0 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20'
							title='Eliminar usuario'>
							{isLoading ? (
								<Icon icon='HeroArrowPath' className='animate-spin' />
							) : (
								<Icon icon='HeroTrash' />
							)}
						</Button>
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
		pageCount: pagination.totalPages,
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
					<Button
						variant='outline'
						icon='HeroPlus'
						onClick={() => {
							console.log('Crear nuevo usuario');
						}}>
						Crear nuevo usuario
					</Button>
				</CardBody>
			</Card>
		);
	}

	return (
		<>
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='overflow-x-auto p-0'>
					<Table className='w-full'>
						<THead className='bg-zinc-50 dark:bg-zinc-800/50'>
							{table.getHeaderGroups().map((headerGroup) => (
								<Tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<Th
											key={header.id}
											className='border-b border-zinc-200 p-4 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'>
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
						<TBody>
							{table.getRowModel().rows.map((row, index) => (
								<Tr
									key={row.id}
									className={`transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-800/20'} border-b border-zinc-100 dark:border-zinc-800`}>
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

					<div className='mt-4'>
						<TableCardFooterTemplateV2 table={table} />
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
