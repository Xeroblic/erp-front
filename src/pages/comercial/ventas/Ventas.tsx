import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchSales,
	setFilters,
	clearFilters,
	generateInvoice,
	recordPayment,
	shipSale,
	deliverSale,
	cancelSale,
	selectSales,
	selectSalesLoading,
	selectSalesPagination,
	selectSaleFilters,
	selectSaleActionLoading,
	selectSalesStatistics,
} from '@/store/slices/sales/salesSlice';

// Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TBody, Td, TFoot, THead, Th, Tr } from '@/components/ui/Table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Pagination from '@/components/ui/Pagination';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import type { ISale, SaleStatus } from '@/interface/sales.interface';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import Icon from '@/components/icon/Icon';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

const Ventas: React.FC = () => {
	const dispatch = useAppDispatch();

	// Redux state
	const sales = useAppSelector(selectSales);
	const loading = useAppSelector(selectSalesLoading);
	const pagination = useAppSelector(selectSalesPagination);
	const filters = useAppSelector(selectSaleFilters);
	const actionLoading = useAppSelector(selectSaleActionLoading);
	const statistics = useAppSelector(selectSalesStatistics);

	// Local state
	const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [showShipModal, setShowShipModal] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);

	// Formularios
	const [paymentForm, setPaymentForm] = useState({
		amount: '',
		payment_method: 'CASH',
		payment_date: new Date().toISOString().split('T')[0],
		reference: '',
		notes: '',
	});

	const [shipForm, setShipForm] = useState({
		tracking_number: '',
		carrier: '',
		shipped_date: new Date().toISOString().split('T')[0],
		expected_delivery_date: '',
		notes: '',
	});

	const [cancelForm, setCancelForm] = useState({
		reason: '',
		refund_amount: '',
		notes: '',
	});

	// Filtros locales
	const [localFilters, setLocalFilters] = useState({
		status: '',
		customer_id: '',
		sale_date_from: '',
		sale_date_to: '',
		delivery_date_from: '',
		delivery_date_to: '',
		salesperson_id: '',
		min_amount: '',
		max_amount: '',
	});

	// Cargar ventas al montar
	useEffect(() => {
		dispatch(fetchSales({ page: 1, filters }));
	}, [dispatch, filters]);

	// Handlers
	const handleApplyFilters = () => {
		const activeFilters = Object.fromEntries(
			Object.entries(localFilters).filter(([_, value]) => value !== ''),
		);
		dispatch(setFilters(activeFilters));
	};

	const handleClearFilters = () => {
		setLocalFilters({
			status: '',
			customer_id: '',
			sale_date_from: '',
			sale_date_to: '',
			delivery_date_from: '',
			delivery_date_to: '',
			salesperson_id: '',
			min_amount: '',
			max_amount: '',
		});
		dispatch(clearFilters());
	};

	const handlePageChange = (page: number) => {
		dispatch(fetchSales({ page, filters }));
	};

	const handleGenerateInvoice = async (saleId: number) => {
		try {
			await dispatch(generateInvoice(saleId)).unwrap();
			dispatch(fetchSales({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const handleRecordPayment = async () => {
		if (!selectedSale) return;

		try {
			await dispatch(
				recordPayment({
					id: selectedSale.id,
					data: {
						amount: parseFloat(paymentForm.amount),
						payment_method: paymentForm.payment_method,
						payment_date: paymentForm.payment_date,
						reference: paymentForm.reference || undefined,
						notes: paymentForm.notes || undefined,
					},
				}),
			).unwrap();

			setShowPaymentModal(false);
			setSelectedSale(null);
			setPaymentForm({
				amount: '',
				payment_method: 'CASH',
				payment_date: new Date().toISOString().split('T')[0],
				reference: '',
				notes: '',
			});

			dispatch(fetchSales({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const handleShipSale = async () => {
		if (!selectedSale) return;

		try {
			await dispatch(
				shipSale({
					id: selectedSale.id,
					data: {
						tracking_number: shipForm.tracking_number || undefined,
						carrier: shipForm.carrier || undefined,
						shipped_date: shipForm.shipped_date,
						expected_delivery_date: shipForm.expected_delivery_date || undefined,
						notes: shipForm.notes || undefined,
					},
				}),
			).unwrap();

			setShowShipModal(false);
			setSelectedSale(null);
			setShipForm({
				tracking_number: '',
				carrier: '',
				shipped_date: new Date().toISOString().split('T')[0],
				expected_delivery_date: '',
				notes: '',
			});

			dispatch(fetchSales({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const handleCancelSale = async () => {
		if (!selectedSale) return;

		try {
			await dispatch(
				cancelSale({
					id: selectedSale.id,
					data: {
						reason: cancelForm.reason,
						refund_amount: cancelForm.refund_amount
							? parseFloat(cancelForm.refund_amount)
							: undefined,
						notes: cancelForm.notes || undefined,
					},
				}),
			).unwrap();

			setShowCancelModal(false);
			setSelectedSale(null);
			setCancelForm({
				reason: '',
				refund_amount: '',
				notes: '',
			});

			dispatch(fetchSales({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const getStatusBadge = (status: SaleStatus) => {
		const statusConfig: Record<
			SaleStatus,
			{
				color:
					| 'yellow'
					| 'blue'
					| 'violet'
					| 'emerald'
					| 'red'
					| 'amber'
					| 'cyan'
					| 'orange';
				text: string;
			}
		> = {
			DRAFT: { color: 'yellow', text: 'Borrador' },
			CONFIRMED: { color: 'blue', text: 'Confirmada' },
			PARTIALLY_PAID: { color: 'amber', text: 'Parcialmente Pagada' },
			PAID: { color: 'emerald', text: 'Pagada' },
			INVOICED: { color: 'cyan', text: 'Facturada' },
			SHIPPED: { color: 'orange', text: 'Enviada' },
			DELIVERED: { color: 'emerald', text: 'Entregada' },
			CANCELLED: { color: 'red', text: 'Cancelada' },
			REFUNDED: { color: 'violet', text: 'Reembolsada' },
		};

		const config = statusConfig[status] || statusConfig['DRAFT'];
		return <Badge color={config.color as any}>{config.text}</Badge>;
	};

	const getPaymentStatusBadge = (paymentStatus?: string) => {
		if (!paymentStatus) return <Badge>N/A</Badge>;

		const statusConfig: Record<
			string,
			{ color: 'yellow' | 'amber' | 'emerald' | 'red'; text: string }
		> = {
			PENDING: { color: 'yellow', text: 'Pendiente' },
			PARTIAL: { color: 'amber', text: 'Parcial' },
			PAID: { color: 'emerald', text: 'Pagado' },
			OVERDUE: { color: 'red', text: 'Vencido' },
		};

		const config = statusConfig[paymentStatus] || statusConfig['PENDING'];
		return <Badge color={config.color as any}>{config.text}</Badge>;
	};

	const canInvoice = (sale: ISale) => {
		return sale.status === 'CONFIRMED' && !sale.invoice_number;
	};

	const canAddPayment = (sale: ISale) => {
		return ['INVOICED', 'PAID'].includes(sale.status) && sale.payment_status !== 'PAID';
	};

	const canShip = (sale: ISale) => {
		return (
			sale.status === 'PAID' || (sale.status === 'INVOICED' && sale.payment_status === 'PAID')
		);
	};

	const canDeliver = (sale: ISale) => {
		return sale.status === 'SHIPPED';
	};

	const canCancel = (sale: ISale) => {
		return !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(sale.status);
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Ventas</h1>
					<p className='text-zinc-500'>Gestión completa del proceso de ventas</p>
				</div>

				<div className='flex space-x-2'>
					<PermissionGuard permissions={[ERP_PERMISSIONS.SALES.CREATE]}>
						<Button
							variant='solid'
							onClick={() => (window.location.href = '/comercial/ventas/crear')}
							icon='HeroPlus'>
							Nueva Venta
						</Button>
					</PermissionGuard>

					<PermissionGuard permissions={[ERP_PERMISSIONS.REPORTS.SALES_DASHBOARD]}>
						<Button
							variant='outline'
							onClick={() => (window.location.href = '/reportes/ventas')}
							icon='HeroChartBar'>
							Dashboard Ventas
						</Button>
					</PermissionGuard>
				</div>
			</div>

			{/* Estadísticas */}
			<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-5'>
				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-blue-100 p-2'>
								<Icon icon='HeroCurrencyDollar' className='h-5 w-5 text-blue-600' />
							</div>
							<div>
								<p className='text-sm text-gray-600'>Total Ventas</p>
								<p className='text-xl font-bold'>
									{formatCurrency(statistics.totalSalesAmount)}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-green-100 p-2'>
								<Icon
									icon='HeroChartBarSquare'
									className='h-5 w-5 text-green-600'
								/>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Cantidad</p>
								<p className='text-xl font-bold'>{statistics.totalSalesCount}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-yellow-100 p-2'>
								<span className='text-xl text-yellow-600'>⏳</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Pendientes</p>
								<p className='text-xl font-bold'>{statistics.pendingSales}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-emerald-100 p-2'>
								<HiOutlineCheckCircle className='text-xl text-emerald-600' />
							</div>
							<div>
								<p className='text-sm text-gray-600'>Entregadas</p>
								<p className='text-xl font-bold'>{statistics.deliveredSales}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-red-100 p-2'>
								<span className='text-xl text-red-600'>❌</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Canceladas</p>
								<p className='text-xl font-bold'>{statistics.cancelledSales}</p>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Filtros */}
			<Card className='mb-6'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Filtros</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4'>
						<Select
							name='status'
							placeholder='Estado'
							value={localFilters.status}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, status: e.target.value })
							}>
							<option value=''>Todos</option>
							<option value='PENDING'>Pendiente</option>
							<option value='CONFIRMED'>Confirmada</option>
							<option value='INVOICED'>Facturada</option>
							<option value='PAID'>Pagada</option>
							<option value='SHIPPED'>Enviada</option>
							<option value='DELIVERED'>Entregada</option>
							<option value='CANCELLED'>Cancelada</option>
							<option value='RETURNED'>Devuelta</option>
						</Select>

						<Input
							name='Fecha desde'
							type='date'
							placeholder='Fecha desde'
							value={localFilters.sale_date_from}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, sale_date_from: e.target.value })
							}
						/>

						<Input
							name='Fecha hasta'
							type='date'
							placeholder='Fecha hasta'
							value={localFilters.sale_date_to}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, sale_date_to: e.target.value })
							}
						/>

						<div className='flex space-x-2'>
							<Button onClick={handleApplyFilters} icon='HeroMagnifyingGlass'>
								Filtrar
							</Button>

							<Button variant='outline' onClick={handleClearFilters} icon='HeroXMark'>
								Limpiar
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Tabla de ventas */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Lista de Ventas ({pagination.totalSales})</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table className='table-fixed max-md:min-w-[80rem]'>
						<THead>
							<Tr>
								<Th className='w-32'>Número</Th>
								<Th>Cliente</Th>
								<Th>Estado</Th>
								<Th>Pago</Th>
								<Th>Fecha</Th>
								<Th>Factura</Th>
								<Th>Total</Th>
								<Th>Vendedor</Th>
								<Th className='w-56'>Acciones</Th>
							</Tr>
						</THead>
						<TBody>
							{loading.fetch ? (
								<Tr>
									<Td colSpan={9} className='py-8 text-center'>
										Cargando ventas...
									</Td>
								</Tr>
							) : sales.length === 0 ? (
								<Tr>
									<Td colSpan={9} className='py-8 text-center'>
										No hay ventas registradas
									</Td>
								</Tr>
							) : (
								sales.map((sale) => (
									<Tr key={sale.id}>
										<Td className='font-mono'>{sale.sale_number}</Td>
										<Td>{sale.customer?.first_name || 'Cliente N/A'}</Td>
										<Td>{getStatusBadge(sale.status)}</Td>
										<Td>{getPaymentStatusBadge(sale.payment_status)}</Td>
										<Td>{formatDate(sale.sale_date)}</Td>
										<Td className='font-mono'>
											{sale.invoice_number || 'Sin factura'}
										</Td>
										<Td className='font-mono'>
											{formatCurrency(sale.total_amount)}
										</Td>
										<Td>{sale.salesperson?.name || 'N/A'}</Td>
										<Td>
											<div className='flex flex-wrap gap-1'>
												<PermissionGuard
													permissions={[ERP_PERMISSIONS.SALES.VIEW]}>
													<Button
														size='sm'
														variant='outline'
														icon='HeroEye'
														onClick={() => {
															window.location.href = `/comercial/ventas/${sale.id}`;
														}}
													/>
												</PermissionGuard>

												{canInvoice(sale) && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.SALES.GENERATE_INVOICE,
														]}>
														<Button
															size='sm'
															color='violet'
															icon='HeroDocument'
															isLoading={actionLoading.invoice}
															onClick={() =>
																handleGenerateInvoice(sale.id)
															}
														/>
													</PermissionGuard>
												)}

												{canAddPayment(sale) && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.SALES.RECORD_PAYMENT,
														]}>
														<Button
															size='sm'
															color='emerald'
															icon='HeroCreditCard'
															onClick={() => {
																setSelectedSale(sale);
																setPaymentForm({
																	...paymentForm,
																	amount: (
																		sale.total_amount -
																		(sale.paid_amount || 0)
																	).toString(),
																});
																setShowPaymentModal(true);
															}}
														/>
													</PermissionGuard>
												)}

												{canShip(sale) && (
													<PermissionGuard
														permissions={[ERP_PERMISSIONS.SALES.SHIP]}>
														<Button
															size='sm'
															color='violet'
															icon='HeroTruck'
															colorIntensity='300'
															onClick={() => {
																setSelectedSale(sale);
																setShowShipModal(true);
															}}
														/>
													</PermissionGuard>
												)}

												{sale.invoice_number && (
													<Button
														size='sm'
														color='gray'
														icon='HeroDocumentText'
														onClick={() => {
															window.open(
																`/api/sales/${sale.id}/invoice-pdf`,
																'_blank',
															);
														}}
													/>
												)}

												{canCancel(sale) && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.SALES.CANCEL,
														]}>
														<Button
															size='sm'
															color='red'
															icon='HeroXMark'
															onClick={() => {
																setSelectedSale(sale);
																setShowCancelModal(true);
															}}
														/>
													</PermissionGuard>
												)}
											</div>
										</Td>
									</Tr>
								))
							)}
						</TBody>
					</Table>

					{pagination.totalPages > 1 && (
						<TFoot>
							<Tr>
								<Td colSpan={9}>
									<div className='flex justify-center py-4'>
										<Pagination
											currentPage={pagination.currentPage}
											totalPages={pagination.totalPages}
											onPageChange={handlePageChange}
										/>
									</div>
								</Td>
							</Tr>
						</TFoot>
					)}
				</CardBody>
			</Card>

			{/* Modal de pago */}
			<Modal isOpen={showPaymentModal} setIsOpen={setShowPaymentModal} size='lg'>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Registrar Pago</h3>
				</ModalHeader>
				<ModalBody>
					{selectedSale && (
						<div className='space-y-4'>
							<div className='rounded-lg bg-gray-50 p-3'>
								<p>
									<strong>Venta:</strong> {selectedSale.sale_number}
								</p>
								<p>
									<strong>Cliente:</strong>{' '}
									{selectedSale.customer?.first_name || 'N/A'}
								</p>
								<p>
									<strong>Total:</strong>{' '}
									{formatCurrency(selectedSale.total_amount)}
								</p>
								<p>
									<strong>Pagado:</strong>{' '}
									{formatCurrency(selectedSale.paid_amount || 0)}
								</p>
								<p>
									<strong>Pendiente:</strong>{' '}
									{formatCurrency(
										selectedSale.total_amount - (selectedSale.paid_amount || 0),
									)}
								</p>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='mb-1 block text-sm font-medium'>Monto</label>
									<Input
										name='monto'
										type='number'
										step='0.01'
										value={paymentForm.amount}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												amount: e.target.value,
											})
										}
									/>
								</div>

								<div>
									<label className='mb-1 block text-sm font-medium'>
										Método de Pago
									</label>
									<Select
										name='metodo de pago'
										value={paymentForm.payment_method}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												payment_method: e.target.value,
											})
										}>
										<option value='CASH'>Efectivo</option>
										<option value='CARD'>Tarjeta</option>
										<option value='TRANSFER'>Transferencia</option>
										<option value='CHECK'>Cheque</option>
									</Select>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='mb-1 block text-sm font-medium'>
										Fecha de Pago
									</label>
									<Input
										name='fecha de pago'
										type='date'
										value={paymentForm.payment_date}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												payment_date: e.target.value,
											})
										}
									/>
								</div>

								<div>
									<label className='mb-1 block text-sm font-medium'>
										Referencia
									</label>
									<Input
										name='referencia'
										value={paymentForm.reference}
										onChange={(e) =>
											setPaymentForm({
												...paymentForm,
												reference: e.target.value,
											})
										}
										placeholder='Número de transacción, cheque, etc.'
									/>
								</div>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>Notas</label>
								<Textarea
									value={paymentForm.notes}
									onChange={(e) =>
										setPaymentForm({ ...paymentForm, notes: e.target.value })
									}
									placeholder='Observaciones adicionales...'
								/>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => {
							setShowPaymentModal(false);
							setSelectedSale(null);
						}}>
						Cancelar
					</Button>
					<Button
						color='emerald'
						isLoading={actionLoading.payment}
						onClick={handleRecordPayment}>
						Registrar Pago
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de envío */}
			<Modal isOpen={showShipModal} setIsOpen={setShowShipModal} size='lg'>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Enviar Venta</h3>
				</ModalHeader>
				<ModalBody>
					{selectedSale && (
						<div className='space-y-4'>
							<div className='rounded-lg bg-gray-50 p-3'>
								<p>
									<strong>Venta:</strong> {selectedSale.sale_number}
								</p>
								<p>
									<strong>Cliente:</strong> {selectedSale.customer?.first_name}
								</p>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='mb-1 block text-sm font-medium'>
										Número de Seguimiento
									</label>
									<Input
										name='numero de seguimiento'
										value={shipForm.tracking_number}
										onChange={(e) =>
											setShipForm({
												...shipForm,
												tracking_number: e.target.value,
											})
										}
										placeholder='Opcional'
									/>
								</div>

								<div>
									<label className='mb-1 block text-sm font-medium'>
										Transportista
									</label>
									<Input
										name='transportista'
										value={shipForm.carrier}
										onChange={(e) =>
											setShipForm({ ...shipForm, carrier: e.target.value })
										}
										placeholder='DHL, FedEx, etc.'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='mb-1 block text-sm font-medium'>
										Fecha de Envío
									</label>
									<Input
										name='fecha de envio'
										type='date'
										value={shipForm.shipped_date}
										onChange={(e) =>
											setShipForm({
												...shipForm,
												shipped_date: e.target.value,
											})
										}
									/>
								</div>

								<div>
									<label className='mb-1 block text-sm font-medium'>
										Entrega Estimada
									</label>
									<Input
										name='fecha de entrega estimada'
										type='date'
										value={shipForm.expected_delivery_date}
										onChange={(e) =>
											setShipForm({
												...shipForm,
												expected_delivery_date: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>
									Notas de Envío
								</label>
								<Textarea
									value={shipForm.notes}
									onChange={(e) =>
										setShipForm({ ...shipForm, notes: e.target.value })
									}
									placeholder='Instrucciones especiales, etc.'
								/>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => {
							setShowShipModal(false);
							setSelectedSale(null);
						}}>
						Cancelar
					</Button>
					<Button
						color='violet'
						colorIntensity='300'
						isLoading={actionLoading.ship}
						onClick={handleShipSale}>
						Marcar como Enviada
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de cancelación */}
			<Modal isOpen={showCancelModal} setIsOpen={setShowCancelModal}>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Cancelar Venta</h3>
				</ModalHeader>
				<ModalBody>
					{selectedSale && (
						<div className='space-y-4'>
							<div className='rounded-lg border border-red-200 bg-red-50 p-3'>
								<p className='text-red-800'>
									Esta acción cancelará la venta permanentemente.
								</p>
								<p>
									<strong>Venta:</strong> {selectedSale.sale_number}
								</p>
								<p>
									<strong>Cliente:</strong>{' '}
									{selectedSale.customer?.first_name || 'N/A'}
								</p>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>
									Razón de Cancelación *
								</label>
								<Select
									name='razon de cancelación'
									value={cancelForm.reason}
									onChange={(e) =>
										setCancelForm({ ...cancelForm, reason: e.target.value })
									}>
									<option value=''>Seleccionar razón</option>
									<option value='CUSTOMER_REQUEST'>Solicitud del cliente</option>
									<option value='OUT_OF_STOCK'>Sin stock</option>
									<option value='PAYMENT_ISSUE'>Problema de pago</option>
									<option value='QUALITY_ISSUE'>Problema de calidad</option>
									<option value='OTHER'>Otra razón</option>
								</Select>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>
									Monto de Reembolso
								</label>
								<Input
									name='monto de reembolso'
									type='number'
									step='0.01'
									value={cancelForm.refund_amount}
									onChange={(e) =>
										setCancelForm({
											...cancelForm,
											refund_amount: e.target.value,
										})
									}
									placeholder={`Opcional - máximo: ${selectedSale?.total_amount || 0}`}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>
									Notas Adicionales
								</label>
								<Textarea
									value={cancelForm.notes}
									onChange={(e) =>
										setCancelForm({ ...cancelForm, notes: e.target.value })
									}
									placeholder='Detalles de la cancelación...'
								/>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => {
							setShowCancelModal(false);
							setSelectedSale(null);
						}}>
						Cancelar
					</Button>
					<Button
						color='red'
						isLoading={actionLoading.cancel}
						onClick={handleCancelSale}
						isDisable={!cancelForm.reason}>
						Confirmar Cancelación
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default Ventas;
