import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { THead, Tr, Th, TBody, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import {
	createColumnHelper,
	getCoreRowModel,
	useReactTable,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	flexRender,
	SortingState,
} from '@tanstack/react-table';
import Input from '@/components/form/Input';
import { IUserMe } from '@/interface/user.interface';
import { useAppSelector } from '@/store';
import Icon from '@/components/icon/Icon';

const columnHelper = createColumnHelper<IUserMe>();

export default function UsuarioLista() {
	const user = useAppSelector((s) => s.auth.user);
	const empresaId = user?.company?.id;

	const [usuarios, setUsuarios] = useState<IUserMe[]>([]);
	const [loading, setLoading] = useState(true);
	const [globalFilter, setGlobalFilter] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);

	useEffect(() => {
		if (!user) return; // aún no cargado

		// Si el usuario es super-admin, puede ver todos los usuarios
		if (user.authority?.includes('super-admin')) {
			const fetchAllUsers = async () => {
				try {
					const { data } = await ApiService.fetchData<{ usuarios: IUserMe[] }>({
						url: '/admin/users',
						method: 'get',
					});
					setUsuarios(data.usuarios);
				} catch (error: any) {
					toast.error(error?.response?.data?.message || 'Error al cargar usuarios');
				} finally {
					setLoading(false);
				}
			};
			fetchAllUsers();
			return;
		}

		// Para otros roles, necesita tener empresa asignada
		if (!empresaId) {
			toast.warn('Este usuario no tiene empresa asignada');
			setLoading(false);
			return;
		}

		const fetchUsuarios = async () => {
			try {
				const { data } = await ApiService.fetchData<{ usuarios: IUserMe[] }>({
					url: '/my-company/users',
					method: 'get',
				});
				setUsuarios(data.usuarios);
			} catch (error: any) {
				toast.error(error?.response?.data?.message || 'Error al cargar usuarios');
			} finally {
				setLoading(false);
			}
		};

		fetchUsuarios();
	}, [user, empresaId]);

	const columns = [
		columnHelper.accessor('first_name', { header: 'Nombre', cell: (info) => info.getValue() }),
		columnHelper.accessor('last_name', { header: 'Apellido', cell: (info) => info.getValue() }),
		columnHelper.accessor('email', { header: 'Email', cell: (info) => info.getValue() }),
		columnHelper.accessor('rut', { header: 'RUT', cell: (info) => info.getValue() ?? '—' }),
		columnHelper.accessor('position', {
			header: 'Rol / Cargo',
			cell: (info) => info.getValue() ?? '—',
		}),
		columnHelper.accessor('subsidiary.name', {
			header: 'Subempresa',
			cell: (info) => info.row.original.subsidiary?.name ?? '—',
		}),
		columnHelper.accessor('branch.name', {
			header: 'Sucursal',
			cell: (info) => info.row.original.branch?.name ?? '—',
		}),
	];

	const table = useReactTable({
		data: usuarios,
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

	return (
		<PageWrapper isProtectedRoute title='Usuarios' name='Usuarios'>
			<Subheader>
				<SubheaderLeft>
					<Badge className='text-xl'>Usuarios de la Empresa</Badge>
				</SubheaderLeft>
				<SubheaderRight>
					<Input
						name='search'
						placeholder='Buscar...'
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className='w-48 rounded border'
					/>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card>
					<CardBody className='overflow-auto'>
						{loading ? (
							<div className='p-8 text-center'>Cargando usuarios…</div>
						) : usuarios.length === 0 ? (
							<div className='p-8 text-center text-gray-600'>
								No hay usuarios registrados
							</div>
						) : (
							<>
								<Table className='w-full table-fixed'>
									<THead>
										{table.getHeaderGroups().map((hg) => (
											<Tr key={hg.id}>
												{hg.headers.map((header) => (
													<Th key={header.id} className='text-left'>
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
											<Tr key={row.id}>
												{row.getVisibleCells().map((cell) => (
													<Td key={cell.id}>
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
							</>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
}
