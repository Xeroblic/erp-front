import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Formik, Form, Field, type FormikHelpers, useFormikContext } from 'formik';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import MediaLibraryModal from '../../../components/MediaLibrary/MediaLibraryModal';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import Textarea from '@/components/form/Textarea';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Tabs, { Tab } from '@/components/ui/Tabs';
import { GeneralTab, ComercialTab, ContenidoTab, AtributosTab } from './components/DetailTabs';
import type { ProductDetailForm } from './types/products.types';
import { useProductDetail } from './hooks/useProductDetail';
import {
	buildDetailUpdatePayload,
	createBrandOptions,
	createCategoryOptions,
	mapProductToDetailForm,
} from './utils/productForm.utils';
import {
	PRODUCT_STATUS,
	PRODUCT_STATUS_LABELS,
	PRODUCT_TYPE_LABELS,
} from './constants/products.constant';
import { ATTRIBUTES_DEFAULT_BY_TYPE } from './constants/attributes.schemas';
import type { ProductStatus, ProductType } from '@/interface/product.interface';
import {
	uploadProductMedia,
	fetchBranchLibraryMedia,
	attachProductMediaFromLibrary,
	fetchProductById,
} from '@/store/slices/products/productsSlice';
import { useAppDispatch } from '@/store';

const DETAIL_TABS = [
	{ id: 'general', text: 'General' },
	{ id: 'comercial', text: 'Comercial' },
	{ id: 'contenido', text: 'Contenido' },
	{ id: 'atributos', text: 'Atributos' },
] as const;

const EMPTY_DETAIL_FORM: ProductDetailForm = {
	sku: '',
	name: '',
	brand_id: '',
	product_type: 'general',
	serial_tracking: false,
	is_active: true,
	category_ids: [],
	price: '',
	offer_price: '',
	cost: '',
	warranty_months: '',
	stock: '',
	snippet_description: '',
	short_description: '',
	long_description: '',
	product_status: 'pending',
	attributes_json: null,
};

const formatProductStatus = (status: string | null | undefined) =>
	PRODUCT_STATUS_LABELS[status ?? ''] ?? 'Sin estado';

type DetailFormikHelpers = FormikHelpers<ProductDetailForm>;

const AttributesEditor: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
	const { values, setFieldValue, setFieldError, errors } = useFormikContext<ProductDetailForm>();
	const [textValue, setTextValue] = useState<string>(() => {
		if (!values.attributes_json) return '';
		try {
			return JSON.stringify(values.attributes_json, null, 2);
		} catch (error) {
			console.error(error);
			return '';
		}
	});

	useEffect(() => {
		if (!values.attributes_json) {
			setTextValue('');
			return;
		}
		try {
			setTextValue(JSON.stringify(values.attributes_json, null, 2));
		} catch (error) {
			console.error(error);
		}
	}, [values.attributes_json]);

	const handleBlur = () => {
		if (!textValue.trim()) {
			setFieldValue('attributes_json', null);
			setFieldError('attributes_json', undefined);
			return;
		}
		try {
			const parsed = JSON.parse(textValue);
			setFieldValue('attributes_json', parsed);
			setFieldError('attributes_json', undefined);
		} catch (error) {
			setFieldError('attributes_json', 'El JSON de atributos no es válido');
		}
	};

	const handleApplyTemplate = () => {
		const productType = values.product_type;
		const template = ATTRIBUTES_DEFAULT_BY_TYPE[productType] ?? null;
		if (!template) {
			toast.info('No hay una plantilla disponible para este tipo de producto');
			return;
		}
		const cloned = JSON.parse(JSON.stringify(template));
		setFieldValue('attributes_json', cloned);
		setFieldError('attributes_json', undefined);
		toast.success('Plantilla de atributos aplicada');
	};

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between gap-3'>
				<div>
					<p className='text-sm font-medium'>Definición técnica (JSON)</p>
					<p className='text-xs text-neutral-500'>
						Edita la estructura de atributos técnicos para sincronizaciones e
						integraciones.
					</p>
				</div>
				<Button
					variant='outline'
					size='sm'
					icon='HeroSparkles'
					onClick={handleApplyTemplate}
					isDisable={disabled}>
					Plantilla
				</Button>
			</div>
			<Textarea
				value={textValue}
				onChange={(event) => setTextValue(event.target.value)}
				onBlur={handleBlur}
				disabled={disabled}
				rows={16}
				placeholder='Ej: {"product_kind":"desktop_pc","cpu":{...}}'
				className='font-mono text-sm'
			/>
			{errors.attributes_json && typeof errors.attributes_json === 'string' && (
				<p className='text-xs text-red-500'>{errors.attributes_json}</p>
			)}
			<div className='rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200'>
				Recuerda validar que el JSON sea válido y consistente con el tipo de producto
				seleccionado.
			</div>
		</div>
	);
};

const validateDetailForm = (values: ProductDetailForm) => {
	const errors: Partial<Record<keyof ProductDetailForm, string>> = {};

	if (!values.sku.trim()) errors.sku = 'El SKU es obligatorio';
	if (!values.name.trim()) errors.name = 'El nombre es obligatorio';
	if (values.brand_id === '' || values.brand_id === 0)
		errors.brand_id = 'Debes seleccionar una marca';
	if (!values.category_ids.length) errors.category_ids = 'Selecciona al menos una categoría';

	if (values.cost !== '') {
		const costValue = Number(values.cost);
		if (!Number.isFinite(costValue) || costValue < 0) errors.cost = 'El costo no es válido';
	}

	if (values.warranty_months !== '') {
		const warrantyValue = Number(values.warranty_months);
		if (!Number.isFinite(warrantyValue) || warrantyValue < 0)
			errors.warranty_months = 'La garantía debe ser un número positivo';
	}

	if (values.stock !== '') {
		const stockValue = Number(values.stock);
		if (!Number.isFinite(stockValue) || stockValue < 0)
			errors.stock = 'El stock debe ser un número positivo';
	}

	if (!values.product_status) errors.product_status = 'Selecciona el estado del producto';

	return errors;
};

const ProductDetail: React.FC = () => {
	const { productId: productIdParam } = useParams<{ productId: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const parsedProductId = productIdParam ? Number(productIdParam) : NaN;
	const productId = Number.isFinite(parsedProductId) ? parsedProductId : null;

	const queryBranchId = searchParams.get('branchId');
	const initialBranchId = queryBranchId ? Number(queryBranchId) : null;
	const [branchId, setBranchId] = useState<number | null>(
		Number.isFinite(initialBranchId ?? NaN) ? initialBranchId : null,
	);
	const [activeTab, setActiveTab] = useState<string>('general');

	const {
		product,
		productLoading,
		productError,
		updating,
		branches,
		brands,
		brandsLoading,
		categories,
		categoriesLoading,
		effectiveBranchId,
		updateProduct,
	} = useProductDetail({ productId, branchId });

	const dispatch = useAppDispatch();
	const [showLibrary, setShowLibrary] = useState(false);

	const handleLibrarySelect = async (items: any[]) => {
		if (!items || items.length === 0 || !product || !effectiveBranchId) return;
		const ids = items.map((i) => i.id);
		try {
			await dispatch(
				attachProductMediaFromLibrary({
					branchId: effectiveBranchId,
					productId: product.id,
					payload: {
						library_media_id: ids[0],
						collection: 'gallery',
						sort_order: 0,
						alt_text: '',
					},
				}),
			).unwrap();
			await dispatch(
				fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
			).unwrap();
		} catch (e) {
			// noop
		}
	};

	useEffect(() => {
		if (!branchId && effectiveBranchId) {
			setBranchId(effectiveBranchId);
			if (effectiveBranchId) {
				const params = new URLSearchParams(searchParams);
				params.set('branchId', String(effectiveBranchId));
				setSearchParams(params, { replace: true });
			}
		}
	}, [branchId, effectiveBranchId, searchParams, setSearchParams]);

	const brandOptions = useMemo(() => createBrandOptions(brands), [brands]);
	const categoryOptions = useMemo(() => createCategoryOptions(categories), [categories]);

	const productTypeOptions = useMemo(() => {
		const entries = Object.entries(PRODUCT_TYPE_LABELS);
		const seen = new Set<string>();
		return entries.reduce<Array<{ value: string; label: string }>>((acc, [value, label]) => {
			if (!value) return acc;
			if (seen.has(value)) return acc;
			seen.add(value);
			acc.push({ value, label });
			return acc;
		}, []);
	}, []);

	const initialValues = useMemo(
		() => (product ? mapProductToDetailForm(product) : EMPTY_DETAIL_FORM),
		[product],
	);

	const handleSubmit = async (
		values: ProductDetailForm,
		{ setSubmitting }: DetailFormikHelpers,
	) => {
		if (!product) return;
		try {
			const payload = buildDetailUpdatePayload(product, values);
			const { category_ids: categoryIds, ...data } = payload;
			const hasChanges = Object.keys(data).length > 0 || categoryIds !== undefined;

			if (!hasChanges) {
				toast.info('No hay cambios para guardar');
				setSubmitting(false);
				return;
			}

			await updateProduct({
				data,
				categoryIds,
			});
			toast.success('Producto actualizado correctamente');
		} catch (error: any) {
			const message =
				error?.response?.data?.message ??
				error?.message ??
				'No se pudo actualizar el producto';
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	};

	// Media handlers (upload + attach)
	const handleFileUpload = async (file?: File | null) => {
		if (!file || !product || !effectiveBranchId) return;
		try {
			const meta = JSON.stringify([
				{
					index: 0,
					collection: 'gallery',
					sort_order: 0,
					alt_text: 'Uploaded',
					primary: false,
				},
			]);
			const url = await dispatch(
				uploadProductMedia({
					branchId: effectiveBranchId,
					productId: product.id,
					file,
					meta,
				}),
			).unwrap();
			if (url) {
				await dispatch(
					fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
				).unwrap();
			}
		} catch (err) {
			console.error('Upload failed', err);
		}
	};

	const handleAttachFirstFromLibrary = async () => {
		if (!product || !effectiveBranchId) return;
		try {
			const lib = await dispatch(
				fetchBranchLibraryMedia({ branchId: effectiveBranchId, params: { q: '' } }),
			).unwrap();
			const first = lib.data?.[0];
			if (!first) return;
			await dispatch(
				attachProductMediaFromLibrary({
					branchId: effectiveBranchId,
					productId: product.id,
					payload: {
						library_media_id: first.id,
						collection: 'gallery',
						sort_order: 0,
						alt_text: first.alt ?? '',
					},
				}),
			).unwrap();
			await dispatch(
				fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
			).unwrap();
		} catch (err) {
			console.error('Attach from library failed', err);
		}
	};

	if (!productId || Number.isNaN(productId)) {
		return (
			<PageWrapper title='Producto no encontrado' name='Detalle de producto'>
				<Container>
					<Card>
						<CardBody className='space-y-3 text-center'>
							<Icon
								icon='HeroExclamationTriangle'
								className='mx-auto h-10 w-10 text-red-500'
							/>
							<p className='text-lg font-semibold text-neutral-700'>
								Producto no válido
							</p>
							<p className='text-sm text-neutral-500'>
								El identificador del producto no es válido. Regresa al listado para
								seleccionar un producto.
							</p>
							<Button
								icon='HeroArrowLeft'
								variant='outline'
								onClick={() => navigate('/catalogos/productos')}>
								Volver al listado
							</Button>
						</CardBody>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

	if (productLoading) {
		return (
			<PageWrapper title='Cargando producto' name='Detalle de producto'>
				<Container>
					<Card>
						<CardBody className='flex items-center gap-3 text-sm text-neutral-500'>
							<div className='h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent' />
							Cargando información del producto…
						</CardBody>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

	if (productError || !product) {
		return (
			<PageWrapper title='Producto no disponible' name='Detalle de producto'>
				<Container>
					<Card>
						<CardBody className='space-y-3 text-center'>
							<Icon
								icon='HeroExclamationTriangle'
								className='mx-auto h-10 w-10 text-red-500'
							/>
							<p className='text-lg font-semibold text-neutral-700'>
								No se encontró el producto
							</p>
							<p className='text-sm text-neutral-500'>
								No pudimos obtener la información del producto. Verifica la sucursal
								seleccionada o intenta nuevamente.
							</p>
							<div className='flex justify-center gap-3'>
								<Button
									variant='outline'
									icon='HeroListBullet'
									onClick={() => navigate('/catalogos/productos')}>
									Ver listado
								</Button>
								<Button
									variant='outline'
									icon='HeroArrowPath'
									onClick={() => window.location.reload()}>
									Reintentar
								</Button>
							</div>
						</CardBody>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

	// Configuración de tabs
	const tabsData = [
		{
			id: 'general',
			label: 'General',
			icon: 'HeroCog6Tooth',
			content: <GeneralTab brands={brands} brandsLoading={brandsLoading} />,
		},
		{
			id: 'comercial',
			label: 'Comercial',
			icon: 'HeroCurrencyDollar',
			content: (
				<ComercialTab
					categories={categories}
					categoriesLoading={categoriesLoading}
					categoryOptions={categoryOptions}
				/>
			),
		},
		{
			id: 'contenido',
			label: 'Contenido',
			icon: 'HeroDocumentText',
			content: (
				<ContenidoTab
					onUploadFile={handleFileUpload}
					onOpenLibrary={() => setShowLibrary(true)}
				/>
			),
		},
		{
			id: 'atributos',
			label: 'Atributos',
			icon: 'HeroListBullet',
			content: <AtributosTab />,
		},
	];

	return (
		<PageWrapper title={`Producto: ${product.name}`} name='Detalle de producto'>
			<Formik
				initialValues={initialValues}
				enableReinitialize
				validate={validateDetailForm}
				onSubmit={handleSubmit}>
				{({ values, errors, touched, isSubmitting, submitForm }) => {
					const selectedBrand = values.brand_id === '' ? '' : String(values.brand_id);
					const selectedCategories: TSelectOption[] = values.category_ids.map(
						(categoryId) => {
							const match = categoryOptions.find(
								(option) => option.value === String(categoryId),
							);
							return (
								match ?? {
									value: String(categoryId),
									label: `Categoría ${categoryId}`,
								}
							);
						},
					);
					const categoryError =
						touched.category_ids && errors.category_ids ? errors.category_ids : null;

					return (
						<Form>
							<Subheader>
								<SubheaderLeft>
									<div className='flex items-center gap-3'>
										<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'>
											{product.image?.thumb ? (
												<img
													src={product.image.thumb}
													alt={product.image.alt ?? product.name}
													className='h-12 w-12 rounded-lg object-cover'
												/>
											) : (
												<Icon icon='HeroCube' className='h-6 w-6' />
											)}
										</div>
										<div>
											<h1 className='text-xl font-semibold text-neutral-800 dark:text-neutral-100'>
												{product.name}
											</h1>
											<div className='flex flex-wrap items-center gap-2 text-sm text-neutral-500'>
												<span>SKU: {product.sku}</span>
												<span>•</span>
												<Badge
													variant='outline'
													color={product.is_active ? 'emerald' : 'zinc'}>
													{product.is_active ? 'Activo' : 'Inactivo'}
												</Badge>
												<span>•</span>
												<Badge variant='outline' color='violet'>
													{formatProductStatus(product.product_status)}
												</Badge>
											</div>
										</div>
									</div>
								</SubheaderLeft>
								<SubheaderRight>
									<div className='flex flex-wrap items-center gap-3'>
										{branches.length > 1 && (
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroBuildingStorefront'
													className='h-4 w-4 text-neutral-400'
												/>
												<select
													className='min-w-[180px] rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-900'
													value={branchId ?? effectiveBranchId ?? ''}
													onChange={(event) => {
														const nextValue = event.target.value
															? Number(event.target.value)
															: null;
														setBranchId(nextValue);
														const params = new URLSearchParams(
															searchParams,
														);
														if (nextValue) {
															params.set(
																'branchId',
																String(nextValue),
															);
														} else {
															params.delete('branchId');
														}
														setSearchParams(params, { replace: true });
													}}>
													<option value=''>Sucursal</option>
													{branches.map((branch) => (
														<option key={branch.id} value={branch.id}>
															{branch.name ?? `Sucursal ${branch.id}`}
														</option>
													))}
												</select>
											</div>
										)}
										<Button
											variant='outline'
											icon='HeroListBullet'
											onClick={() => navigate('/catalogos/productos')}>
											Ver listado
										</Button>
										<Button
											color='blue'
											icon='HeroArrowDownCircle'
											isLoading={isSubmitting || updating}
											isDisable={isSubmitting || updating}
											onClick={() => submitForm()}>
											Guardar cambios
										</Button>
									</div>
								</SubheaderRight>
							</Subheader>

							<Container>
								<div className='grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
									<div className='space-y-6'>
										<Card>
											<CardHeader>
												<CardTitle>Edición del producto</CardTitle>
												<p className='text-sm text-neutral-500'>
													Actualiza la información comercial y técnica del
													producto utilizando las pestañas.
												</p>
											</CardHeader>
											<CardBody className='p-0'>
												<div className='w-full'>
													<div
														className='product-tabs-container overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-700'
														style={{
															WebkitOverflowScrolling: 'touch',
															scrollbarWidth: 'none',
															msOverflowStyle: 'none',
														}}>
														<div
															className='flex w-max min-w-full'
															style={{ gap: '0px' }}>
															{tabsData.map((tab) => (
																<button
																	key={tab.id}
																	onClick={() =>
																		setActiveTab(tab.id)
																	}
																	className={`inline-flex flex-shrink-0 items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
																		activeTab === tab.id
																			? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
																			: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
																	}`}
																	style={{
																		minWidth: 'max-content',
																		whiteSpace:
																			'nowrap' as const,
																	}}>
																	{tab.icon && (
																		<Icon
																			icon={tab.icon}
																			className={`h-5 w-5 flex-shrink-0 ${
																				activeTab === tab.id
																					? 'text-blue-500 dark:text-blue-400'
																					: 'text-gray-400'
																			}`}
																		/>
																	)}
																	<span className='flex-shrink-0'>
																		{tab.label}
																	</span>
																</button>
															))}
														</div>
													</div>
													<style>{`
														.product-tabs-container::-webkit-scrollbar {
															display: none;
														}
													`}</style>
												</div>
												<div className='p-6'>
													{
														tabsData.find((tab) => tab.id === activeTab)
															?.content
													}
												</div>
											</CardBody>
										</Card>
									</div>

									<div className='space-y-6'>
										<Card>
											<CardHeader>
												<CardTitle>Resumen rápido</CardTitle>
											</CardHeader>
											<CardBody className='space-y-3 text-sm'>
												<div className='flex items-center justify-between'>
													<span className='text-neutral-500'>
														Sucursal
													</span>
													<span className='font-medium text-neutral-800 dark:text-neutral-100'>
														{branches.find(
															(branch) =>
																branch.id === product.branch_id,
														)?.name ?? `Sucursal ${product.branch_id}`}
													</span>
												</div>
												<div className='flex items-center justify-between'>
													<span className='text-neutral-500'>
														Tipo de producto
													</span>
													<span className='font-medium text-neutral-800 dark:text-neutral-100'>
														{PRODUCT_TYPE_LABELS[
															product.product_type ?? ''
														] ??
															product.product_type ??
															'Sin tipo'}
													</span>
												</div>
												<div className='flex items-center justify-between'>
													<span className='text-neutral-500'>Serie</span>
													<Badge
														variant='outline'
														color={
															product.serial_tracking
																? 'emerald'
																: 'zinc'
														}>
														{product.serial_tracking
															? 'Con serie'
															: 'Sin serie'}
													</Badge>
												</div>
												<div className='flex items-center justify-between'>
													<span className='text-neutral-500'>Precio</span>
													<span className='font-semibold text-neutral-800 dark:text-neutral-100'>
														${product.price.toLocaleString('es-CL')}
													</span>
												</div>
												<div className='space-y-1'>
													<p className='text-xs uppercase text-neutral-400'>
														Categorías
													</p>
													<div className='flex flex-wrap gap-1'>
														{product.categories?.map((category) => (
															<Badge
																key={category.id}
																variant='outline'
																color='blue'>
																{category.name}
															</Badge>
														)) ?? (
															<span className='text-xs text-neutral-400'>
																Sin categorías
															</span>
														)}
													</div>
												</div>
											</CardBody>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle>Auditoría</CardTitle>
											</CardHeader>
											<CardBody className='space-y-3 text-sm text-neutral-500'>
												<div>
													<p className='text-xs uppercase text-neutral-400'>
														Creado
													</p>
													<p className='font-medium text-neutral-700 dark:text-neutral-200'>
														{new Date(
															product.created_at,
														).toLocaleString('es-CL')}
													</p>
												</div>
												<div>
													<p className='text-xs uppercase text-neutral-400'>
														Actualizado
													</p>
													<p className='font-medium text-neutral-700 dark:text-neutral-200'>
														{new Date(
															product.updated_at,
														).toLocaleString('es-CL')}
													</p>
												</div>
											</CardBody>
										</Card>
									</div>
								</div>
							</Container>
						</Form>
					);
				}}
			</Formik>
			<MediaLibraryModal
				open={showLibrary}
				branchId={effectiveBranchId ?? 0}
				onClose={() => setShowLibrary(false)}
				onSelect={handleLibrarySelect}
			/>
		</PageWrapper>
	);
};

export default ProductDetail;
