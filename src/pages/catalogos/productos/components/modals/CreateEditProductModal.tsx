import React, { useMemo, useEffect, useRef } from 'react';
import {
	Formik,
	Form,
	Field,
	ErrorMessage,
	FormikHelpers,
	FieldProps,
	type FormikErrors,
} from 'formik';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import SelectReact, { TSelectOptions, TSelectOption } from '@/components/form/SelectReact';
import type { IProduct } from '@/interface/product.interface';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import { PRODUCT_FORM_SECTIONS, PRODUCT_TOGGLES } from '../../constants/products.constant';
import {
	buildInitialValues,
	buildSubmitPayload,
	createBrandOptions,
	createCategoryOptions,
	initializeAttributesJson,
} from '../../utils/productForm.utils';
import {
	productSchema,
	productSchemaCreate,
	productDetailSchema,
} from '../../validation/productForm.schema';
import type { ProductFormValues } from '../../types/products.types';
import Select from '@/components/form/Select';
import { PRODUCT_DEVICE_TYPES } from '../../constants/product-attributes.constants';
import UserBranchSelector from './components/UserBranchSelector';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';

interface CreateEditProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: { data: Partial<IProduct>; categoryIds: number[] }) => Promise<void>;
	product?: IProduct;
	brands: IBrand[];
	categories: ICategory[];
	isLoading?: boolean;
	brandsLoading?: boolean;
	defaultBranchId?: number | null;
}

type ProductToggleKey = Extract<(typeof PRODUCT_TOGGLES)[number]['key'], keyof ProductFormValues>;

const FieldContainer: React.FC<{
	id: string;
	label: string;
	children: React.ReactNode;
	error?: string;
}> = ({ id, label, children, error }) => (
	<div className='space-y-1'>
		<label className='text-sm font-medium' htmlFor={id}>
			{label}
		</label>
		{children}
		{error && <p className='text-xs text-red-500'>{error}</p>}
	</div>
);

const CreateEditProductModal: React.FC<CreateEditProductModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	product,
	brands,
	categories,
	isLoading = false,
	brandsLoading = false,
	defaultBranchId = null,
}) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const dispatch = useAppDispatch();
	const isEditMode = !!product;

	const userId = currentUser?.id || currentUser?.pk;

	const enhancedBrands = useMemo(() => {
		if (isEditMode && product?.brand) {
			const exists = brands.some((brand) => brand.id === product.brand!.id);
			if (!exists) {
				return [...brands, product.brand];
			}
		}
		return brands;
	}, [brands, isEditMode, product?.brand]);

	const brandOptions: TSelectOptions = useMemo(
		() => createBrandOptions(enhancedBrands).map((option) => ({ ...option })),
		[enhancedBrands],
	);

	const categoryOptions: TSelectOptions = useMemo(
		() => createCategoryOptions(categories).map((option) => ({ ...option })),
		[categories],
	);

	const initialValues = useMemo<ProductFormValues>(() => {
		const values = buildInitialValues(product);
		// Prefijar sucursal solo en modo creación
		if (!isEditMode) {
			values.branch_id = defaultBranchId ?? null;
		} else if (product?.branch_id) {
			values.branch_id = product.branch_id;
		}
		return values;
	}, [product, isEditMode, defaultBranchId]);

	// Pre-cargar marcas al abrir el modal según la sucursal relevante
	useEffect(() => {
		if (!isOpen) return;
		const branchToLoad = isEditMode ? (product?.branch_id ?? null) : (defaultBranchId ?? null);
		if (branchToLoad) {
			void dispatch(fetchBrands({ branchId: branchToLoad, search: '' }));
		}
	}, [isOpen, isEditMode, product?.branch_id, defaultBranchId, dispatch]);

	const handleSubmit = async (
		values: ProductFormValues,
		{ setSubmitting, resetForm, setErrors }: FormikHelpers<ProductFormValues>,
	) => {
		try {
			let payload: { data: Partial<IProduct>; categoryIds: number[] };
			if (product) {
				payload = buildSubmitPayload(values);
			} else {
				const categoryIds = (values.categories || []).map((c) => Number(c.value));

				const normalizedPrice =
					values.price === '' || values.price === null || values.price === undefined
						? 0
						: Number(values.price);

				const data: Partial<IProduct> = {
					sku: values.sku.trim(),
					name: values.name.trim(),
					brand_id: Number(values.brand_id),
					price: normalizedPrice,
					is_active: typeof values.is_active === 'boolean' ? values.is_active : true,
					serial_tracking:
						typeof values.serial_tracking === 'boolean'
							? values.serial_tracking
							: false,
				};

				if (values.branch_id) {
					data.branch_id = Number(values.branch_id);
				}

				if (values.commercial_sku?.trim()) {
					data.commercial_sku = values.commercial_sku.trim();
				}
				if (values.barcode?.trim()) {
					data.barcode = values.barcode.trim();
				}
				if (values.product_type) {
					data.product_type = values.product_type;
				}
				if (values.attributes_json) {
					data.attributes_json = values.attributes_json as unknown as Record<string, unknown>;
				}

				payload = { data, categoryIds };
			}

			await onSubmit(payload);

			if (!product) {
				resetForm();
			}
			onClose();
		} catch (error: unknown) {
			const errorRecord =
				error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined;
			const response =
				errorRecord?.response && typeof errorRecord.response === 'object'
					? (errorRecord.response as Record<string, unknown>)
					: undefined;
			const payload =
				response?.data && typeof response.data === 'object'
					? (response.data as Record<string, unknown>)
					: (errorRecord ?? {});
			if (payload && typeof payload === 'object') {
				const serverErrors: Record<string, string> = {};
				if (payload.errors && typeof payload.errors === 'object') {
					Object.entries(payload.errors).forEach(([key, val]) => {
						if (Array.isArray(val) && val.length) serverErrors[key] = String(val[0]);
						else if (typeof val === 'string') serverErrors[key] = val;
					});
					if (serverErrors.category_ids && !serverErrors.categories) {
						serverErrors.categories = serverErrors.category_ids;
					}
				}

				if (Object.keys(serverErrors).length) {
					setErrors(serverErrors as FormikErrors<ProductFormValues>);
				}

				const message =
					typeof payload.message === 'string'
						? payload.message
						: (payload?.message ??
							'No se pudo guardar el producto. Intenta nuevamente.');
				toast.error(message as string);
			} else {
				const message =
					typeof error === 'string'
						? error
						: error instanceof Error
							? error.message
							: 'No se pudo guardar el producto. Intenta nuevamente.';
				toast.error(message);
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md' isStaticBackdrop>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<Icon
						icon={product ? 'HeroPencilSquare' : 'HeroSparkles'}
						className='h-5 w-5'
					/>
					<div>
						<p className='text-lg font-semibold'>
							{product ? 'Editar producto' : 'Nuevo producto'}
						</p>
						<p className='text-sm text-neutral-500'>
							Completa la informacion para sincronizar el producto.
						</p>
					</div>
				</div>
			</ModalHeader>
			<Formik
				initialValues={initialValues}
				validationSchema={product ? productSchema : productSchemaCreate}
				enableReinitialize
				onSubmit={handleSubmit}>
				{({
					values,
					errors,
					touched,
					setFieldValue,
					setFieldTouched,
					isSubmitting,
					submitForm,
				}) => {
					const isBusy = isLoading || isSubmitting;
					const selectedBrandOption: TSelectOption | null =
						brandOptions.find(
							(option) => String(option.value) === String(values.brand_id),
						) ??
						(isEditMode && product?.brand
							? { value: String(product.brand.id), label: product.brand.name }
							: null);

					// Ref para evitar loops infinitos
					const lastSyncedProductType = useRef<string | null>(null);

					// Auto-sincronizar product_kind cuando cambia product_type
					useEffect(() => {
						// Evitar ejecutar en la carga inicial o si ya sincronizamos este tipo
						if (
							!values.product_type ||
							lastSyncedProductType.current === values.product_type
						) {
							return;
						}

						const productKindMap: Record<string, string> = {
							notebook: 'notebook',
							desktop_pc: 'desktop_pc',
							aio: 'aio',
							monitor: 'monitor',
							docking: 'docking',
						};

						const newProductKind = productKindMap[values.product_type];

						if (newProductKind) {
							const attrs =
								values.attributes_json && typeof values.attributes_json === 'object'
									? (values.attributes_json as unknown as Record<string, unknown>)
									: null;
							const currentProductKind =
								attrs && 'product_kind' in attrs ? attrs.product_kind : null;

							// Solo actualizar si es diferente
							if (currentProductKind !== newProductKind) {
								void setFieldValue(
									'attributes_json',
									{
										...(values.attributes_json || {}),
										product_kind: newProductKind,
									},
									false,
								);
							}
						} else if (values.product_type === 'general' && values.attributes_json) {
							// Si es general, limpiar attributes_json
							void setFieldValue('attributes_json', null, false);
						}

						// Marcar como sincronizado
						lastSyncedProductType.current = values.product_type;
					}, [values.product_type, values.attributes_json, setFieldValue]);

					return (
						<Form id='productForm'>
							<ModalBody className='space-y-5'>
								{PRODUCT_FORM_SECTIONS.map((section) => (
									<Card key={section.key} className={section.cardClass}>
										<CardHeader className='pb-2'>
											<div className='flex items-start gap-3'>
												<Icon icon={section.icon} className='h-5 w-5' />
												<div>
													<CardTitle className='text-base font-semibold'>
														{section.title}
													</CardTitle>
													<p className='text-sm text-neutral-500'>
														{section.description}
													</p>
												</div>
											</div>
										</CardHeader>
										<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
											{section.key === 'general' && (
												<>
													<Field name='sku'>
														{({ field, meta }: FieldProps) => (
															<FieldContainer
																id='sku'
																label='SKU'
																error={
																	meta.touched
																		? (meta.error as string)
																		: undefined
																}>
																<Input
																	id='sku'
																	{...field}
																	required
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													<Field name='name'>
														{({ field, meta }: FieldProps) => (
															<FieldContainer
																id='name'
																label='Nombre'
																error={
																	meta.touched
																		? (meta.error as string)
																		: undefined
																}>
																<Input
																	id='name'
																	{...field}
																	required
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													{/* Selector de Branch - Solo en modo CREAR */}
													{!isEditMode && userId && (
														<div className='space-y-2 md:col-span-2'>
															<UserBranchSelector
																userId={userId}
																name='branch_id'
																value={values.branch_id ?? ''}
																onChange={(branchId) => {
																	setFieldValue('brand_id', '');
																	setFieldValue(
																		'branch_id',
																		branchId,
																	);
																	setFieldTouched(
																		'branch_id',
																		true,
																	);
																	if (branchId) {
																		void dispatch(
																			fetchBrands({
																				branchId,
																				search: '',
																			}),
																		);
																	}
																}}
																label='Sucursal'
																placeholder='Selecciona la sucursal para este producto'
																disabled={isBusy}
																required
															/>
															{touched.branch_id &&
																errors.branch_id && (
																	<p className='text-xs text-red-500'>
																		{typeof errors.branch_id ===
																		'string'
																			? errors.branch_id
																			: 'Selecciona una sucursal'}
																	</p>
																)}
														</div>
													)}

													<div className='space-y-2 md:col-span-2'>
														<p className='text-sm font-medium'>Marca</p>
														<SelectReact
															name='brand_id'
															options={brandOptions}
															value={selectedBrandOption}
															onChange={(option) => {
																if (Array.isArray(option)) {
																	void setFieldValue(
																		'brand_id',
																		'',
																	);
																	return;
																}
																const singleOption = (option ??
																	null) as TSelectOption | null;
																void setFieldValue(
																	'brand_id',
																	singleOption?.value ?? '',
																);
															}}
															onBlur={() => {
																void setFieldTouched(
																	'brand_id',
																	true,
																);
															}}
															placeholder={
																brandsLoading
																	? 'Cargando marcas...'
																	: !brandOptions.length &&
																		  !values.branch_id
																		? 'Selecciona la sucursal primero'
																		: 'Selecciona una marca'
															}
															// Disable only while busy or when there are no brands for the selected branch
															isDisabled={
																isBusy ||
																brandsLoading ||
																(!brandOptions.length &&
																	!values.brand_id &&
																	!values.branch_id)
															}
														/>
														{touched.brand_id && errors.brand_id && (
															<p className='text-xs text-red-500'>
																{errors.brand_id}
															</p>
														)}
													</div>
												</>
											)}

											{section.key === 'classification' && (
												<>
													<div className='space-y-2'>
														<p className='text-sm font-medium'>
															Tipo de dispositivo
														</p>
														<Select
															name='product_type'
															value={
																PRODUCT_DEVICE_TYPES.some(
																	(opt) =>
																		opt.value ===
																		values.product_type,
																)
																	? values.product_type
																	: ''
															}
															onChange={(
																event: React.ChangeEvent<HTMLSelectElement>,
															) =>
																setFieldValue(
																	'product_type',
																	event.target.value,
																)
															}
															disabled={isBusy}>
															<option value=''>
																Seleccionar tipo
															</option>
															{PRODUCT_DEVICE_TYPES.map((option) => (
																<option
																	key={option.value}
																	value={option.value}>
																	{option.label}
																</option>
															))}
														</Select>
													</div>
													<div className='space-y-2 md:col-span-2'>
														<p className='text-sm font-medium'>
															Categorias
														</p>
														<SelectReact
															name='categories'
															isMulti
															options={categoryOptions}
															value={values.categories.map(
																(option) => ({
																	value: option.value,
																	label: option.label,
																}),
															)}
															onChange={(option) => {
																const nextOptions = Array.isArray(
																	option,
																)
																	? option
																	: option
																		? [option]
																		: [];
																void setFieldValue(
																	'categories',
																	nextOptions.map((item) => ({
																		value: item.value,
																		label: item.label,
																	})),
																);
															}}
															onBlur={() => {
																void setFieldTouched(
																	'categories',
																	true,
																);
															}}
															isDisabled={
																isBusy || !categoryOptions.length
															}
															placeholder='Selecciona las categorias'
														/>
														<ErrorMessage name='categories'>
															{(msg) => (
																<p className='text-xs text-red-500'>
																	{msg}
																</p>
															)}
														</ErrorMessage>
													</div>
												</>
											)}
										</CardBody>
									</Card>
								))}

								<Card>
									<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										{PRODUCT_TOGGLES.map((toggle) => (
											<div
												key={toggle.key}
												className='flex items-center gap-4 rounded-lg border p-4'>
												<span className='flex h-11 w-11 items-center justify-center rounded-lg border'>
													<Icon icon={toggle.icon} className='h-5 w-5' />
												</span>
												<div className='flex-1'>
													<p className='text-sm font-semibold'>
														{toggle.title}
													</p>
													<p className='text-xs text-neutral-500'>
														{toggle.description}
													</p>
												</div>
												<Checkbox
													checked={values[toggle.key as ProductToggleKey]}
													onChange={(event) =>
														setFieldValue(
															toggle.key,
															event.target.checked,
														)
													}
													disabled={isBusy}
												/>
											</div>
										))}
									</CardBody>
								</Card>
							</ModalBody>

							<ModalFooter>
								<div className='flex w-full justify-end gap-3'>
									<Button
										variant='outline'
										onClick={onClose}
										isDisable={isBusy}
										icon='HeroXMark'>
										Cancelar
									</Button>
									<Button
										onClick={(e) => {
											e.preventDefault();
											submitForm();
										}}
										color='blue'
										isLoading={isBusy}
										isDisable={isBusy}
										icon={product ? 'HeroArrowPath' : 'HeroCheck'}>
										{product ? 'Actualizar producto' : 'Crear producto'}
									</Button>
								</div>
							</ModalFooter>
						</Form>
					);
				}}
			</Formik>
		</Modal>
	);
};

export default CreateEditProductModal;
