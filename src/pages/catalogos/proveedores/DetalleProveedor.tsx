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
import { fetchSuppliers } from '@/store/slices/suppliers/suppliersSlice';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import { useSupplierCustomers } from './components/hooks/useSupplierCustomers';
import type { ISupplier } from '@/interface/supplier.interface';
import { formatDate } from './components/utils';

// Tipo extendido para incluir propiedades adicionales del backend
interface ISupplierExtended extends ISupplier {
	customers_count?: number; // Calculado por el backend
}

type CustomerRow = {
	id: number;
	name: string;
};

const columnHelper = createColumnHelper<CustomerRow>();

const DetalleProveedorPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [isEditable, setIsEditable] = useState(false);
	const [supplier, setSupplier] = useState<ISupplierExtended | null>(null);

	const supplierId = id ? parseInt(id, 10) : 0;

	// Obtener subsidiaryId de la personalización del usuario
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const subsidiaryId = personalizacionUsuario?.sucursal_principal ?? 0;

	const { items: allSuppliers, loading: loadingSuppliers } = useAppSelector((s) => s.suppliers);
	const {
		customers: associatedCustomers,
		detach,
		attach,
		loading: loadingAssociated,
		attaching,
		detaching,
	} = useSupplierCustomers(supplierId, true);
	const { items: allCustomers, loading: loadingAll } = useAppSelector((s) => s.customerSuppliers);

	// 🔄 useEffect 1: Cargar proveedores (siempre para datos frescos)
	useEffect(() => {
		if (subsidiaryId) {
			void dispatch(
				fetchSuppliers({
					subsidiaryId,
					with_customers: true,
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	// 🔄 useEffect 2: Buscar y establecer proveedor específico
	useEffect(() => {
		if (supplierId && allSuppliers && allSuppliers.length > 0) {
			const found = allSuppliers.find((s: any) => s.id === supplierId);
			if (found) {
				setSupplier(found as ISupplierExtended);
			} else if (!loadingSuppliers) {
				console.warn(`Proveedor con ID ${supplierId} no encontrado`);
			}
		}
	}, [supplierId, allSuppliers, loadingSuppliers]);

	// 🔄 useEffect 3: Cargar todos los clientes de la subsidiaria
	useEffect(() => {
		if (subsidiaryId) {
			void dispatch(
				fetchCustomerSuppliers({
					subsidiaryId,
					with_suppliers: false,
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	// Clientes NO asociados (disponibles)
	const availableCustomers = useMemo(() => {
		if (!allCustomers || !associatedCustomers) return [];

		const associatedIds = new Set(associatedCustomers.map((c: any) => c.id));
		return allCustomers.filter((c: any) => !associatedIds.has(c.id));
	}, [allCustomers, associatedCustomers]);

	// Columnas para clientes ASOCIADOS
	const associatedColumns = useMemo(
		() => [
			columnHelper.accessor('name', {
				header: 'Nombre',
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

	// Columnas para clientes DISPONIBLES
	const availableColumns = useMemo(
		() => [
			columnHelper.accessor('name', {
				header: 'Nombre',
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
		data: associatedCustomers || [],
		columns: associatedColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	const availableTable = useReactTable({
		data: availableCustomers || [],
		columns: availableColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (!supplier) {
		return (
			<PageWrapper name='Detalle de Proveedor'>
				<Container>
					<div className='flex min-h-[400px] items-center justify-center'>
						<div className='text-center'>
							<Icon
								icon='HeroArrowPath'
								className='mx-auto h-12 w-12 animate-spin text-orange-600'
							/>
							<p className='mt-4 text-lg font-medium text-gray-700 dark:text-gray-300'>
								Cargando información del proveedor...
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
		<PageWrapper name={`Proveedor: ${supplier.name}`}>
			<Subheader>
				<SubheaderLeft>
					<Button icon='HeroArrowLeft' onClick={() => navigate('/catalogos/proveedores')}>
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
					{/* Información del proveedor - SOLO DATOS REALES */}
					<Card className='overflow-hidden shadow-lg'>
						<CardHeader className='bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'>
							<div className='flex items-center gap-4'>
								<div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-2xl font-bold text-white shadow-lg'>
									{supplier.name?.[0]?.toUpperCase()}
								</div>
								<div className='flex-1'>
									<CardTitle className='text-2xl font-bold text-gray-900 dark:text-white'>
										{supplier.name}
									</CardTitle>
									<p className='mt-1 font-mono text-sm text-gray-600 dark:text-gray-400'>
										<Icon icon='HeroHashtag' className='inline h-4 w-4' /> ID:{' '}
										{supplier.id}
									</p>
								</div>
							</div>
						</CardHeader>

						<CardBody>
							{/* Stats Cards - SOLO DATOS REALES */}
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								<div className='rounded-lg border-2 border-orange-100 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/10'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600'>
											<Icon
												icon='HeroCalendarDays'
												className='h-6 w-6 text-white'
											/>
										</div>
										<div>
											<p className='text-xs text-gray-600 dark:text-gray-400'>
												Fecha de Creación
											</p>
											<p className='text-sm font-bold text-gray-900 dark:text-white'>
												{formatDate(supplier.created_at)}
											</p>
										</div>
									</div>
								</div>

								<div className='rounded-lg border-2 border-amber-100 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600'>
											<Icon icon='HeroClock' className='h-6 w-6 text-white' />
										</div>
										<div>
											<p className='text-xs text-gray-600 dark:text-gray-400'>
												Última Actualización
											</p>
											<p className='text-sm font-bold text-gray-900 dark:text-white'>
												{formatDate(supplier.updated_at)}
											</p>
										</div>
									</div>
								</div>

								<div className='rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-sm dark:border-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600'>
											<Icon icon='HeroUsers' className='h-6 w-6 text-white' />
										</div>
										<div>
											<p className='text-xs text-gray-600 dark:text-gray-400'>
												Clientes Asociados
											</p>
											<p className='text-2xl font-bold text-blue-700 dark:text-blue-400'>
												{associatedCustomers?.length || 0}
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* TABLA 1: Clientes ASOCIADOS - DISEÑO MEJORADO */}
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
											Clientes Asociados
										</CardTitle>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											{associatedCustomers?.length || 0} cliente(s)
											actualmente asociado(s)
										</p>
									</div>
								</div>
								{associatedCustomers && associatedCustomers.length > 0 && (
									<Badge color='emerald' className='shadow-md'>
										{associatedCustomers.length}
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
											className='mx-auto h-10 w-10 animate-spin text-emerald-600'
										/>
										<p className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
											Cargando clientes asociados...
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
											Este proveedor no tiene clientes asociados
										</p>
										<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
											Habilita el modo edición para asociar clientes
										</p>
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

					{/* TABLA 2: Clientes DISPONIBLES - DISEÑO MEJORADO */}
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
												Clientes Disponibles
											</CardTitle>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												{availableCustomers?.length || 0} cliente(s)
												disponible(s) para asociar
											</p>
										</div>
									</div>
									{availableCustomers && availableCustomers.length > 0 && (
										<Badge color='blue' className='shadow-md'>
											{availableCustomers.length}
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
												Cargando clientes disponibles...
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
												¡Todos los clientes ya están asociados!
											</p>
											<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
												No hay más clientes disponibles para vincular
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

export default DetalleProveedorPage;
