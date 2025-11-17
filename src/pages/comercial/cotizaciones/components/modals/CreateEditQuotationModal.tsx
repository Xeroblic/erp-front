/**
 * Modal para crear y editar cotizaciones
 * Utiliza Formik para validación y manejo de formularios
 * ACTUALIZADO: Usa componentes UI Card, SelectReact y estructura consistente
 */
import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { IQuote, QuoteStatus, IQuoteItem } from '../../../../../interface';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../components/ui/Modal';
import Card, {
	CardBody,
	CardHeader,
	CardHeaderChild,
	CardTitle,
} from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/form/Input';
import SelectReact from '../../../../../components/form/SelectReact';
import Textarea from '../../../../../components/form/Textarea';
import type { TSelectOption, TSelectOptions } from '../../../../../components/form/SelectReact';
import { quoteStatusOptions, normalizeQuoteStatusValue } from '../../constants/quoteStatuses';

interface CreateEditQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	quotation?: IQuote | null;
	loading?: boolean;
}

// Esquema de validación mejorado según CU025
const quotationSchema = Yup.object().shape({
	quote_number: Yup.string()
		.required('El número de cotización es requerido')
		.min(3, 'Mínimo 3 caracteres'),
	customer_id: Yup.number()
		.required('Debe seleccionar un cliente')
		.min(1, 'Debe seleccionar un cliente válido'),
	quote_date: Yup.date().required('La fecha de cotización es requerida'),
	valid_until: Yup.date()
		.required('La fecha de validez es requerida')
		.min(
			Yup.ref('quote_date'),
			'La fecha de validez debe ser posterior a la fecha de cotización',
		),
	payment_method: Yup.string().required('Debe seleccionar un método de pago'),
	purchase_order: Yup.string().max(100, 'La orden de compra no puede exceder 100 caracteres'),
	payment_terms: Yup.number()
		.min(0, 'Los términos de pago no pueden ser negativos')
		.max(365, 'Los términos de pago no pueden exceder 365 días'),
	discount_percentage: Yup.number()
		.min(0, 'El descuento no puede ser negativo')
		.max(100, 'El descuento no puede ser mayor a 100%'),
	fixed_discount: Yup.number().min(0, 'El descuento fijo no puede ser negativo'),
	tax_percentage: Yup.number()
		.min(0, 'El impuesto no puede ser negativo')
		.max(100, 'El impuesto no puede ser mayor a 100%'),
	notes: Yup.string().max(500, 'Las notas no pueden exceder 500 caracteres'),
	items: Yup.array()
		.of(
			Yup.object().shape({
				product_id: Yup.number()
					.required('Debe seleccionar un producto')
					.min(1, 'Debe seleccionar un producto válido'),
				quantity: Yup.number()
					.required('La cantidad es requerida')
					.min(1, 'La cantidad debe ser mayor a 0'),
				unit_price: Yup.number()
					.required('El precio unitario es requerido')
					.min(0, 'El precio no puede ser negativo'),
				discount_percentage: Yup.number()
					.min(0, 'El descuento no puede ser negativo')
					.max(100, 'El descuento no puede ser mayor a 100%'),
			}),
		)
		.min(1, 'Debe agregar al menos un item'),
});

const CreateEditQuotationModal: React.FC<CreateEditQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	quotation,
	loading = false,
}) => {
	// Opciones para los selects
	const customerOptions: TSelectOptions = [
		{ value: '1', label: 'Empresa ABC S.A.S.' },
		{ value: '2', label: 'Tech Solutions Ltda.' },
		{ value: '3', label: 'Constructora XYZ' },
		{ value: '4', label: 'Retail Store S.A.' },
		{ value: '5', label: 'Educación Digital' },
	];

	const paymentMethodOptions: TSelectOptions = [
		{ value: 'cash', label: 'Efectivo' },
		{ value: 'transfer', label: 'Transferencia' },
		{ value: 'credit_card', label: 'Tarjeta de Crédito' },
		{ value: 'check', label: 'Cheque' },
		{ value: 'credit_30', label: 'Crédito 30 días' },
	];

	const paymentTermsOptions: TSelectOptions = [
		{ value: '0', label: 'Inmediato' },
		{ value: '15', label: '15 días' },
		{ value: '30', label: '30 días' },
		{ value: '45', label: '45 días' },
		{ value: '60', label: '60 días' },
	];

	const statusOptions: TSelectOptions = quoteStatusOptions.map((option) => ({
		value: option.value,
		label: option.label,
	}));

	const productOptions: TSelectOptions = [
		{ value: '1', label: 'Laptop Dell Inspiron 15' },
		{ value: '2', label: 'Monitor Samsung 24"' },
		{ value: '3', label: 'Teclado Mecánico RGB' },
		{ value: '4', label: 'Mouse Inalámbrico Logitech' },
		{ value: '5', label: 'Webcam HD 1080p' },
		{ value: '6', label: 'Impresora HP LaserJet' },
		{ value: '7', label: 'Router WiFi 6' },
		{ value: '8', label: 'Disco SSD 1TB' },
	];

	// Valores iniciales del formulario
	const getInitialValues = (): Omit<IQuote, 'id' | 'created_at' | 'updated_at'> => {
		if (quotation) {
			return {
				company_id: quotation.company_id,
				quote_number: quotation.quote_number,
				customer_id: quotation.customer_id,
				quote_date: quotation.quote_date,
				valid_until: quotation.valid_until,
				status: normalizeQuoteStatusValue(quotation.status) as QuoteStatus,
				subtotal: quotation.subtotal,
				discount_amount: quotation.discount_amount,
				discount_percentage: quotation.discount_percentage,
				tax_percentage: quotation.tax_percentage,
				total_amount: quotation.total_amount,
				notes: quotation.notes || '',
				created_by: quotation.created_by,
				approved_by: quotation.approved_by,
				payment_method: quotation.payment_method,
				purchase_order: quotation.purchase_order,
				payment_terms: quotation.payment_terms,
				fixed_discount: quotation.fixed_discount,
				items: quotation.items || [],
				customer: quotation.customer,
				creator: quotation.creator,
				approver: quotation.approver,
				converted_sale: quotation.converted_sale,
				items_count: quotation.items_count,
				days_until_expiry: quotation.days_until_expiry,
				is_expired: quotation.is_expired,
				can_convert: quotation.can_convert,
			};
		}

		// Valores por defecto para nueva cotización según CU025
		const today = new Date().toISOString().split('T')[0];
		const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		return {
			company_id: 1,
			quote_number: `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
			customer_id: 0,
			quote_date: today,
			valid_until: validUntil,
			status: 'draft' as QuoteStatus,
			payment_method: '',
			purchase_order: '',
			payment_terms: 0,
			subtotal: 0,
			discount_amount: 0,
			discount_percentage: 0,
			fixed_discount: 0,
			tax_percentage: 19,
			total_amount: 0,
			notes: '',
			created_by: 1,
			items: [
				{
					id: 0,
					quote_id: 0,
					product_id: 0,
					quantity: 1,
					unit_price: 0,
					discount_percentage: 0,
					subtotal: 0,
					total: 0,
					created_at: '',
					updated_at: '',
				},
			],
		};
	};

	// Calcular totales de un item
	const calculateItemTotals = (item: any) => {
		const subtotal = item.quantity * item.unit_price;
		const discountAmount = (subtotal * item.discount_percentage) / 100;
		const total = subtotal - discountAmount;
		return { subtotal, discountAmount, total };
	};

	// Calcular totales de la cotización
	const calculateQuotationTotals = (
		items: any[],
		globalDiscountPercentage: number,
		fixedDiscount: number,
		taxPercentage: number,
	) => {
		const itemsTotal = items.reduce((sum, item) => {
			const { total } = calculateItemTotals(item);
			return sum + total;
		}, 0);

		const globalDiscountAmount = (itemsTotal * globalDiscountPercentage) / 100;
		const totalAfterPercentageDiscount = itemsTotal - globalDiscountAmount;
		const subtotal = totalAfterPercentageDiscount - fixedDiscount;
		const taxAmount = (subtotal * taxPercentage) / 100;
		const totalAmount = subtotal + taxAmount;

		return {
			subtotal: itemsTotal,
			discount_amount: globalDiscountAmount + fixedDiscount,
			total_amount: totalAmount,
		};
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()}>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-semibold'>
						{quotation ? 'Editar Cotización' : 'Nueva Cotización'}
					</h2>
					<p className='text-sm text-gray-600'>
						{quotation
							? 'Modifica los datos de la cotización'
							: 'Completa la información de la nueva cotización'}
					</p>
				</div>
			</ModalHeader>

			<ModalBody>
				<Formik
					initialValues={getInitialValues()}
					validationSchema={quotationSchema}
					onSubmit={(values, { setSubmitting }) => {
						onSubmit(values);
						setSubmitting(false);
					}}
					enableReinitialize>
					{({ values, setFieldValue, errors, touched, handleSubmit }) => (
						<Form id='quotation-form' className='space-y-6' onSubmit={handleSubmit}>
							{/* Información básica */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Información General</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Número de Cotización *
											</label>
											<Input
												name='quote_number'
												placeholder='COT-2024-001'
												value={values.quote_number}
												onChange={(e) =>
													setFieldValue('quote_number', e.target.value)
												}
												isValid={!errors.quote_number}
												isTouched={touched.quote_number}
												invalidFeedback={errors.quote_number}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Cliente *
											</label>
											<SelectReact
												name='customer_id'
												options={customerOptions}
												placeholder='Seleccionar cliente...'
												value={customerOptions.find(
													(opt) =>
														opt.value === String(values.customer_id),
												)}
												onChange={(option) => {
													const selectedOption = option as TSelectOption;
													if (
														selectedOption &&
														!Array.isArray(selectedOption)
													) {
														setFieldValue(
															'customer_id',
															Number(selectedOption.value) || 0,
														);
													}
												}}
												isValid={!errors.customer_id}
												isTouched={touched.customer_id}
												invalidFeedback={errors.customer_id}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Fecha de Cotización *
											</label>
											<Input
												name='quote_date'
												type='date'
												value={values.quote_date}
												onChange={(e) =>
													setFieldValue('quote_date', e.target.value)
												}
												isValid={!errors.quote_date}
												isTouched={touched.quote_date}
												invalidFeedback={errors.quote_date}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Válida Hasta *
											</label>
											<Input
												name='valid_until'
												type='date'
												value={values.valid_until}
												onChange={(e) =>
													setFieldValue('valid_until', e.target.value)
												}
												isValid={!errors.valid_until}
												isTouched={touched.valid_until}
												invalidFeedback={errors.valid_until}
											/>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Información de Pago */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Información de Pago</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Método de Pago
											</label>
											<SelectReact
												name='payment_method'
												options={paymentMethodOptions}
												placeholder='Seleccionar método...'
												value={paymentMethodOptions.find(
													(opt) => opt.value === values.payment_method,
												)}
												onChange={(option) => {
													const selectedOption = option as TSelectOption;
													if (
														selectedOption &&
														!Array.isArray(selectedOption)
													) {
														setFieldValue(
															'payment_method',
															selectedOption.value || '',
														);
													}
												}}
												isValid={!errors.payment_method}
												isTouched={touched.payment_method}
												invalidFeedback={errors.payment_method}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Orden de Compra (OC)
											</label>
											<Input
												name='purchase_order'
												placeholder='OC-2024-001'
												value={values.purchase_order}
												onChange={(e) =>
													setFieldValue('purchase_order', e.target.value)
												}
												isValid={!errors.purchase_order}
												isTouched={touched.purchase_order}
												invalidFeedback={errors.purchase_order}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Términos de Pago
											</label>
											<SelectReact
												name='payment_terms'
												options={paymentTermsOptions}
												placeholder='Seleccionar términos...'
												value={paymentTermsOptions.find(
													(opt) =>
														opt.value === String(values.payment_terms),
												)}
												onChange={(option) => {
													const selectedOption = option as TSelectOption;
													if (
														selectedOption &&
														!Array.isArray(selectedOption)
													) {
														setFieldValue(
															'payment_terms',
															Number(selectedOption.value) || 0,
														);
													}
												}}
												isValid={!errors.payment_terms}
												isTouched={touched.payment_terms}
												invalidFeedback={errors.payment_terms}
											/>
										</div>
									</div>

									<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Estado de la Cotización
											</label>
											<SelectReact
												name='status'
												options={statusOptions}
												placeholder='Seleccionar estado...'
												value={statusOptions.find(
													(opt) => opt.value === values.status,
												)}
												onChange={(option) => {
													const selectedOption = option as TSelectOption;
													if (
														selectedOption &&
														!Array.isArray(selectedOption)
													) {
														setFieldValue(
															'status',
															selectedOption.value as QuoteStatus,
														);
													}
												}}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Observaciones
											</label>
											<Textarea
												name='notes'
												placeholder='Observaciones adicionales...'
												value={values.notes}
												onChange={(e) =>
													setFieldValue('notes', e.target.value)
												}
												rows={3}
												isValid={!errors.notes}
												isTouched={touched.notes}
												invalidFeedback={errors.notes}
											/>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Items de la Cotización */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Items de la Cotización</CardTitle>
									</CardHeaderChild>
									<CardHeaderChild>
										<Button size='sm' variant='outline' icon='plus'>
											Agregar Item
										</Button>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<FieldArray name='items'>
										{({ push, remove }) => (
											<div className='space-y-4'>
												{(values.items || []).map((item, index) => (
													<div
														key={index}
														className='rounded-md border border-gray-200 p-4'>
														<div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Producto *
																</label>
																<SelectReact
																	name={`items.${index}.product_id`}
																	options={productOptions}
																	placeholder='Seleccionar...'
																	value={productOptions.find(
																		(opt) =>
																			opt.value ===
																			String(item.product_id),
																	)}
																	onChange={(option) => {
																		const selectedOption =
																			option as TSelectOption;
																		if (
																			selectedOption &&
																			!Array.isArray(
																				selectedOption,
																			)
																		) {
																			setFieldValue(
																				`items.${index}.product_id`,
																				Number(
																					selectedOption.value,
																				) || 0,
																			);
																		}
																	}}
																	dimension='sm'
																/>
															</div>

															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Cantidad *
																</label>
																<Input
																	name={`items.${index}.quantity`}
																	type='number'
																	placeholder='1'
																	value={item.quantity}
																	onChange={(e) =>
																		setFieldValue(
																			`items.${index}.quantity`,
																			Number(e.target.value),
																		)
																	}
																	dimension='sm'
																/>
															</div>

															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Precio Unit. *
																</label>
																<Input
																	name={`items.${index}.unit_price`}
																	type='number'
																	placeholder='0'
																	value={item.unit_price}
																	onChange={(e) =>
																		setFieldValue(
																			`items.${index}.unit_price`,
																			Number(e.target.value),
																		)
																	}
																	dimension='sm'
																/>
															</div>

															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Desc. %
																</label>
																<Input
																	name={`items.${index}.discount_percentage`}
																	type='number'
																	placeholder='0'
																	value={item.discount_percentage}
																	onChange={(e) =>
																		setFieldValue(
																			`items.${index}.discount_percentage`,
																			Number(e.target.value),
																		)
																	}
																	dimension='sm'
																/>
															</div>

															<div className='flex items-end'>
																<Button
																	variant='outline'
																	color='red'
																	size='sm'
																	icon='trash'
																	onClick={() => remove(index)}
																	isDisable={
																		(values.items?.length ||
																			0) === 1
																	}>
																	Eliminar
																</Button>
															</div>
														</div>
													</div>
												))}

												<Button
													variant='outline'
													onClick={() =>
														push({
															id: 0,
															quote_id: 0,
															product_id: 0,
															quantity: 1,
															unit_price: 0,
															discount_percentage: 0,
															subtotal: 0,
															total: 0,
															created_at: '',
															updated_at: '',
														})
													}
													icon='plus'>
													Agregar Ítem
												</Button>
											</div>
										)}
									</FieldArray>
								</CardBody>
							</Card>

							{/* Resumen Financiero */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Resumen</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Descuento Fijo ($)
											</label>
											<Input
												name='fixed_discount'
												type='number'
												placeholder='0'
												value={values.fixed_discount}
												onChange={(e) =>
													setFieldValue(
														'fixed_discount',
														Number(e.target.value),
													)
												}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Descuento Global %
											</label>
											<Input
												name='discount_percentage'
												type='number'
												placeholder='0'
												value={values.discount_percentage}
												onChange={(e) =>
													setFieldValue(
														'discount_percentage',
														Number(e.target.value),
													)
												}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Impuesto %
											</label>
											<Input
												name='tax_percentage'
												type='number'
												placeholder='19'
												value={values.tax_percentage}
												onChange={(e) =>
													setFieldValue(
														'tax_percentage',
														Number(e.target.value),
													)
												}
											/>
										</div>
									</div>

									<div className='mt-6 space-y-2 border-t pt-4'>
										<div className='flex justify-between'>
											<span className='text-sm font-medium text-gray-600'>
												Subtotal:
											</span>
											<span className='text-sm font-semibold'>$0</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-sm font-medium text-gray-600'>
												Descuento:
											</span>
											<span className='text-sm font-semibold'>-$0</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-sm font-medium text-gray-600'>
												Impuestos:
											</span>
											<span className='text-sm font-semibold'>$0</span>
										</div>
										<div className='flex justify-between border-t pt-2'>
											<span className='text-lg font-bold text-gray-900'>
												Total:
											</span>
											<span className='text-lg font-bold text-gray-900'>
												$0
											</span>
										</div>
									</div>
								</CardBody>
							</Card>
						</Form>
					)}
				</Formik>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose} isDisable={loading}>
						Cancelar
					</Button>
					<Button
						onClick={() =>
							document
								.getElementById('quotation-form')
								?.dispatchEvent(
									new Event('submit', { bubbles: true, cancelable: true }),
								)
						}
						isLoading={loading}>
						{quotation ? 'Actualizar' : 'Crear'} Cotización
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CreateEditQuotationModal;
