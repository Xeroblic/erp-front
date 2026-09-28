import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type { TSelectOption } from '@/components/form/SelectReact';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import { generateSmartSKU } from '@/pages/catalogos/productos/utils/productForm.utils';
import { createPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type {
	ICreatedPurchasableProduct,
	IPurchasableProductCreatePayload,
} from '@/services/procurement/purchasableProducts.service';
import { EMPTY_PRODUCTO_COMPRA_VALUES, procurementProductFormSchema } from '../types';
import type { IProcurementProductFormValues } from '../types';

/**
 * Formik del alta en línea de producto desde el documento de compra. Crea el
 * producto en el catálogo real (`createPurchasableProduct`), con las marcas,
 * categorías, tipos de dispositivo e interruptores del alta de
 * `catalogos/productos`.
 *
 * El SKU no lo escribe el usuario: se genera con el mismo `generateSmartSKU`
 * del catálogo (marca + tipo, modelo y sufijo aleatorio). El backend lo exige
 * único en la filial; si el generado ya existe (422 en `sku`), se genera otro
 * y se reintenta sin que el usuario tenga que volver a enviar. Un 422 no crea
 * nada, así que reintentar no duplica el producto.
 */

const FORM_FIELDS: ReadonlyArray<keyof IProcurementProductFormValues> = [
	'name',
	'brand_id',
	'product_type',
	'category_ids',
];
const SKU_MAX_ATTEMPTS = 3;
const VALIDATION_STATUS = 422;

const emptyValues = (): IProcurementProductFormValues => ({
	...EMPTY_PRODUCTO_COMPRA_VALUES,
	category_ids: [],
});

interface IUseProcurementProductFormArgs {
	isOpen: boolean;
	subsidiaryId: number | null;
	onSuccess?: (product: ICreatedPurchasableProduct) => void;
}

const useProcurementProductForm = ({
	isOpen,
	subsidiaryId,
	onSuccess,
}: IUseProcurementProductFormArgs) => {
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const brands = useAppSelector((state) => state.brands.items);
	const loadingBrands = useAppSelector((state) => state.brands.loading);
	const brandsBranchId = useAppSelector((state) => state.brands.lastBranchId);
	const categories = useAppSelector((state) => state.categories.items);
	const loadingCategories = useAppSelector((state) => state.categories.loading);

	// Las marcas se listan por sucursal: se recargan sólo si el store trae las de otra.
	useEffect(() => {
		if (!isOpen || branchId === null || loadingBrands) return;
		if (brandsBranchId === branchId && brands.length > 0) return;
		void dispatch(fetchBrands({ branchId, search: '' }));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, branchId]);

	useEffect(() => {
		if (!isOpen || loadingCategories || categories.length > 0) return;
		void dispatch(fetchCategories());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const brandOptions = useMemo<TSelectOption[]>(
		() =>
			brands
				.filter((brand) => brand.is_active)
				.map((brand) => ({ value: String(brand.id), label: brand.name })),
		[brands],
	);
	const categoryOptions = useMemo<TSelectOption[]>(
		() =>
			categories
				.filter((category) => category.is_active)
				.map((category) => ({ value: String(category.id), label: category.name })),
		[categories],
	);

	/**
	 * SKU que se mostrará y enviará. Se regenera al cambiar nombre, marca o
	 * tipo, o cuando el backend rechaza el generado por repetido.
	 */
	const [sku, setSku] = useState('');

	const toPayload = (
		values: IProcurementProductFormValues,
		productSku: string,
	): IPurchasableProductCreatePayload => ({
		name: values.name.trim(),
		sku: productSku,
		brand_id: Number(values.brand_id),
		product_type: values.product_type,
		serial_tracking: values.serial_tracking,
		is_active: values.is_active,
		category_ids: values.category_ids.map(Number),
	});

	const formik = useFormik<IProcurementProductFormValues>({
		initialValues: emptyValues(),
		validationSchema: procurementProductFormSchema,
		onSubmit: async (values, { resetForm, setFieldError }) => {
			if (subsidiaryId === null) {
				toast.error('Necesitas una filial activa para crear un producto.');
				return;
			}
			const brandName =
				brands.find((item) => String(item.id) === values.brand_id)?.name ?? '';
			const skuParams = {
				name: values.name.trim(),
				brandName,
				productType: values.product_type,
			};

			let productSku = sku || generateSmartSKU(skuParams);
			for (let attempt = 1; attempt <= SKU_MAX_ATTEMPTS; attempt += 1) {
				try {
					// eslint-disable-next-line no-await-in-loop
					const product = await createPurchasableProduct(
						subsidiaryId,
						toPayload(values, productSku),
					);
					resetForm({ values: emptyValues() });
					setSku('');
					onSuccess?.(product);
					return;
				} catch (error: unknown) {
					const resolved = resolveProcurementError(
						error,
						'No se pudo crear el producto.',
					);
					const fieldErrors = resolved.fieldErrors ?? {};
					const isSkuTaken =
						resolved.status === VALIDATION_STATUS &&
						Object.keys(fieldErrors).length === 1 &&
						Boolean(fieldErrors.sku);
					if (isSkuTaken && attempt < SKU_MAX_ATTEMPTS) {
						productSku = generateSmartSKU(skuParams);
						setSku(productSku);
					} else {
						Object.entries(fieldErrors).forEach(([apiField, messages]) => {
							// `category_ids.0` se pinta sobre el selector de categorías.
							const baseField = apiField.split('.')[0];
							const formField = FORM_FIELDS.find((field) => field === baseField);
							if (formField && messages[0]) setFieldError(formField, messages[0]);
						});
						toast.error(resolved.message);
						return;
					}
				}
			}
		},
	});

	const selectedBrandName =
		brands.find((item) => String(item.id) === formik.values.brand_id)?.name ?? '';
	const trimmedName = formik.values.name.trim();
	const productType = formik.values.product_type;

	useEffect(() => {
		if (!trimmedName || !selectedBrandName || !productType) {
			setSku('');
			return;
		}
		setSku(generateSmartSKU({ name: trimmedName, brandName: selectedBrandName, productType }));
	}, [trimmedName, selectedBrandName, productType]);

	const reset = useCallback(() => {
		formik.resetForm({ values: emptyValues() });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		formik,
		isSubmitting: formik.isSubmitting,
		reset,
		sku,
		hasBranch: branchId !== null,
		brandOptions,
		categoryOptions,
		loadingBrands,
		loadingCategories,
	};
};

export default useProcurementProductForm;
