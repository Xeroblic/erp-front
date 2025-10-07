import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table';
import Input from '@/components/form/Input';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
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
import Button from '@/components/ui/Button';
import { useFormik } from 'formik';
import {
	fetchUsuariosConRolesPerms,
	updateUsuarioRolesPerms,
} from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import * as Yup from 'yup';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Label from '@/components/form/Label';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { fetchPermissions, fetchRoles } from '@/store/slices/permissions/permissionsSlice';
import { formatPermissionName, formatRoleName } from '@/pages/admin/Permission/utils/formatters';

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

const RolesPermisos: React.FC = () => {
	const dispatch = useAppDispatch();
	const { data: usuarios, status, error } = useAppSelector((s) => s.rolesPermisos);
	const { roles: availableRoles, permissions: availablePermissions } = useAppSelector(
		(s) => s.permissions,
	);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);

	useEffect(() => {
		dispatch(fetchUsuariosConRolesPerms());
		dispatch(fetchRoles());
		dispatch(fetchPermissions());
	}, [dispatch]);

	const tableData: UserRow[] = useMemo(() => {
		if (!usuarios) return [];

		return usuarios.map((user) => {
			const displayName =
				[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || '—';

			const cargoResolved =
				user.cargo ||
				user.companies?.[0]?.position ||
				user.position ||
				user.branch?.position ||
				'—';

			const companyResolved =
				user.branch?.subsidiary?.company?.company_name ||
				user.companies?.[0]?.name ||
				'—';

			const uniqueRoles = Array.from(
				new Set([
					...(user.global_roles ?? []),
					...(user.contextual_roles?.map((cr) => cr.role) ?? []),
				]),
			);

			const directPermissionsCount = user.direct_permissions?.length ?? 0;
			const totalPermissionsCount = user.all_permissions?.length ?? 0;

			const searchText = [
				displayName,
				user.email ?? '',
				cargoResolved,
				companyResolved,
				uniqueRoles.join(' '),
			]
				.join(' ')
				.toLowerCase();

			return {
				...user,
				displayName,
				cargoResolved,
				companyResolved,
				uniqueRoles,
				directPermissionsCount,
				totalPermissionsCount,
				searchText,
			};
		});
	}, [usuarios]);

	const openEditor = useCallback((user: UserRow) => {
		setEditingUser(user);
	}, []);

	const columns = useMemo(
		() => [
			columnHelper.display({
				id: 'usuario',
				header: 'Usuario',
				cell: (info) => {
					const user = info.row.original;
					return (
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-500 font-semibold text-white'>
								{user.first_name?.charAt(0) ?? '—'}
								{user.last_name?.charAt(0) ?? ''}
							</div>
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
					if (!roles.length) {
						return <span className='text-zinc-400'>Sin roles asignados</span>;
					}

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
							<div className='text-lg font-semibold'>{user.totalPermissionsCount}</div>
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
					<Badge color={info.getValue() ? 'emerald' : 'red'} className='inline-flex items-center gap-1'>
						<div
							className={`h-2 w-2 rounded-full ${
								info.getValue() ? 'bg-emerald-300' : 'bg-red-300'
							}`}
						/>
						{info.getValue() ? 'Activo' : 'Inactivo'}
					</Badge>
				),
			}),
			columnHelper.display({
				id: 'acciones',
				header: 'Acciones',
				cell: (info) => (
					<Button variant='outline' size='sm' onClick={() => openEditor(info.row.original)}>
						Editar
					</Button>
				),
			}),
		],
		[openEditor],
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
		initialState: { pagination: { pageSize: 5 } },
		enableGlobalFilter: true,
		globalFilterFn,
	});

	const roleOptions = useMemo<TSelectOption[]>(() => {
		return availableRoles.map((role) => ({
			value: role.name,
			label: formatRoleName(role.name),
		}));
	}, [availableRoles]);

	const permissionOptions = useMemo<TSelectOption[]>(() => {
		return availablePermissions.map((permission) => ({
			value: permission.name,
			label: formatPermissionName(permission.name),
		}));
	}, [availablePermissions]);

	const extractUserRoles = useCallback((user: UserWithDetails | null) => {
		if (!user) return [];
		return Array.from(
			new Set([
				...(user.global_roles ?? []),
				...(user.contextual_roles?.map((cr) => cr.role) ?? []),
			]),
		);
	}, []);

	const currentRoles = useMemo(() => extractUserRoles(editingUser), [editingUser, extractUserRoles]);
	const currentPermissions = useMemo(
		() => editingUser?.direct_permissions ?? [],
		[editingUser],
	);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			roles: currentRoles,
			permisos: currentPermissions,
		},
		validationSchema: Yup.object({
			roles: Yup.array().min(1, 'Seleccione al menos un rol'),
			permisos: Yup.array(),
		}),
		onSubmit: (values) => {
			if (editingUser) {
				dispatch(
					updateUsuarioRolesPerms({
						id: editingUser.id,
						nextRoles: values.roles,
						nextPermissions: values.permisos,
						currentRoles,
						currentPermissions,
					}),
				).then(() => {
					dispatch(fetchUsuariosConRolesPerms());
					setEditingUser(null);
				});
			}
		},
	});

	return (
		<PageWrapper isProtectedRoute title='Roles y Permisos' name='Roles y Permisos '>
			<Subheader>
				<SubheaderLeft>
					<h1 className='text-2xl font-semibold'>Roles y Permisos</h1>
					<Badge className='ml-4'>
						{status === 'loading'
							? 'Cargando...'
							: `${table.getPrePaginationRowModel().rows.length} usuarios`}
					</Badge>
				</SubheaderLeft>
				<SubheaderRight>
					<Input
						name='globalFilter'
						type='text'
						placeholder='Buscar...'
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className='w-full max-w-xs rounded border'
					/>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				{status === 'loading' && <div className='py-8 text-center'>Cargando usuarios...</div>}
				{status === 'failed' && <div className='py-8 text-red-600'>Error: {error}</div>}
				{status === 'idle' && (
					<Card>
						<CardBody className='overflow-auto'>
							<Table className='min-w-full table-fixed'>
								<THead>
									{table.getHeaderGroups().map((hg) => (
										<Tr key={hg.id}>
											{hg.headers.map((header) => (
												<Th key={header.id} className='text-left'>
													{header.isPlaceholder ? null : (
														<div
															{...{
																className:
																	header.column.getCanSort()
																		? 'cursor-pointer select-none flex items-center'
																		: '',
																onClick:
																	header.column.getToggleSortingHandler(),
															}}>
															{flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
															{{
																asc: <span className='ml-1'>▲</span>,
																desc: <span className='ml-1'>▼</span>,
															}[header.column.getIsSorted() as string] ?? null}
														</div>
													)}
												</Th>
											))}
										</Tr>
									))}
								</THead>
								<TBody>
									{table.getRowModel().rows.map((row) => (
										<Tr key={row.id}>
											{row.getVisibleCells().map((cell) => (
												<Td key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</Td>
											))}
										</Tr>
									))}
								</TBody>
							</Table>
							<div className='mt-2'>
								<TableCardFooterTemplateV2 table={table} />
							</div>
						</CardBody>
					</Card>
				)}
			</Container>

			<Modal
				isOpen={!!editingUser}
				setIsOpen={(open) => {
					if (!open) setEditingUser(null);
				}}>
				<ModalHeader>
					Editar{' '}
					{editingUser
						? [editingUser.first_name, editingUser.last_name].filter(Boolean).join(' ') ||
							editingUser.email
						: ''}
				</ModalHeader>
				<ModalBody>
					<form onSubmit={formik.handleSubmit} className='space-y-4'>
						<Label htmlFor='roles'>Roles</Label>
						<SelectReact
							id='roles'
							name='roles'
							isMulti
							options={roleOptions}
							value={formik.values.roles.map((roleName) => {
								const option = roleOptions.find((opt) => opt.value === roleName);
								return (
									option ?? {
										value: roleName,
										label: formatRoleName(roleName),
									}
								);
							})}
							onChange={(newValue) =>
								formik.setFieldValue(
									'roles',
									Array.isArray(newValue) ? newValue.map((o) => o.value) : [],
								)
							}
						/>
						{formik.touched.roles && formik.errors.roles && (
							<div className='text-sm text-red-600'>{formik.errors.roles as string}</div>
						)}

						<Label htmlFor='permisos'>Permisos</Label>
						<SelectReact
							id='permisos'
							name='permisos'
							isMulti
							options={permissionOptions}
							value={formik.values.permisos.map((permName) => {
								const option = permissionOptions.find((opt) => opt.value === permName);
								return (
									option ?? {
										value: permName,
										label: formatPermissionName(permName),
									}
								);
							})}
							onChange={(newValue) => {
								if (Array.isArray(newValue)) {
									formik.setFieldValue(
										'permisos',
										newValue.map((o) => o.value),
									);
								} else if (newValue && typeof newValue === 'object' && 'value' in newValue) {
									formik.setFieldValue('permisos', [newValue.value]);
								} else {
									formik.setFieldValue('permisos', []);
								}
							}}
						/>
					</form>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={() => setEditingUser(null)}>
							Cancelar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button variant='solid' onClick={() => formik.handleSubmit()}>
							Guardar
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
};

export default RolesPermisos;
