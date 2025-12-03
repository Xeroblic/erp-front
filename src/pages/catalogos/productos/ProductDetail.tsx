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
import { useAppDispatch } from '@/store';
import {
	deleteProductMedia,
	setProductMainImage,
	fetchProductById,
} from '@/store/slices/products/productsSlice';

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

	const parsedProductId = productIdParam ? Number(productIdParam) : NaN;
	const productId = Number.isFinite(parsedProductId) ? parsedProductId : null;
	const branchIdFromState = (location.state as any)?.branchId;
	const branchIdFromQuery = useMemo(() => {
		const params = new URLSearchParams(location.search);
		const raw = params.get('branchId');
		const parsed = raw ? Number(raw) : NaN;
		return Number.isFinite(parsed) ? parsed : null;
	}, [location.search]);
	const initialBranchId = Number.isFinite(branchIdFromState)
		? branchIdFromState
		: branchIdFromQuery;

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
	} = useProductDetail({ productId, branchId: initialBranchId });

	const { branchId, activeTab, setActiveTab, handleBranchChange } = useProductDetailState(
		initialBranchId,
		effectiveBranchId,
	);

	const { handleMainImageUpload, handleGalleryImageUpload, handleLibrarySelect } =
		useProductMediaHandlers(product, effectiveBranchId);

	const [showLibrary, setShowLibrary] = useState(false);

	const brandOptions = useMemo(() => createBrandOptions(brands), [brands]);
	const categoryOptions = useMemo(() => createCategoryOptions(categories), [categories]);

	const initialValues = useMemo(() => {
		if (!product) return EMPTY_DETAIL_FORM;
		return mapProductToDetailForm(product);
	}, [product?.id, product?.attributes_json, product?.updated_at]);

	// Manejar eliminaciÃ³n de imagen
	const handleDeleteImage = async (mediaId: number) => {
		if (!product || !effectiveBranchId) return;
		try {
			await dispatch(
				deleteProductMedia({
					branchId: effectiveBranchId,
					productId: product.id,
					mediaId,
				}),
			).unwrap();
			toast.success('Imagen eliminada correctamente');
			// Recargar el producto para ver los cambios
			await dispatch(
				fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
			).unwrap();
		} catch (error: any) {
			toast.error(error?.message ?? 'Error al eliminar la imagen');
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
		} catch (error: any) {
			if (error?.response?.data?.errors) {
				const backendErrors = error.response.data.errors;
				const formikErrors: Record<string, string> = {};

				Object.keys(backendErrors).forEach((key) => {
					const errorMessages = backendErrors[key];
					if (Array.isArray(errorMessages) && errorMessages.length > 0) {
						formikErrors[key] = errorMessages[0];
						setFieldTouched(key, true, false);
					}
				});

				setErrors(formikErrors);

				const message = error?.response?.data?.message ?? 'Error de validación';
				toast.error(message);
			} else {
				const message =
					error?.response?.data?.message ??
					error?.message ??
					'No se pudo actualizar el producto';
				toast.error(message);
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

	if (productError || !product) {
		return <ProductNotFoundError />;
	}

	return (
		<PageWrapper title={`Producto: ${product.name}`} name='Detalle de producto'>
			<Formik
				initialValues={initialValues}
				enableReinitialize
				validationSchema={productDetailSchema}
				validateOnBlur={true}
				validateOnChange={true}
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
				branchId={effectiveBranchId ?? 0}
				onClose={() => setShowLibrary(false)}
				onSelect={handleLibrarySelect}
			/>
		</PageWrapper>
	);
};

export default ProductDetail;
