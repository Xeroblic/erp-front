import React, { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Formik, Form, type FormikHelpers, useFormikContext } from 'formik';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import MediaLibraryModal from '../../../components/MediaLibrary/MediaLibraryModal';
import Container from '@/components/layouts/Container/Container';
import Subheader from '@/components/layouts/Subheader/Subheader';
import SavePrompt from '@/components/ui/SavePrompt';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useProductDetail } from './hooks/useProductDetail';
import { useProductDetailState } from './hooks/useProductDetailState';
import { useProductMediaHandlers } from './hooks/useProductMediaHandlers';
import { ProductDetailHeader } from './components/ProductDetailHeader';
import { ProductDetailSidebar } from './components/ProductDetailSidebar';
import { ProductDetailTabs } from './components/ProductDetailTabs';
import {
	InvalidProductError,
	ProductNotFoundError,
	LoadingState,
} from './components/ProductDetailErrorStates';
import type { ProductDetailForm } from './types/products.types';
import {
	buildDetailUpdatePayload,
	createBrandOptions,
	createCategoryOptions,
	mapProductToDetailForm,
} from './utils/productForm.utils';
import { productDetailSchema } from './validation/productForm.schema';
import { useAppDispatch, useAppSelector } from '@/store';
import { publishProductThunk } from '@/store/slices/integrations/woocommerceProductsSlice';
import { isWooSynced } from '@/utils/wooProductMeta.util';
import {
	deleteProductMedia,
	setProductMainImage,
	fetchProductById,
	type ProductEntityParam,
} from '@/store/slices/products/productsSlice';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import type { ProductsViewMode } from './hooks/useProductos';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

const EMPTY_DETAIL_FORM: ProductDetailForm = {
	sku: '',
	name: '',
	brand_id: '',
	product_type: 'desktop_pc',
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

interface AutoSaveHandlerProps {
	activeTab: string;
}

const AutoSaveHandler: React.FC<AutoSaveHandlerProps> = React.memo(() => {
	const { submitForm } = useFormikContext<ProductDetailForm>();

	const { showSavePrompt, confirmSave, cancelSave, isSaving } = useAutoSave<ProductDetailForm>({
		delay: 30000,
		onSave: async () => {
			await submitForm();
		},
		enabled: true,
	});

	return (
		<SavePrompt
			isOpen={showSavePrompt}
			onConfirm={confirmSave}
			onCancel={cancelSave}
			isLoading={isSaving}
			title='¿Guardar cambios?'
			message='Has estado inactivo por 30 segundos y tienes cambios sin guardar. ¿Deseas guardar estos cambios ahora?'
		/>
	);
});

AutoSaveHandler.displayName = 'AutoSaveHandler';

const ProductDetail: React.FC = () => {
	const { productId: productIdParam } = useParams<{ productId: string }>();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { branchId: currentBranchId } = useCurrentBranch();
	const locationState =
		location.state && typeof location.state === 'object'
			? (location.state as Record<string, unknown>)
			: null;

	const parsedProductId = productIdParam ? Number(productIdParam) : NaN;
	const productId = Number.isFinite(parsedProductId) ? parsedProductId : null;
	const branchIdFromState =
		typeof locationState?.branchId === 'number' ? locationState.branchId : null;
	const viewModeFromState: ProductsViewMode | null =
		locationState?.viewMode === 'subsidiaries' || locationState?.viewMode === 'branches'
			? (locationState.viewMode as ProductsViewMode)
			: null;
	const subsidiaryIdFromState =
		typeof locationState?.subsidiaryId === 'number' ? locationState.subsidiaryId : null;
	const branchIdFromQuery = useMemo(() => {
		const params = new URLSearchParams(location.search);
		const raw = params.get('branchId');
		const parsed = raw ? Number(raw) : NaN;
		return Number.isFinite(parsed) ? parsed : null;
	}, [location.search]);
	const modeFromQuery = useMemo<ProductsViewMode | null>(() => {
		const params = new URLSearchParams(location.search);
		const raw = params.get('mode');
		if (raw === 'subsidiaries' || raw === 'branches') return raw;
		return null;
	}, [location.search]);
	const subsidiaryIdFromQuery = useMemo(() => {
		const params = new URLSearchParams(location.search);
		const raw = params.get('subsidiaryId');
		const parsed = raw ? Number(raw) : NaN;
		return Number.isFinite(parsed) ? parsed : null;
	}, [location.search]);
	const mode: ProductsViewMode =
		modeFromQuery ?? viewModeFromState ?? (effectiveSubsidiaryId ? 'subsidiaries' : 'branches');
	const subsidiaryId =
		subsidiaryIdFromQuery ?? subsidiaryIdFromState ?? effectiveSubsidiaryId ?? null;
	const routeBranchId = Number.isFinite(branchIdFromState)
		? branchIdFromState
		: branchIdFromQuery;
	const initialBranchId = mode === 'branches' ? (currentBranchId ?? routeBranchId) : null;

	const getErrorMessage = (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) return error.message;
		if (error && typeof error === 'object') {
			const record = error as Record<string, unknown>;
			const response =
				record.response && typeof record.response === 'object'
					? (record.response as Record<string, unknown>)
					: undefined;
			const data =
				response?.data && typeof response.data === 'object'
					? (response.data as Record<string, unknown>)
					: undefined;
			if (typeof data?.message === 'string' && data.message.trim()) {
				return data.message;
			}
		}
		return fallback;
	};

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
		entityId,
		updateProduct,
	} = useProductDetail({
		productId,
		branchId: initialBranchId,
		subsidiaryId,
		mode,
	});
	const entityParam: ProductEntityParam = mode === 'subsidiaries' ? 'subsidiaries' : 'branches';

	const { branchId, activeTab, setActiveTab, handleBranchChange } = useProductDetailState(
		initialBranchId,
		effectiveBranchId,
	);

	const { handleMainImageUpload, handleGalleryImageUpload, handleLibrarySelect } =
		useProductMediaHandlers(product, entityId, entityParam);

	const [showLibrary, setShowLibrary] = useState(false);

	const brandOptions = useMemo(() => createBrandOptions(brands), [brands]);
	const categoryOptions = useMemo(() => createCategoryOptions(categories), [categories]);

	const initialValues = useMemo(() => {
		if (!product) return EMPTY_DETAIL_FORM;
		return mapProductToDetailForm(product);
	}, [product?.id, product?.attributes_json, product?.updated_at]);

	// Manejar eliminaciÃ³n de imagen
	const handleDeleteImage = async (mediaId: number) => {
		if (!product || !entityId) return;
		try {
			await dispatch(
				deleteProductMedia({
					entityParam,
					entityId,
					productId: product.id,
					mediaId,
				}),
			).unwrap();
			toast.success('Imagen eliminada correctamente');
			// Recargar el producto para ver los cambios
			await dispatch(
				fetchProductById({ entityParam, entityId, productId: product.id }),
			).unwrap();
		} catch (error: unknown) {
			toast.error(getErrorMessage(error, 'Error al eliminar la imagen'));
		}
	};

	const handleSubmit = async (
		values: ProductDetailForm,
		{ setSubmitting, setErrors, setFieldTouched }: FormikHelpers<ProductDetailForm>,
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

			// Auto-sincronización: si el producto ya está vinculado a WooCommerce,
			// propaga los cambios publicándolo de nuevo (#5). El push real es un
			// job en cola; no bloquea ni revierte el guardado si falla.
			if (subsidiaryId && isWooSynced(product.marketplace_external_ids)) {
				try {
					await dispatch(
						publishProductThunk({
							subsidiaryId,
							productId: product.id,
							payload: { sync_stock_with_woo: product.sync_stock_with_woo ?? true },
						}),
					).unwrap();
					toast.info('Cambios enviados a WooCommerce');
				} catch {
					toast.warning(
						'El producto se guardó, pero no se pudo sincronizar con WooCommerce',
					);
				}
			}
		} catch (error: unknown) {
			const errorRecord =
				error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined;
			const response =
				errorRecord?.response && typeof errorRecord.response === 'object'
					? (errorRecord.response as Record<string, unknown>)
					: undefined;
			const data =
				response?.data && typeof response.data === 'object'
					? (response.data as Record<string, unknown>)
					: undefined;
			const backendErrors =
				data?.errors && typeof data.errors === 'object'
					? (data.errors as Record<string, unknown>)
					: undefined;

			if (backendErrors) {
				const formikErrors: Record<string, string> = {};

				Object.keys(backendErrors).forEach((key) => {
					const errorMessages = backendErrors[key];
					if (Array.isArray(errorMessages) && errorMessages.length > 0) {
						const first = errorMessages.find(
							(msg): msg is string => typeof msg === 'string',
						);
						if (!first) return;
						formikErrors[key] = first;
						setFieldTouched(key, true, false);
					}
				});

				setErrors(formikErrors);

				const message =
					typeof data?.message === 'string' && data.message.trim()
						? data.message
						: 'Error de validación';
				toast.error(message);
			} else {
				toast.error(getErrorMessage(error, 'No se pudo actualizar el producto'));
			}
		} finally {
			setSubmitting(false);
		}
	};

	if (!productId || Number.isNaN(productId)) {
		return <InvalidProductError />;
	}

	if (productLoading) {
		return <LoadingState />;
	}

	if (!product && !productError) {
		return <LoadingState />;
	}

	if (productError || !product) {
		return <ProductNotFoundError />;
	}

	return (
		<PageWrapper title={`Producto: ${product.name}`} name='Detalle de producto'>
			<Formik
				initialValues={initialValues}
				enableReinitialize
				validationSchema={productDetailSchema}
				validateOnBlur
				validateOnChange
				onSubmit={handleSubmit}>
				{({ isSubmitting, submitForm }) => (
					<Form>
						<AutoSaveHandler activeTab={activeTab} />

						<Subheader>
							<ProductDetailHeader
								product={product}
								branches={branches}
								branchId={branchId}
								effectiveBranchId={effectiveBranchId}
								onBranchChange={handleBranchChange}
								onSave={submitForm}
								isSubmitting={isSubmitting}
								isUpdating={updating}
							/>
						</Subheader>

						<Container>
							<div className='flex w-full flex-col gap-6 xl:flex-row xl:items-start'>
								<div className='order-1 space-y-6 xl:order-1 xl:flex-1'>
									<ProductDetailTabs
										activeTab={activeTab}
										onTabChange={setActiveTab}
										brands={brands}
										brandsLoading={brandsLoading}
										categories={categories}
										categoriesLoading={categoriesLoading}
										categoryOptions={categoryOptions}
										onUploadMainImage={handleMainImageUpload}
										onUploadGalleryImage={handleGalleryImageUpload}
										onOpenLibrary={() => setShowLibrary(true)}
										product={product}
										onDeleteImage={handleDeleteImage}
										updateProduct={updateProduct}
									/>
								</div>

								<div className='order-2 xl:order-2 xl:w-[320px] xl:flex-shrink-0'>
									<ProductDetailSidebar product={product} branches={branches} />
								</div>
							</div>
						</Container>
					</Form>
				)}
			</Formik>

			<MediaLibraryModal
				open={showLibrary}
				entityParam={entityParam}
				entityId={entityId ?? 0}
				onClose={() => setShowLibrary(false)}
				onSelect={handleLibrarySelect}
			/>
		</PageWrapper>
	);
};

export default ProductDetail;
