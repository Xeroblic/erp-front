import React from 'react';
import { IQuote } from '../../../../../interface/quotes.interface';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import Card, {
	CardBody,
	CardHeader,
	CardHeaderChild,
	CardTitle,
} from '../../../../../components/ui/Card';

interface QuotationDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	quotation: IQuote | null;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
	isOpen,
	onClose,
	quotation,
}) => {
	if (!isOpen || !quotation) return null;

	// Función para formatear fecha
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// Función para formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	// Función para obtener el texto del estado
	const getStatusText = (status: string) => {
		const statusMap: Record<string, string> = {
			DRAFT: 'Borrador',
			SENT: 'Enviada',
			APPROVED: 'Aprobada',
			REJECTED: 'Rechazada',
			CONVERTED: 'Convertida',
			EXPIRED: 'Vencida',
			ACCEPTED: 'Aceptada',
			WAITING: 'En Espera',
			CREDIT_30: 'Crédito 30 días',
			PAID: 'Pagada',
		};
		return statusMap[status] || status;
	};

	// Función para obtener texto del método de pago
	const getPaymentMethodText = (method?: string) => {
		if (!method) return 'No especificado';
		const methodMap: Record<string, string> = {
			cash: 'Efectivo',
			transfer: 'Transferencia',
			credit_card: 'Tarjeta de Crédito',
			check: 'Cheque',
			credit_30: 'Crédito 30 días',
		};
		return methodMap[method] || method;
	};

	// Función para obtener texto de términos de pago
	const getPaymentTermsText = (terms?: number) => {
		if (!terms) return 'No especificado';
		if (terms === 0) return 'Inmediato';
		return `${terms} días`;
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()}>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-semibold'>Detalles de Cotización</h2>
					<p className='text-sm text-gray-600'>{quotation.quote_number}</p>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-6'>
					{/* Información General y de Pago */}
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Información General</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='space-y-3'>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Número de Cotización
										</dt>
										<dd className='text-sm text-gray-900'>
											{quotation.quote_number}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Cliente
										</dt>
										<dd className='text-sm text-gray-900'>
											{quotation.customer?.company_name ||
												(quotation.customer?.first_name &&
												quotation.customer?.last_name
													? `${quotation.customer.first_name} ${quotation.customer.last_name}`
													: `Cliente ID: ${quotation.customer_id}`)}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Fecha de Cotización
										</dt>
										<dd className='text-sm text-gray-900'>
											{formatDate(quotation.quote_date)}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Válida Hasta
										</dt>
										<dd className='text-sm text-gray-900'>
											{formatDate(quotation.valid_until)}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Estado
										</dt>
										<dd className='text-sm text-gray-900'>
											{getStatusText(quotation.status)}
										</dd>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Información de Pago</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='space-y-3'>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Método de Pago
										</dt>
										<dd className='text-sm text-gray-900'>
											{getPaymentMethodText(quotation.payment_method)}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Orden de Compra
										</dt>
										<dd className='text-sm text-gray-900'>
											{quotation.purchase_order || 'No especificado'}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Términos de Pago
										</dt>
										<dd className='text-sm text-gray-900'>
											{getPaymentTermsText(quotation.payment_terms)}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Convertida a venta
										</dt>
										<dd className='text-sm text-gray-900'>
											{quotation.converted_sale ? 'Sí' : 'No'}
										</dd>
									</div>
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Descuento Fijo
										</dt>
										<dd className='text-sm text-gray-900'>
											{quotation.fixed_discount
												? formatCurrency(quotation.fixed_discount)
												: 'No aplicado'}
										</dd>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>

					{/* Items de la Cotización */}
					{quotation.items && quotation.items.length > 0 && (
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Ítems de la Cotización</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='overflow-x-auto'>
									<table className='min-w-full divide-y divide-gray-200'>
										<thead className=''>
											<tr>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Producto
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Cantidad
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Precio Unit.
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Desc. %
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Total
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200'>
											{quotation.items.map((item, index) => {
												const itemTotal = item.quantity * item.unit_price;
												const discountAmount =
													(itemTotal * (item.discount_percentage || 0)) /
													100;
												const finalTotal = itemTotal - discountAmount;

												return (
													<tr key={index}>
														<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
															Producto #{item.product_id}
														</td>
														<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
															{item.quantity}
														</td>
														<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
															{formatCurrency(item.unit_price)}
														</td>
														<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
															{item.discount_percentage || 0}%
														</td>
														<td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900'>
															{formatCurrency(finalTotal)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</CardBody>
						</Card>
					)}

					{/* Resumen Financiero */}
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Resumen Financiero</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-3'>
								<div className='flex justify-between'>
									<dt className='text-sm font-medium text-gray-500'>Subtotal:</dt>
									<dd className='text-sm text-gray-900'>
										{formatCurrency(quotation.subtotal)}
									</dd>
								</div>
								<div className='flex justify-between'>
									<dt className='text-sm font-medium text-gray-500'>
										Descuento ({quotation.discount_percentage || 0}%):
									</dt>
									<dd className='text-sm text-gray-900'>
										- {formatCurrency(quotation.discount_amount || 0)}
									</dd>
								</div>
								<div className='flex justify-between'>
									<dt className='text-sm font-medium text-gray-500'>
										Impuestos ({quotation.tax_percentage || 0}%):
									</dt>
									<dd className='text-sm text-gray-900'>
										{formatCurrency(
											(quotation.subtotal * (quotation.tax_percentage || 0)) /
												100,
										)}
									</dd>
								</div>
								<div className='flex justify-between border-t pt-3'>
									<dt className='text-lg font-bold text-gray-900'>Total:</dt>
									<dd className='text-lg font-bold text-gray-900'>
										{formatCurrency(quotation.total_amount)}
									</dd>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Información de Auditoría */}
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Información de Auditoría</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<dt className='text-sm font-medium text-gray-500'>
										Creada el:
									</dt>
									<dd className='text-sm text-gray-900'>
										{formatDate(quotation.created_at)}
									</dd>
								</div>
								<div>
									<dt className='text-sm font-medium text-gray-500'>
										Última modificación:
									</dt>
									<dd className='text-sm text-gray-900'>
										{formatDate(quotation.updated_at)}
									</dd>
								</div>
								{quotation.created_by && (
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Creada por:
										</dt>
										<dd className='text-sm text-gray-900'>
											Usuario ID: {quotation.created_by}
										</dd>
									</div>
								)}
								{quotation.approved_by && (
									<div>
										<dt className='text-sm font-medium text-gray-500'>
											Aprobada por:
										</dt>
										<dd className='text-sm text-gray-900'>
											Usuario ID: {quotation.approved_by}
										</dd>
									</div>
								)}
							</div>
						</CardBody>
					</Card>

					{/* Notas */}
					{quotation.notes && (
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Notas</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<p className='text-sm text-gray-900'>{quotation.notes}</p>
							</CardBody>
						</Card>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose}>
						Cerrar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};
