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
	getInventoryAdjustableProducts,
	getInventoryStockAvailability,
	getInventoryWarehouses,
} from '@/services/procurement/inventoryStock.service';
import type { IInventoryStockAvailability } from '@/services/procurement/inventoryStock.service';
import {
	locationStockParams,
	locationToken,
	warehouseIdFromToken,
} from '@/utils/inventoryLocation.util';
import {
	AjusteSchema,
	emptyAjusteItem,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/adjustment.types';
import type {
	IAjusteFormValues,
	IAjusteItemDraft,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/adjustment.types';
import useStepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useStepWizard';
import {
	AJUSTE_STEPS,
	NO_PRESELECTION,
	resolvePreselectedLocation,
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
	IInventoryStockRow,
	IProcurementProduct,
} from '@/interface/procurement.interface';

export type TProductNames = Record<number, { name: string; sku: string }>;

export interface IAjusteResult {
	adjustment: IInventoryAdjustment;
	products: TProductNames;
	locationLabel: string;
	/** Disponible de la sucursal frente a reservas, después del ajuste. */
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

	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	/**
	 * Los productos elegibles salen del **catálogo**, no del stock vigente de la
	 * ubicación: un conteo que encuentra unidades de un producto que quedó en
	 * cero —o que nunca estuvo en esa bodega— tiene que poder nombrarlo. El
	 * stock sólo informa el saldo y valida los egresos.
	 */
	const products = useMemo<IProcurementProduct[]>(
		() => getInventoryAdjustableProducts(subsidiaryId),
		[subsidiaryId],
	);
	// Preselección de la URL: se resuelve una vez, al montar. Es el valor
	// inicial del formulario, no un filtro que lo siga.
	const [initialSelection] = useState(() => {
		const location = resolvePreselectedLocation(preselection.location, warehouses);
		const productId: number | '' =
			location !== null &&
			preselection.productId !== null &&
			products.some((product) => product.id === preselection.productId)
				? preselection.productId
				: '';
		return { location: location ?? '', productId };
	});

	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo registrar el ajuste.',
		renewKeyOnDefinitiveError: true,
	});

	const stockRowsRef = useRef<IInventoryStockRow[]>([]);
	// `onSubmit` no puede depender del catálogo por cierre sin volver a crear el
	// formulario en cada render: la ref le da el valor vigente al escribir.
	const productsRef = useRef<IProcurementProduct[]>([]);
	productsRef.current = products;

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

			const adjustment = await idempotentWrite.submit((headers) =>
				dispatch(
					createInventoryAdjustmentThunk({
						branchId,
						payload,
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			);
			if (!adjustment) return;

			// El disponible se lee **después** de aplicar: es el estado que la
			// pantalla tiene que mostrar, faltante incluido.
			const availability = [...new Set(adjustment.items.map((item) => item.product_id))].map(
				(productId) => getInventoryStockAvailability(branchId, productId),
			);
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

	const request = useMemo(
		() => ({
			branchId,
			ownerContext: `ajuste:${context}:${session}`,
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

	const loadingStock = loadingFirstPage || searchingPages;
	const stockError =
		firstPageError ??
		(lookupFailed ? 'No se pudo consultar el saldo de todos los productos elegidos.' : null);

	/** `null`: la ubicación no tiene el producto; `undefined`: saldo desconocido. */
	const totalsFor = useCallback(
		(productId: number | ''): IInventoryStockRow | null | undefined => {
			if (productId === '') return null;
			if (unresolvedIds.has(productId)) return undefined;
			return stockRows.find((row) => row.product.id === productId) ?? null;
		},
		[stockRows, unresolvedIds],
	);

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

	/**
	 * Formik guarda los errores de un arreglo como `FormikErrors<T>[]` o como la
	 * cadena del `test` de nivel arreglo; sólo el primero trae mensajes por línea.
	 *
	 * Se esperan al primer intento de avanzar o enviar: cambiar la ubicación
	 * valida el formulario entero y marcaría en rojo líneas que nadie editó aún.
	 */
	const errorFor = useCallback(
		(index: number, field: keyof IAjusteItemDraft): string | undefined => {
			if (formik.submitCount === 0 && !itemsChecked) return undefined;
			if (!Array.isArray(formik.errors.items)) return undefined;
			const lineErrors = formik.errors.items[index];
			if (!lineErrors || typeof lineErrors === 'string') return undefined;
			const message = (lineErrors as Record<string, unknown>)[field];
			return typeof message === 'string' ? message : undefined;
		},
		[formik.errors.items, formik.submitCount, itemsChecked],
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
		stockRows,
		loadingStock,
		stockError,
		hasLocation,
		totalsFor,
		errorFor,
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
