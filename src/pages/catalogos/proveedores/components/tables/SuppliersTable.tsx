import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import type { ISupplier } from '@/interface/supplier.interface';

type SuppliersTableProps = {
	suppliers: ISupplier[];
	loading: boolean;
	onView: (supplier: ISupplier) => void;
	// onEdit: (supplier: ISupplier) => void;
	onDelete: (supplier: ISupplier) => void;
};

const SuppliersTable: React.FC<SuppliersTableProps> = ({
	suppliers,
	loading,
	onView,
	// onEdit,
	onDelete,
}) => (
	<Card>
		<CardHeader>
			<div className='flex items-center justify-between'>
				<CardTitle>Lista de Proveedores</CardTitle>
				<span className='text-sm text-gray-500'>{suppliers.length} proveedores</span>
			</div>
		</CardHeader>
		<CardBody className='p-0'>
			{loading ? (
				<div className='flex items-center justify-center py-12'>
					<Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-orange-600' />
					<span className='ml-2 text-gray-600'>Cargando proveedores...</span>
				</div>
			) : (
				<div className='overflow-x-auto'>
					<Table>
						<THead>
							<Tr>
								<Th>Proveedor</Th>
								<Th>Clientes asociados</Th>
								<Th>Creado</Th>
								<Th>Acciones</Th>
							</Tr>
						</THead>
						<TBody>
							{suppliers.map((supplier) => {
								const customerSuppliers =
									(supplier as any).customerSuppliers ||
									(supplier as any).customer_suppliers ||
									[];
								const hasCustomers = customerSuppliers.length > 0;

								return (
									<Tr
										key={supplier.id}
										className='hover:bg-gray-50 dark:hover:bg-gray-800'>
										<Td>
											<div className='text-sm font-medium text-gray-900 dark:text-white'>
												{supplier.name}
											</div>
											<div className='text-xs text-gray-500'>
												ID: {supplier.id}
											</div>
										</Td>
										<Td>
											{hasCustomers ? (
												<div className='flex flex-col gap-1'>
													{customerSuppliers
														.slice(0, 3)
														.map((cs: any, idx: number) => (
															<div
																key={cs.id || idx}
																className='flex items-center gap-2'>
																<Badge
																	variant='outline'
																	color='sky'
																	className='text-xs'>
																	{cs.customer_name ||
																		cs.name ||
																		cs.customer?.name ||
																		`Cliente ${cs.customer_id || cs.id}`}
																</Badge>
															</div>
														))}
													{customerSuppliers.length > 3 && (
														<span className='text-xs text-gray-500'>
															+{customerSuppliers.length - 3} más
														</span>
													)}
												</div>
											) : (
												<span className='text-xs text-gray-400'>
													Sin clientes
												</span>
											)}
										</Td>
										<Td>
											<div className='text-xs text-gray-500'>
												{supplier.created_at
													? new Date(
															String(supplier.created_at),
														).toLocaleDateString('es-CO')
													: '-'}
											</div>
										</Td>
										<Td>
											<div className='flex space-x-2'>
												<Button
													size='sm'
													variant='outline'
													onClick={() => onView(supplier)}
													className='text-blue-600 hover:text-blue-900 dark:text-blue-400'>
													<Icon icon='HeroEye' className='h-4 w-4' />
												</Button>
												{/* <Button
													size='sm'
													variant='outline'
													onClick={() => onEdit(supplier)}
													className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400'>
													<Icon
														icon='HeroPencilSquare'
														className='h-4 w-4'
													/>
												</Button> */}
												<Button
													size='sm'
													variant='outline'
													onClick={() => onDelete(supplier)}
													className='text-red-600 hover:text-red-900 dark:text-red-400'>
													<Icon icon='HeroTrash' className='h-4 w-4' />
												</Button>
											</div>
										</Td>
									</Tr>
								);
							})}
						</TBody>
					</Table>
				</div>
			)}
		</CardBody>
	</Card>
);

export default SuppliersTable;
