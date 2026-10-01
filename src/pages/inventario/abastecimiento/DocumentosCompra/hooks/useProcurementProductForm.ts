import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import type { FormikHelpers } from 'formik';
import { toast } from 'react-toastify';
import type { TSelectOption } from '@/components/form/SelectReact';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { fetchCategories } from '@/store/slices/categories/categoriesSlice';
import {
	clearPendingProductAttempt,
	completeProductAttempt,
	markProductAttemptUncertain,
	selectPendingProductAttempt,
	startProductAttempt,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import { generateSmartSKU } from '@/pages/catalogos/productos/utils/productForm.utils';
import { createPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import type {
	ICreatedPurchasableProduct,
	IPendingProductAttempt,
	IPurchasableProductCreatePayload,
} from '@/services/procurement/purchasableProducts.service';
import type { IBrand } from '@/interface/brand.interface';
import {
	isSkuTakenError,
	isUncertainCreateOutcome,
	reconcileProductAttempt,
} from '../utils/productAttemptReconciliation';
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
 *
 * El intento se guarda en el store, uno por filial
 * (`purchaseDocuments.pendingProductAttempts`), desde que empieza el `POST`, no
 * en este hook: sobrevive al cierre y al desmontaje del modal —cambio de filial
 * en la ficha, salida de la página—. Al volver a su filial el formulario sigue
 * bloqueado mientras la petición vuela, queda para «Reintentar» si su resultado
 * no se supo, o entrega el producto si se creó sin nadie que lo recibiera.
 * Sólo un cierre de sesión o una recarga lo descartan.
 */

const FORM_FIELDS: ReadonlyArray<keyof IProcurementProductFormValues> = [
	'name',
	'brand_id',
	'product_type',
	'category_ids',
];
const SKU_MAX_ATTEMPTS = 3;

type TResetForm = FormikHelpers<IProcurementProductFormValues>['resetForm'];
type TSetFieldError = FormikHelpers<IProcurementProductFormValues>['setFieldError'];

/** Pinta los errores del backend sobre los campos del formulario. */
const paintFieldErrors = (error: IProcurementResolvedError, setFieldError: TSetFieldError) => {
	Object.entries(error.fieldErrors ?? {}).forEach(([apiField, messages]) => {
		// `category_ids.0` se pinta sobre el selector de categorías.
		const baseField = apiField.split('.')[0];
		const formField = FORM_FIELDS.find((field) => field === baseField);
		if (formField && messages[0]) setFieldError(formField, messages[0]);
	});
};

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

/** Valores del formulario con que se hizo un alta, para volver a mostrarlos. */
const attemptValues = (
	payload: IPurchasableProductCreatePayload,
): IProcurementProductFormValues => ({
	name: payload.name,
	brand_id: String(payload.brand_id),
	product_type: payload.product_type,
	serial_tracking: payload.serial_tracking,
	is_active: payload.is_active,
	category_ids: payload.category_ids.map(String),
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
	 * Alta sin cerrar de la filial activa, desde que empieza su `POST`: mientras
	 * exista, el formulario muestra sus valores sin permitir cambiarlos ni enviar
	 * otra. La de otra filial sigue guardada y reaparece al volver a ella.
	 */
	const pendingAttempt = useAppSelector((state) =>
		selectPendingProductAttempt(state, subsidiaryId),
	);
	const pendingAttemptRef = useRef(pendingAttempt);
	pendingAttemptRef.current = pendingAttempt;

	/** Filial activa ahora, no la del render que empezó un envío en curso. */
	const activeSubsidiaryRef = useRef(subsidiaryId);
	activeSubsidiaryRef.current = subsidiaryId;

	/** Un envío puede terminar después de que el modal que lo hizo se desmontó. */
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	/**
	 * Identidad del borrador que abrió el modal. Cambia al cambiar de filial y
	 * al cerrarse el modal desde afuera: con eso el documento descarta su
	 * borrador y la línea que lo abrió. Volver A → B → A deja la misma filial,
	 * pero no el mismo borrador, así que la filial sola no alcanza.
	 */
	const draftRef = useRef({ subsidiaryId, isOpen, id: 0 });
	if (draftRef.current.subsidiaryId !== subsidiaryId || (draftRef.current.isOpen && !isOpen)) {
		draftRef.current = { subsidiaryId, isOpen, id: draftRef.current.id + 1 };
	} else if (draftRef.current.isOpen !== isOpen) {
		draftRef.current = { ...draftRef.current, isOpen };
	}

	/** Si el borrador cambió o el modal se desmontó, el formulario ya no es el del envío. */
	const isStillHere = (attemptSubsidiaryId: number, draftId: number) =>
		mountedRef.current &&
		activeSubsidiaryRef.current === attemptSubsidiaryId &&
		draftRef.current.id === draftId;

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

	/**
	 * Cierra un alta que creó el producto y lo entrega sólo al borrador que lo
	 * pidió. Sin un modal montado que lo reciba, o si ese borrador ya se
	 * descartó aunque se haya vuelto a su filial, queda en el store para
	 * «Usar producto»: el callback del envío apunta a una línea que ya no existe.
	 */
	const finish = (
		product: ICreatedPurchasableProduct,
		attemptSubsidiaryId: number,
		draftId: number,
		resetForm: TResetForm,
	) => {
		if (!mountedRef.current) {
			dispatch(completeProductAttempt({ subsidiaryId: attemptSubsidiaryId, product }));
			return;
		}
		if (activeSubsidiaryRef.current !== attemptSubsidiaryId) {
			dispatch(clearPendingProductAttempt(attemptSubsidiaryId));
			toast.info('El producto se creó en la filial anterior; no se agrega a esta línea.');
			return;
		}
		if (draftRef.current.id !== draftId) {
			dispatch(completeProductAttempt({ subsidiaryId: attemptSubsidiaryId, product }));
			return;
		}
		dispatch(clearPendingProductAttempt(attemptSubsidiaryId));
		resetForm({ values: emptyValues() });
		setSku('');
		onSuccess?.(product);
	};

	const formik = useFormik<IProcurementProductFormValues>({
		initialValues: pendingAttempt ? attemptValues(pendingAttempt.payload) : emptyValues(),
		validationSchema: procurementProductFormSchema,
		onSubmit: async (values, { resetForm, setFieldError }) => {
			// Con un alta sin cerrar no se crea otra: `submit` la atiende.
			if (pendingAttemptRef.current !== null) return;
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

			const draftId = draftRef.current.id;
			let productSku = sku || generateSmartSKU(skuParams);
			for (let attempt = 1; attempt <= SKU_MAX_ATTEMPTS; attempt += 1) {
				const payload = toPayload(values, productSku);
				// Se registra antes del `POST`: si el modal se desmonta y se vuelve a
				// abrir con la petición en vuelo, no deja enviar otra.
				dispatch(startProductAttempt({ subsidiaryId, payload }));
				try {
					// eslint-disable-next-line no-await-in-loop
					const product = await createPurchasableProduct(subsidiaryId, payload);
					finish(product, subsidiaryId, draftId, resetForm);
					return;
				} catch (error: unknown) {
					const resolved = resolveProcurementError(
						error,
						'No se pudo crear el producto.',
					);
					if (isUncertainCreateOutcome(resolved.status)) {
						dispatch(markProductAttemptUncertain(subsidiaryId));
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
						dispatch(clearPendingProductAttempt(subsidiaryId));
						if (isStillHere(subsidiaryId, draftId))
							paintFieldErrors(resolved, setFieldError);
						toast.error(resolved.message);
						return;
					}
				}
			}
		},
	});

	/**
	 * «Reintentar»: concilia el intento guardado. No pasa por la validación de
	 * Formik: trabaja sobre la filial y el payload del intento, no sobre lo que
	 * muestre el formulario.
	 */
	const reconcile = async (attempt: IPendingProductAttempt) => {
		const draftId = draftRef.current.id;
		dispatch(startProductAttempt(attempt));
		const outcome = await reconcileProductAttempt(attempt);
		if (outcome.kind === 'found') {
			toast.info('El producto ya se había creado: se usa ese.');
			finish(outcome.product, attempt.subsidiaryId, draftId, formik.resetForm);
		} else if (outcome.kind === 'created') {
			finish(outcome.product, attempt.subsidiaryId, draftId, formik.resetForm);
		} else if (outcome.kind === 'not_created') {
			// Nada se creó: el formulario se libera con sus valores para corregirlos.
			dispatch(clearPendingProductAttempt(attempt.subsidiaryId));
			if (isStillHere(attempt.subsidiaryId, draftId))
				paintFieldErrors(outcome.error, formik.setFieldError);
			toast.error(outcome.error.message);
		} else {
			dispatch(markProductAttemptUncertain(attempt.subsidiaryId));
			toast.error(outcome.message);
		}
	};

	/** Envío del modal: crea, concilia el intento incierto o usa el ya creado. */
	const submit = async () => {
		const attempt = pendingAttemptRef.current;
		if (attempt === null) {
			await formik.submitForm();
			return;
		}
		if (attempt.status === 'in_flight') return;
		if (attempt.status === 'created') {
			dispatch(clearPendingProductAttempt(attempt.subsidiaryId));
			formik.resetForm({ values: emptyValues() });
			setSku('');
			toast.info('El producto ya se había creado: se usa ese.');
			onSuccess?.(attempt.product);
			return;
		}
		await reconcile(attempt);
	};

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
	 * El intento puede llegar con el modal ya montado: lo empezó un montaje
	 * anterior y su respuesta llegó después de volver. El formulario pasa a
	 * mostrar sus valores, que son los que se concilian.
	 */
	const attemptKey = pendingAttempt
		? `${pendingAttempt.subsidiaryId}:${JSON.stringify(pendingAttempt.payload)}`
		: null;
	useEffect(() => {
		const attempt = pendingAttemptRef.current;
		if (attempt === null) return;
		void formik.setValues(attemptValues(attempt.payload), false);
		formik.setErrors({});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attemptKey]);

	/**
	 * Otra filial es otro catálogo: el borrador de la anterior se descarta y se
	 * muestra el intento pendiente de la nueva, si tiene. El de la anterior no
	 * se pierde: sigue en el store, ligado a su filial.
	 */
	const draftSubsidiaryRef = useRef(subsidiaryId);
	useEffect(() => {
		if (draftSubsidiaryRef.current === subsidiaryId) return;
		draftSubsidiaryRef.current = subsidiaryId;
		formik.resetForm({
			values: pendingAttempt ? attemptValues(pendingAttempt.payload) : emptyValues(),
		});
		setSku('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subsidiaryId]);

	/**
	 * Al cerrar se limpia, salvo un intento sin cerrar: vuelve a mostrar sus
	 * valores. Un producto ya creado que se cierra sin usar se descarta: está en
	 * el catálogo y se puede buscar en la línea.
	 */
	const reset = useCallback(() => {
		const attempt = pendingAttemptRef.current;
		if (attempt?.status === 'created') {
			dispatch(clearPendingProductAttempt(attempt.subsidiaryId));
		}
		formik.resetForm({
			values:
				attempt && attempt.status !== 'created'
					? attemptValues(attempt.payload)
					: emptyValues(),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	const attemptStatus = pendingAttempt?.status ?? null;

	return {
		formik,
		submit,
		/** Un envío en curso, propio o de un montaje anterior del modal. */
		isSubmitting: formik.isSubmitting || attemptStatus === 'in_flight',
		/** Hay un envío en curso que empezó otro montaje (o «Reintentar»), no Formik. */
		isAwaitingAttempt: attemptStatus === 'in_flight' && !formik.isSubmitting,
		isLocked: formik.isSubmitting || pendingAttempt !== null,
		reset,
		sku: pendingAttempt?.payload.sku ?? sku,
		isReconciling: attemptStatus === 'uncertain',
		recoveredProduct: pendingAttempt?.status === 'created' ? pendingAttempt.product : null,
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
