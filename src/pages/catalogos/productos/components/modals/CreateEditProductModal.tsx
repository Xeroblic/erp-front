import React, { useMemo, useEffect, useRef, useState } from 'react';
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
import OffCanvas, { OffCanvasBody, OffCanvasFooter, OffCanvasHeader } from '@/components/ui/OffCanvas';
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
	generateSmartSKU,
	generateUniqueSmartSKU,
	type SmartSKUParams,
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
import BrandSelectorWithCreate from '../../../../../components/utils/selects/BrandSelectorWithCreate';
import CategorySelectorWithCreate from '../../../../../components/utils/selects/CategorySelectorWithCreate';
import { useAppSelector, useAppDispatch } from '@/store';
import { createBrand, fetchBrands } from '@/store/slices/brands/brandsSlice';
import Tooltip from '@/components/ui/Tooltip';
import Tabs, { Tab } from '@/components/ui/Tabs';
import WooCommerceProductTab from './components/WooCommerceProductTab';

interface CreateEditProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: { data: Partial<IProduct>; categoryIds: number[] }) => Promise<void>;
	product?: IProduct;
	brands: IBrand[];
	categories: ICategory[];
	isLoading?: boolean;
	brandsLoading?: boolean;
	categoriesLoading?: boolean;
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
	categoriesLoading = false,
	defaultBranchId = null,
}) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const dispatch = useAppDispatch();
	const isEditMode = !!product;

	const userId = currentUser?.id || currentUser?.pk;
	const [activeTab, setActiveTab] = useState<'formulario' | 'nuevo_formulario'>('formulario');
	const [skuChecking, setSkuChecking] = useState<boolean>(false);
	const [skuManuallyEdited, setSkuManuallyEdited] = useState<boolean>(false);

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

	const draftValuesRef = useRef<ProductFormValues | null>(null);

	const initialValues = useMemo<ProductFormValues>(() => {
		if (!isEditMode && draftValuesRef.current) {
			return draftValuesRef.current;
		}
		const values = buildInitialValues(product);
		// Prefijar sucursal solo en modo creación
		if (!isEditMode) {
			values.branch_id = defaultBranchId ?? null;
		} else if (product?.branch_id) {
			values.branch_id = product.branch_id;
		}
		return values;
	}, [product, isEditMode, defaultBranchId, isOpen]);

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
				draftValuesRef.current = null;
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
		<OffCanvas isOpen={isOpen} setIsOpen={onClose} position='right' dialogClassName='md:!max-w-[65rem] w-full' isStaticBackdrop>
			<OffCanvasHeader>
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
			</OffCanvasHeader>
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

					// Determinar si los campos clave para SKU están completos
					const skuFieldsComplete = !!(values.name?.trim() && values.brand_id && values.product_type);

					// Auto-save draft
					useEffect(() => {
						if (!isEditMode) {
							draftValuesRef.current = values;
						}
					}, [values]);

					// Ref para debounce de SKU
					const skuGenTimerRef = useRef<any>(null);

					// Auto-generar SKU cuando cambian los campos relevantes (solo en modo crear)
					useEffect(() => {
						if (isEditMode || skuManuallyEdited) return;

						const currentBrandOpt = brandOptions.find(
							(o) => String(o.value) === String(values.brand_id),
						);
						const currentBrandName = currentBrandOpt ? String(currentBrandOpt.label) : '';

						// Si no hay datos suficientes, limpiar SKU
						if (!values.name?.trim() || !currentBrandName || !values.product_type) {
							if (values.sku) void setFieldValue('sku', '', false);
							return;
						}

						// Generar SKU con debounce para no saturar
						if (skuGenTimerRef.current) clearTimeout(skuGenTimerRef.current);
						skuGenTimerRef.current = setTimeout(() => {
							const previewSku = generateSmartSKU({
								name: values.name,
								brandName: currentBrandName,
								productType: values.product_type || '',
							});
							void setFieldValue('sku', previewSku, false);
						}, 400);

						return () => {
							if (skuGenTimerRef.current) clearTimeout(skuGenTimerRef.current);
						};
						// eslint-disable-next-line react-hooks/exhaustive-deps
					}, [values.name, values.brand_id, values.product_type, isEditMode, skuManuallyEdited]);

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
					const formFieldsMarkup = (
						<>
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
															<div className='flex gap-2'>
																<Input
																	id='sku'
																	{...field}
																	onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
																		field.onChange(e);
																		if (!isEditMode) setSkuManuallyEdited(true);
																	}}
																	required
																	disabled={isBusy || (!isEditMode && !skuFieldsComplete && !skuManuallyEdited)}
																	className='flex-1'
																	placeholder={!isEditMode && !skuFieldsComplete ? 'Se genera automáticamente...' : ''}
																/>
																<Tooltip text={skuChecking ? 'Verificando unicidad...' : skuManuallyEdited ? 'Volver a auto-generar' : 'Regenerar SKU'}>
																	<Button
																		variant='outline'
																		type='button'
																		onClick={async () => {
																			if (!values.name?.trim()) {
																				toast.warning('Ingresa un nombre de producto primero');
																				return;
																			}
																			const currentBrandOpt = brandOptions.find(o => String(o.value) === String(values.brand_id));
																			const currentBrand = currentBrandOpt ? String(currentBrandOpt.label) : '';
																			setSkuChecking(true);
																			setSkuManuallyEdited(false);
																			try {
																				const branchId = values.branch_id || defaultBranchId;
																				let newSku: string;
																				if (branchId) {
																					newSku = await generateUniqueSmartSKU(
																						{ name: values.name, brandName: currentBrand, productType: values.product_type || '' },
																						'branches',
																						Number(branchId),
																					);
																				} else {
																					newSku = generateSmartSKU({ name: values.name, brandName: currentBrand, productType: values.product_type || '' });
																				}
																				void setFieldValue('sku', newSku);
																				toast.success('SKU generado y verificado ✓');
																			} catch {
																				const fallback = generateSmartSKU({ name: values.name, brandName: currentBrand, productType: values.product_type || '' });
																				void setFieldValue('sku', fallback);
																			} finally {
																				setSkuChecking(false);
																			}
																		}}
																		isDisable={isBusy || skuChecking}
																	>
																		{skuChecking
																			? <Icon icon='HeroArrowPath' className='h-5 w-5 animate-spin text-blue-500' />
																			: <Icon icon='HeroSparkles' className='h-5 w-5 text-amber-500' />
																		}
																	</Button>
																</Tooltip>
															</div>
															{!isEditMode && !skuFieldsComplete && (
																<p className='mt-1 text-xs text-amber-500'>
																	<Icon icon='HeroInformationCircle' className='mr-1 inline h-3 w-3' />
																	Completa nombre, marca y tipo para habilitar edición
																</p>
															)}
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
													<BrandSelectorWithCreate
														name='brand_id'
														branchId={values.branch_id ?? null}
														brandOptions={brandOptions}
														value={values.brand_id}
														onChange={(newBrandId) => {
															void setFieldValue('brand_id', newBrandId);
														}}
														onBlur={() => {
															void setFieldTouched('brand_id', true);
														}}
														brandsLoading={brandsLoading}
														isDisabled={isBusy || (!brandOptions.length && !values.brand_id && !values.branch_id)}
														placeholder={
															brandsLoading
																? 'Cargando marcas...'
																: !brandOptions.length && !values.branch_id
																	? 'Selecciona la sucursal primero'
																	: 'Selecciona una marca'
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
													<CategorySelectorWithCreate
														name='categories'
														branchId={values.branch_id ?? null}
														categoryOptions={categoryOptions}
														value={values.categories.map(
															(option) => ({
																value: String(option.value),
																label: String(option.label),
															}),
														)}
														onChange={(nextOptions) => {
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
														categoriesLoading={categoriesLoading}
														placeholder={
															categoriesLoading
																? 'Cargando categorías...'
																: 'Selecciona las categorías'
														}
														isDisabled={
															isBusy || categoriesLoading
														}
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

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								{PRODUCT_TOGGLES.map((toggle) => (
									<Card
										key={toggle.key}
										className='border-2 border-dashed hover:border-solid hover:border-neutral-300 transition-all duration-200 ease-in-out cursor-pointer'>
										<CardBody className='p-0'>
											<div className='flex w-full items-center gap-4 p-4'>
												<span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border'>
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
										</CardBody>
									</Card>
								))}
							</div>
						</>
					);

					return (
						<Form id='productForm' className='flex h-full flex-col overflow-hidden'>
							<OffCanvasBody className='space-y-5'>
								{import.meta.env.DEV ? (
									<Tabs
										activeTab={activeTab}
										onTabChange={(id) => setActiveTab(id as 'formulario' | 'nuevo_formulario')}
										variant='pills'
										className='w-full'
									>
										<Tab id='formulario' text='Formulario Normal' icon='HeroDocumentText'>
											<div className='space-y-5 mt-4'>
												{formFieldsMarkup}
											</div>
										</Tab>
										<Tab id='nuevo_formulario' text='Publicacion Sincronizada WooErp' icon='HeroCodeBracketSquare'>
											<WooCommerceProductTab
												setActiveTab={setActiveTab}
												branchId={values.branch_id ?? null}
												isBusy={isBusy}
											/>
										</Tab>
									</Tabs>
								) : (
									formFieldsMarkup
								)}
							</OffCanvasBody>

							<OffCanvasFooter>
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
							</OffCanvasFooter>
						</Form>
					);
				}}
			</Formik>
		</OffCanvas>
	);
};

export default CreateEditProductModal;
