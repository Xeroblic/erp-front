/**
 * Modal para mostrar la factura de una venta
 * Muestra los detalles completos de la factura con opción de descarga
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

interface InvoiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	sale: ISale | null;
	onDownload?: (sale: ISale) => void;
	onPrint?: (sale: ISale) => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
	isOpen,
	onClose,
	sale,
	onDownload,
	onPrint,
}) => {
	if (!sale) return null;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('es-CO');
	};

	const handleDownload = () => {
		if (onDownload && sale) {
			onDownload(sale);
		}
	};

	const handlePrint = () => {
		if (onPrint && sale) {
			onPrint(sale);
		} else {
			window.print();
		}
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

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} size='4xl'>
			<ModalHeader className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
						<Icon icon='HeroDocument' className='h-5 w-5 text-blue-600' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>
							Factura - {sale.sale_number}
						</h3>
						<p className='text-sm text-gray-600'>Fecha: {formatDate(sale.sale_date)}</p>
					</div>
				</div>
				<span
					className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(sale.status)}`}>
					{getStatusText(sale.status)}
				</span>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-6'>
					{/* Información de la empresa y cliente */}
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroBuilding' className='h-5 w-5' />
									Información de la Empresa
								</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='space-y-2'>
									<p className='text-lg font-semibold'>EcoPC Solutions</p>
									<p className='text-sm text-gray-600'>NIT: 900.123.456-7</p>
									<p className='text-sm text-gray-600'>Cra. 15 #93-07, Bogotá</p>
									<p className='text-sm text-gray-600'>Tel: (601) 555-0123</p>
									<p className='text-sm text-gray-600'>contacto@ecopc.com</p>
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
							<CardBody>
								<div className='space-y-2'>
									<p className='font-semibold'>
										{sale.customer?.company_name ||
											`${sale.customer?.first_name || ''} ${sale.customer?.last_name || ''}`.trim() ||
											'Cliente no especificado'}
									</p>
									{sale.customer?.tax_id && (
										<p className='text-sm text-gray-600'>
											NIT: {sale.customer.tax_id}
										</p>
									)}
									{sale.customer?.email && (
										<p className='text-sm text-gray-600'>
											Email: {sale.customer.email}
										</p>
									)}
									{sale.customer?.phone && (
										<p className='text-sm text-gray-600'>
											Tel: {sale.customer.phone}
										</p>
									)}
								</div>
							</CardBody>
						</Card>
					</div>

					{/* Detalles de la venta */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Icon icon='HeroShoppingCart' className='h-5 w-5' />
								Detalles de la Venta
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='overflow-x-auto'>
								<table className='w-full table-auto'>
									<thead>
										<tr className='border-b'>
											<th className='px-2 py-3 text-left'>Producto</th>
											<th className='px-2 py-3 text-center'>Cantidad</th>
											<th className='px-2 py-3 text-right'>Precio Unit.</th>
											<th className='px-2 py-3 text-right'>Descuento</th>
											<th className='px-2 py-3 text-right'>Total</th>
										</tr>
									</thead>
									<tbody>
										{sale.items?.map((item, index) => (
											<tr key={index} className='border-b'>
												<td className='px-2 py-3'>
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
												<td className='px-2 py-3 text-center'>
													{item.quantity}
												</td>
												<td className='px-2 py-3 text-right'>
													{formatCurrency(item.unit_price)}
												</td>
												<td className='px-2 py-3 text-right'>
													{item.discount_amount
														? formatCurrency(item.discount_amount)
														: '-'}
												</td>
												<td className='px-2 py-3 text-right font-medium'>
													{formatCurrency(item.total)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardBody>
					</Card>

					{/* Totales */}
					<Card>
						<CardBody>
							<div className='space-y-3'>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Subtotal:</span>
									<span className='font-medium'>
										{formatCurrency(sale.subtotal)}
									</span>
								</div>
								{sale.discount_total > 0 && (
									<div className='flex justify-between'>
										<span className='text-gray-600'>Descuento:</span>
										<span className='font-medium text-red-600'>
											-{formatCurrency(sale.discount_total)}
										</span>
									</div>
								)}
								<div className='flex justify-between'>
									<span className='text-gray-600'>IVA:</span>
									<span className='font-medium'>
										{formatCurrency(sale.tax_total)}
									</span>
								</div>
								<div className='border-t pt-3'>
									<div className='flex justify-between text-lg font-bold'>
										<span>Total:</span>
										<span>{formatCurrency(sale.total_amount)}</span>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Información de pagos */}
					{sale.payments && sale.payments.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroCreditCard' className='h-5 w-5' />
									Información de Pagos
								</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='space-y-3'>
									{sale.payments.map((payment, index) => (
										<div
											key={index}
											className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
											<div>
												<p className='font-medium'>
													{payment.payment_method}
												</p>
												<p className='text-sm text-gray-600'>
													{formatDate(payment.payment_date)}
												</p>
											</div>
											<span className='font-semibold text-green-600'>
												{formatCurrency(payment.amount)}
											</span>
										</div>
									))}
								</div>
							</CardBody>
						</Card>
					)}

					{/* Notas */}
					{sale.notes && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon icon='HeroDocumentText' className='h-5 w-5' />
									Notas
								</CardTitle>
							</CardHeader>
							<CardBody>
								<p className='text-gray-700'>{sale.notes}</p>
							</CardBody>
						</Card>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cerrar
					</Button>
					<Button variant='outline' onClick={handlePrint}>
						<Icon icon='HeroPrinter' className='mr-2 h-4 w-4' />
						Imprimir
					</Button>
					<Button color='blue' onClick={handleDownload}>
						<Icon icon='HeroArrowDownTray' className='mr-2 h-4 w-4' />
						Descargar PDF
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default InvoiceModal;
