import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { fetchSuppliers } from '@/store/slices/suppliers/suppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import { useCustomerSuppliers } from './components/hooks/useCustomerSuppliers';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

// Tipo basado en la estructura real de la BD
interface ICustomerSupplierExtended extends ICustomerSupplier {
	// Campos reales de customer_suppliers: id, name, subsidiary_id, created_at, updated_at
	suppliers_count?: number; // Calculado por el backend
}

type SupplierRow = {
	id: number;
	name: string;
	// Campos reales de suppliers: id, name, subsidiary_id, created_at, updated_at
};

const columnHelper = createColumnHelper<SupplierRow>();

const DetalleClientePage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [isEditable, setIsEditable] = useState(false);
	const [customer, setCustomer] = useState<ICustomerSupplierExtended | null>(null);

	const customerSupplierId = id ? parseInt(id, 10) : 0;

	// Obtener subsidiaryId de la personalización del usuario
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const subsidiaryId = personalizacionUsuario?.sucursal_principal ?? 0;

	const { items: allCustomers, loading: loadingCustomers } = useAppSelector(
		(s) => s.customerSuppliers,
	);
	const {
		suppliers: associatedSuppliers,
		detach,
		attach,
		loading: loadingAssociated,
		attaching,
		detaching,
	} = useCustomerSuppliers(customerSupplierId, true);
	const { items: allSuppliers, loading: loadingAll } = useAppSelector((s) => s.suppliers);

	// 🔄 useEffect 1: Cargar clientes si no están en el store (recarga de página)
	useEffect(() => {
		if (subsidiaryId) {
			// Siempre cargar para tener datos frescos
			void dispatch(
				fetchCustomerSuppliers({
					subsidiaryId,
					with_suppliers: true,
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	// 🔄 useEffect 2: Buscar y establecer el cliente específico
	useEffect(() => {
		if (customerSupplierId && allCustomers && allCustomers.length > 0) {
			const found = allCustomers.find((c: any) => c.id === customerSupplierId);
			if (found) {
				setCustomer(found as ICustomerSupplierExtended);
			} else if (!loadingCustomers) {
				// Si no se encuentra y no está cargando, mostrar error
				console.warn(`Cliente con ID ${customerSupplierId} no encontrado`);
			}
		}
	}, [customerSupplierId, allCustomers, loadingCustomers]);

	// 🔄 useEffect 3: Cargar todos los proveedores de la subsidiaria
	useEffect(() => {
		if (subsidiaryId) {
			void dispatch(
				fetchSuppliers({
					subsidiaryId,
					with_customers: false,
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	// Proveedores NO asociados (disponibles)
	const availableSuppliers = useMemo(() => {
		if (!allSuppliers || !associatedSuppliers) return [];

		const associatedIds = new Set(associatedSuppliers.map((s: any) => s.id));
		return allSuppliers.filter((s: any) => !associatedIds.has(s.id));
	}, [allSuppliers, associatedSuppliers]);

	// Columnas para proveedores ASOCIADOS
	const associatedColumns = useMemo(
		() => [
			columnHelper.accessor('name', {
				header: 'Nombre del Proveedor',
				cell: (info) => (
					<span className='font-medium text-gray-900 dark:text-white'>
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => (
					<Button
						color='red'
						size='sm'
						icon='HeroXMark'
						onClick={() => detach([row.original.id])}
						isDisable={!isEditable || detaching}
						isLoading={detaching}>
						{detaching ? 'Desasociando...' : 'Desasociar'}
					</Button>
				),
			}),
		],
		[detach, isEditable, detaching],
	);

	// Columnas para proveedores DISPONIBLES
	const availableColumns = useMemo(
		() => [
			columnHelper.accessor('name', {
				header: 'Nombre del Proveedor',
				cell: (info) => (
					<span className='font-medium text-gray-900 dark:text-white'>
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => (
					<Button
						color='blue'
						size='sm'
						icon='HeroPlus'
						onClick={() => attach([row.original.id])}
						isDisable={!isEditable || attaching}
						isLoading={attaching}>
						{attaching ? 'Asociando...' : 'Asociar'}
					</Button>
				),
			}),
		],
		[attach, isEditable, attaching],
	);

	// Tablas
	const associatedTable = useReactTable({
		data: associatedSuppliers || [],
		columns: associatedColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	const availableTable = useReactTable({
		data: availableSuppliers || [],
		columns: availableColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (!customer) {
		return (
			<PageWrapper name='Detalle de Cliente'>
				<Container>
					<div className='flex min-h-[400px] items-center justify-center'>
						<div className='text-center'>
							<Icon
								icon='HeroArrowPath'
								className='mx-auto h-12 w-12 animate-spin text-blue-600'
							/>
							<p className='mt-4 text-lg font-medium text-gray-700 dark:text-gray-300'>
								Cargando información del cliente...
							</p>
							<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
								Por favor espera un momento
							</p>
						</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper name={`Cliente: ${customer.name}`}>
			<Subheader>
				<SubheaderLeft>
					<Button icon='HeroArrowLeft' onClick={() => navigate('/catalogos/clientes')}>
						Volver
					</Button>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						color={isEditable ? 'amber' : 'blue'}
						icon={isEditable ? 'HeroLockClosed' : 'HeroPencil'}
						onClick={() => setIsEditable(!isEditable)}>
						{isEditable ? 'Bloquear Edición' : 'Habilitar Edición'}
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-6'>
					{/* Información del cliente - DATOS REALES DE BD */}
					<Card className='overflow-hidden shadow-lg'>
						<CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-4'>
									{/* Avatar con inicial */}
									<div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-lg'>
										{customer.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<CardTitle className='text-2xl font-bold text-gray-900 dark:text-white'>
											{customer.name}
										</CardTitle>
										<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
											ID: #{customer.id}
										</p>
									</div>
								</div>
							</div>
						</CardHeader>

						<CardBody className='p-6'>
							{/* Stats Card */}
							<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
								<div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900'>
											<Icon
												icon='HeroCalendarDays'
												className='h-5 w-5 text-blue-600 dark:text-blue-400'
											/>
										</div>
										<div>
											<p className='text-xs text-gray-600 dark:text-gray-400'>
												Fecha de Creación
											</p>
											<p className='text-sm font-semibold text-gray-900 dark:text-white'>
												{new Date(customer.created_at).toLocaleDateString(
													'es-ES',
													{
														day: '2-digit',
														month: 'long',
														year: 'numeric',
													},
												)}
											</p>
										</div>
									</div>
								</div>

								<div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900'>
											<Icon
												icon='HeroClock'
												className='h-5 w-5 text-amber-600 dark:text-amber-400'
											/>
										</div>
										<div>
											<p className='text-xs text-gray-600 dark:text-gray-400'>
												Última Actualización
											</p>
											<p className='text-sm font-semibold text-gray-900 dark:text-white'>
												{new Date(customer.updated_at).toLocaleDateString(
													'es-ES',
													{
														day: '2-digit',
														month: 'long',
														year: 'numeric',
													},
												)}
											</p>
										</div>
									</div>
								</div>

								<div className='rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-600'>
											<Icon icon='HeroUsers' className='h-6 w-6 text-white' />
										</div>
										<div>
											<p className='text-xs text-gray-600 dark:text-gray-400'>
												Proveedores Asociados
											</p>
											<p className='text-2xl font-bold text-green-700 dark:text-green-400'>
												{associatedSuppliers?.length || 0}
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* TABLA 1: Proveedores ASOCIADOS - DISEÑO MEJORADO */}
					<Card className='shadow-md'>
						<CardHeader className='bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500'>
										<Icon
											icon='HeroCheckBadge'
											className='h-6 w-6 text-white'
										/>
									</div>
									<div>
										<CardTitle className='text-xl'>
											Proveedores Asociados
										</CardTitle>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											{associatedSuppliers?.length || 0} proveedor(es)
											actualmente asociado(s)
										</p>
									</div>
								</div>
								{associatedSuppliers && associatedSuppliers.length > 0 && (
									<Badge color='emerald' className='shadow-md'>
										{associatedSuppliers.length}
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardBody className='p-0'>
							{loadingAssociated ? (
								<div className='flex min-h-[200px] items-center justify-center'>
									<div className='text-center'>
										<Icon
											icon='HeroArrowPath'
											className='mx-auto h-10 w-10 animate-spin text-blue-600'
										/>
										<p className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
											Cargando proveedores asociados...
										</p>
									</div>
								</div>
							) : associatedTable.getRowModel().rows.length === 0 ? (
								<div className='flex min-h-[200px] items-center justify-center'>
									<div className='text-center'>
										<div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800'>
											<Icon
												icon='HeroInboxStack'
												className='h-8 w-8 text-gray-400'
											/>
										</div>
										<p className='mt-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
											Sin proveedores asociados
										</p>
										<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
											Este cliente no tiene proveedores vinculados aún
										</p>
										{isEditable && (
											<p className='mt-2 text-xs text-blue-600 dark:text-blue-400'>
												💡 Activa el modo edición para asociar proveedores
											</p>
										)}
									</div>
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='w-full'>
										<thead className='bg-gray-50 dark:bg-gray-800'>
											{associatedTable
												.getHeaderGroups()
												.map((headerGroup) => (
													<tr key={headerGroup.id}>
														{headerGroup.headers.map((header) => (
															<th
																key={header.id}
																className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300'>
																{flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
															</th>
														))}
													</tr>
												))}
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
											{associatedTable.getRowModel().rows.map((row) => (
												<tr
													key={row.id}
													className='transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/10'>
													{row.getVisibleCells().map((cell) => (
														<td
															key={cell.id}
															className='whitespace-nowrap px-6 py-4'>
															{flexRender(
																cell.column.columnDef.cell,
																cell.getContext(),
															)}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardBody>
					</Card>

					{/* TABLA 2: Proveedores DISPONIBLES - DISEÑO MEJORADO */}
					{isEditable && (
						<Card className='border-2 border-dashed border-blue-300 shadow-md dark:border-blue-700'>
							<CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500'>
											<Icon icon='HeroPlus' className='h-6 w-6 text-white' />
										</div>
										<div>
											<CardTitle className='text-xl'>
												Proveedores Disponibles
											</CardTitle>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												{availableSuppliers?.length || 0} proveedor(es)
												disponible(s) para asociar
											</p>
										</div>
									</div>
									{availableSuppliers && availableSuppliers.length > 0 && (
										<Badge color='blue' className='shadow-md'>
											{availableSuppliers.length}
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardBody className='p-0'>
								{loadingAll ? (
									<div className='flex min-h-[200px] items-center justify-center'>
										<div className='text-center'>
											<Icon
												icon='HeroArrowPath'
												className='mx-auto h-10 w-10 animate-spin text-blue-600'
											/>
											<p className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
												Cargando proveedores disponibles...
											</p>
										</div>
									</div>
								) : availableTable.getRowModel().rows.length === 0 ? (
									<div className='flex min-h-[200px] items-center justify-center'>
										<div className='text-center'>
											<div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800'>
												<Icon
													icon='HeroCheckCircle'
													className='h-8 w-8 text-green-500'
												/>
											</div>
											<p className='mt-4 text-sm font-medium text-gray-700 dark:text-gray-300'>
												¡Todos los proveedores ya están asociados!
											</p>
											<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
												No hay más proveedores disponibles para vincular
											</p>
										</div>
									</div>
								) : (
									<div className='overflow-x-auto'>
										<table className='w-full'>
											<thead className='bg-gray-50 dark:bg-gray-800'>
												{availableTable
													.getHeaderGroups()
													.map((headerGroup) => (
														<tr key={headerGroup.id}>
															{headerGroup.headers.map((header) => (
																<th
																	key={header.id}
																	className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300'>
																	{flexRender(
																		header.column.columnDef
																			.header,
																		header.getContext(),
																	)}
																</th>
															))}
														</tr>
													))}
											</thead>
											<tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
												{availableTable.getRowModel().rows.map((row) => (
													<tr
														key={row.id}
														className='transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/10'>
														{row.getVisibleCells().map((cell) => (
															<td
																key={cell.id}
																className='whitespace-nowrap px-6 py-4'>
																{flexRender(
																	cell.column.columnDef.cell,
																	cell.getContext(),
																)}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</CardBody>
						</Card>
					)}
				</div>
			</Container>
		</PageWrapper>
	);
};

export default DetalleClientePage;
