import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type { TSelectOption } from '@/components/form/SelectReact';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import { generateSmartSKU } from '@/pages/catalogos/productos/utils/productForm.utils';
import {
	createProcurementProduct,
	isProcurementProductSkuTaken,
} from '@/services/procurement/procurementProducts.service';
import type { IProcurementProductCreatePayload } from '@/services/procurement/procurementProducts.service';
import type { IProcurementProduct } from '@/interface/procurement.interface';
import { EMPTY_PRODUCTO_COMPRA_VALUES, productoCompraFormSchema } from '../types';
import type { IProductoCompraFormValues } from '../types';

/**
 * Formik + `useIdempotentWrite` del alta en línea de producto desde el
 * documento de compra, con las reglas del alta por filial.
 *
 * Marcas, categorías, tipos de dispositivo y los interruptores de serie y
 * estado son los del catálogo (`catalogos/productos`); el producto en sí se
 * crea en el mock de abastecimiento (ver `procurementProducts.service`), así
 * que se llama al servicio directo: no hay estado compartido en Redux que
 * actualizar.
 *
 * El SKU no lo escribe el usuario: se genera con el mismo `generateSmartSKU`
 * del catálogo (marca + tipo, modelo y sufijo aleatorio) y se reintenta hasta
 * que no choque con otro de la filial.
 */

const FORM_FIELDS: ReadonlyArray<keyof IProductoCompraFormValues> = [
	'name',
	'brand_id',
	'product_type',
	'category_ids',
];
const SKU_MAX_ATTEMPTS = 5;

/** La ficha de abastecimiento exige `slug`; marcas y categorías del catálogo lo traen opcional. */
const toSlug = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[^a-zA-Z0-9\s-]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[\s-]+/g, '-')
		.replace(/^-+|-+$/g, '');

const emptyValues = (): IProductoCompraFormValues => ({
	...EMPTY_PRODUCTO_COMPRA_VALUES,
	category_ids: [],
});

/** Mismo criterio que `generateUniqueSmartSKU` del catálogo, verificado contra la filial del mock. */
const generateAvailableSku = (
	subsidiaryId: number,
	name: string,
	brandName: string,
	productType: string,
): string => {
	const params = { name, brandName, productType };
	for (let attempt = 0; attempt < SKU_MAX_ATTEMPTS; attempt += 1) {
		const candidate = generateSmartSKU(params);
		if (!isProcurementProductSkuTaken(subsidiaryId, candidate)) return candidate;
	}
	return `${generateSmartSKU(params)}${Date.now().toString(36).slice(-3).toUpperCase()}`;
};

interface IUseProductoCompraFormArgs {
	isOpen: boolean;
	subsidiaryId: number | null;
	onSuccess?: (product: IProcurementProduct) => void;
}

const useProductoCompraForm = ({ isOpen, subsidiaryId, onSuccess }: IUseProductoCompraFormArgs) => {
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

	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo crear el producto.',
	});

	const toPayload = (
		values: IProductoCompraFormValues,
		sku: string,
	): IProcurementProductCreatePayload => {
		const brand = brands.find((item) => String(item.id) === values.brand_id);
		return {
			name: values.name.trim(),
			brand: brand
				? { id: brand.id, name: brand.name, slug: brand.slug ?? toSlug(brand.name) }
				: null,
			sku,
			categories: categories
				.filter((category) => values.category_ids.includes(String(category.id)))
				.map((category) => ({
					id: category.id,
					name: category.name,
					slug: category.slug ?? toSlug(category.name),
				})),
			serial_tracking: values.serial_tracking,
			is_active: values.is_active,
		};
	};

	/**
	 * SKU que se enviará. Se regenera al cambiar nombre, marca o tipo, y queda
	 * fijo mientras no cambien: una clave idempotente reintentada debe mandar el
	 * mismo payload, no uno con otro sufijo aleatorio.
	 */
	const [sku, setSku] = useState('');

	const formik = useFormik<IProductoCompraFormValues>({
		initialValues: emptyValues(),
		validationSchema: productoCompraFormSchema,
		onSubmit: async (values, { resetForm }) => {
			if (subsidiaryId === null) {
				toast.error('Necesitas una filial activa para crear un producto.');
				return;
			}
			const result = await idempotentWrite.submit((headers) =>
				createProcurementProduct(subsidiaryId, toPayload(values, sku), {
					idempotencyKey: headers['Idempotency-Key'],
				}),
			);
			if (result) {
				resetForm({ values: emptyValues() });
				onSuccess?.(result.data);
			}
		},
	});

	const selectedBrandName =
		brands.find((item) => String(item.id) === formik.values.brand_id)?.name ?? '';
	const trimmedName = formik.values.name.trim();
	const productType = formik.values.product_type;

	useEffect(() => {
		if (subsidiaryId === null || !trimmedName || !selectedBrandName || !productType) {
			setSku('');
			return;
		}
		setSku(generateAvailableSku(subsidiaryId, trimmedName, selectedBrandName, productType));
	}, [subsidiaryId, trimmedName, selectedBrandName, productType]);

	/**
	 * Mismo criterio que `useProveedorForm`: errores de campo sobre el input,
	 * siempre toast, clave nueva. Un SKU que chocó igual (otra pestaña creó uno
	 * con el mismo sufijo) se regenera para el próximo intento.
	 */
	useEffect(() => {
		const resolved = idempotentWrite.error;
		if (!resolved) return;

		Object.entries(resolved.fieldErrors ?? {}).forEach(([apiField, messages]) => {
			const formField = FORM_FIELDS.find((field) => field === apiField);
			if (formField && messages[0]) formik.setFieldError(formField, messages[0]);
		});
		if (resolved.code === 'PRODUCT_SKU_ALREADY_EXISTS' && subsidiaryId !== null) {
			setSku(generateAvailableSku(subsidiaryId, trimmedName, selectedBrandName, productType));
		}
		toast.error(resolved.message);

		if (resolved.action !== 'retry_same_key') idempotentWrite.renewKey();
		// Sólo reacciona a un error nuevo: `formik` e `idempotentWrite` cambian de identidad en cada render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idempotentWrite.error]);

	const reset = useCallback(() => {
		formik.resetForm({ values: emptyValues() });
		idempotentWrite.clearError();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		formik,
		isSubmitting: idempotentWrite.isSubmitting,
		reset,
		sku,
		hasBranch: branchId !== null,
		brandOptions,
		categoryOptions,
		loadingBrands,
		loadingCategories,
	};
};

export default useProductoCompraForm;
