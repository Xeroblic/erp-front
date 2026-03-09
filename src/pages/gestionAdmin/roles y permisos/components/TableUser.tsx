import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import ApiService from '@/services/ApiService';
import { toggleUserStatus, type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { formatRoleName } from '@/pages/admin/Permission/utils/formatters';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUsuariosConRolesPerms } from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Tooltip from '@/components/ui/Tooltip';
import { zinc } from 'tailwindcss/colors';

type UserRow = UserWithDetails & {
	displayName: string;
	cargoResolved: string;
	companyResolved: string;
	uniqueRoles: string[];
	directPermissionsCount: number;
	totalPermissionsCount: number;
	searchText: string;
};

const columnHelper = createColumnHelper<UserRow>();

type Props = {
	tableData: UserRow[];
	status: 'idle' | 'loading' | 'failed' | string;
	error?: string | null;
	globalFilter: string;
	setGlobalFilter: (v: string) => void;
};

const TableUser: React.FC<Props> = ({
	tableData,
	status,
	error,
	globalFilter,
	setGlobalFilter,
}) => {
	const navigate = useNavigate();
	const currentUser = useAppSelector((s) => s.auth.user);
	const dispatch = useAppDispatch();

	const isAdmin = useMemo(() => {
		const roles = [
			...(currentUser?.roles ?? []),
			...(Array.isArray(currentUser?.authority) ? currentUser.authority : []),
		].map((r) => (typeof r === 'string' ? r.toLowerCase() : String(r).toLowerCase()));
		return roles.includes('admin') || roles.includes('super-admin');
	}, [currentUser]);

	const handleManageUser = (userId: number) => {
		navigate(`/gestion/roles-permisos/${userId}`);
	};

	const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
		try {
			const response = await dispatch(
				toggleUserStatus({ userId: userId, status: currentStatus }),
			);
			if (response.meta.requestStatus === 'fulfilled') {
				const data = await dispatch(fetchUsuariosConRolesPerms());
				console.log(data);
			} else {
				toast.error(error + ' ' + 'No se ha podido obtener los datos de la tabla');
			}
			toast.success('Estado del usuario cambiado exitosamente');
		} catch (err) {
			console.error('Error al cambiar el estado del usuario:', err);
		}
	};

	const columns = useMemo(
		() =>
			[
				columnHelper.display({
					id: 'usuario',
					header: 'Usuario',
					cell: (info) => {
						const user = info.row.original;
						return (
							<div className='flex items-center gap-3'>
								{(() => {
									const typedUser = user as UserRow & {
										image?: unknown;
										image_url?: string;
									};
									const img = typedUser?.image;
									let avatarUrl: string | null = null;
									if (typeof img === 'string') avatarUrl = img;
									else if (img && typeof img === 'object') {
										avatarUrl =
											(img as any).md ??
											(img as any).sm ??
											(img as any).lg ??
											(img as any).original_url ??
											(img as any).url ??
											null;
									}
									if (!avatarUrl) avatarUrl = typedUser?.image_url ?? null;

									if (avatarUrl) {
										return (
											<img
												src={avatarUrl}
												alt={
													user.displayName ??
													`${user.first_name} ${user.last_name}`
												}
												className='h-10 w-10 flex-shrink-0 rounded-full object-cover'
											/>
										);
									}

									const initials = `${user.first_name?.charAt(0) ?? '—'}${user.last_name?.charAt(0) ?? ''}`;
									return (
										<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-500 font-semibold text-white'>
											{initials}
										</div>
									);
								})()}
								<div>
									<div className='font-medium'>{user.displayName}</div>
									<div className='text-sm text-zinc-500'>{user.email}</div>
								</div>
							</div>
						);
					},
				}),
				columnHelper.display({
					id: 'cargoEmpresa',
					header: 'Cargo y Empresa',
					cell: (info) => {
						const user = info.row.original;
						return (
							<div>
								<div className='font-medium'>{user.cargoResolved}</div>
								<div className='text-sm text-zinc-500'>{user.companyResolved}</div>
							</div>
						);
					},
				}),
				columnHelper.display({
					id: 'roles',
					header: 'Roles Asignados',
					cell: (info) => {
						const roles = info.row.original.uniqueRoles;
						if (!roles.length)
							return <span className='text-zinc-400'>Sin roles asignados</span>;
						return (
							<div className='flex flex-wrap gap-1'>
								{roles.slice(0, 3).map((role) => (
									<Badge key={role} color='blue' className='text-xs'>
										{formatRoleName(role)}
									</Badge>
								))}
								{roles.length > 3 && (
									<Badge color='zinc' className='text-xs'>
										+{roles.length - 3} más
									</Badge>
								)}
							</div>
						);
					},
				}),
				columnHelper.display({
					id: 'permisos',
					header: 'Permisos',
					cell: (info) => {
						const user = info.row.original;
						return (
							<div className='text-center'>
								<div className='text-lg font-semibold'>
									{user.totalPermissionsCount}
								</div>
								<div className='text-xs text-zinc-500'>
									{user.directPermissionsCount} directo
									{user.directPermissionsCount === 1 ? '' : 's'}
								</div>
							</div>
						);
					},
				}),
				columnHelper.accessor('is_active', {
					header: 'Estado',
					cell: (info) => (
						<Badge
							color={info.getValue() ? 'emerald' : 'red'}
							className='inline-flex items-center gap-1'>
							<div
								className={`h-2 w-2 rounded-full ${info.getValue() ? 'bg-emerald-300' : 'bg-red-300'}`}
							/>
							{info.getValue() ? 'Activo' : 'Inactivo'}
						</Badge>
					),
				}),
				isAdmin &&
					columnHelper.display({
						id: 'acciones',
						header: 'Acciones',
						cell: (info) => (
							<div className='flex gap-2'>
								<PermissionGuard role={'admin'}>
									<Tooltip text='Gestionar'>
										<Button
											variant='outline'
											color='zinc'
											size='xs'
											className='bg-gray-300 hover:bg-gray-400'
											onClick={() => handleManageUser(info.row.original.id)}>
											<Icon
												icon='HeroCog6Tooth'
												className='text-2xl'
												color={'zinc'}
											/>
										</Button>
									</Tooltip>
								</PermissionGuard>

								<PermissionGuard role={'super-admin'}>
									<Tooltip
										text={
											info.row.original.is_active ? 'Inactivar' : 'Activar'
										}>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												handleToggleStatus(
													info.row.original.id,
													info.row.original.is_active,
												)
											}
											className={
												info.row.original.is_active
													? 'bg-red-500/20 hover:bg-red-500/10'
													: 'bg-green-500/30 hover:bg-green-500/10'
											}
											color={info.row.original.is_active ? 'red' : 'emerald'}>
											<Icon
												icon={
													info.row.original.is_active
														? 'DuoErrorCircle'
														: 'DuoDoneCircle'
												}
												className='mr-1 text-2xl'
												color={
													info.row.original.is_active ? 'red' : 'emerald'
												}
											/>
											{info.row.original.is_active}
										</Button>
									</Tooltip>
									<Button
										variant='solid'
										size='sm'
										color='blue'
										icon='HeroBuildingOffice'
										onClick={async () => {
											try {
												await ApiService.fetchData({
													url: `/users/${info.row.original.id}`,
													method: 'patch',
													data: { company_id: 1 },
												});
												toast.success('Empresa asignada (id 1)');
											} catch (err: unknown) {
												toast.error('No se pudo asignar la empresa');
											}
										}}>
										Asignar empresa 1
									</Button>
								</PermissionGuard>
							</div>
						),
					}),
			].filter(Boolean) as ColumnDef<UserRow, unknown>[],
		[navigate, isAdmin],
	);

	return (
		<DataTable<UserRow>
			columns={columns}
			data={tableData}
			loading={status === 'loading'}
			emptyMessage={
				status === 'failed'
					? `Error: ${error ?? 'Error desconocido'}`
					: 'No se encontraron usuarios'
			}
			searchPlaceholder='Buscar usuario por nombre, email, cargo...'
			searchValue={globalFilter}
			onSearchChange={setGlobalFilter}
			pageSize={10}
		/>
	);
};

export default TableUser;
