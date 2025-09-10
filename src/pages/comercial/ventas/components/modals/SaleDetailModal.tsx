/**
 * Modal para mostrar detalles completos de una venta
 * Vista detallada con toda la información de la venta
 */
import React from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { ISale } from '../../types/sales.types';

interface SaleDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	sale: ISale | null;
	onEdit?: (sale: ISale) => void;
	onGenerateInvoice?: (sale: ISale) => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
	isOpen,
	onClose,
	sale,
	onEdit,
	onGenerateInvoice,
}) => {
	if (!sale) return null;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const formatDateTime = (date: string) => {
		return new Date(date).toLocaleString('es-CO');
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800';
			case 'CANCELLED':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'Completada';
			case 'PENDING':
				return 'Pendiente';
			case 'CANCELLED':
				return 'Cancelada';
			default:
				return status;
		}
	};

	const handleEdit = () => {
		if (onEdit && sale) {
			onEdit(sale);
		}
	};

	const handleGenerateInvoice = () => {
		if (onGenerateInvoice && sale) {
			onGenerateInvoice(sale);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} size='4xl'>
			<ModalHeader className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
						<Icon icon='HeroEye' className='h-5 w-5 text-blue-600' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>
							Detalles de Venta - {sale.sale_number}
						</h3>
						<p className='text-sm text-gray-600'>
							Creada el {formatDate(sale.created_at)}
						</p>
					</div>
				</div>
				<span
					className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(sale.status)}`}>
					{getStatusText(sale.status)}
				</span>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-6'>
					{/* Información General */}
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroInformationCircle' className='h-5 w-5' />
									Información General
								</CardTitle>
							</CardHeader>
							<CardBody className='space-y-3'>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										Número de Venta
									</p>
									<p className='text-lg font-semibold'>{sale.sale_number}</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										Fecha de Venta
									</p>
									<p className='font-medium'>{formatDate(sale.sale_date)}</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>Vendedor</p>
									<p className='font-medium'>
										{sale.salesperson?.first_name} {sale.salesperson?.last_name}
									</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>Estado</p>
									<span
										className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(sale.status)}`}>
										{getStatusText(sale.status)}
									</span>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroUser' className='h-5 w-5' />
									Información del Cliente
								</CardTitle>
							</CardHeader>
							<CardBody className='space-y-3'>
								<div>
									<p className='text-sm font-medium text-gray-600'>Cliente</p>
									<p className='font-semibold'>
										{sale.customer?.company_name ||
											`${sale.customer?.first_name || ''} ${sale.customer?.last_name || ''}`.trim() ||
											'Cliente no especificado'}
									</p>
								</div>
								{sale.customer?.tax_id && (
									<div>
										<p className='text-sm font-medium text-gray-600'>NIT/CC</p>
										<p className='font-medium'>{sale.customer.tax_id}</p>
									</div>
								)}
								{sale.customer?.email && (
									<div>
										<p className='text-sm font-medium text-gray-600'>Email</p>
										<p className='font-medium'>{sale.customer.email}</p>
									</div>
								)}
								{sale.customer?.phone && (
									<div>
										<p className='text-sm font-medium text-gray-600'>
											Teléfono
										</p>
										<p className='font-medium'>{sale.customer.phone}</p>
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					{/* Productos */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Icon icon='HeroShoppingCart' className='h-5 w-5' />
								Productos Vendidos
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='overflow-x-auto'>
								<table className='w-full table-auto'>
									<thead>
										<tr className='border-b bg-gray-50'>
											<th className='px-4 py-3 text-left font-semibold'>
												Producto
											</th>
											<th className='px-4 py-3 text-center font-semibold'>
												Cantidad
											</th>
											<th className='px-4 py-3 text-right font-semibold'>
												Precio Unit.
											</th>
											<th className='px-4 py-3 text-right font-semibold'>
												Descuento
											</th>
											<th className='px-4 py-3 text-right font-semibold'>
												IVA
											</th>
											<th className='px-4 py-3 text-right font-semibold'>
												Total
											</th>
										</tr>
									</thead>
									<tbody>
										{sale.items?.map((item, index) => (
											<tr key={index} className='border-b hover:bg-gray-50'>
												<td className='px-4 py-4'>
													<div>
														<p className='font-medium'>
															{item.product_name || 'Producto'}
														</p>
														{item.product_sku && (
															<p className='text-sm text-gray-500'>
																Código: {item.product_sku}
															</p>
														)}
													</div>
												</td>
												<td className='px-4 py-4 text-center'>
													{item.quantity}
												</td>
												<td className='px-4 py-4 text-right'>
													{formatCurrency(item.unit_price)}
												</td>
												<td className='px-4 py-4 text-right'>
													{item.discount_amount
														? formatCurrency(item.discount_amount)
														: '-'}
												</td>
												<td className='px-4 py-4 text-right'>
													{item.tax_amount
														? formatCurrency(item.tax_amount)
														: '-'}
												</td>
												<td className='px-4 py-4 text-right font-semibold'>
													{formatCurrency(item.total)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Resumen de totales */}
							<div className='mt-6 border-t pt-6'>
								<div className='flex justify-end'>
									<div className='w-80 space-y-3'>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Subtotal:</span>
											<span className='font-medium'>
												{formatCurrency(sale.subtotal)}
											</span>
										</div>
										{sale.discount_total > 0 && (
											<div className='flex justify-between'>
												<span className='text-gray-600'>
													Descuento Total:
												</span>
												<span className='font-medium text-red-600'>
													-{formatCurrency(sale.discount_total)}
												</span>
											</div>
										)}
										<div className='flex justify-between'>
											<span className='text-gray-600'>IVA Total:</span>
											<span className='font-medium'>
												{formatCurrency(sale.tax_total)}
											</span>
										</div>
										<div className='border-t pt-3'>
											<div className='flex justify-between text-xl font-bold'>
												<span>Total:</span>
												<span className='text-green-600'>
													{formatCurrency(sale.total_amount)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Pagos */}
					{sale.payments && sale.payments.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroCreditCard' className='h-5 w-5' />
									Historial de Pagos
								</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='space-y-4'>
									{sale.payments.map((payment, index) => (
										<div
											key={index}
											className='flex items-center justify-between rounded-lg bg-gray-50 p-4'>
											<div className='flex items-center gap-3'>
												<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100'>
													<Icon
														icon='HeroCreditCard'
														className='h-5 w-5 text-green-600'
													/>
												</div>
												<div>
													<p className='font-semibold'>
														{payment.payment_method}
													</p>
													<p className='text-sm text-gray-600'>
														{formatDateTime(payment.payment_date)}
													</p>
													{payment.reference && (
														<p className='text-xs text-gray-500'>
															Ref: {payment.reference}
														</p>
													)}
												</div>
											</div>
											<div className='text-right'>
												<p className='text-lg font-semibold text-green-600'>
													{formatCurrency(payment.amount)}
												</p>
											</div>
										</div>
									))}
								</div>
							</CardBody>
						</Card>
					)}

					{/* Notas y observaciones */}
					{sale.notes && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroDocumentText' className='h-5 w-5' />
									Notas y Observaciones
								</CardTitle>
							</CardHeader>
							<CardBody>
								<p className='whitespace-pre-wrap text-gray-700'>{sale.notes}</p>
							</CardBody>
						</Card>
					)}

					{/* Metadatos */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Icon icon='HeroClock' className='h-5 w-5' />
								Información de Auditoría
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
								<div>
									<p className='font-medium text-gray-600'>Creado</p>
									<p>{formatDateTime(sale.created_at)}</p>
								</div>
								<div>
									<p className='font-medium text-gray-600'>Última modificación</p>
									<p>{formatDateTime(sale.updated_at)}</p>
								</div>
								{sale.quotation_id && (
									<div>
										<p className='font-medium text-gray-600'>
											Cotización origen
										</p>
										<p>COT-{sale.quotation_id}</p>
									</div>
								)}
							</div>
						</CardBody>
					</Card>
				</div>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cerrar
					</Button>
					{sale.status !== 'CANCELLED' && (
						<>
							<Button variant='outline' color='blue' onClick={handleEdit}>
								<Icon icon='HeroPencil' className='mr-2 h-4 w-4' />
								Editar
							</Button>
							<Button color='blue' onClick={handleGenerateInvoice}>
								<Icon icon='HeroDocument' className='mr-2 h-4 w-4' />
								Ver Factura
							</Button>
						</>
					)}
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default SaleDetailModal;
