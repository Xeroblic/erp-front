import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { ICreateTransferRequest, TransferPriority } from '@/interface/transfers.interface';
import type { ICreateTransferForm, ITransferItemForm } from '../../types/transfers.types';
import type { IProduct } from '@/interface/product.interface';
import type { IWarehouse } from '@/interface/warehouse.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

interface CreateEditTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: ICreateTransferRequest) => Promise<void>;
	isLoading?: boolean;
}

const createEmptyItem = (): ITransferItemForm => ({
	product_id: 0,
	product_name: '',
	product_sku: '',
	quantity: 1,
});

const INITIAL_VALUES: ICreateTransferForm = {
	to_branch_id: '',
	from_warehouse_id: '',
	to_warehouse_id: '',
	auto_create_destination_product: true,
	expected_date: '',
	priority: undefined,
	notes: '',
	items: [createEmptyItem()],
};

const formatPayload = (values: ICreateTransferForm): ICreateTransferRequest => ({
	to_branch_id: Number(values.to_branch_id),
	from_warehouse_id: values.from_warehouse_id ? Number(values.from_warehouse_id) : undefined,
	to_warehouse_id: values.to_warehouse_id ? Number(values.to_warehouse_id) : undefined,
	auto_create_destination_product: values.auto_create_destination_product,
	expected_date: values.expected_date || undefined,
	priority: values.priority,
	notes: values.notes?.trim() || undefined,
	items: values.items.map((item) => ({
		product_id: Number(item.product_id),
		quantity: Number(item.quantity),
	})),
});

const CreateEditTransferModal: React.FC<CreateEditTransferModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	isLoading,
}) => {
	const dispatch = useAppDispatch();
	const branches = useAppSelector((state) => state.sucursales.lista);
	const branchesLoading = useAppSelector((state) => state.sucursales.loading);
	const currentBranchId = useAppSelector(selectEffectiveSubsidiaryId);

	const [originWarehouses, setOriginWarehouses] = useState<IWarehouse[]>([]);
	const [destinationWarehouses, setDestinationWarehouses] = useState<IWarehouse[]>([]);
	const [originWarehousesLoading, setOriginWarehousesLoading] = useState(false);
	const [destinationWarehousesLoading, setDestinationWarehousesLoading] = useState(false);

	const [availableProducts, setAvailableProducts] = useState<IProduct[]>([]);
	const [productsLoading, setProductsLoading] = useState(false);
	const [productsLoaded, setProductsLoaded] = useState(false);

	const branchOptions = useMemo<TSelectOption[]>(
		() =>
			branches.map((branch) => ({
				value: String(branch.id),
				label: branch.name || branch.branch_name || `Sucursal ${branch.id}`,
			})),
		[branches],
	);

	const originWarehouseOptions = useMemo<TSelectOption[]>(
		() =>
			originWarehouses.map((warehouse) => ({
				value: String(warehouse.id),
				label: warehouse.name || `Bodega ${warehouse.id}`,
			})),
		[originWarehouses],
	);

	const destinationWarehouseOptions = useMemo<TSelectOption[]>(
		() =>
			destinationWarehouses.map((warehouse) => ({
				value: String(warehouse.id),
				label: warehouse.name || `Bodega ${warehouse.id}`,
			})),
		[destinationWarehouses],
	);

	const productStockMap = useMemo(() => {
		const map = new Map<number, { stock: number; serialTracking: boolean }>();
		availableProducts.forEach((product) => {
			map.set(product.id, {
				stock: product.stock ?? 0,
				serialTracking: product.serial_tracking,
			});
		});
		return map;
	}, [availableProducts]);

	const productOptions = useMemo<TSelectOption[]>(
		() =>
			availableProducts.map((product) => ({
				value: String(product.id),
				label: `${product.name ?? 'Producto'}${product.sku ? ` (${product.sku})` : ''} (stock: ${
					product.stock ?? 0
				})`,
			})),
		[availableProducts],
	);

	const priorityOptions = useMemo<TSelectOption[]>(
		() => [
			{ value: 'alta', label: 'Alta' },
			{ value: 'media', label: 'Media' },
			{ value: 'baja', label: 'Baja' },
		],
		[],
	);

	const validationSchema = useMemo(
		() =>
			Yup.object({
				to_branch_id: Yup.number()
					.required('Sucursal destino requerida')
					.min(1, 'Valor inválido')
					.notOneOf(
						currentBranchId ? [currentBranchId] : [],
						'La sucursal destino debe ser distinta a la de origen',
					),
				from_warehouse_id: Yup.number()
					.nullable()
					.transform((value) => (Number.isNaN(value) ? null : value)),
				to_warehouse_id: Yup.number()
					.nullable()
					.transform((value) => (Number.isNaN(value) ? null : value))
					.test(
						'different-warehouse',
						'La bodega destino debe ser diferente a la bodega origen',
						function (value) {
							const fromWarehouseId = this.parent.from_warehouse_id;
							if (!value || !fromWarehouseId) return true;
							return value !== fromWarehouseId;
						},
					),
				items: Yup.array()
					.of(
						Yup.object().shape({
							product_id: Yup.number()
								.min(1, 'Producto requerido')
								.required('Producto requerido'),
							quantity: Yup.number()
								.min(1, 'Cantidad mínima 1')
								.required('Cantidad requerida')
								.test(
									'max-stock',
									'La cantidad supera el stock disponible',
									function (value) {
										const productId = this.parent.product_id;
										if (!productId) return true;
										const stock =
											productStockMap.get(Number(productId))?.stock ?? 0;
										if (!stock) return true;
										return !value || value <= stock;
									},
								),
						}),
					)
					.min(1, 'Debe agregar al menos un producto')
					.test('unique-products', 'No puedes repetir el mismo producto', (items) => {
						const ids = (items ?? [])
							.map((item) => item?.product_id)
							.filter((id): id is number => Boolean(id));
						return ids.length === new Set(ids).size;
					}),
			}),
		[currentBranchId, productStockMap],
	);

	const findOption = useCallback(
		(options: TSelectOption[], value?: string | number | ''): TSelectOption | null => {
			if (value === '' || value === undefined || value === null) return null;
			const stringValue = String(value);
			return options.find((option) => option.value === stringValue) ?? null;
		},
		[],
	);

	useEffect(() => {
		if (isOpen && branches.length === 0 && !branchesLoading) {
			dispatch(fetchMisSucursales());
		}
	}, [isOpen, branches.length, branchesLoading, dispatch]);

	useEffect(() => {
		const loadOriginWarehouses = async () => {
			if (!isOpen || !currentBranchId) return;
			try {
				setOriginWarehousesLoading(true);
				const result = await dispatch(
					fetchWarehouses({ branchId: currentBranchId, params: { per_page: 100 } }),
				).unwrap();
				setOriginWarehouses(result.items);
			} catch {
				setOriginWarehouses([]);
			} finally {
				setOriginWarehousesLoading(false);
			}
		};

		loadOriginWarehouses();
	}, [dispatch, isOpen, currentBranchId]);

	useEffect(() => {
		if (!isOpen) {
			setDestinationWarehouses([]);
			setAvailableProducts([]);
			setProductsLoaded(false);
		}
	}, [isOpen]);

	const loadOriginProducts = useCallback(async () => {
		if (!currentBranchId || productsLoaded || productsLoading) return;
		try {
			setProductsLoading(true);
			const response = await dispatch(
				fetchProducts({ branchId: currentBranchId, params: { per_page: 500 } }),
			).unwrap();
			const filtered = response.items.filter(
				(product) => !product.serial_tracking && (product.stock ?? 0) > 0,
			);
			setAvailableProducts(filtered);
			setProductsLoaded(true);
		} catch {
			setAvailableProducts([]);
			setProductsLoaded(false);
		} finally {
			setProductsLoading(false);
		}
	}, [currentBranchId, dispatch, productsLoaded, productsLoading]);

	const handleLoadDestinationWarehouses = useCallback(
		async (branchId?: number) => {
			if (!branchId) {
				setDestinationWarehouses([]);
				return;
			}
			try {
				setDestinationWarehousesLoading(true);
				const result = await dispatch(
					fetchWarehouses({ branchId, params: { per_page: 100 } }),
				).unwrap();
				setDestinationWarehouses(result.items);
			} catch {
				setDestinationWarehouses([]);
			} finally {
				setDestinationWarehousesLoading(false);
			}
		},
		[dispatch],
	);

	const handleDestinationBranchChange = useCallback(
		async (
			option: TSelectOption | null,
			setFieldValue: (field: string, value: unknown) => void,
			setFieldError: (field: string, message: string | undefined) => void,
		) => {
			const selectedBranch = option ? Number(option.value) : '';
			setFieldValue('to_branch_id', selectedBranch);
			setFieldValue('to_warehouse_id', '');
			setFieldValue('items', [createEmptyItem()]);

			if (currentBranchId && selectedBranch === currentBranchId) {
				setFieldError(
					'to_branch_id',
					'La sucursal destino debe ser distinta a la de origen',
				);
			}

			await handleLoadDestinationWarehouses(selectedBranch || undefined);
			if (selectedBranch) {
				await loadOriginProducts();
			}
		},
		[currentBranchId, handleLoadDestinationWarehouses, loadOriginProducts],
	);

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div>
					<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
						Nueva transferencia
					</h3>
					<p className='text-sm text-gray-500'>
						Ingresa la sucursal destino y los productos a transferir.
					</p>
				</div>
			</ModalHeader>
			<Formik
				initialValues={INITIAL_VALUES}
				validationSchema={validationSchema}
				onSubmit={async (values, helpers) => {
					try {
						helpers.setStatus(undefined);
						await onSubmit(formatPayload(values));
						helpers.resetForm({
							values: { ...INITIAL_VALUES, items: [createEmptyItem()] },
						});
					} catch (error: any) {
						const apiError = (error ?? {}) as {
							message?: string;
							errors?: Record<string, string[] | string>;
						};
						if (apiError.errors) {
							Object.entries(apiError.errors).forEach(([field, messages]) => {
								const message = Array.isArray(messages)
									? messages.join(' ')
									: messages;
								if (field === 'items') {
									helpers.setFieldError('items', message);
								} else if (
									field === 'to_branch_id' ||
									field === 'from_warehouse_id' ||
									field === 'to_warehouse_id' ||
									field === 'notes'
								) {
									helpers.setFieldError(
										field as keyof ICreateTransferForm,
										message,
									);
								}
							});
						}
						helpers.setStatus({
							apiError: apiError.message || 'No se pudo crear la transferencia',
						});
					}
				}}>
				{({
					values,
					errors,
					touched,
					handleChange,
					handleBlur,
					isSubmitting,
					setFieldValue,
					status,
					setFieldError,
				}) => (
					<Form>
						<ModalBody className='space-y-4'>
							{status?.apiError && (
								<p className='rounded-md bg-red-50 px-3 py-2 text-sm text-red-700'>
									{status.apiError}
								</p>
							)}

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div className='flex flex-col space-y-1'>
									<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
										Sucursal destino (ID)
									</label>
									<SelectReact
										name='to_branch_id'
										options={branchOptions}
										value={findOption(branchOptions, values.to_branch_id)}
										onChange={(option) =>
											void handleDestinationBranchChange(
												option as TSelectOption | null,
												setFieldValue,
												setFieldError,
											)
										}
										onBlur={handleBlur}
										placeholder='Selecciona una sucursal'
										isLoading={branchesLoading}
										isClearable
									/>
									{touched.to_branch_id &&
										typeof errors.to_branch_id === 'string' && (
											<p className='text-xs text-red-500'>
												{errors.to_branch_id}
											</p>
										)}
								</div>
								<div className='flex flex-col space-y-1'>
									<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
										Bodega origen (opcional)
									</label>
									<SelectReact
										name='from_warehouse_id'
										options={originWarehouseOptions}
										value={findOption(
											originWarehouseOptions,
											values.from_warehouse_id,
										)}
										onChange={(option) => {
											const selected = option as TSelectOption | null;
											setFieldValue(
												'from_warehouse_id',
												selected ? Number(selected.value) : '',
											);
										}}
										placeholder='Selecciona bodega'
										isClearable
										isLoading={originWarehousesLoading}
									/>
									{touched.from_warehouse_id &&
										typeof errors.from_warehouse_id === 'string' && (
											<p className='text-xs text-red-500'>
												{errors.from_warehouse_id}
											</p>
										)}
								</div>
								<div className='flex flex-col space-y-1'>
									<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
										Bodega destino (opcional)
									</label>
									<SelectReact
										name='to_warehouse_id'
										options={destinationWarehouseOptions}
										value={findOption(
											destinationWarehouseOptions,
											values.to_warehouse_id,
										)}
										onChange={(option) => {
											const selected = option as TSelectOption | null;
											setFieldValue(
												'to_warehouse_id',
												selected ? Number(selected.value) : '',
											);
										}}
										placeholder='Selecciona bodega'
										isClearable
										isLoading={destinationWarehousesLoading}
										isDisabled={!values.to_branch_id}
									/>
									{touched.to_warehouse_id &&
										typeof errors.to_warehouse_id === 'string' && (
											<p className='text-xs text-red-500'>
												{errors.to_warehouse_id}
											</p>
										)}
								</div>
								<div className='flex flex-col space-y-1'>
									<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
										Fecha esperada (opcional)
									</label>
									<Input
										name='expected_date'
										type='date'
										value={values.expected_date}
										onChange={handleChange}
										onBlur={handleBlur}
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div className='flex flex-col space-y-1'>
									<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
										Prioridad (opcional)
									</label>
									<SelectReact
										name='priority'
										options={priorityOptions}
										value={findOption(priorityOptions, values.priority ?? '')}
										onChange={(option) => {
											const selected = option as TSelectOption | null;
											setFieldValue('priority', selected?.value ?? '');
										}}
										isClearable
										placeholder='Selecciona prioridad'
									/>
								</div>
								<label className='flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300'>
									<input
										type='checkbox'
										name='auto_create_destination_product'
										checked={values.auto_create_destination_product}
										onChange={handleChange}
									/>
									<span>Crear producto en destino si no existe</span>
								</label>
							</div>

							<div className='flex flex-col space-y-1'>
								<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
									Notas
								</label>
								<Textarea
									name='notes'
									rows={3}
									value={values.notes}
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder='Instrucciones especiales, prioridad operativa, etc.'
								/>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Productos a transferir</CardTitle>
								</CardHeader>
								<CardBody className='space-y-3'>
									<FieldArray name='items'>
										{({ push, remove }) => (
											<>
												{values.items.map((item, index) => {
													const selectedIds = values.items
														.map((entry) => entry.product_id)
														.filter((id): id is number => Boolean(id));
													const optionsForRow = productOptions.filter(
														(option) =>
															option.value ===
																String(item.product_id || '') ||
															!selectedIds.includes(
																Number(option.value),
															),
													);
													const stock = item.product_id
														? (productStockMap.get(
																Number(item.product_id),
															)?.stock ?? 0)
														: 0;

													return (
														<div
															key={index}
															className='grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-3 md:grid-cols-12'>
															<div className='md:col-span-6'>
																<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
																	Producto
																</label>
																<SelectReact
																	name={`items.${index}.product_id`}
																	options={optionsForRow}
																	value={findOption(
																		productOptions,
																		item.product_id,
																	)}
																	onChange={(option) => {
																		const selected =
																			option as TSelectOption | null;
																		if (!selected) {
																			setFieldValue(
																				`items.${index}`,
																				createEmptyItem(),
																			);
																			return;
																		}
																		const productInfo =
																			availableProducts.find(
																				(product) =>
																					String(
																						product.id,
																					) ===
																					selected.value,
																			);
																		if (
																			productInfo?.serial_tracking
																		) {
																			setFieldError(
																				`items.${index}.product_id`,
																				'Este producto usa tracking por serie. Usa el traslado de equipos.',
																			);
																			setFieldValue(
																				`items.${index}.product_id`,
																				'',
																			);
																			return;
																		}

																		setFieldValue(
																			`items.${index}.product_id`,
																			Number(selected.value),
																		);
																		if (
																			values.items[index]
																				.quantity >
																			(productInfo?.stock ??
																				0)
																		) {
																			setFieldValue(
																				`items.${index}.quantity`,
																				Math.max(
																					1,
																					productInfo?.stock ??
																						1,
																				),
																			);
																		}
																	}}
																	placeholder={
																		values.to_branch_id
																			? 'Selecciona producto'
																			: 'Selecciona una sucursal destino primero'
																	}
																	isClearable
																	isDisabled={
																		!values.to_branch_id ||
																		!productsLoaded
																	}
																	isLoading={productsLoading}
																/>
																{touched.items &&
																	errors.items &&
																	typeof errors.items !==
																		'string' &&
																	(errors.items[index] as any)
																		?.product_id && (
																		<p className='mt-1 text-xs text-red-500'>
																			{
																				(
																					errors.items[
																						index
																					] as any
																				)?.product_id
																			}
																		</p>
																	)}
																{!values.to_branch_id && (
																	<p className='mt-1 text-xs text-gray-500'>
																		Selecciona la sucursal
																		destino para habilitar los
																		productos.
																	</p>
																)}
															</div>
															<div className='md:col-span-4'>
																<Input
																	name={`items.${index}.quantity`}
																	label='Cantidad'
																	type='number'
																	min={1}
																	value={item.quantity}
																	onChange={handleChange}
																	onBlur={handleBlur}
																	disabled={
																		!values.to_branch_id ||
																		!item.product_id
																	}
																/>
																{touched.items &&
																	errors.items &&
																	typeof errors.items !==
																		'string' &&
																	(errors.items[index] as any)
																		?.quantity && (
																		<p className='mt-1 text-xs text-red-500'>
																			{
																				(
																					errors.items[
																						index
																					] as any
																				)?.quantity
																			}
																		</p>
																	)}
																{item.product_id && (
																	<p className='mt-1 text-xs text-gray-500'>
																		Stock disponible: {stock}
																	</p>
																)}
															</div>
															<div className='flex items-end md:col-span-2'>
																<Button
																	type='button'
																	variant='outline'
																	color='red'
																	icon='HeroTrash'
																	onClick={() => remove(index)}
																	disabled={
																		values.items.length === 1
																	}>
																	Quitar
																</Button>
															</div>
														</div>
													);
												})}

												<Button
													type='button'
													variant='outline'
													icon='HeroPlus'
													onClick={() => push(createEmptyItem())}
													disabled={
														!values.to_branch_id || !productsLoaded
													}>
													Agregar producto
												</Button>
											</>
										)}
									</FieldArray>
									{typeof errors.items === 'string' && (
										<p className='text-sm text-red-500'>{errors.items}</p>
									)}
								</CardBody>
							</Card>
						</ModalBody>
						<ModalFooter>
							<ModalFooterChild>
								<Button variant='outline' onClick={onClose}>
									Cancelar
								</Button>
							</ModalFooterChild>
							<ModalFooterChild>
								<Button
									type='submit'
									variant='solid'
									icon='HeroPaperAirplane'
									disabled={isSubmitting || Boolean(isLoading)}>
									Crear transferencia
								</Button>
							</ModalFooterChild>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};

export default CreateEditTransferModal;
