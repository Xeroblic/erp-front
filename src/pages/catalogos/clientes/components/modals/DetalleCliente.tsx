import React, { Dispatch, SetStateAction, useMemo, useEffect } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { formatDate } from '../../../proveedores/components/utils';
import { useCustomerSuppliers } from '../hooks/useCustomerSuppliers';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSuppliers } from '@/store/slices/suppliers/suppliersSlice';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

type DetalleClienteProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	customer: ICustomerSupplier | null;
	onEdit?: (customer: ICustomerSupplier) => void;
};

type SupplierRow = {
	id: number;
	name: string;
};

const columnHelper = createColumnHelper<SupplierRow>();

const DetalleCliente: React.FC<DetalleClienteProps> = ({ isOpen, setIsOpen, customer, onEdit }) => {
	const dispatch = useAppDispatch();
	const customerId = customer?.id ?? 0;
	const subsidiaryId = customer?.subsidiary_id ?? 0;

	const {
		suppliers: associatedSuppliers,
		detach,
		attach,
		loading: loadingAssociated,
	} = useCustomerSuppliers(customerId, isOpen);
	const { items: allSuppliers, loading: loadingAll } = useAppSelector((s) => s.suppliers);

	// Fetch todos los proveedores de la subsidiaria
	useEffect(() => {
		if (isOpen && subsidiaryId) {
			void dispatch(
				fetchSuppliers({
					subsidiaryId,
					with_customers: false,
				}),
			);
		}
	}, [dispatch, isOpen, subsidiaryId]);

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
						onClick={() => detach([row.original.id])}>
						Desasociar
					</Button>
				),
			}),
		],
		[detach],
	);

	// Columnas para proveedores DISPONIBLES
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
						onClick={() => attach([row.original.id])}>
						Asociar
					</Button>
				),
			}),
		],
		[attach],
	);

	// Tabla para proveedores ASOCIADOS
	const associatedTable = useReactTable({
		data: associatedSuppliers || [],
		columns: associatedColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	// Tabla para proveedores DISPONIBLES
	const availableTable = useReactTable({
		data: availableSuppliers || [],
		columns: availableColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='4xl' isScrollable>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
						<Icon
							icon='HeroUserGroup'
							className='h-6 w-6 text-blue-600 dark:text-blue-400'
						/>
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900 dark:text-white'>
							Detalles del Cliente
						</h2>
						<p className='text-sm text-gray-600 dark:text-gray-400'>
							Información general, métricas y proveedores asociados
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{customer ? (
					<div className='space-y-6'>
						{/* Información del cliente - SOLO DATOS REALES */}
						<div className='rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-6 dark:from-blue-900/20 dark:to-cyan-900/20'>
							<div className='space-y-4'>
								<div>
									<h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
										{customer.name}
									</h3>
									<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
										ID: #{customer.id}
									</p>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div className='rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
											Subsidiaria
										</p>
										<p className='mt-1 text-lg font-semibold text-gray-900 dark:text-white'>
											{customer.subsidiary?.subsidiary_name || 'N/A'}
										</p>
									</div>

									<div className='rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
											Proveedores Asociados
										</p>
										<p className='mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400'>
											{customer.suppliers_count || 0}
										</p>
									</div>

									<div className='rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
											Creado
										</p>
										<p className='mt-1 text-sm text-gray-900 dark:text-white'>
											{formatDate(customer.created_at)}
										</p>
									</div>

									<div className='rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
											Actualizado
										</p>
										<p className='mt-1 text-sm text-gray-900 dark:text-white'>
											{formatDate(customer.updated_at)}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* TABLA 1: Proveedores ASOCIADOS */}
						<div className='space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
							<div className='flex items-center justify-between'>
								<h4 className='font-semibold text-gray-700 dark:text-gray-300'>
									Proveedores Asociados ({associatedSuppliers?.length || 0})
								</h4>
							</div>
							{loadingAssociated ? (
								<div className='flex items-center justify-center py-8'>
									<Icon
										icon='HeroArrowPath'
										className='h-6 w-6 animate-spin text-blue-600'
									/>
									<span className='ml-2 text-sm text-gray-600'>Cargando...</span>
								</div>
							) : associatedTable.getRowModel().rows.length === 0 ? (
								<div className='py-8 text-center text-sm text-gray-500 dark:text-gray-400'>
									Este cliente no tiene proveedores asociados.
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='w-full text-left text-sm'>
										<thead className='border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
											{associatedTable
												.getHeaderGroups()
												.map((headerGroup) => (
													<tr key={headerGroup.id}>
														{headerGroup.headers.map((header) => (
															<th
																key={header.id}
																className='px-4 py-3 font-semibold text-gray-700 dark:text-gray-300'>
																{flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
															</th>
														))}
													</tr>
												))}
										</thead>
										<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
											{associatedTable.getRowModel().rows.map((row) => (
												<tr
													key={row.id}
													className='hover:bg-gray-50 dark:hover:bg-gray-800'>
													{row.getVisibleCells().map((cell) => (
														<td key={cell.id} className='px-4 py-3'>
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
						</div>

						{/* TABLA 2: Proveedores DISPONIBLES (NO asociados) */}
						<div className='space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
							<div className='flex items-center justify-between'>
								<h4 className='font-semibold text-gray-700 dark:text-gray-300'>
									Proveedores Disponibles ({availableSuppliers?.length || 0})
								</h4>
							</div>
							{loadingAll ? (
								<div className='flex items-center justify-center py-8'>
									<Icon
										icon='HeroArrowPath'
										className='h-6 w-6 animate-spin text-blue-600'
									/>
									<span className='ml-2 text-sm text-gray-600'>Cargando...</span>
								</div>
							) : availableTable.getRowModel().rows.length === 0 ? (
								<div className='py-8 text-center text-sm text-gray-500 dark:text-gray-400'>
									No hay proveedores disponibles para asociar.
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='w-full text-left text-sm'>
										<thead className='border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
											{availableTable.getHeaderGroups().map((headerGroup) => (
												<tr key={headerGroup.id}>
													{headerGroup.headers.map((header) => (
														<th
															key={header.id}
															className='px-4 py-3 font-semibold text-gray-700 dark:text-gray-300'>
															{flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
														</th>
													))}
												</tr>
											))}
										</thead>
										<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
											{availableTable.getRowModel().rows.map((row) => (
												<tr
													key={row.id}
													className='hover:bg-gray-50 dark:hover:bg-gray-800'>
													{row.getVisibleCells().map((cell) => (
														<td key={cell.id} className='px-4 py-3'>
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
						</div>
					</div>
				) : (
					<div className='py-6 text-center text-sm text-gray-500 dark:text-gray-400'>
						Selecciona un cliente para ver los detalles.
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-3'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cerrar
					</Button>
					{customer && onEdit && (
						<Button
							color='blue'
							onClick={() => {
								setIsOpen(false);
								onEdit(customer);
							}}>
							Editar Cliente
						</Button>
					)}
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DetalleCliente;
