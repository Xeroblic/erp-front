/**
 * Modal para Crear/Editar Ventas
 * Incluye gestió	// Mock data - reemplazar con datos reales
	const [customers] = useState<TSelectOptions>([
		{ value: '1', label: 'Juan Pérez - Empresa ABC' },
		{ value: '2', label: 'Ana Silva' },
		{ value: '3', label: 'Corporación XYZ' },
	]);

	const [salespersons] = useState<TSelectOptions>([
		{ value: '1', label: 'María González' },
		{ value: '2', label: 'Carlos Rodríguez' },
		{ value: '3', label: 'Pat																			<Icon
																				icon='HeroTrash'
																				className='h-3 w-3'
																			/>a Morales' },
	]);

	const [products] = useState<TSelectOptions>([
		{ value: '1', label: 'Producto A - SKU001' },
		{ value: '2', label: 'Producto B - SKU002' },
		{ value: '3', label: 'Producto C - SKU003' },
	]);y validaciones
 */
import React, { useState, useEffect } from 'react';
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
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Table, { TBody, THead, Th, Tr, Td } from '@/components/ui/Table';
import { ISale, SaleStatus, ISaleItem, ISalePayment, PaymentMethod } from '../../types/sales.types';

interface CreateEditSaleModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (
		saleData: Omit<ISale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>,
	) => Promise<void>;
	sale?: ISale | null;
	isLoading?: boolean;
	quotationData?: any; // Datos de cotización si viene desde allí
}

// Esquema de validación
const saleValidationSchema = Yup.object().shape({
	customer_id: Yup.number().required('Cliente es requerido'),
	salesperson_id: Yup.number().required('Vendedor es requerido'),
	sale_date: Yup.string().required('Fecha de venta es requerida'),
	status: Yup.string().required('Estado es requerido'),
	items: Yup.array()
		.of(
			Yup.object().shape({
				product_id: Yup.number().required('Producto requerido'),
				quantity: Yup.number()
					.min(1, 'Cantidad debe ser mayor a 0')
					.required('Cantidad requerida'),
				unit_price: Yup.number()
					.min(0, 'Precio debe ser mayor o igual a 0')
					.required('Precio requerido'),
			}),
		)
		.min(1, 'Debe agregar al menos un item'),
});

const CreateEditSaleModal: React.FC<CreateEditSaleModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	sale,
	isLoading = false,
	quotationData,
}) => {
	// Estados locales - versión corregida
	const [customers] = useState<TSelectOptions>([
		{ value: '1', label: 'Juan Pérez - Empresa ABC' },
		{ value: '2', label: 'Ana Silva' },
		{ value: '3', label: 'Corporación XYZ' },
	]);

	const [salespersons] = useState<TSelectOptions>([
		{ value: '1', label: 'María González' },
		{ value: '2', label: 'Carlos Rodríguez' },
		{ value: '3', label: 'Patricia Morales' },
	]);

	const [products] = useState<TSelectOptions>([
		{ value: '1', label: 'Producto A - SKU001' },
		{ value: '2', label: 'Producto B - SKU002' },
		{ value: '3', label: 'Producto C - SKU003' },
	]);

	const statusOptions: TSelectOptions = [
		{ value: 'PENDING', label: 'Pendiente' },
		{ value: 'COMPLETED', label: 'Completada' },
		{ value: 'CANCELLED', label: 'Cancelada' },
	];

	const paymentMethodOptions: TSelectOptions = [
		{ value: 'CASH', label: 'Efectivo' },
		{ value: 'DEBIT', label: 'Débito' },
		{ value: 'CREDIT', label: 'Crédito' },
		{ value: 'TRANSFER', label: 'Transferencia' },
	];

	// Valores iniciales
	const getInitialValues = () => {
		if (sale) {
			return {
				customer_id: sale.customer_id,
				salesperson_id: sale.salesperson_id,
				sale_date: sale.sale_date,
				status: sale.status,
				notes: sale.notes || '',
				items: sale.items.map((item: ISaleItem) => ({
					product_id: item.product_id,
					product_name: item.product_name,
					product_sku: item.product_sku,
					quantity: item.quantity,
					unit_price: item.unit_price,
					discount_percentage: item.discount_percentage,
					tax_percentage: item.tax_percentage,
				})),
				payments: sale.payments.map((payment: ISalePayment) => ({
					payment_method: payment.payment_method,
					amount: payment.amount,
					fee_percentage: payment.fee_percentage || 0,
					reference: payment.reference || '',
				})),
			};
		}

		// Si viene de cotización, usar esos datos
		if (quotationData) {
			return {
				customer_id: quotationData.customer_id,
				salesperson_id: quotationData.salesperson_id || 1,
				sale_date: new Date().toISOString().split('T')[0],
				status: 'PENDING' as SaleStatus,
				notes: quotationData.notes || '',
				items: quotationData.items.map((item: any) => ({
					product_id: item.product_id,
					product_name: item.product_name,
					product_sku: item.product_sku,
					quantity: item.quantity,
					unit_price: item.unit_price,
					discount_percentage: item.discount_percentage || 0,
					tax_percentage: item.tax_percentage || 19,
				})),
				payments: [],
			};
		}

		// Valores por defecto
		return {
			customer_id: '',
			salesperson_id: '',
			sale_date: new Date().toISOString().split('T')[0],
			status: 'PENDING' as SaleStatus,
			notes: '',
			items: [
				{
					product_id: '',
					product_name: '',
					product_sku: '',
					quantity: 1,
					unit_price: 0,
					discount_percentage: 0,
					tax_percentage: 19,
				},
			],
			payments: [],
		};
	};

	// Calcular totales
	const calculateItemTotals = (item: any) => {
		const subtotal = item.quantity * item.unit_price;
		const discountAmount = subtotal * (item.discount_percentage / 100);
		const taxableAmount = subtotal - discountAmount;
		const taxAmount = taxableAmount * (item.tax_percentage / 100);
		const total = taxableAmount + taxAmount;

		return {
			subtotal,
			discountAmount,
			taxAmount,
			total,
		};
	};

	const calculateSaleTotals = (items: any[]) => {
		const totals = items.reduce(
			(acc, item) => {
				const itemTotals = calculateItemTotals(item);
				acc.subtotal += itemTotals.subtotal;
				acc.discountTotal += itemTotals.discountAmount;
				acc.taxTotal += itemTotals.taxAmount;
				acc.total += itemTotals.total;
				return acc;
			},
			{ subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 },
		);
		return totals;
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='2xl'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
						<Icon
							icon='HeroShoppingCart'
							className='h-6 w-6 text-blue-600 dark:text-blue-400'
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							{sale ? 'Editar Venta' : 'Nueva Venta'}
						</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							{quotationData
								? 'Creada desde cotización'
								: 'Complete los datos de la venta'}
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={getInitialValues()}
				validationSchema={saleValidationSchema}
				onSubmit={async (values) => {
					const saleTotals = calculateSaleTotals(values.items);

					const saleData = {
						customer_id: Number(values.customer_id),
						salesperson_id: Number(values.salesperson_id),
						sale_date: values.sale_date,
						status: values.status as SaleStatus,
						subtotal: saleTotals.subtotal,
						discount_total: saleTotals.discountTotal,
						tax_total: saleTotals.taxTotal,
						total_amount: saleTotals.total,
						notes: values.notes,
						items: values.items.map((item: any) => ({
							id: 0,
							sale_id: 0,
							product_id: Number(item.product_id),
							product_name: item.product_name,
							product_sku: item.product_sku,
							quantity: Number(item.quantity),
							unit_price: Number(item.unit_price),
							discount_percentage: Number(item.discount_percentage),
							discount_amount: calculateItemTotals(item).discountAmount,
							tax_percentage: Number(item.tax_percentage),
							tax_amount: calculateItemTotals(item).taxAmount,
							subtotal: calculateItemTotals(item).subtotal,
							total: calculateItemTotals(item).total,
						})) as ISaleItem[],
						payments: values.payments.map((payment: any) => ({
							id: 0,
							sale_id: 0,
							payment_method: payment.payment_method as PaymentMethod,
							amount: Number(payment.amount),
							fee_percentage: Number(payment.fee_percentage),
							fee_amount:
								Number(payment.amount) * (Number(payment.fee_percentage) / 100),
							reference: payment.reference,
							payment_date: new Date().toISOString(),
							status: 'COMPLETED' as const,
						})) as ISalePayment[],
						documents: [],
						stock_movements: [],
					};

					await onSubmit(saleData);
				}}>
				{(formik) => {
					const saleTotals = calculateSaleTotals(formik.values.items);

					return (
						<Form>
							<ModalBody className='space-y-6'>
								{/* Información General */}
								<Card>
									<CardHeader>
										<CardTitle>Información General</CardTitle>
									</CardHeader>
									<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div className='md:col-span-2'>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Cliente *
											</label>
											<SelectReact
												name='customer_id'
												options={customers}
												value={customers.find(
													(opt) =>
														opt.value ===
														String(formik.values.customer_id),
												)}
												onChange={(selectedOption) => {
													const option = selectedOption as TSelectOption;
													formik.setFieldValue(
														'customer_id',
														option?.value || '',
													);
												}}
												isValid={formik.isValid}
												isTouched={!!formik.touched.customer_id}
												invalidFeedback={
													formik.errors.customer_id as string
												}
												placeholder='Seleccionar cliente...'
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Vendedor *
											</label>
											<SelectReact
												name='salesperson_id'
												options={salespersons}
												value={salespersons.find(
													(opt) =>
														opt.value ===
														String(formik.values.salesperson_id),
												)}
												onChange={(selectedOption) => {
													const option = selectedOption as TSelectOption;
													formik.setFieldValue(
														'salesperson_id',
														option?.value || '',
													);
												}}
												isValid={formik.isValid}
												isTouched={!!formik.touched.salesperson_id}
												invalidFeedback={
													formik.errors.salesperson_id as string
												}
												placeholder='Seleccionar vendedor...'
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Fecha de Venta *
											</label>
											<Input
												type='date'
												name='sale_date'
												value={formik.values.sale_date}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												isValid={formik.isValid}
												isTouched={!!formik.touched.sale_date}
												invalidFeedback={formik.errors.sale_date}
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Estado *
											</label>
											<SelectReact
												name='status'
												options={statusOptions}
												value={statusOptions.find(
													(opt) => opt.value === formik.values.status,
												)}
												onChange={(selectedOption) => {
													const option = selectedOption as TSelectOption;
													formik.setFieldValue(
														'status',
														option?.value || '',
													);
												}}
												isValid={formik.isValid}
												isTouched={!!formik.touched.status}
												invalidFeedback={formik.errors.status as string}
											/>
										</div>

										<div className='md:col-span-2'>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Notas
											</label>
											<Textarea
												name='notes'
												value={formik.values.notes}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder='Notas adicionales sobre la venta...'
												rows={3}
											/>
										</div>
									</CardBody>
								</Card>

								{/* Items */}
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<CardTitle>Items de la Venta</CardTitle>
											<FieldArray name='items'>
												{({ push }) => (
													<Button
														size='sm'
														onClick={() =>
															push({
																product_id: '',
																product_name: '',
																product_sku: '',
																quantity: 1,
																unit_price: 0,
																discount_percentage: 0,
																tax_percentage: 19,
															})
														}
														icon='HeroPlus'>
														Agregar Item
													</Button>
												)}
											</FieldArray>
										</div>
									</CardHeader>
									<CardBody>
										<FieldArray name='items'>
											{({ remove }) => (
												<div className='space-y-4'>
													{formik.values.items.map(
														(item: any, index: number) => {
															const itemTotals =
																calculateItemTotals(item);
															return (
																<div
																	key={index}
																	className='rounded-lg border p-4'>
																	<div className='mb-4 flex items-start justify-between'>
																		<h4 className='text-sm font-medium text-gray-900 dark:text-white'>
																			Item #{index + 1}
																		</h4>
																		{formik.values.items
																			.length > 1 && (
																			<Button
																				variant='outline'
																				size='xs'
																				color='red'
																				onClick={() =>
																					remove(index)
																				}>
																				<Icon
																					icon='HeroTrashOutline'
																					className='h-3 w-3'
																				/>
																			</Button>
																		)}
																	</div>

																	<div className='grid grid-cols-1 gap-4 md:grid-cols-6'>
																		<div className='md:col-span-2'>
																			<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																				Producto *
																			</label>
																			<SelectReact
																				name={`items.${index}.product_id`}
																				options={products}
																				value={products.find(
																					(opt) =>
																						opt.value ===
																						String(
																							item.product_id,
																						),
																				)}
																				onChange={(
																					selectedOption,
																				) => {
																					const option =
																						selectedOption as TSelectOption;
																					formik.setFieldValue(
																						`items.${index}.product_id`,
																						option?.value ||
																							'',
																					);
																					formik.setFieldValue(
																						`items.${index}.product_name`,
																						option?.label.split(
																							' - ',
																						)[0] || '',
																					);
																					formik.setFieldValue(
																						`items.${index}.product_sku`,
																						option?.label.split(
																							' - ',
																						)[1] || '',
																					);
																				}}
																				placeholder='Seleccionar...'
																			/>
																		</div>

																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																				Cantidad *
																			</label>
																			<Input
																				type='number'
																				name={`items.${index}.quantity`}
																				value={
																					item.quantity
																				}
																				onChange={
																					formik.handleChange
																				}
																				min='1'
																			/>
																		</div>

																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																				Precio Unit. *
																			</label>
																			<Input
																				type='number'
																				name={`items.${index}.unit_price`}
																				value={
																					item.unit_price
																				}
																				onChange={
																					formik.handleChange
																				}
																				min='0'
																			/>
																		</div>

																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																				Descuento %
																			</label>
																			<Input
																				type='number'
																				name={`items.${index}.discount_percentage`}
																				value={
																					item.discount_percentage
																				}
																				onChange={
																					formik.handleChange
																				}
																				min='0'
																				max='100'
																			/>
																		</div>

																		<div>
																			<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																				IVA %
																			</label>
																			<Input
																				type='number'
																				name={`items.${index}.tax_percentage`}
																				value={
																					item.tax_percentage
																				}
																				onChange={
																					formik.handleChange
																				}
																				min='0'
																			/>
																		</div>
																	</div>

																	<div className='mt-3 flex justify-end space-x-4 text-xs text-gray-600 dark:text-gray-400'>
																		<span>
																			Subtotal:{' '}
																			{formatCurrency(
																				itemTotals.subtotal,
																			)}
																		</span>
																		{itemTotals.discountAmount >
																			0 && (
																			<span className='text-green-600 dark:text-green-400'>
																				Desc: -
																				{formatCurrency(
																					itemTotals.discountAmount,
																				)}
																			</span>
																		)}
																		<span>
																			IVA:{' '}
																			{formatCurrency(
																				itemTotals.taxAmount,
																			)}
																		</span>
																		<span className='font-semibold text-gray-900 dark:text-white'>
																			Total:{' '}
																			{formatCurrency(
																				itemTotals.total,
																			)}
																		</span>
																	</div>
																</div>
															);
														},
													)}
												</div>
											)}
										</FieldArray>

										{/* Totales de la venta */}
										<div className='mt-6 border-t pt-4'>
											<div className='flex justify-end'>
												<div className='space-y-2 text-right'>
													<div className='flex justify-between space-x-8'>
														<span className='text-sm text-gray-600 dark:text-gray-400'>
															Subtotal:
														</span>
														<span className='text-sm font-medium text-gray-900 dark:text-white'>
															{formatCurrency(saleTotals.subtotal)}
														</span>
													</div>
													{saleTotals.discountTotal > 0 && (
														<div className='flex justify-between space-x-8'>
															<span className='text-sm text-gray-600 dark:text-gray-400'>
																Descuento:
															</span>
															<span className='text-sm font-medium text-green-600 dark:text-green-400'>
																-
																{formatCurrency(
																	saleTotals.discountTotal,
																)}
															</span>
														</div>
													)}
													<div className='flex justify-between space-x-8'>
														<span className='text-sm text-gray-600 dark:text-gray-400'>
															IVA:
														</span>
														<span className='text-sm font-medium text-gray-900 dark:text-white'>
															{formatCurrency(saleTotals.taxTotal)}
														</span>
													</div>
													<div className='flex justify-between space-x-8 border-t pt-2'>
														<span className='text-base font-semibold text-gray-900 dark:text-white'>
															Total:
														</span>
														<span className='text-base font-bold text-gray-900 dark:text-white'>
															{formatCurrency(saleTotals.total)}
														</span>
													</div>
												</div>
											</div>
										</div>
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
										color='blue'
										isDisable={isLoading || !formik.isValid}
										onClick={() => formik.handleSubmit()}>
										{isLoading ? (
											<>
												<Icon
													icon='HeroArrowPath'
													className='mr-2 h-4 w-4 animate-spin'
												/>
												Guardando...
											</>
										) : (
											<>
												<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
												{sale ? 'Actualizar Venta' : 'Crear Venta'}
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

export default CreateEditSaleModal;
