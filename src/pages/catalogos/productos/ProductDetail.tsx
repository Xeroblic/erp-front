import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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

// ✅ Componente AutoSaveHandler - ESTABLE, fuera del formulario
const AutoSaveHandler: React.FC = React.memo(() => {
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

	const parsedProductId = productIdParam ? Number(productIdParam) : NaN;
	const productId = Number.isFinite(parsedProductId) ? parsedProductId : null;

	const queryBranchId = new URLSearchParams(window.location.search).get('branchId');
	const initialBranchId = queryBranchId ? Number(queryBranchId) : null;

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

	const { handleFileUpload, handleLibrarySelect } = useProductMediaHandlers(
		product,
		effectiveBranchId,
	);

	const [showLibrary, setShowLibrary] = useState(false);

	const brandOptions = useMemo(() => createBrandOptions(brands), [brands]);
	const categoryOptions = useMemo(() => createCategoryOptions(categories), [categories]);

	const initialValues = useMemo(
		() => (product ? mapProductToDetailForm(product) : EMPTY_DETAIL_FORM),
		[product],
	);

	const handleSubmit = async (
		values: ProductDetailForm,
		{ setSubmitting }: FormikHelpers<ProductDetailForm>,
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

	// Estados de error y carga
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
				validate={validateDetailForm}
				onSubmit={handleSubmit}>
				{({ isSubmitting, submitForm }) => (
					<Form>
						<AutoSaveHandler />

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
							<div className='grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
								<div className='space-y-6'>
									<ProductDetailTabs
										activeTab={activeTab}
										onTabChange={setActiveTab}
										brands={brands}
										brandsLoading={brandsLoading}
										categories={categories}
										categoriesLoading={categoriesLoading}
										categoryOptions={categoryOptions}
										onUploadFile={handleFileUpload}
										onOpenLibrary={() => setShowLibrary(true)}
									/>
								</div>

								<ProductDetailSidebar product={product} branches={branches} />
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
