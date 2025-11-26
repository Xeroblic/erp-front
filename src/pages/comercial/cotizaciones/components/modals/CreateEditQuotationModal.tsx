/**
 * Modal para crear y editar cotizaciones
 * Utiliza Formik para validación y manejo de formularios
 * ACTUALIZADO: Usa componentes UI Card, SelectReact y estructura consistente
 */
import React, { useEffect } from 'react';
import { Formik, Form, FieldArray } from 'formik';
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
import { selectPersonalizacionUsuario, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';

interface CreateEditQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	quotation?: IQuote | null;
	loading?: boolean;
}

// Esquema de validación mejorado según CU025
const quotationSchema = Yup.object().shape({
	// quote_number: Yup.string()
	// 	.required('El número de cotización es requerido')
	// 	.min(3, 'Mínimo 3 caracteres'),
	customer_id: Yup.number()
		.required('Debe seleccionar un cliente')
		.min(1, 'Debe seleccionar un cliente válido'),
	quote_date: Yup.date().required('La fecha de cotización es requerida'),
	expiry_date: Yup.date()
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
	tax_percentage: Yup.number()
		.oneOf([0, 19], 'Seleccione si desea aplicar IVA (19%)')
		.default(19),
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
			}),
		)
		.min(1, 'Debe agregar al menos un item'),
});

const IVA_RATE = 19;

const EMPTY_ITEM: IQuoteItem = {
	id: 0,
	quote_id: 0,
	product_id: 0,
	quantity: 1,
	unit_price: 0,
	created_at: '',
	updated_at: '',
};

const sanitizeItemsForSubmit = (items: IQuoteItem[]) =>
	(items || [])
		.filter((item) => item && item.product_id)
		.map((item) => ({
			product_id: Number(item.product_id),
			quantity: Number(item.quantity) || 1,
		}));

interface SaleableProduct {
	id: number;
	sku: string;
	name: string;
	stock: number;
	unit_price_gross: number;
	unit_price_net: number;
}

const formatCurrency = (value?: number | null) => {
	const amount = Number(value ?? 0);
	return new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP',
		maximumFractionDigits: 0,
	}).format(Number.isFinite(amount) ? amount : 0);
};

const CreateEditQuotationModal: React.FC<CreateEditQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	quotation,
	loading = false,
}) => {
	const personalizacion = useAppSelector(selectPersonalizacionUsuario);
	const user = useAppSelector((state) => state.auth.user);
	const subsidiaryId = personalizacion?.subsidiary_id || 1;
	const branchId =
		personalizacion?.sucursal_principal ||
		user?.branch?.id ||
		user?.personalizacion?.sucursal_principal ||
		0;

	const [customerOptions, setCustomerOptions] = React.useState<TSelectOptions>([]);
	const [productOptions, setProductOptions] = React.useState<TSelectOptions>([]);
	const [saleableProductsMap, setSaleableProductsMap] = React.useState<
		Record<number, SaleableProduct>
	>({});

	useEffect(() => {
		const fetchClientes = async () => {
			try {
				const clientes = await ApiService.fetchNormalized({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/overview?per_page=200`,
					method: 'GET',
				});

				setCustomerOptions(
					(clientes || []).map((c: any) => ({
						value: String(c.id),
						label:
							c.name || c.contact.name || 'Cliente sin nombre',
					})),
				);
			} catch (error) {
				console.error('Error cargando clientes:', error);
			}
		};

		if (isOpen) fetchClientes();
	}, [subsidiaryId, isOpen]);

	useEffect(() => {
		const fetchProductos = async () => {
			if (!branchId) return;
			try {
				const response = await ApiService.fetchNormalized({
					url: `/branches/${branchId}/products/saleables`,
					method: 'GET',
				});

				const saleables: SaleableProduct[] = Array.isArray(response)
					? response
					: Array.isArray(response?.data)
						? response.data
						: [];

				const mapped: Record<number, SaleableProduct> = {};
				saleables.forEach((product) => {
					if (product?.id) {
						mapped[product.id] = product;
					}
				});

				setSaleableProductsMap(mapped);
				setProductOptions(
					saleables.map((p) => ({
						value: String(p.id),
						label: `${p.name} · Stock ${p.stock ?? 0}`,
					})),
				);
			} catch (error) {
				console.error('Error cargando productos:', error);
			}
		};

		if (isOpen && branchId) fetchProductos();
	}, [branchId, isOpen]);

	// Opciones estáticas
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

	// Valores iniciales del formulario
	const getInitialValues = (): Omit<IQuote, 'id' | 'created_at' | 'updated_at'> => {
		if (quotation) {
			return {
				subsidiary_id: quotation.subsidiary_id,
				// quote_number: quotation.quote_number ?? '',
				customer_id: quotation.customer_id ?? 0,
				quote_date: quotation.quote_date ?? '',
				expiry_date: quotation.expiry_date ?? quotation.valid_until ?? '',
				status: normalizeQuoteStatusValue(quotation.status) as QuoteStatus,
				subtotal: quotation.subtotal ?? 0,
				tax_rate: quotation.tax_rate ?? Number(quotation.tax_percentage ?? 0),
				discount_amount: quotation.discount_amount ?? 0,
				discount_percentage: quotation.discount_percentage ?? 0,
				tax_percentage: Number(quotation.tax_percentage ?? IVA_RATE) > 0 ? IVA_RATE : 0,
				total_amount: quotation.total_amount ?? 0,
				notes: quotation.notes ?? '',
				created_by: quotation.created_by ?? undefined,
				approved_by: quotation.approved_by ?? undefined,
				payment_method: quotation.payment_method ?? '',
				purchase_order: quotation.purchase_order ?? '',
				payment_terms: quotation.payment_terms ?? 0,
				fixed_discount: quotation.fixed_discount ?? 0,
				items: quotation.items || [],
				customer: quotation.customer,
				items_count: quotation.items_count,
				can_convert: quotation.can_convert,
				is_converted_to_sale: quotation.is_converted_to_sale,
				converted_at: quotation.converted_at,
			};
		}

		// Valores por defecto para nueva cotización según CU025
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		return {
			subsidiary_id: 1,
			// quote_number: `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
			customer_id: 0,
			quote_date: today,
			expiry_date: expiryDate,
			tax_rate: 0,
			status: 'draft' as QuoteStatus,
			payment_method: '',
			purchase_order: '',
			payment_terms: 0,
			subtotal: 0,
			discount_amount: 0,
			discount_percentage: 0,
			fixed_discount: 0,
			tax_percentage: IVA_RATE,
			total_amount: 0,
			notes: '',
			created_by: 1,
			items: [{ ...EMPTY_ITEM }],
		};
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} size='full'>
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
						const sanitizedItems = sanitizeItemsForSubmit(values.items || []);
						const payload = {
							...values,
							items: sanitizedItems as any,
							tax_percentage: values.tax_percentage === IVA_RATE ? IVA_RATE : 0,
						};
						onSubmit(payload);
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
										{/* <div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Número de Cotización *
											</label>
											<Input
												name='quote_number'
												placeholder='COT-2024-001'
												value={values.quote_number ?? ''}
												onChange={(e) =>
													setFieldValue('quote_number', e.target.value)
												}
												isValid={!errors.quote_number}
												isTouched={touched.quote_number}
												invalidFeedback={errors.quote_number}
											/>
										</div> */}

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
												name='expiry_date'
												type='date'
												value={values.expiry_date ?? ''}
												onChange={(e) =>
													setFieldValue('expiry_date', e.target.value)
												}
												isValid={!errors.expiry_date}
												isTouched={touched.expiry_date}
												invalidFeedback={errors.expiry_date}
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
												value={values.purchase_order ?? ''}
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
												value={values.notes ?? ''}
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
								<FieldArray name='items'>
									{({ push, remove }) => (
										<>
											<CardHeader>
												<CardHeaderChild>
													<CardTitle>Items de la Cotización</CardTitle>
												</CardHeaderChild>
												<CardHeaderChild>
													<Button
														size='sm'
														variant='outline'
														icon='plus'
														type='button'
														onClick={() => push({ ...EMPTY_ITEM })}>
														Agregar Item
													</Button>
												</CardHeaderChild>
											</CardHeader>
											<CardBody>
												<div className='space-y-4'>
													{(values.items || []).map((item, index) => {
														const productInfo = item.product_id
															? saleableProductsMap[item.product_id]
															: undefined;
														const maxQuantity =
															productInfo?.stock ?? undefined;

														return (
															<div
																key={index}
																className='rounded-md border border-gray-200 p-4'>
																<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
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
																					String(
																						item.product_id,
																					),
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
																					const nextProductId =
																						Number(
																							selectedOption.value,
																						) || 0;
																					setFieldValue(
																						`items.${index}.product_id`,
																						nextProductId,
																					);
																					const stock =
																						saleableProductsMap[
																							nextProductId
																						]?.stock;
																					const currentQuantity =
																						values
																							.items?.[
																							index
																						]
																							?.quantity ??
																						1;
																					if (
																						stock &&
																						currentQuantity >
																							stock
																					) {
																						setFieldValue(
																							`items.${index}.quantity`,
																							stock,
																						);
																					}
																				}
																			}}
																			dimension='sm'
																		/>
																		{productInfo && (
																			<p className='mt-1 text-xs text-gray-500'>
																				Stock disponible:{' '}
																				<strong>
																					{
																						productInfo.stock
																					}
																				</strong>{' '}
																				· Precio neto:{' '}
																				{formatCurrency(
																					productInfo.unit_price_net,
																				)}{' '}
																				· Precio bruto:{' '}
																				{formatCurrency(
																					productInfo.unit_price_gross,
																				)}
																			</p>
																		)}
																	</div>

																	<div>
																		<label className='mb-1 block text-xs font-medium text-gray-500'>
																			Cantidad *
																		</label>
																		<Input
																			name={`items.${index}.quantity`}
																			type='number'
																			min={1}
																			max={maxQuantity}
																			placeholder='1'
																			value={
																				item.quantity ?? 1
																			}
																			onChange={(e) =>
																				setFieldValue(
																					`items.${index}.quantity`,
																					(() => {
																						const rawValue =
																							Number(
																								e
																									.target
																									.value,
																							);
																						const normalizedValue =
																							Number.isFinite(
																								rawValue,
																							) &&
																							rawValue >
																								0
																								? rawValue
																								: 1;
																						if (
																							maxQuantity &&
																							normalizedValue >
																								maxQuantity
																						) {
																							return maxQuantity;
																						}
																						return normalizedValue;
																					})(),
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
																			type='button'
																			onClick={() =>
																				remove(index)
																			}
																			isDisable={
																				(values.items
																					?.length ||
																					0) === 1
																			}>
																			Eliminar
																		</Button>
																	</div>
																</div>
															</div>
														);
													})}

													<Button
														variant='outline'
														type='button'
														onClick={() => push({ ...EMPTY_ITEM })}
														icon='plus'>
														Agregar Ítem
													</Button>
												</div>
											</CardBody>
										</>
									)}
								</FieldArray>
							</Card>

							{/* Resumen Financiero */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Resumen</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Descuento Global %
											</label>
											<Input
												name='discount_percentage'
												type='number'
												placeholder='0'
												value={values.discount_percentage ?? 0}
												onChange={(e) =>
													setFieldValue(
														'discount_percentage',
														Number(e.target.value),
													)
												}
											/>
										</div>

										<div className='rounded border border-dashed border-gray-200 p-4'>
											<label className='flex items-center gap-2 text-sm font-medium text-gray-700'>
												<input
													type='checkbox'
													className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
													checked={values.tax_percentage === IVA_RATE}
													onChange={(e) =>
														setFieldValue(
															'tax_percentage',
															e.target.checked ? IVA_RATE : 0,
														)
													}
												/>
												Aplicar IVA (19%)
											</label>
											<p className='mt-2 text-xs text-gray-500'>
												Activa esta opción si la cotización debe incluir
												IVA. Los cálculos finales se realizan en el backend.
											</p>
										</div>
									</div>

									<p className='mt-6 text-sm text-gray-500'>
										Los montos se calcularán automáticamente en el backend
										usando los productos seleccionados. Aquí solo definimos el
										descuento global y si corresponde aplicar IVA.
									</p>
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
