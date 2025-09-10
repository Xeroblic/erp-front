/**
 * Modal para Crear/Editar Transferencias
 * Incluye selección de sucursales, productos y validaciones
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
import Badge from '@/components/ui/Badge';
import { ITransfer } from '@/interface/transfers.interface';
import {
	ICreateTransferForm,
	ITransferItemForm,
	IWarehouseOption,
	IProductStock,
	ICreateTransferRequest,
} from '../../types/transfers.types';

interface CreateEditTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (transferData: ICreateTransferRequest) => Promise<void>;
	transfer?: ITransfer | null;
	isLoading?: boolean;
}

// Esquema de validación
const transferValidationSchema = Yup.object().shape({
	from_warehouse_id: Yup.number().required('Sucursal origen es requerida'),
	to_warehouse_id: Yup.number()
		.required('Sucursal destino es requerida')
		.notOneOf(
			[Yup.ref('from_warehouse_id')],
			'Sucursal destino debe ser diferente a la origen',
		),
	items: Yup.array()
		.of(
			Yup.object().shape({
				product_id: Yup.number().required('Producto requerido'),
				quantity: Yup.number()
					.min(1, 'Cantidad debe ser mayor a 0')
					.required('Cantidad requerida'),
			}),
		)
		.min(1, 'Debe agregar al menos un producto'),
});

const CreateEditTransferModal: React.FC<CreateEditTransferModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	transfer,
	isLoading = false,
}) => {
	// Estados locales para datos mock - reemplazar con datos reales
	const [warehouses] = useState<TSelectOptions>([
		{ value: '1', label: 'Almacén Central - Bogotá' },
		{ value: '2', label: 'Sucursal Norte - Medellín' },
		{ value: '3', label: 'Sucursal Sur - Cali' },
		{ value: '4', label: 'Sucursal Oriente - Bucaramanga' },
	]);

	const [products] = useState<TSelectOptions>([
		{ value: '1', label: 'Producto A - SKU001' },
		{ value: '2', label: 'Producto B - SKU002' },
		{ value: '3', label: 'Producto C - SKU003' },
		{ value: '4', label: 'Producto D - SKU004' },
	]);

	// Mock de stock por almacén
	const [productStock] = useState<Record<string, IProductStock>>({
		'1_1': {
			product_id: 1,
			product_name: 'Producto A',
			product_sku: 'SKU001',
			warehouse_id: 1,
			available_quantity: 100,
			reserved_quantity: 10,
			total_quantity: 110,
			unit_cost: 15000,
		},
		'1_2': {
			product_id: 2,
			product_name: 'Producto B',
			product_sku: 'SKU002',
			warehouse_id: 1,
			available_quantity: 50,
			reserved_quantity: 5,
			total_quantity: 55,
			unit_cost: 25000,
		},
		'2_1': {
			product_id: 1,
			product_name: 'Producto A',
			product_sku: 'SKU001',
			warehouse_id: 2,
			available_quantity: 30,
			reserved_quantity: 3,
			total_quantity: 33,
			unit_cost: 15000,
		},
		'3_3': {
			product_id: 3,
			product_name: 'Producto C',
			product_sku: 'SKU003',
			warehouse_id: 3,
			available_quantity: 75,
			reserved_quantity: 8,
			total_quantity: 83,
			unit_cost: 35000,
		},
	});

	const priorityOptions: TSelectOptions = [
		{ value: 'LOW', label: 'Baja' },
		{ value: 'NORMAL', label: 'Normal' },
		{ value: 'HIGH', label: 'Alta' },
		{ value: 'URGENT', label: 'Urgente' },
	];

	// Valores iniciales
	const getInitialValues = (): ICreateTransferForm => {
		if (transfer) {
			return {
				from_warehouse_id: transfer.from_warehouse_id,
				to_warehouse_id: transfer.to_warehouse_id,
				items:
					transfer.items?.map((item) => ({
						product_id: item.product_id,
						product_name: item.product?.name || '',
						product_sku: item.product?.sku || '',
						quantity: item.quantity,
						available_quantity: 0, // Se calculará
						from_location_id: item.from_location_id,
						to_location_id: item.to_location_id,
					})) || [],
				notes: '',
				expected_date: '',
				priority: 'NORMAL',
			};
		}

		return {
			from_warehouse_id: 0,
			to_warehouse_id: 0,
			items: [
				{
					product_id: 0,
					product_name: '',
					product_sku: '',
					quantity: 1,
					available_quantity: 0,
					from_location_id: undefined,
					to_location_id: undefined,
				},
			],
			notes: '',
			expected_date: '',
			priority: 'NORMAL',
		};
	};

	// Obtener stock disponible para un producto en un almacén
	const getAvailableStock = (productId: number, warehouseId: number): number => {
		const key = `${warehouseId}_${productId}`;
		return productStock[key]?.available_quantity || 0;
	};

	// Validar disponibilidad de stock
	const validateStock = (items: ITransferItemForm[], fromWarehouseId: number) => {
		return items.every((item) => {
			if (!item.product_id || !item.quantity) return true;
			const availableStock = getAvailableStock(item.product_id, fromWarehouseId);
			return item.quantity <= availableStock;
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const calculateTotalValue = (items: ITransferItemForm[]) => {
		return items.reduce((total, item) => {
			if (!item.product_id || !item.quantity) return total;
			const stockInfo = Object.values(productStock).find(
				(stock) => stock.product_id === item.product_id,
			);
			return total + item.quantity * (stockInfo?.unit_cost || 0);
		}, 0);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='4xl'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20'>
						<Icon
							icon='HeroTruck'
							className='h-6 w-6 text-purple-600 dark:text-purple-400'
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							{transfer ? 'Editar Transferencia' : 'Nueva Transferencia'}
						</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Complete los datos para la transferencia entre sucursales
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={getInitialValues()}
				validationSchema={transferValidationSchema}
				onSubmit={async (values) => {
					const transferData: ICreateTransferRequest = {
						from_warehouse_id: values.from_warehouse_id,
						to_warehouse_id: values.to_warehouse_id,
						items: values.items
							.filter((item) => item.product_id && item.quantity > 0)
							.map((item) => ({
								product_id: item.product_id,
								quantity: item.quantity,
								from_location_id: item.from_location_id,
								to_location_id: item.to_location_id,
							})),
					};

					if (values.notes) transferData.notes = values.notes;
					if (values.expected_date) transferData.expected_date = values.expected_date;
					if (values.priority) transferData.priority = values.priority;

					await onSubmit(transferData);
				}}>
				{(formik) => {
					const totalValue = calculateTotalValue(formik.values.items);
					const hasStockIssues = !validateStock(
						formik.values.items,
						formik.values.from_warehouse_id,
					);

					return (
						<Form>
							<ModalBody className='space-y-6'>
								{/* Información General */}
								<Card>
									<CardHeader>
										<CardTitle>Información de Transferencia</CardTitle>
									</CardHeader>
									<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Sucursal Origen *
											</label>
											<SelectReact
												name='from_warehouse_id'
												options={warehouses}
												value={warehouses.find(
													(opt) =>
														opt.value ===
														String(formik.values.from_warehouse_id),
												)}
												onChange={(selectedOption) => {
													const option = selectedOption as TSelectOption;
													formik.setFieldValue(
														'from_warehouse_id',
														Number(option?.value || 0),
													);
													// Limpiar items al cambiar origen
													formik.setFieldValue('items', [
														{
															product_id: 0,
															product_name: '',
															product_sku: '',
															quantity: 1,
															available_quantity: 0,
														},
													]);
												}}
												isValid={formik.isValid}
												isTouched={!!formik.touched.from_warehouse_id}
												invalidFeedback={
													formik.errors.from_warehouse_id as string
												}
												placeholder='Seleccionar sucursal origen...'
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Sucursal Destino *
											</label>
											<SelectReact
												name='to_warehouse_id'
												options={warehouses.filter(
													(w) =>
														w.value !==
														String(formik.values.from_warehouse_id),
												)}
												value={warehouses.find(
													(opt) =>
														opt.value ===
														String(formik.values.to_warehouse_id),
												)}
												onChange={(selectedOption) => {
													const option = selectedOption as TSelectOption;
													formik.setFieldValue(
														'to_warehouse_id',
														Number(option?.value || 0),
													);
												}}
												isValid={formik.isValid}
												isTouched={!!formik.touched.to_warehouse_id}
												invalidFeedback={
													formik.errors.to_warehouse_id as string
												}
												placeholder='Seleccionar sucursal destino...'
												isDisabled={!formik.values.from_warehouse_id}
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Fecha Esperada
											</label>
											<Input
												type='date'
												name='expected_date'
												value={formik.values.expected_date}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												min={new Date().toISOString().split('T')[0]}
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Prioridad
											</label>
											<SelectReact
												name='priority'
												options={priorityOptions}
												value={priorityOptions.find(
													(opt) => opt.value === formik.values.priority,
												)}
												onChange={(selectedOption) => {
													const option = selectedOption as TSelectOption;
													formik.setFieldValue(
														'priority',
														option?.value || 'NORMAL',
													);
												}}
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
												placeholder='Notas adicionales sobre la transferencia...'
												rows={3}
											/>
										</div>
									</CardBody>
								</Card>

								{/* Productos */}
								{formik.values.from_warehouse_id > 0 && (
									<Card>
										<CardHeader>
											<div className='flex items-center justify-between'>
												<CardTitle>Productos a Transferir</CardTitle>
												<FieldArray name='items'>
													{({ push }) => (
														<Button
															size='sm'
															onClick={() =>
																push({
																	product_id: 0,
																	product_name: '',
																	product_sku: '',
																	quantity: 1,
																	available_quantity: 0,
																})
															}
															icon='HeroPlus'>
															Agregar Producto
														</Button>
													)}
												</FieldArray>
											</div>
										</CardHeader>
										<CardBody>
											<FieldArray name='items'>
												{({ remove }) => (
													<div className='space-y-4'>
														{formik.values.items.map((item, index) => {
															const availableStock =
																getAvailableStock(
																	item.product_id,
																	formik.values.from_warehouse_id,
																);
															const hasStockIssue =
																item.quantity > availableStock &&
																item.product_id > 0;

															return (
																<Card
																	key={index}
																	className={`border ${
																		hasStockIssue
																			? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
																			: 'border-gray-200'
																	}`}>
																	<CardBody>
																		<div className='mb-4 flex items-start justify-between'>
																			<h4 className='text-sm font-medium text-gray-900 dark:text-white'>
																				Producto #
																				{index + 1}
																			</h4>
																			{formik.values.items
																				.length > 1 && (
																				<Button
																					variant='outline'
																					size='xs'
																					color='red'
																					onClick={() =>
																						remove(
																							index,
																						)
																					}>
																					<Icon
																						icon='HeroTrash'
																						className='h-3 w-3'
																					/>
																				</Button>
																			)}
																		</div>

																		<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
																			<div className='md:col-span-2'>
																				<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																					Producto *
																				</label>
																				<SelectReact
																					name={`items.${index}.product_id`}
																					options={
																						products
																					}
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
																						const productId =
																							Number(
																								option?.value ||
																									0,
																							);
																						formik.setFieldValue(
																							`items.${index}.product_id`,
																							productId,
																						);
																						formik.setFieldValue(
																							`items.${index}.product_name`,
																							option?.label.split(
																								' - ',
																							)[0] ||
																								'',
																						);
																						formik.setFieldValue(
																							`items.${index}.product_sku`,
																							option?.label.split(
																								' - ',
																							)[1] ||
																								'',
																						);
																						formik.setFieldValue(
																							`items.${index}.available_quantity`,
																							getAvailableStock(
																								productId,
																								formik
																									.values
																									.from_warehouse_id,
																							),
																						);
																					}}
																					placeholder='Seleccionar producto...'
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
																					max={
																						availableStock
																					}
																					className={
																						hasStockIssue
																							? 'border-red-300 focus:border-red-500'
																							: ''
																					}
																				/>
																			</div>

																			<div>
																				<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																					Disponible
																				</label>
																				<div className='flex items-center space-x-2'>
																					<Badge
																						color={
																							availableStock >
																							0
																								? 'emerald'
																								: 'red'
																						}>
																						{
																							availableStock
																						}
																					</Badge>
																					{hasStockIssue && (
																						<Badge color='red'>
																							Stock
																							insuficiente
																						</Badge>
																					)}
																				</div>
																			</div>
																		</div>
																	</CardBody>
																</Card>
															);
														})}
													</div>
												)}
											</FieldArray>

											{/* Resumen */}
											<div className='mt-6 border-t pt-4'>
												<div className='flex justify-between'>
													<div className='space-y-2 text-left'>
														<div className='flex items-center space-x-4'>
															<span className='text-sm text-gray-600 dark:text-gray-400'>
																Total de productos:
															</span>
															<span className='text-sm font-medium text-gray-900 dark:text-white'>
																{
																	formik.values.items.filter(
																		(item) =>
																			item.product_id > 0,
																	).length
																}
															</span>
														</div>
														<div className='flex items-center space-x-4'>
															<span className='text-sm text-gray-600 dark:text-gray-400'>
																Total de unidades:
															</span>
															<span className='text-sm font-medium text-gray-900 dark:text-white'>
																{formik.values.items
																	.filter(
																		(item) =>
																			item.product_id > 0,
																	)
																	.reduce(
																		(sum, item) =>
																			sum + item.quantity,
																		0,
																	)}
															</span>
														</div>
													</div>
													<div className='space-y-2 text-right'>
														<div className='flex justify-between space-x-8'>
															<span className='text-sm text-gray-600 dark:text-gray-400'>
																Valor estimado:
															</span>
															<span className='text-base font-bold text-gray-900 dark:text-white'>
																{formatCurrency(totalValue)}
															</span>
														</div>
													</div>
												</div>
											</div>
										</CardBody>
									</Card>
								)}
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
										isDisable={
											isLoading ||
											!formik.isValid ||
											hasStockIssues ||
											formik.values.items.filter(
												(item) => item.product_id > 0,
											).length === 0
										}
										onClick={() => formik.handleSubmit()}>
										{isLoading ? (
											<>
												<Icon
													icon='HeroArrowPath'
													className='mr-2 h-4 w-4 animate-spin'
												/>
												Procesando...
											</>
										) : (
											<>
												<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
												{transfer
													? 'Actualizar Transferencia'
													: 'Crear Transferencia'}
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

export default CreateEditTransferModal;
