import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMisSucursales,
	createSucursal,
	deleteSucursal,
} from '@/store/slices/sucursales/sucursalesSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import SucursalModal from './components/SucursalModal';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { ISucursal } from '@/interface/empresas.interface';
import { toast } from 'react-toastify';

const columnHelper = createColumnHelper<ISucursal>();

export default function SucursalesLista() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const user = useAppSelector((s) => s.auth.user);

	interface SucursalesState {
		lista: ISucursal[];
		loading: boolean;
		createLoading: boolean;
	}

	const {
		lista: sucursales = [],
		loading,
		createLoading,
	}: SucursalesState = useAppSelector((s: { sucursales: SucursalesState }) => s.sucursales);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [openCreate, setOpenCreate] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [toDeleteId, setToDeleteId] = useState<number | null>(null);
	const [editingSucursal, setEditingSucursal] = useState<ISucursal | null>(null);

	useEffect(() => {
		if (user) {
			dispatch(fetchMisSucursales());
		}
	}, [dispatch, user]);

	// columnas de la tabla
	const columns = [
		columnHelper.accessor('name', {
			header: 'Sucursal',
			cell: (info) => (
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
						<Icon icon='HeroBuildingOffice' className='text-lg text-primary-600' />
					</div>
					<div>
						<div className='font-medium'>{info.getValue()}</div>
						<div className='text-xs text-zinc-500'>ID: {info.row.original.id}</div>
					</div>
				</div>
			),
		}),
		columnHelper.accessor('subsidiary_name', {
			header: 'Subsidiaria',
			cell: (info) => {
				const value = info.getValue();
				return value ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroBuildingStorefront' className='text-xs text-zinc-400' />
						<span className='text-sm'>{value}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin subsidiaria
					</Badge>
				);
			},
		}),
		columnHelper.accessor('rut', {
			header: 'RUT',
			cell: (info) => {
				const value = info.getValue();
				return value ? (
					<span className='font-mono text-sm'>{value}</span>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin RUT
					</Badge>
				);
			},
		}),
		columnHelper.accessor('address', {
			header: 'Dirección',
			cell: (info) => {
				const value = info.getValue();
				return value ? (
					<div className='max-w-xs'>
						<span className='text-sm'>{value}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin dirección
					</Badge>
				);
			},
		}),
		columnHelper.accessor('commune_name' as any, {
			header: 'Comuna',
			cell: (info) => {
				const value = (info.row.original as any).commune_name;
				return value ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroMap' className='text-xs text-zinc-400' />
						<span className='text-sm'>{value}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin comuna
					</Badge>
				);
			},
		}),
		columnHelper.accessor('phone', {
			header: 'Teléfono',
			cell: (info) => {
				const value = info.getValue();
				return value ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroPhone' className='text-xs text-zinc-400' />
						<span className='text-sm'>{value}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin teléfono
					</Badge>
				);
			},
		}),
		columnHelper.accessor('manager_name', {
			header: 'Encargado',
			cell: (info) => {
				const value = info.getValue();
				return value ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroUser' className='text-xs text-zinc-400' />
						<span className='text-sm'>{value}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin encargado
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: (info) => (
				<div className='flex justify-end gap-2'>
					<Button
						variant='outline'
						size='sm'
						icon='HeroPencil'
						onClick={() => handleEdit(info.row.original)}
						className='p-1'
					/>
					<Button
						variant='outline'
						size='sm'
						icon='HeroEye'
						onClick={() => navigate(`/gestion/sucursal/${info.row.original.id}`)}
						className='p-1'
					/>
					<Button
						variant='solid'
						size='sm'
						icon='HeroTrash'
						color='red'
						onClick={() => {
							setToDeleteId(info.row.original.id);
							setOpenDelete(true);
						}}
						className='p-1'
					/>
				</div>
			),
		}),
	];

	const table = useReactTable({
		data: sucursales,
		columns,
		state: { sorting, globalFilter },
		onSortingChange: setSorting,
		enableGlobalFilter: true,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 5 } },
	});

	const handleEdit = (sucursal: ISucursal) => {
		setEditingSucursal(sucursal);
		setOpenCreate(true);
	};

	const handleCreate = () => {
		setEditingSucursal(null);
		setOpenCreate(true);
	};

	const handleCloseModal = () => {
		setOpenCreate(false);
		setEditingSucursal(null);
	};

	const handleSuccess = () => {
		handleCloseModal();
		dispatch(fetchMisSucursales());
	};

	const confirmDelete = async () => {
		if (!toDeleteId) return;
		try {
			await dispatch(deleteSucursal(toDeleteId)).unwrap();
			toast.success('Sucursal eliminada correctamente');
			dispatch(fetchMisSucursales());
		} catch {
			toast.error('Error al eliminar sucursal');
		} finally {
			setOpenDelete(false);
			setToDeleteId(null);
		}
	};

	return (
		<PageWrapper isProtectedRoute title='Sucursales' name='Sucursales'>
			<Subheader>
				<SubheaderLeft>
					<Badge className='text-xl'>Sucursales de la Empresa</Badge>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-2'>
					<Input
						name='sucursal-busqueda'
						placeholder='Buscar sucursales...'
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className='w-48 rounded border'
					/>
					<Button variant='solid' icon='HeroPlus' onClick={handleCreate}>
						Nueva Sucursal
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card>
					<CardBody className='overflow-x-auto'>
						{loading ? (
							<div className='p-8 text-center'>
								<div className='flex items-center justify-center gap-3'>
									<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
									<span className='text-zinc-600'>Cargando sucursales...</span>
								</div>
							</div>
						) : sucursales.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-12 text-center'>
								<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
									<Icon
										icon='HeroBuildingOffice'
										className='text-2xl text-zinc-400'
									/>
								</div>
								<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
									No hay sucursales registradas
								</h3>
								<p className='mb-4 max-w-sm text-sm text-zinc-500'>
									Comienza agregando tu primera sucursal para organizar mejor tu
									estructura empresarial.
								</p>
								<Button
									variant='solid'
									icon='HeroPlus'
									onClick={handleCreate}
									size='sm'>
									Crear Primera Sucursal
								</Button>
							</div>
						) : (
							<>
								<Table className='w-full'>
									<THead>
										{table.getHeaderGroups().map((hg) => (
											<Tr key={hg.id}>
												{hg.headers.map((header) => (
													<Th key={header.id} className='text-left'>
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

			{/* Modal de creación/edición */}
			<SucursalModal
				isOpen={openCreate}
				onClose={handleCloseModal}
				sucursal={editingSucursal}
				onSuccess={handleSuccess}
			/>

			{/* Modal de confirmación de borrado */}
			{openDelete && (
				<Modal isOpen={openDelete} setIsOpen={setOpenDelete}>
					<ModalHeader>Eliminar Sucursal</ModalHeader>
					<ModalBody>
						<div className='mb-4 flex items-center gap-3'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='text-xl text-red-600'
								/>
							</div>
							<div>
								<h3 className='font-medium text-zinc-900'>¿Eliminar sucursal?</h3>
								<p className='text-sm text-zinc-500'>
									Esta acción no se puede deshacer.
								</p>
							</div>
						</div>
						<p className='text-zinc-700'>
							¿Estás seguro de que deseas eliminar esta sucursal? Todos los datos
							asociados se perderán permanentemente.
						</p>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button variant='outline' onClick={() => setOpenDelete(false)}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button variant='solid' color='red' onClick={confirmDelete}>
								Eliminar Sucursal
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	);
}
