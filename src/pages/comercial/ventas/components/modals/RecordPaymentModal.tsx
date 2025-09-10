/**
 * Modal para Registrar Pagos de Ventas
 * Manejo de múltiples métodos de pago y validaciones
 */
import React, { useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import { ISale, ISalePayment, PaymentMethod } from '../../types/sales.types';
import { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';

interface RecordPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (saleId: number, payments: Omit<ISalePayment, 'id' | 'sale_id'>[]) => Promise<void>;
	sale: ISale | null;
	isLoading?: boolean;
}

// Esquema de validación
const paymentValidationSchema = Yup.object().shape({
	payments: Yup.array()
		.of(
			Yup.object().shape({
				payment_method: Yup.string().required('Método de pago requerido'),
				amount: Yup.number()
					.min(0.01, 'Monto debe ser mayor a 0')
					.required('Monto requerido'),
				fee_percentage: Yup.number().min(0).max(100),
				reference: Yup.string().when('payment_method', {
					is: (method: string) => ['DEBIT', 'CREDIT', 'TRANSFER'].includes(method),
					then: (schema) =>
						schema.required('Referencia requerida para este método de pago'),
					otherwise: (schema) => schema,
				}),
			}),
		)
		.min(1, 'Debe agregar al menos un pago'),
});

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	sale,
	isLoading = false,
}) => {
	if (!sale) return null;

	const paymentMethodOptions: TSelectOptions = [
		{ value: 'CASH', label: 'Efectivo' },
		{ value: 'DEBIT', label: 'Débito' },
		{ value: 'CREDIT', label: 'Crédito' },
		{ value: 'TRANSFER', label: 'Transferencia' },
	];

	// Calcular pagos existentes
	const totalPaid = sale.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
	const remainingAmount = sale.total_amount - totalPaid;

	// Obtener configuración de fees por método de pago
	const getPaymentMethodConfig = (method: PaymentMethod) => {
		const configs = {
			CASH: { fee: 0, requiresReference: false, label: 'Efectivo' },
			DEBIT: { fee: 1.5, requiresReference: true, label: 'Débito' },
			CREDIT: { fee: 3.5, requiresReference: true, label: 'Crédito' },
			TRANSFER: { fee: 0.5, requiresReference: true, label: 'Transferencia' },
		};
		return configs[method];
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const initialValues = {
		payments: [
			{
				payment_method: 'CASH' as PaymentMethod,
				amount: remainingAmount,
				fee_percentage: 0,
				reference: '',
			},
		],
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100'>
						<Icon icon='HeroCurrencyDollar' className='h-6 w-6 text-green-600' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>Registrar Pago</h3>
						<p className='text-sm text-gray-500'>
							Venta {sale.sale_number} -{' '}
							{sale.customer?.company_name ||
								`${sale.customer?.first_name} ${sale.customer?.last_name}`}
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={paymentValidationSchema}
				onSubmit={async (values) => {
					const payments = values.payments.map((payment) => {
						const config = getPaymentMethodConfig(payment.payment_method);
						const feeAmount = payment.amount * (payment.fee_percentage / 100);

						return {
							payment_method: payment.payment_method,
							amount: payment.amount,
							fee_percentage: payment.fee_percentage,
							fee_amount: feeAmount,
							reference: payment.reference,
							payment_date: new Date().toISOString(),
							status: 'COMPLETED' as const,
						};
					});

					await onSubmit(sale.id, payments);
				}}>
				{(formik) => {
					// Calcular totales de pagos
					const totalPayments = formik.values.payments.reduce(
						(sum, payment) => sum + Number(payment.amount || 0),
						0,
					);
					const totalFees = formik.values.payments.reduce((sum, payment) => {
						const amount = Number(payment.amount || 0);
						const feePercent = Number(payment.fee_percentage || 0);
						return sum + amount * (feePercent / 100);
					}, 0);

					return (
						<Form>
							<ModalBody className='space-y-6'>
								{/* Información de la venta */}
								<Card>
									<CardHeader>
										<CardTitle>Información de la Venta</CardTitle>
									</CardHeader>
									<CardBody>
										<div className='grid grid-cols-2 gap-4 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Total Venta:
												</span>
												<span className='font-semibold text-gray-900'>
													{formatCurrency(sale.total_amount)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Ya Pagado:
												</span>
												<span className='font-medium text-gray-900'>
													{formatCurrency(totalPaid)}
												</span>
											</div>
											<div className='col-span-2 flex justify-between border-t pt-2'>
												<span className='font-medium text-gray-700'>
													Por Pagar:
												</span>
												<span className='text-lg font-bold text-red-600'>
													{formatCurrency(remainingAmount)}
												</span>
											</div>
										</div>
									</CardBody>
								</Card>

								{/* Pagos */}
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<CardTitle>Métodos de Pago</CardTitle>
											<FieldArray name='payments'>
												{({ push }) => (
													<Button
														size='sm'
														onClick={() =>
															push({
																payment_method:
																	'CASH' as PaymentMethod,
																amount: 0,
																fee_percentage: 0,
																reference: '',
															})
														}
														icon='HeroPlus'>
														Agregar Pago
													</Button>
												)}
											</FieldArray>
										</div>
									</CardHeader>
									<CardBody>
										<FieldArray name='payments'>
											{({ remove }) => (
												<div className='space-y-4'>
													{formik.values.payments.map(
														(payment, index) => {
															const config = getPaymentMethodConfig(
																payment.payment_method,
															);
															const feeAmount =
																Number(payment.amount || 0) *
																(Number(
																	payment.fee_percentage || 0,
																) /
																	100);

															return (
																<div
																	key={index}
																	className='rounded-lg border p-4'>
																	<div className='mb-4 flex items-start justify-between'>
																		<h4 className='text-sm font-medium text-gray-900'>
																			Pago #{index + 1}
																		</h4>
																		{formik.values.payments
																			.length > 1 && (
																			<Button
																				variant='outline'
																				size='xs'
																				color='red'
																				onClick={() =>
																					remove(index)
																				}>
																				<Icon
																					icon='HeroTrash'
																					className='h-3 w-3'
																				/>
																			</Button>
																		)}
																	</div>

																	<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700'>
																				Método de Pago *
																			</label>
																			<SelectReact
																				name={`payments.${index}.payment_method`}
																				options={
																					paymentMethodOptions
																				}
																				value={paymentMethodOptions.find(
																					(opt) =>
																						opt.value ===
																						payment.payment_method,
																				)}
																				onChange={(
																					selectedOption,
																				) => {
																					const option =
																						selectedOption as TSelectOption;
																					const method =
																						option?.value as PaymentMethod;
																					const methodConfig =
																						getPaymentMethodConfig(
																							method,
																						);

																					formik.setFieldValue(
																						`payments.${index}.payment_method`,
																						method,
																					);
																					formik.setFieldValue(
																						`payments.${index}.fee_percentage`,
																						methodConfig.fee,
																					);
																				}}
																			/>
																		</div>

																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700'>
																				Monto *
																			</label>
																			<Input
																				type='number'
																				name={`payments.${index}.amount`}
																				value={
																					payment.amount
																				}
																				onChange={
																					formik.handleChange
																				}
																				min='0'
																				step='0.01'
																			/>
																		</div>

																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700'>
																				Fee %
																			</label>
																			<Input
																				type='number'
																				name={`payments.${index}.fee_percentage`}
																				value={
																					payment.fee_percentage
																				}
																				onChange={
																					formik.handleChange
																				}
																				min='0'
																				max='100'
																				step='0.1'
																			/>
																			{feeAmount > 0 && (
																				<div className='mt-1 text-xs text-red-600'>
																					Fee:{' '}
																					{formatCurrency(
																						feeAmount,
																					)}
																				</div>
																			)}
																		</div>

																		{config.requiresReference && (
																			<div>
																				<label className='mb-1 block text-xs font-medium text-gray-700'>
																					Referencia *
																				</label>
																				<Input
																					name={`payments.${index}.reference`}
																					value={
																						payment.reference
																					}
																					onChange={
																						formik.handleChange
																					}
																					placeholder='Número de transacción...'
																				/>
																			</div>
																		)}
																	</div>

																	<div className='mt-3 text-right text-xs text-gray-600'>
																		Neto recibido:{' '}
																		{formatCurrency(
																			Number(
																				payment.amount || 0,
																			) - feeAmount,
																		)}
																	</div>
																</div>
															);
														},
													)}
												</div>
											)}
										</FieldArray>

										{/* Resumen de pagos */}
										<div className='mt-6 border-t pt-4'>
											<div className='flex justify-end'>
												<div className='space-y-2 text-right'>
													<div className='flex justify-between space-x-8'>
														<span className='text-sm text-gray-600'>
															Total Pagos:
														</span>
														<span className='text-sm font-medium'>
															{formatCurrency(totalPayments)}
														</span>
													</div>
													{totalFees > 0 && (
														<div className='flex justify-between space-x-8'>
															<span className='text-sm text-gray-600'>
																Total Fees:
															</span>
															<span className='text-sm font-medium text-red-600'>
																{formatCurrency(totalFees)}
															</span>
														</div>
													)}
													<div className='flex justify-between space-x-8'>
														<span className='text-sm text-gray-600'>
															Neto Recibido:
														</span>
														<span className='text-sm font-semibold'>
															{formatCurrency(
																totalPayments - totalFees,
															)}
														</span>
													</div>
													<div className='flex justify-between space-x-8 border-t pt-2'>
														<span className='text-sm text-gray-600'>
															Faltante:
														</span>
														<span
															className={`text-sm font-bold ${remainingAmount - totalPayments === 0 ? 'text-green-600' : 'text-red-600'}`}>
															{formatCurrency(
																remainingAmount - totalPayments,
															)}
														</span>
													</div>
												</div>
											</div>
										</div>

										{/* Validación de pago completo */}
										{totalPayments > remainingAmount && (
											<div className='mt-4 rounded-lg bg-red-50 p-3'>
												<div className='flex items-start space-x-2'>
													<Icon
														icon='HeroExclamationTriangle'
														className='mt-0.5 h-4 w-4 text-red-500'
													/>
													<div className='text-sm text-red-700'>
														<p className='font-medium'>
															Sobrepago detectado
														</p>
														<p>
															El total de pagos excede el monto
															pendiente por{' '}
															{formatCurrency(
																totalPayments - remainingAmount,
															)}
														</p>
													</div>
												</div>
											</div>
										)}

										{totalPayments === remainingAmount && (
											<div className='mt-4 rounded-lg bg-green-50 p-3'>
												<div className='flex items-start space-x-2'>
													<Icon
														icon='HeroCheckCircle'
														className='mt-0.5 h-4 w-4 text-green-500'
													/>
													<div className='text-sm text-green-700'>
														<p className='font-medium'>Pago completo</p>
														<p>
															La venta quedará marcada como
															completamente pagada
														</p>
													</div>
												</div>
											</div>
										)}
									</CardBody>
								</Card>
							</ModalBody>

							<ModalFooter>
								<ModalFooterChild>
									<Button
										variant='outline'
										color='gray'
										onClick={onClose}
										isDisable={isLoading}>
										<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
										Cancelar
									</Button>
									<Button
										onClick={() => formik.handleSubmit()}
										isDisable={
											isLoading || !formik.isValid || totalPayments <= 0
										}>
										{isLoading ? (
											<>
												<Icon
													icon='HeroArrowPath'
													className='mr-2 h-4 w-4 animate-spin'
												/>
												Registrando...
											</>
										) : (
											<>
												<Icon
													icon='HeroCurrencyDollar'
													className='mr-2 h-4 w-4'
												/>
												Registrar Pago
												{formik.values.payments.length > 1 ? 's' : ''}
											</>
										)}
									</Button>
								</ModalFooterChild>
							</ModalFooter>
						</Form>
					);
				}}
			</Formik>
		</Modal>
	);
};

export default RecordPaymentModal;
