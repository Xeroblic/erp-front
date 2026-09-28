import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import type {
	ICreatedPurchasableProduct,
	IPurchasableProductCreatePayload,
} from '@/services/procurement/purchasableProducts.service';
import type { IBrand } from '@/interface/brand.interface';
import {
	isSkuTakenError,
	isUncertainCreateOutcome,
	reconcileProductAttempt,
} from '../utils/productAttemptReconciliation';
import type { IPendingProductAttempt } from '../utils/productAttemptReconciliation';
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
 *
 * El alta no admite `Idempotency-Key`. Si el `POST` falla sin una respuesta
 * que diga qué pasó (red, timeout o 5xx), el producto pudo haberse creado: el
 * intento queda pendiente con su filial y su payload, el formulario se
 * bloquea con esos valores y «Reintentar» lo concilia
 * (`reconcileProductAttempt`) en vez de crear otro.
 */

const FORM_FIELDS: ReadonlyArray<keyof IProcurementProductFormValues> = [
	'name',
	'brand_id',
	'product_type',
	'category_ids',
];
const SKU_MAX_ATTEMPTS = 3;

const emptyValues = (): IProcurementProductFormValues => ({
	...EMPTY_PRODUCTO_COMPRA_VALUES,
	category_ids: [],
});

/** Marcas de una sucursal: el catálogo las lista por sucursal. */
interface IBranchBrands {
	branchId: number;
	items: IBrand[];
	failed: boolean;
}

/** Intento incierto y los valores del formulario con que se hizo, para mostrarlos. */
interface IPendingAttemptState extends IPendingProductAttempt {
	values: IProcurementProductFormValues;
}

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
	const categories = useAppSelector((state) => state.categories.items);
	const loadingCategories = useAppSelector((state) => state.categories.loading);

	/**
	 * Marcas propias del modal, atadas a la sucursal que las pidió. No se leen
	 * del slice compartido: puede traer las de otra sucursal o el resultado de
	 * una búsqueda del catálogo, y una carga ajena en curso no avisa al
	 * terminar. Se piden al abrir si no están las de la sucursal activa.
	 */
	const [branchBrands, setBranchBrands] = useState<IBranchBrands | null>(null);
	const brandsForBranch =
		branchId !== null && branchBrands?.branchId === branchId ? branchBrands : null;
	const brands = useMemo(() => brandsForBranch?.items ?? [], [brandsForBranch]);
	const loadingBrands = isOpen && branchId !== null && brandsForBranch === null;

	useEffect(() => {
		if (!isOpen || branchId === null || brandsForBranch !== null) return undefined;
		let cancelled = false;
		dispatch(fetchBrands({ branchId, search: '' }))
			.unwrap()
			.then(({ items }) => {
				if (!cancelled) setBranchBrands({ branchId, items, failed: false });
			})
			.catch(() => {
				if (!cancelled) setBranchBrands({ branchId, items: [], failed: true });
			});
		return () => {
			cancelled = true;
		};
	}, [dispatch, isOpen, branchId, brandsForBranch]);

	// Un fallo se reintenta al volver a abrir, no en cada render con el modal abierto.
	useEffect(() => {
		if (!isOpen) setBranchBrands((current) => (current?.failed ? null : current));
	}, [isOpen]);

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

	/**
	 * Alta cuyo resultado no se supo. Sobrevive al cierre del modal y al cambio
	 * de filial: hasta conciliarla, el formulario muestra sus valores sin
	 * permitir cambiarlos.
	 */
	const [pendingAttempt, setPendingAttempt] = useState<IPendingAttemptState | null>(null);

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
			const paintFieldErrors = (error: IProcurementResolvedError) => {
				Object.entries(error.fieldErrors ?? {}).forEach(([apiField, messages]) => {
					// `category_ids.0` se pinta sobre el selector de categorías.
					const baseField = apiField.split('.')[0];
					const formField = FORM_FIELDS.find((field) => field === baseField);
					if (formField && messages[0]) setFieldError(formField, messages[0]);
				});
			};

			/** Entrega el producto sólo a la filial en que se pidió. */
			const finish = (product: ICreatedPurchasableProduct, attemptSubsidiaryId: number) => {
				setPendingAttempt(null);
				resetForm({ values: emptyValues() });
				setSku('');
				if (attemptSubsidiaryId === subsidiaryId) onSuccess?.(product);
				else
					toast.info(
						'El producto se creó en la filial anterior; no se agrega a esta línea.',
					);
			};

			if (pendingAttempt !== null) {
				const outcome = await reconcileProductAttempt(pendingAttempt);
				if (outcome.kind === 'found') {
					toast.info('El producto ya se había creado: se usa ese.');
					finish(outcome.product, pendingAttempt.subsidiaryId);
				} else if (outcome.kind === 'created') {
					finish(outcome.product, pendingAttempt.subsidiaryId);
				} else if (outcome.kind === 'sku_collision') {
					// El SKU era de otro producto, así que el intento no creó nada: se
					// libera con otro SKU para que el usuario vuelva a crear.
					const brandName =
						brands.find((item) => item.id === pendingAttempt.payload.brand_id)?.name ??
						'';
					let nextSku = pendingAttempt.payload.sku;
					while (nextSku === pendingAttempt.payload.sku) {
						nextSku = generateSmartSKU({
							name: pendingAttempt.payload.name,
							brandName,
							productType: pendingAttempt.payload.product_type,
						});
					}
					setPendingAttempt(null);
					setSku(nextSku);
					toast.info(
						'El SKU generado ya era de otro producto, así que no se creó nada. Se generó otro SKU: vuelve a crear el producto.',
					);
				} else if (outcome.kind === 'not_created') {
					// Nada se creó: el formulario se libera con sus valores para corregirlos.
					setPendingAttempt(null);
					paintFieldErrors(outcome.error);
					toast.error(outcome.error.message);
				} else {
					toast.error(outcome.message);
				}
				return;
			}

			if (subsidiaryId === null) {
				toast.error('Necesitas una filial activa para crear un producto.');
				return;
			}
			const brand = brands.find((item) => String(item.id) === values.brand_id);
			if (!brand) {
				// La marca elegida era de otra sucursal: ya no está entre las opciones.
				setFieldError('brand_id', 'Selecciona una marca de la sucursal activa.');
				return;
			}

			const skuParams = {
				name: values.name.trim(),
				brandName: brand.name,
				productType: values.product_type,
			};

			let productSku = sku || generateSmartSKU(skuParams);
			for (let attempt = 1; attempt <= SKU_MAX_ATTEMPTS; attempt += 1) {
				const payload = toPayload(values, productSku);
				try {
					// eslint-disable-next-line no-await-in-loop
					const product = await createPurchasableProduct(subsidiaryId, payload);
					finish(product, subsidiaryId);
					return;
				} catch (error: unknown) {
					const resolved = resolveProcurementError(
						error,
						'No se pudo crear el producto.',
					);
					if (isUncertainCreateOutcome(resolved.status)) {
						setPendingAttempt({ subsidiaryId, payload, values });
						toast.error(
							'No se pudo confirmar si el producto se creó. «Reintentar» lo comprueba antes de crearlo otra vez.',
						);
						return;
					}
					// Este SKU se generó recién y su 422 es definitivo: nada se creó, así
					// que otro SKU no duplica. El SKU de un intento incierto nunca llega
					// acá: ese camino es `reconcileProductAttempt`, que no lo regenera.
					const onlySkuTaken =
						isSkuTakenError(resolved) &&
						Object.keys(resolved.fieldErrors ?? {}).length === 1;
					if (onlySkuTaken && attempt < SKU_MAX_ATTEMPTS) {
						productSku = generateSmartSKU(skuParams);
						setSku(productSku);
					} else {
						paintFieldErrors(resolved);
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

	/**
	 * Otra filial es otro catálogo: el borrador de la anterior se descarta. Un
	 * intento pendiente se conserva, porque sigue ligado a su propia filial.
	 */
	const draftSubsidiaryRef = useRef(subsidiaryId);
	useEffect(() => {
		if (draftSubsidiaryRef.current === subsidiaryId) return;
		draftSubsidiaryRef.current = subsidiaryId;
		if (pendingAttempt !== null) return;
		formik.resetForm({ values: emptyValues() });
		setSku('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subsidiaryId]);

	/** Al cerrar se limpia, salvo un intento pendiente: vuelve a mostrar sus valores. */
	const reset = useCallback(() => {
		formik.resetForm({ values: pendingAttempt?.values ?? emptyValues() });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pendingAttempt]);

	return {
		formik,
		isSubmitting: formik.isSubmitting,
		reset,
		sku: pendingAttempt?.payload.sku ?? sku,
		isReconciling: pendingAttempt !== null,
		pendingProductName: pendingAttempt?.payload.name ?? null,
		hasBranch: branchId !== null,
		brandOptions,
		categoryOptions,
		loadingBrands,
		brandsFailed: brandsForBranch?.failed ?? false,
		loadingCategories,
	};
};

export default useProcurementProductForm;
