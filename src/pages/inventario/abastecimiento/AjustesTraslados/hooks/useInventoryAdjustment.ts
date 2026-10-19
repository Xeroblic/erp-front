import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	createInventoryAdjustmentThunk,
	fetchInventoryStock,
	inventoryStockQueryKey,
} from '@/store/slices/procurement/inventoryStockSlice';
import {
	getInventoryAdjustableProduct,
	getAdjustmentStockAvailability,
	getAdjustmentWarehouses,
	listAdjustmentStock,
} from '@/services/procurement/inventoryStock.service';
import type { IInventoryStockAvailability } from '@/services/procurement/inventoryStock.service';
import {
	locationStockParams,
	locationToken,
	UNLOCATED_TOKEN,
	warehouseIdFromToken,
} from '@/utils/inventoryLocation.util';
import { applyProcurementFieldErrors } from '@/utils/procurementErrors.util';
import {
	AJUSTE_FORM_FIELDS,
	AjusteSchema,
	ajusteLineErrorsFrom,
	emptyAjusteItem,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/adjustment.types';
import type {
	IAjusteFormValues,
	IAjusteItemDraft,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/adjustment.types';
import useStepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useStepWizard';
import useAdjustableProductSearch from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAdjustableProductSearch';
import {
	AJUSTE_STEPS,
	NO_PRESELECTION,
	resolvePreselectedLocation,
	shortageLineFrom,
	type IAjustesTrasladosPreselection,
	type TAjusteStep,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';
import {
	findLocationStockRows,
	LOCATION_STOCK_PAGE_SIZE,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/locationStockLookup';
import type {
	IInventoryAdjustment,
	IInventoryAdjustmentPayload,
	IInventoryProductRef,
	IInventoryStockRow,
	IWarehouseCompact,
} from '@/interface/procurement.interface';

export type TProductNames = Record<number, { name: string; sku: string }>;

export interface IAjusteResult {
	adjustment: IInventoryAdjustment;
	products: TProductNames;
	locationLabel: string;
	/**
	 * Disponible de la sucursal frente a reservas, después del ajuste. Vacío
	 * cuando el entorno no publica reservas: el disponible no se conoce.
	 */
	availability: IInventoryStockAvailability[];
}

/**
 * Filas de stock halladas más allá de la primera página, por producto (`null`:
 * la ubicación no lo tiene). `key` las ata a la consulta que las originó y
 * `failedFor` es el conjunto de productos cuya búsqueda falló: otro conjunto
 * vuelve a intentarlo.
 */
interface IPagedStockLookup {
	key: string;
	rows: Record<number, IInventoryStockRow | null>;
	failedFor: string | null;
}

const NO_PAGED_LOOKUP: IPagedStockLookup = { key: '', rows: {}, failedFor: null };

/**
 * El ajuste corrige el saldo de la ubicación elegida: no se enlaza a una
 * recepción ni atribuye egresos a una compra. El servicio consume lo más
 * antiguo primero (FIFO), que es lo que el usuario espera al «quitar de la
 * ubicación».
 */
export default function useInventoryAdjustment(
	branchId: number,
	context: string,
	subsidiaryId: number | null = null,
	preselection: IAjustesTrasladosPreselection = NO_PRESELECTION,
	/** Etapa 2 de la filial. Se lee al montar: un cambio rehace el formulario (`key`). */
	multiLocation = false,
	loadedWarehouses?: readonly IWarehouseCompact[],
) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [result, setResult] = useState<IAjusteResult | null>(null);
	const [retry, setRetry] = useState(0);
	// Los errores de línea se muestran desde el primer intento de avanzar del
	// paso de productos, no sólo tras un envío.
	const [itemsChecked, setItemsChecked] = useState(false);

	const [pagedLookup, setPagedLookup] = useState<IPagedStockLookup>(NO_PAGED_LOOKUP);

	// En la etapa 1 un ajuste con bodega responde `409 MULTI_LOCATION_NOT_ENABLED`:
	// sin bodegas, la única ubicación es «Sin ubicación» y una bodega de la URL
	// no resuelve, así que su producto tampoco se preselecciona.
	const warehouses = useMemo(
		() => (multiLocation ? (loadedWarehouses ?? getAdjustmentWarehouses(branchId)) : []),
		[multiLocation, branchId, loadedWarehouses],
	);
	// Preselección de la URL: se resuelve una vez, al montar. Es el valor
	// inicial del formulario, no un filtro que lo siga. El catálogo no está
	// cargado —se busca en el servidor—, así que el producto se confirma
	// después, al montar (ver `preselectedProductId`).
	const [initialSelection] = useState(() => {
		const location = resolvePreselectedLocation(preselection.location, warehouses);
		const productId: number | '' =
			location !== null && preselection.productId !== null ? preselection.productId : '';
		const fixedLocation = multiLocation ? '' : UNLOCATED_TOKEN;
		return { location: location ?? fixedLocation, productId };
	});

	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo registrar el ajuste.',
		renewKeyOnDefinitiveError: true,
	});

	const stockRowsRef = useRef<IInventoryStockRow[]>([]);
	// `onSubmit` no puede depender del catálogo por cierre sin volver a crear el
	// formulario en cada render: la ref le da el valor vigente al escribir.
	const productsRef = useRef<IInventoryProductRef[]>([]);
	// El asistente se arma después del formulario (valida con él): `onSubmit`
	// lo alcanza por ref para volver a «Productos».
	const showItemsRef = useRef<() => void>(() => undefined);

	const labelFor = useCallback(
		(token: string): string => {
			if (!token) return '';
			const warehouseId = warehouseIdFromToken(token);
			if (warehouseId === null) return 'Sin ubicación';
			return warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '';
		},
		[warehouses],
	);

	const formik = useFormik<IAjusteFormValues>({
		initialValues: {
			location: initialSelection.location,
			reason: '',
			notes: '',
			items: [{ ...emptyAjusteItem(), productId: initialSelection.productId }],
		},
		validationSchema: AjusteSchema,
		onSubmit: async (formValues, helpers) => {
			const payload: IInventoryAdjustmentPayload = {
				warehouse_id: warehouseIdFromToken(formValues.location),
				reason: formValues.reason.trim(),
				notes: formValues.notes.trim() || null,
				items: formValues.items.map((item) => ({
					product_id: Number(item.productId),
					quantity_delta: Number(item.quantityDelta),
					condition: item.condition,
				})),
			};
			const names: TProductNames = {};
			formValues.items.forEach((item) => {
				const product =
					productsRef.current.find((candidate) => candidate.id === item.productId) ??
					stockRowsRef.current.find(
						(candidate) => candidate.product.id === item.productId,
					)?.product;
				if (product) names[product.id] = { name: product.name, sku: product.sku };
			});
			const locationLabel = labelFor(formValues.location);

			const adjustment = await idempotentWrite.submit(
				(headers) =>
					dispatch(
						createInventoryAdjustmentThunk({
							branchId,
							payload,
							headers: { idempotencyKey: headers['Idempotency-Key'] },
						}),
					).unwrap(),
				{
					onError: (error) => {
						// Motivo y notas están en el paso visible; los errores de línea
						// (`items.N.campo`) los marca `errorFor` en su línea.
						applyProcurementFieldErrors(
							error.fieldErrors,
							(apiField) => AJUSTE_FORM_FIELDS[apiField],
							helpers.setFieldError,
						);
						// El lote se rechazó entero por saldo: el que muestran las
						// líneas ya no es el vigente.
						if (error.code === 'INSUFFICIENT_LOCATION_STOCK')
							setRetry((value) => value + 1);
						// Con la línea identificada, se corrige donde está marcada.
						if (shortageLineFrom(error, formValues.items)) showItemsRef.current();
					},
				},
			);
			if (!adjustment) return;

			// El disponible se lee **después** de aplicar: es el estado que la
			// pantalla tiene que mostrar, faltante incluido.
			const availability = [
				...new Set(adjustment.items.map((item) => item.product_id)),
			].flatMap((productId) => getAdjustmentStockAvailability(branchId, productId) ?? []);
			setResult({ adjustment, products: names, locationLabel, availability });
			toast.success(`Ajuste registrado en ${locationLabel}.`);
			helpers.resetForm({
				values: {
					location: formValues.location,
					reason: '',
					notes: '',
					items: [emptyAjusteItem()],
				},
			});
			setItemsChecked(false);
			setRetry((value) => value + 1);
		},
	});

	const { values, touched, setFieldValue, setValues, setTouched, setFieldTouched, validateForm } =
		formik;

	/**
	 * Los productos elegibles salen del **catálogo**, no del stock vigente de la
	 * ubicación: un conteo que encuentra unidades de un producto que quedó en
	 * cero —o que nunca estuvo en esa bodega— tiene que poder nombrarlo. El
	 * stock sólo informa el saldo y valida los egresos.
	 */
	const productSearch = useAdjustableProductSearch(branchId, subsidiaryId, values.location);
	const { remember: rememberProducts, knownProducts: products } = productSearch;
	productsRef.current = products;

	const request = useMemo(
		() => ({
			branchId,
			ownerContext: `ajuste:${context}:${session}`,
			source: 'adjustment' as const,
			params: values.location
				? {
						...locationStockParams(values.location),
						page: 1,
						per_page: LOCATION_STOCK_PAGE_SIZE,
					}
				: {},
		}),
		[branchId, context, session, values.location],
	);
	const queryKey = inventoryStockQueryKey(request);
	const isCurrent = raw.ownerContext === queryKey;
	const stockResponse = isCurrent ? raw.response : null;
	const firstPageError = isCurrent ? raw.error : null;
	const hasLocation = Boolean(values.location);
	const loadingFirstPage = hasLocation && (!isCurrent || raw.loading);

	useEffect(() => {
		if (!hasLocation) return undefined;
		const pending = dispatch(fetchInventoryStock(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry, hasLocation]);

	// `retry` cambia tras registrar un ajuste: los saldos hallados quedan viejos.
	const pagedLookupKey = `${queryKey}#${retry}`;
	const paged = pagedLookup.key === pagedLookupKey ? pagedLookup : NO_PAGED_LOOKUP;
	const firstPageRows = useMemo(() => stockResponse?.data ?? [], [stockResponse]);
	const lastPage = stockResponse?.meta.last_page ?? 1;

	/*
	 * Productos de las líneas que la primera página no trae: el catálogo ofrece
	 * cualquier producto, así que su saldo puede estar en cualquier página. Se
	 * serializa para que el efecto no se reinicie con cada tecla.
	 */
	const missingProductKey = useMemo(() => {
		if (loadingFirstPage || firstPageError || lastPage <= 1) return '';
		const loaded = new Set(firstPageRows.map((row) => row.product.id));
		const ids = values.items.flatMap((item) =>
			item.productId === '' || loaded.has(item.productId) || item.productId in paged.rows
				? []
				: [item.productId],
		);
		return [...new Set(ids)].sort((a, b) => a - b).join(',');
	}, [loadingFirstPage, firstPageError, lastPage, firstPageRows, values.items, paged.rows]);
	const lookupFailed = missingProductKey !== '' && paged.failedFor === missingProductKey;
	const searchingPages = missingProductKey !== '' && !lookupFailed;
	const unresolvedIds = useMemo(
		() => new Set(lookupFailed ? missingProductKey.split(',').map(Number) : []),
		[lookupFailed, missingProductKey],
	);

	useEffect(() => {
		if (!searchingPages) return undefined;
		const productIds = missingProductKey.split(',').map(Number);
		const controller = new AbortController();
		findLocationStockRows(
			listAdjustmentStock,
			branchId,
			values.location,
			productIds,
			lastPage,
			controller.signal,
		).then(
			(found) => {
				if (controller.signal.aborted) return;
				setPagedLookup((previous) => {
					const rows = previous.key === pagedLookupKey ? { ...previous.rows } : {};
					productIds.forEach((id) => {
						rows[id] = found.get(id) ?? null;
					});
					return { key: pagedLookupKey, rows, failedFor: null };
				});
			},
			() => {
				if (controller.signal.aborted) return;
				setPagedLookup((previous) => ({
					key: pagedLookupKey,
					rows: previous.key === pagedLookupKey ? previous.rows : {},
					failedFor: missingProductKey,
				}));
			},
		);
		return () => controller.abort();
	}, [branchId, values.location, lastPage, missingProductKey, pagedLookupKey, searchingPages]);

	const stockRows: IInventoryStockRow[] = useMemo(() => {
		const found = Object.values(paged.rows).filter(
			(row): row is IInventoryStockRow => row !== null,
		);
		return found.length ? [...firstPageRows, ...found] : firstPageRows;
	}, [firstPageRows, paged.rows]);
	stockRowsRef.current = stockRows;

	// Una línea preseleccionada desde la URL nombra su producto con la fila de
	// stock, antes de cualquier búsqueda.
	useEffect(() => {
		rememberProducts(stockRows.map((row) => row.product));
	}, [stockRows, rememberProducts]);

	const loadingStock = loadingFirstPage || searchingPages;
	const stockError =
		firstPageError ??
		(lookupFailed ? 'No se pudo consultar el saldo de todos los productos elegidos.' : null);

	const retryStock = useCallback(() => {
		if (firstPageError) setRetry((value) => value + 1);
		else setPagedLookup((previous) => ({ ...previous, failedFor: null }));
	}, [firstPageError]);

	/** `null`: la ubicación no tiene el producto; `undefined`: saldo desconocido. */
	const totalsFor = useCallback(
		(productId: number | ''): IInventoryStockRow | null | undefined => {
			if (productId === '') return null;
			if (unresolvedIds.has(productId)) return undefined;
			return stockRows.find((row) => row.product.id === productId) ?? null;
		},
		[stockRows, unresolvedIds],
	);

	/*
	 * El producto de la URL se valida por elegibilidad —de la filial y no
	 * serializado, la misma regla con que el backend acepta `items.*.product_id`—
	 * y no por su saldo: el acceso directo sirve justamente para registrar
	 * unidades encontradas de un producto en cero. Si no es elegible se
	 * descarta; si la consulta falla, se conserva y el backend lo valida al
	 * enviar, en su línea.
	 */
	const itemsRef = useRef(values.items);
	itemsRef.current = values.items;
	const preselectedProductId = initialSelection.productId;
	useEffect(() => {
		if (preselectedProductId === '' || subsidiaryId === null) return undefined;
		const controller = new AbortController();
		getInventoryAdjustableProduct(subsidiaryId, preselectedProductId, controller.signal).then(
			(product) => {
				if (controller.signal.aborted) return;
				if (product) {
					rememberProducts([product]);
					return;
				}
				// Sólo si la línea todavía lo tiene: el usuario pudo cambiarlo.
				const [line, ...rest] = itemsRef.current;
				if (line?.productId !== preselectedProductId) return;
				void setFieldValue('items', [{ ...line, productId: '' }, ...rest]);
			},
			// Incierto (red, permiso): el producto queda y lo valida el envío.
			() => undefined,
		);
		return () => controller.abort();
	}, [preselectedProductId, subsidiaryId, rememberProducts, setFieldValue]);

	// Un rechazo definitivo describe el lote que se envió: al editar ubicación
	// o líneas deja de ser cierto. Uno reintentable congela el formulario, así
	// que nunca llega a limpiarse por esta vía.
	const { error: writeError, canRetry, clearError } = idempotentWrite;
	useEffect(() => {
		if (writeError && !canRetry) clearError();
		// Sólo ante cambios del lote, no cuando aparece el error.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [values.location, values.items]);

	const setItem = useCallback(
		(index: number, patch: Partial<IAjusteItemDraft>) => {
			void setFieldValue(
				'items',
				values.items.map((item, position) => {
					return position === index ? { ...item, ...patch } : item;
				}),
			);
		},
		[setFieldValue, values.items],
	);

	const addItem = useCallback(() => {
		void setFieldValue('items', [...values.items, emptyAjusteItem()]);
	}, [setFieldValue, values.items]);

	const removeItem = useCallback(
		(index: number) => {
			const next = values.items.filter((_, position) => position !== index);
			void setFieldValue('items', next.length ? next : [emptyAjusteItem()]);
		},
		[setFieldValue, values.items],
	);

	/**
	 * Cambiar de ubicación invalida las líneas: el saldo que muestran era de la otra.
	 *
	 * Un único `setValues` para que la validación vea la ubicación nueva: con
	 * `setFieldValue` + `setFieldTouched` cada llamada valida el estado anterior.
	 */
	const setLocation = useCallback(
		(token: string) => {
			void setValues(
				{
					...values,
					location: token,
					items: [emptyAjusteItem()],
				},
				true,
			);
			void setTouched({ ...touched, location: true }, false);
			setItemsChecked(false);
		},
		[setValues, setTouched, values, touched],
	);

	/** Línea que no alcanzó en el último `409 INSUFFICIENT_LOCATION_STOCK`. */
	const shortage = useMemo(
		() => shortageLineFrom(writeError, values.items),
		[writeError, values.items],
	);

	/*
	 * Errores de línea del último 422 (`items.N.campo`) y la línea del faltante
	 * del 409. Se derivan del error de escritura, así que desaparecen con él al
	 * editar la ubicación o las líneas.
	 */
	const serverLineErrors = useMemo(() => {
		const lines = ajusteLineErrorsFrom(writeError?.fieldErrors ?? null);
		if (!shortage) return lines;
		return {
			...lines,
			[shortage.index]: {
				...lines[shortage.index],
				quantityDelta: `Disponible: ${shortage.available}`,
			},
		};
	}, [writeError, shortage]);
	const serverLineErrorCount = Object.keys(serverLineErrors).length;

	/**
	 * Formik guarda los errores de un arreglo como `FormikErrors<T>[]` o como la
	 * cadena del `test` de nivel arreglo; sólo el primero trae mensajes por línea.
	 *
	 * Los de Yup se esperan al primer intento de avanzar o enviar: cambiar la
	 * ubicación valida el formulario entero y marcaría en rojo líneas que nadie
	 * editó aún. Los del servidor existen sólo tras un envío y valen siempre;
	 * uno de Yup sobre el mismo campo tiene prioridad porque describe el valor
	 * actual.
	 */

	const errorFor = useCallback(
		(index: number, field: keyof IAjusteItemDraft): string | undefined => {
			const serverMessage = serverLineErrors[index]?.[field];
			if (formik.submitCount === 0 && !itemsChecked) return serverMessage;
			if (!Array.isArray(formik.errors.items)) return serverMessage;
			const lineErrors = formik.errors.items[index];
			if (!lineErrors || typeof lineErrors === 'string') return serverMessage;
			const message = (lineErrors as Record<string, unknown>)[field];
			return typeof message === 'string' ? message : serverMessage;
		},
		[formik.errors.items, formik.submitCount, itemsChecked, serverLineErrors],
	);

	/** Marca como tocados sólo los campos del paso validado. */
	const validateStep = useCallback(
		async (key: TAjusteStep): Promise<string | undefined> => {
			const errors = await validateForm();
			if (key === 'location') {
				void setFieldTouched('location', true, false);
				return errors.location;
			}
			if (key === 'items') {
				setItemsChecked(true);
				void setFieldTouched('items', true, false);
				if (!errors.items) return undefined;
				return typeof errors.items === 'string'
					? errors.items
					: 'Revisa las líneas marcadas antes de continuar.';
			}
			void setFieldTouched('reason', true, false);
			void setFieldTouched('notes', true, false);
			return errors.reason ?? errors.notes;
		},
		[validateForm, setFieldTouched],
	);

	// Con la ubicación ya elegida desde la URL, el asistente abre en «Productos».
	const wizard = useStepWizard(AJUSTE_STEPS, validateStep, initialSelection.location ? 1 : 0);
	const { restartAt, finish } = wizard;
	showItemsRef.current = () => restartAt(AJUSTE_STEPS.indexOf('items'));

	const { submitForm } = formik;
	const submit = useCallback(() => finish(submitForm), [finish, submitForm]);

	const clearResult = useCallback(() => {
		setResult(null);
		restartAt(0);
	}, [restartAt]);

	const locationOptions = useMemo(
		() => [
			{ value: locationToken(null), label: 'Sin ubicación' },
			...warehouses.map((warehouse) => ({
				value: locationToken(warehouse.id),
				label: warehouse.name,
			})),
		],
		[warehouses],
	);

	return {
		formik,
		locationOptions,
		products,
		productSearch,
		stockRows,
		loadingStock,
		stockError,
		retryStock,
		hasLocation,
		totalsFor,
		errorFor,
		serverLineErrorCount,
		shortage,
		setLocation,
		setItem,
		addItem,
		removeItem,
		idempotentWrite,
		result,
		clearResult,
		wizard,
		submit,
	};
}
