import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import {
	fetchMisSubsidiarias,
	createSubsidiaria,
	deleteSubsidiaria
} from '@/store/slices/subempresa/subEmpresaSlice'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader'
import Container from '@/components/layouts/Container/Container'
import Card, { CardBody } from '@/components/ui/Card'
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Input from '@/components/form/Input'
import Badge from '@/components/ui/Badge'
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2'
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild
} from '@/components/ui/Modal'
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { ISubempresa } from '@/interface/empresas.interface'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import Label from '@/components/form/Label'

const columnHelper = createColumnHelper<ISubempresa>()

export default function SubEmpresaLista() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const user = useAppSelector((s) => s.auth.user)

	interface SubEmpresaState {
		lista: ISubempresa[];
		loading: boolean;
		createLoading: boolean;
	}

	const { lista: subempresas = [], loading, createLoading }: SubEmpresaState = useAppSelector((s: { subEmpresa: SubEmpresaState }) => s.subEmpresa)

	// Debug: verificar datos
	console.log('🔍 Subempresas debug:', { subempresas, loading, createLoading });

	// filtros / sorting
	const [sorting, setSorting] = useState<SortingState>([])
	const [globalFilter, setGlobalFilter] = useState('')

	// apertura modales
	const [openCreate, setOpenCreate] = useState(false)
	const [openDelete, setOpenDelete] = useState(false)
	const [toDeleteId, setToDeleteId] = useState<number | null>(null)

	// carga inicial
	useEffect(() => {
		if (user) {
			dispatch(fetchMisSubsidiarias())
		}
	}, [dispatch, user])

	// formik para creación
	const formik = useFormik({
		initialValues: { nombre: '', slug: '', descripcion: '' },
		validationSchema: Yup.object({
			nombre: Yup.string().required('El nombre es obligatorio'),
			slug: Yup.string().required('El slug es obligatorio'),
			descripcion: Yup.string(),
		}),
		onSubmit: async values => {
			try {
				await dispatch(createSubsidiaria(values as any)).unwrap()
				toast.success('Subempresa creada correctamente')
				setOpenCreate(false)
				formik.resetForm()
				dispatch(fetchMisSubsidiarias())
			} catch (err: any) {
				toast.error(err)
			}
		}
	})

	// columnas de la tabla
	const columns = [
		columnHelper.accessor('name', { header: 'Subempresa', cell: info => info.getValue() }),
		columnHelper.accessor('rut', { header: 'Rut Empresa', cell: info => info.getValue() }),
		columnHelper.accessor('phone', {
			header: 'N° telefono',
			cell: info => info.getValue() || '—'
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: info => (
				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						size="sm"
						icon="HeroEye"
						onClick={() => navigate(`/gestion/subempresas/${info.row.original.id}`)}
					/>
					<Button
						variant="solid"
						size="sm"
						icon="HeroTrash"
						onClick={() => {
							setToDeleteId(info.row.original.id)
							setOpenDelete(true)
						}}
					/>
				</div>
			)
		})
	]

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
		initialState: { pagination: { pageSize: 5 } }
	})

	// petición de borrado
	const confirmDelete = async () => {
		if (!toDeleteId) return
		try {
			await dispatch(deleteSubsidiaria(toDeleteId)).unwrap()
			toast.success('Subempresa eliminada correctamente')
			dispatch(fetchMisSubsidiarias())
		} catch {
			toast.error('Error al eliminar subempresa')
		} finally {
			setOpenDelete(false)
			setToDeleteId(null)
		}
	}

	return (
		<PageWrapper isProtectedRoute title="Subempresas" name="Subempresas">
			<Subheader>
				<SubheaderLeft>
					<Badge className="text-xl">Subempresas de la Empresa</Badge>
				</SubheaderLeft>
				<SubheaderRight className="flex items-center gap-2">
					<Input
						name="subempresa-busqueda"
						placeholder="Buscar..."
						value={globalFilter}
						onChange={e => setGlobalFilter(e.target.value)}
						className="border rounded w-48"
					/>
					<Button
						variant="solid"
						icon="HeroPlus"
						onClick={() => setOpenCreate(true)}
					>
						Nueva
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className="pt-4">
				<Card>
					<CardBody className="overflow-auto">
						{loading
							? <div className="p-8 text-center">Cargando subempresas…</div>
							: subempresas.length === 0
								? <div className="p-8 text-center text-gray-600">No hay subempresas registradas</div>
								: <>
									<Table className="table-fixed w-full">
										<THead>
											{table.getHeaderGroups().map(hg => (
												<Tr key={hg.id}>
													{hg.headers.map(header => (
														<Th key={header.id} className="text-left">
															{header.isPlaceholder
																? null
																: flexRender(header.column.columnDef.header, header.getContext())}
														</Th>
													))}
												</Tr>
											))}
										</THead>
										<TBody>
											{table.getRowModel().rows.map(row => (
												<Tr key={row.id}>
													{row.getVisibleCells().map(cell => (
														<Td key={cell.id}>
															{flexRender(cell.column.columnDef.cell, cell.getContext())}
														</Td>
													))}
												</Tr>
											))}
										</TBody>
									</Table>
									<div className="mt-4">
										<TableCardFooterTemplateV2 table={table} />
									</div>
								</>
						}
					</CardBody>
				</Card>
			</Container>

			{/* Modal de creación */}
			{openCreate && (
				<Modal isOpen={openCreate} setIsOpen={setOpenCreate}>
					<ModalHeader>Crear Subempresa</ModalHeader>
					<ModalBody>
						<form onSubmit={formik.handleSubmit} className="space-y-4">
							<div>
								<Label htmlFor="nombre">Nombre</Label>
								<Input id="nombre" name="nombre"
									value={formik.values.nombre}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur} />
								{formik.touched.nombre && formik.errors.nombre && (
									<p className="text-red-600 text-sm">{formik.errors.nombre}</p>
								)}
							</div>
							<div>
								<Label htmlFor="slug">Slug</Label>
								<Input id="slug" name="slug"
									value={formik.values.slug}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur} />
								{formik.touched.slug && formik.errors.slug && (
									<p className="text-red-600 text-sm">{formik.errors.slug}</p>
								)}
							</div>
							<div>
								<Label htmlFor="descripcion">Descripción</Label>
								<Input id="descripcion" name="descripcion"
									value={formik.values.descripcion}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur} />
							</div>
						</form>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button color="red" onClick={() => setOpenCreate(false)}>Cancelar</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button variant="solid" onClick={() => formik.handleSubmit()} isDisable={createLoading}>
								{createLoading ? 'Creando…' : 'Crear'}
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
						<p>¿Estás seguro de que deseas eliminar esta subempresa? Esta acción no se puede deshacer.</p>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button color="red" onClick={() => setOpenDelete(false)}>Cancelar</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button variant="solid" onClick={confirmDelete}>Eliminar</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	)
}
