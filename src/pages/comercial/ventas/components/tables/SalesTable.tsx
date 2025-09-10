/**
 * Tabla de Ventas
 * Muestra listado de ventas con funcionalidades de acciones
 */
import React from 'react';
import Table, { TBody, THead, Th, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { ISale, SaleStatus } from '../../types/sales.types';
import { TColors } from '@/types/colors.type';

interface SalesTableProps {
	data: ISale[];
	loading: boolean;
	onView: (sale: ISale) => void;
	onEdit: (sale: ISale) => void;
	onRecordPayment: (sale: ISale) => void;
	onGenerateDocument: (sale: ISale) => void;
	onSendDocument: (sale: ISale) => void;
	onCancel: (sale: ISale) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({
	data,
	loading,
	onView,
	onEdit,
	onRecordPayment,
	onGenerateDocument,
	onSendDocument,
	onCancel,
}) => {
	const getStatusConfig = (
		status: SaleStatus,
	): { label: string; color: TColors; variant: 'solid' } => {
		const configs = {
			PENDING: { label: 'Pendiente', color: 'amber' as TColors, variant: 'solid' as const },
			COMPLETED: {
				label: 'Completada',
				color: 'emerald' as TColors,
				variant: 'solid' as const,
			},
			CANCELLED: { label: 'Cancelada', color: 'red' as TColors, variant: 'solid' as const },
		};
		return configs[status];
	};

	const getPaymentStatus = (sale: ISale): { label: string; color: TColors } => {
		if (sale.status === 'CANCELLED') return { label: 'Cancelada', color: 'red' as TColors };
		if (sale.status === 'COMPLETED') return { label: 'Pagada', color: 'emerald' as TColors };

		const totalPaid = sale.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
		if (totalPaid === 0) return { label: 'Sin pagar', color: 'red' as TColors };
		if (totalPaid < sale.total_amount)
			return { label: 'Pago parcial', color: 'amber' as TColors };
		return { label: 'Pagada', color: 'emerald' as TColors };
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO');
	};

	if (loading) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<div className='flex items-center space-x-2'>
					<Icon
						icon='HeroArrowPath'
						className='h-5 w-5 animate-spin text-blue-600 dark:text-blue-400'
					/>
					<span className='text-gray-600 dark:text-gray-300'>Cargando ventas...</span>
				</div>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className='flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400'>
				<Icon
					icon='HeroDocumentText'
					className='mb-4 h-12 w-12 text-gray-300 dark:text-gray-600'
				/>
				<h3 className='text-lg font-medium text-gray-900 dark:text-white'>No hay ventas</h3>
				<p className='text-sm'>No se encontraron ventas con los filtros aplicados.</p>
			</div>
		);
	}

	return (
		<div className='overflow-x-auto'>
			<Table>
				<THead>
					<Tr>
						<Th>N° Venta</Th>
						<Th>Cliente</Th>
						<Th>Fecha</Th>
						<Th>Vendedor</Th>
						<Th>Total</Th>
						<Th>Estado</Th>
						<Th>Estado Pago</Th>
						<Th>Acciones</Th>
					</Tr>
				</THead>
				<TBody>
					{data.map((sale) => {
						const statusConfig = getStatusConfig(sale.status);
						const paymentStatus = getPaymentStatus(sale);

						return (
							<Tr key={sale.id}>
								<Td>
									<div className='font-mono text-sm font-medium text-gray-900 dark:text-white'>
										{sale.sale_number}
									</div>
									{sale.quotation_id && (
										<div className='text-xs text-gray-500 dark:text-gray-400'>
											Desde cotización
										</div>
									)}
								</Td>
								<Td>
									<div className='text-sm'>
										<div className='font-medium text-gray-900 dark:text-white'>
											{sale.customer?.company_name ||
												`${sale.customer?.first_name} ${sale.customer?.last_name}`}
										</div>
										{sale.customer?.email && (
											<div className='text-gray-500 dark:text-gray-400'>
												{sale.customer.email}
											</div>
										)}
									</div>
								</Td>
								<Td>
									<div className='text-sm text-gray-900 dark:text-white'>
										{formatDate(sale.sale_date)}
									</div>
								</Td>
								<Td>
									<div className='text-sm text-gray-900 dark:text-white'>
										{sale.salesperson?.first_name} {sale.salesperson?.last_name}
									</div>
								</Td>
								<Td>
									<div className='text-sm font-semibold text-gray-900 dark:text-white'>
										{formatCurrency(sale.total_amount)}
									</div>
									{sale.discount_total > 0 && (
										<div className='text-xs text-green-600 dark:text-green-400'>
											Desc: {formatCurrency(sale.discount_total)}
										</div>
									)}
								</Td>
								<Td>
									<Badge
										color={statusConfig.color}
										variant={statusConfig.variant}
										className='text-xs'>
										{statusConfig.label}
									</Badge>
								</Td>
								<Td>
									<Badge
										color={paymentStatus.color}
										variant='solid'
										className='text-xs'>
										{paymentStatus.label}
									</Badge>
								</Td>
								<Td>
									<div className='flex items-center space-x-1'>
										<Button
											variant='outline'
											size='xs'
											onClick={() => onView(sale)}
											title='Ver detalles'>
											<Icon icon='HeroEye' className='h-3 w-3' />
										</Button>

										{sale.status !== 'CANCELLED' && (
											<>
												<Button
													variant='outline'
													size='xs'
													onClick={() => onEdit(sale)}
													title='Editar venta'>
													<Icon icon='HeroPencil' className='h-3 w-3' />
												</Button>

												{sale.status === 'PENDING' && (
													<>
														<Button
															variant='outline'
															size='xs'
															color='emerald'
															onClick={() => onRecordPayment(sale)}
															title='Registrar pago'>
															<Icon
																icon='HeroCurrencyDollar'
																className='h-3 w-3'
															/>
														</Button>

														<Button
															variant='outline'
															size='xs'
															color='blue'
															onClick={() => onGenerateDocument(sale)}
															title='Generar documento'>
															<Icon
																icon='HeroDocumentText'
																className='h-3 w-3'
															/>
														</Button>
													</>
												)}

												{sale.documents && sale.documents.length > 0 && (
													<Button
														variant='outline'
														size='xs'
														color='blue'
														onClick={() => onSendDocument(sale)}
														title='Enviar documento'>
														<Icon
															icon='HeroPaperAirplane'
															className='h-3 w-3'
														/>
													</Button>
												)}

												<Button
													variant='outline'
													size='xs'
													color='red'
													onClick={() => onCancel(sale)}
													title='Cancelar venta'>
													<Icon icon='HeroXMark' className='h-3 w-3' />
												</Button>
											</>
										)}
									</div>
								</Td>
							</Tr>
						);
					})}
				</TBody>
			</Table>
		</div>
	);
};

export default SalesTable;
