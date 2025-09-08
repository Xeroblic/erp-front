import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMisSubsidiarias,
	createSubsidiaria,
	updateSubsidiaria,
	deleteSubsidiaria,
} from '@/store/slices/subempresa/subEmpresaSlice';
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
import { ISubempresa } from '@/interface/empresas.interface';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Label from '@/components/form/Label';

const columnHelper = createColumnHelper<ISubempresa>();

export default function SubEmpresaLista() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const user = useAppSelector((s) => s.auth.user);

	interface SubEmpresaState {
		lista: ISubempresa[];
		loading: boolean;
		createLoading: boolean;
	}

	const {
		lista: subempresas = [],
		loading,
		createLoading,
	}: SubEmpresaState = useAppSelector((s: { subEmpresa: SubEmpresaState }) => s.subEmpresa);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [openCreate, setOpenCreate] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [toDeleteId, setToDeleteId] = useState<number | null>(null);
	const [editingSubempresa, setEditingSubempresa] = useState<ISubempresa | null>(null);

	useEffect(() => {
		if (user) {
			dispatch(fetchMisSubsidiarias());
		}
	}, [dispatch, user]);

	const formik = useFormik({
		initialValues: { nombre: '', rut: '', telefono: '', email: '', direccion: '' },
		validationSchema: Yup.object({
			nombre: Yup.string().required('El nombre es obligatorio'),
			rut: Yup.string(),
			telefono: Yup.string(),
			email: Yup.string().email('Email inválido'),
			direccion: Yup.string(),
		}),
		onSubmit: async (values) => {
			try {
				const data = {
					name: values.nombre,
					rut: values.rut || undefined,
					phone: values.telefono || undefined,
					email: values.email || undefined,
					address: values.direccion || undefined,
				};

				if (editingSubempresa?.id) {
					// Actualizar subempresa existente
					await dispatch(
						updateSubsidiaria({
							id: editingSubempresa.id,
							data: data as any,
						}),
					).unwrap();
					toast.success(`${values.nombre} ha sido actualizada correctamente`);
				} else {
					// Crear nueva subempresa
					await dispatch(createSubsidiaria(data as any)).unwrap();
					toast.success(`${values.nombre} ha sido creada correctamente`);
				}
				handleCloseModal();
				dispatch(fetchMisSubsidiarias());
			} catch (err: any) {
				toast.error(
					editingSubempresa
						? 'Error al actualizar la subempresa'
						: 'Error al crear la subempresa',
				);
			}
		},
	});

	const handleEdit = (subempresa: ISubempresa) => {
		setEditingSubempresa(subempresa);
		formik.setValues({
			nombre: subempresa.name || '',
			rut: subempresa.rut || '',
			telefono: subempresa.phone || '',
			email: subempresa.email || '',
			direccion: subempresa.address || '',
		});
		setOpenCreate(true);
	};

	const handleCreate = () => {
		setEditingSubempresa(null);
		formik.resetForm();
		setOpenCreate(true);
	};

	const handleCloseModal = () => {
		setOpenCreate(false);
		setEditingSubempresa(null);
		formik.resetForm();
	};

	// columnas de la tabla
	const columns = [
		columnHelper.accessor('name', {
			header: 'Subempresa',
			cell: (info) => (
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
						<Icon icon='HeroBuildingStorefront' className='text-lg text-primary-600' />
					</div>
					<div>
						<div className='font-medium'>{info.getValue()}</div>
						<div className='text-xs text-zinc-500'>ID: {info.row.original.id}</div>
					</div>
				</div>
			),
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
		columnHelper.accessor('email', {
			header: 'Email',
			cell: (info) => {
				const value = info.getValue();
				return value ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroEnvelope' className='text-xs text-zinc-400' />
						<span className='text-sm'>{value}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin email
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
						onClick={() => navigate(`/gestion/subempresa/${info.row.original.id}`)}
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
		data: subempresas,
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

	const confirmDelete = async () => {
		if (!toDeleteId) return;
		try {
			await dispatch(deleteSubsidiaria(toDeleteId)).unwrap();
			toast.success('Subempresa eliminada correctamente');
			dispatch(fetchMisSubsidiarias());
		} catch {
			toast.error('Error al eliminar subempresa');
		} finally {
			setOpenDelete(false);
			setToDeleteId(null);
		}
	};

	return (
		<PageWrapper isProtectedRoute title='Subempresas' name='Subempresas'>
			<Subheader>
				<SubheaderLeft>
					<Badge className='text-xl'>Subempresas de la Empresa</Badge>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-2'>
					<Input
						name='subempresa-busqueda'
						placeholder='Buscar subempresas...'
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className='w-48 rounded border'
					/>
					<Button variant='solid' icon='HeroPlus' onClick={handleCreate}>
						Nueva Subempresa
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card>
					<CardBody className='overflow-auto'>
						{loading ? (
							<div className='p-8 text-center'>
								<div className='flex items-center justify-center gap-3'>
									<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
									<span className='text-zinc-600'>Cargando subempresas...</span>
								</div>
							</div>
						) : subempresas.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-12 text-center'>
								<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
									<Icon
										icon='HeroBuildingStorefront'
										className='text-2xl text-zinc-400'
									/>
								</div>
								<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
									No hay subempresas registradas
								</h3>
								<p className='mb-4 max-w-sm text-sm text-zinc-500'>
									Comienza agregando tu primera subempresa para organizar mejor tu
									estructura empresarial.
								</p>
								<Button
									variant='solid'
									icon='HeroPlus'
									onClick={handleCreate}
									size='sm'>
									Crear Primera Subempresa
								</Button>
							</div>
						) : (
							<>
								<Table className='w-full table-fixed'>
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
			{openCreate && (
				<Modal isOpen={openCreate} setIsOpen={setOpenCreate}>
					<ModalHeader>
						{editingSubempresa ? 'Editar Subempresa' : 'Crear Subempresa'}
					</ModalHeader>
					<ModalBody>
						<form onSubmit={formik.handleSubmit} className='space-y-4'>
							<div>
								<Label htmlFor='nombre'>Nombre *</Label>
								<Input
									id='nombre'
									name='nombre'
									placeholder='Ej: Subsidiaria Norte'
									value={formik.values.nombre}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
								{formik.touched.nombre && formik.errors.nombre && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.nombre}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='rut'>RUT</Label>
								<Input
									id='rut'
									name='rut'
									placeholder='Ej: 12.345.678-9'
									value={formik.values.rut}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
								{formik.touched.rut && formik.errors.rut && (
									<p className='mt-1 text-sm text-red-600'>{formik.errors.rut}</p>
								)}
							</div>
							<div>
								<Label htmlFor='telefono'>Teléfono</Label>
								<Input
									id='telefono'
									name='telefono'
									placeholder='Ej: +56 9 8765 4321'
									value={formik.values.telefono}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
								{formik.touched.telefono && formik.errors.telefono && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.telefono}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									name='email'
									type='email'
									placeholder='Ej: contacto@subsidiaria.com'
									value={formik.values.email}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
								{formik.touched.email && formik.errors.email && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.email}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='direccion'>Dirección</Label>
								<Input
									id='direccion'
									name='direccion'
									placeholder='Ej: Av. Principal 123, Ciudad'
									value={formik.values.direccion}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
								{formik.touched.direccion && formik.errors.direccion && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.direccion}
									</p>
								)}
							</div>
						</form>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button
								variant='outline'
								onClick={handleCloseModal}
								isDisable={formik.isSubmitting}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button
								variant='solid'
								onClick={() => formik.handleSubmit()}
								isLoading={formik.isSubmitting}
								isDisable={formik.isSubmitting}>
								{editingSubempresa ? 'Actualizar' : 'Crear'} Subempresa
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}

			{/* Modal de confirmación de borrado */}
			{openDelete && (
				<Modal isOpen={openDelete} setIsOpen={setOpenDelete}>
					<ModalHeader>Eliminar Subempresa</ModalHeader>
					<ModalBody>
						<div className='mb-4 flex items-center gap-3'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='text-xl text-red-600'
								/>
							</div>
							<div>
								<h3 className='font-medium text-zinc-900'>¿Eliminar subempresa?</h3>
								<p className='text-sm text-zinc-500'>
									Esta acción no se puede deshacer.
								</p>
							</div>
						</div>
						<p className='text-zinc-700'>
							¿Estás seguro de que deseas eliminar esta subempresa? Todos los datos
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
								Eliminar Subempresa
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	);
}
