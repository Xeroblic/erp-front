import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import type { FilterFn } from '@tanstack/react-table';
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import ApiService from '@/services/ApiService';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { formatRoleName } from '@/pages/admin/Permission/utils/formatters';
import { useAppSelector } from '@/store';

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

const globalFilterFn: FilterFn<UserRow> = (row, _columnId, filterValue) => {
	if (!filterValue) return true;
	return row.original.searchText.includes(String(filterValue).toLowerCase());
};

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
	const [sorting, setSorting] = useState<SortingState>([]);
	const currentUser = useAppSelector((s) => s.auth.user);
	const isSuperAdmin = useMemo(() => {
		const roles = [
			...(currentUser?.roles ?? []),
			...(Array.isArray(currentUser?.authority) ? currentUser.authority : []),
		].map((r) => (typeof r === 'string' ? r.toLowerCase() : String(r).toLowerCase()));
		return roles.includes('super-admin') || roles.includes('superadmin');
	}, [currentUser]);

	const handleManageUser = (userId: number) => {
		navigate(`/gestion/roles-permisos/${userId}`);
	};

	const columns = useMemo(
		() => [
			columnHelper.display({
				id: 'usuario',
				header: 'Usuario',
				cell: (info) => {
					const user = info.row.original;
					return (
						<div className='flex items-center gap-3'>
							{(() => {
								const anyUser: any = user as any;
								const img = anyUser?.image;
								let avatarUrl: string | null = null;
								if (typeof img === 'string') avatarUrl = img;
								else if (img && typeof img === 'object') {
									avatarUrl =
										img.md ??
										img.sm ??
										img.lg ??
										img.original_url ??
										img.url ??
										null;
								}
								if (!avatarUrl) avatarUrl = anyUser?.image_url ?? null;

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
			columnHelper.display({
				id: 'acciones',
				header: 'Acciones',
				cell: (info) => (
					<div className='flex gap-2'>
						<Button
							variant='outline'
							size='sm'
							color='amber'
							onClick={() => handleManageUser(info.row.original.id)}>
							<Icon icon='HeroCog6Tooth' className='mr-1' />
							Gestionar
						</Button>
						<Button
							variant='outline'
							size='sm'
							color={info.row.original.is_active ? 'red' : 'emerald'}>
							<Icon
								icon={
									info.row.original.is_active ? 'HeroXCircle' : 'HeroCheckCircle'
								}
								className='mr-1'
							/>
							{info.row.original.is_active ? 'Desactivar' : 'Activar'}
						</Button>
						{isSuperAdmin && (
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
									} catch (err: any) {
										toast.error('No se pudo asignar la empresa');
									}
								}}>
								Asignar empresa 1
							</Button>
						)}
					</div>
				),
			}),
		],
		[navigate],
	);

	const table = useReactTable({
		data: tableData,
		columns,
		state: { sorting, globalFilter },
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
		enableGlobalFilter: true,
		globalFilterFn,
	});

	return (
		<div>
			<Card className='overflow-hidden'>
				<CardBody className='p-0'>
					<div className='flex items-center justify-between border-b border-zinc-700 p-6'>
						<div className='flex items-center gap-3'>
							<div className='rounded-lg bg-blue-500/10 p-2'>
								<Icon icon='HeroUsers' className='h-6 w-6 text-blue-400' />
							</div>
							<div>
								<h2 className='text-lg font-semibold'>Lista de Usuarios</h2>
								<p className='text-sm'>Gestiona permisos y roles de usuarios</p>
							</div>
						</div>
						<div className='rounded-full px-4 py-1.5'>
							<span className='text-sm font-medium'>
								<Icon icon='HeroUsers' className='mr-1 inline h-4 w-4' />
								{tableData.length} usuarios encontrados
							</span>
						</div>
						<p className='text-xs text-zinc-500'>
							Última actualización: {new Date().toLocaleDateString('es-ES')}
						</p>
					</div>

					<div className='overflow-x-auto'>
						{status === 'loading' && (
							<div className='py-12 text-center text-zinc-400'>
								Cargando usuarios...
							</div>
						)}
						{status === 'failed' && (
							<div className='py-12 text-center text-red-400'>Error: {error}</div>
						)}
						{status === 'idle' && (
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
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default TableUser;
