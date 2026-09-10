import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
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
	listInventoryOrigins,
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
	optionalId,
} from '@/pages/inventario/abastecimiento/AjustesInventario/types';
import type {
	IAjusteFormValues,
	IAjusteItemDraft,
} from '@/pages/inventario/abastecimiento/AjustesInventario/types';
import type {
	IInventoryAdjustment,
	IInventoryAdjustmentPayload,
	IInventoryStockOriginRow,
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
 * Lógica del ajuste por conteo (card 08, sección 11).
 *
 * Las procedencias se piden **por producto elegido**, con el mismo
 * `GET B/inventory-stock/{product}/origins` del contrato, y no por un thunk:
 * el slice modela una única consulta de procedencias con `ownerContext` —
 * pensada para la fila expandida de `StockPorUbicacion` —, y un formulario con
 * varias líneas necesita varias a la vez. La llamada directa queda detrás del
 * mismo flag que los thunks para no escaparse de la puerta de mocks.
 */
export default function useAjusteInventario(branchId: number, context: string) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [result, setResult] = useState<IAjusteResult | null>(null);
	const [retry, setRetry] = useState(0);
	const [originsByProduct, setOriginsByProduct] = useState<
		Record<number, IInventoryStockOriginRow[]>
	>({});

	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	/**
	 * Los productos elegibles salen del **catálogo**, no del stock vigente de la
	 * ubicación: un conteo que encuentra unidades de un producto que quedó en
	 * cero —o que nunca estuvo en esa bodega— tiene que poder nombrarlo. El
	 * stock se sigue consultando, pero para informar el saldo y validar los
	 * egresos, no para decidir qué se puede corregir.
	 */
	const products = useMemo<IProcurementProduct[]>(() => getInventoryAdjustableProducts(), []);
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo registrar el ajuste.',
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
			location: '',
			reason: '',
			notes: '',
			relatedStockReceiptId: '',
			items: [emptyAjusteItem()],
		},
		validationSchema: AjusteSchema,
		onSubmit: async (formValues, helpers) => {
			const payload: IInventoryAdjustmentPayload = {
				warehouse_id: warehouseIdFromToken(formValues.location),
				reason: formValues.reason.trim(),
				notes: formValues.notes.trim() || null,
				related_stock_receipt_id: optionalId(formValues.relatedStockReceiptId),
				items: formValues.items.map((item) => ({
					product_id: Number(item.productId),
					quantity_delta: Number(item.quantityDelta),
					condition: item.condition,
					origin_id: optionalId(item.originId),
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
			toast.success(`Ajuste aplicado en ${locationLabel}.`);
			helpers.resetForm({
				values: {
					location: formValues.location,
					reason: '',
					notes: '',
					relatedStockReceiptId: '',
					items: [emptyAjusteItem()],
				},
			});
			setOriginsByProduct({});
			setRetry((value) => value + 1);
		},
	});

	const { values, setFieldValue, setFieldTouched } = formik;

	/* Stock vigente en la ubicación ajustada: alimenta el selector de producto. */
	const request = useMemo(
		() => ({
			branchId,
			ownerContext: `ajuste:${context}:${session}`,
			params: values.location
				? { ...locationStockParams(values.location), page: 1, per_page: 100 }
				: {},
		}),
		[branchId, context, session, values.location],
	);
	const queryKey = inventoryStockQueryKey(request);
	const isCurrent = raw.ownerContext === queryKey;
	const stockResponse = isCurrent ? raw.response : null;
	const stockError = isCurrent ? raw.error : null;
	const hasLocation = Boolean(values.location);
	const loadingStock = hasLocation && (!isCurrent || raw.loading);

	useEffect(() => {
		if (!hasLocation) return undefined;
		const pending = dispatch(fetchInventoryStock(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry, hasLocation]);

	const stockRows: IInventoryStockRow[] = useMemo(
		() => stockResponse?.data ?? [],
		[stockResponse],
	);
	stockRowsRef.current = stockRows;

	/* Procedencias de cada producto elegido, para atribuir egresos. */
	const chosenProductIds = useMemo(
		() =>
			[
				...new Set(
					values.items
						.map((item) => item.productId)
						.filter((productId): productId is number => productId !== ''),
				),
			].sort((a, b) => a - b),
		[values.items],
	);
	const locationKey = values.location;

	useEffect(() => {
		if (!INVENTORY_STOCK_USE_MOCKS || !locationKey || chosenProductIds.length === 0)
			return undefined;
		const controller = new AbortController();
		const missing = chosenProductIds.filter((productId) => !(productId in originsByProduct));
		if (missing.length === 0) return undefined;

		void Promise.all(
			missing.map(async (productId) => {
				try {
					const response = await listInventoryOrigins(
						branchId,
						productId,
						{ ...locationStockParams(locationKey), page: 1, per_page: 100 },
						controller.signal,
					);
					return [productId, response.data] as const;
				} catch {
					// Una procedencia que no se pudo leer deja la línea en FIFO
					// automático, que es un ajuste válido: no bloquea el formulario.
					return [productId, [] as IInventoryStockOriginRow[]] as const;
				}
			}),
		).then((entries) => {
			if (controller.signal.aborted) return;
			const loaded: Record<number, IInventoryStockOriginRow[]> = {};
			entries.forEach(([productId, origins]) => {
				loaded[productId] = origins;
			});
			setOriginsByProduct((current) => ({ ...current, ...loaded }));
		});

		return () => {
			controller.abort();
		};
	}, [branchId, locationKey, chosenProductIds, originsByProduct]);

	/**
	 * Recepciones enlazables: las que respaldan alguna procedencia de los
	 * productos ya elegidos. Enlazar a una recepción que no puso stock acá
	 * produciría un ajuste imposible de auditar (422 en el servicio).
	 */
	const receiptOptions = useMemo(() => {
		const ids = new Set<number>();
		Object.values(originsByProduct).forEach((origins) =>
			origins.forEach((origin) => {
				if (origin.stock_receipt_id !== null) ids.add(origin.stock_receipt_id);
			}),
		);
		return [...ids].sort((a, b) => a - b);
	}, [originsByProduct]);

	/** Procedencias elegibles para una línea, filtradas por la recepción enlazada. */
	const originsFor = useCallback(
		(productId: number | ''): IInventoryStockOriginRow[] => {
			if (productId === '') return [];
			const origins = originsByProduct[productId] ?? [];
			if (values.relatedStockReceiptId === '') return origins;
			return origins.filter(
				(origin) => origin.stock_receipt_id === values.relatedStockReceiptId,
			);
		},
		[originsByProduct, values.relatedStockReceiptId],
	);

	const totalsFor = useCallback(
		(productId: number | ''): IInventoryStockRow | null =>
			productId === ''
				? null
				: (stockRows.find((row) => row.product.id === productId) ?? null),
		[stockRows],
	);

	const setItem = useCallback(
		(index: number, patch: Partial<IAjusteItemDraft>) => {
			void setFieldValue(
				'items',
				values.items.map((item, position) => {
					if (position !== index) return item;
					const next = { ...item, ...patch };
					// Un ingreso no admite origen: cambiar el signo lo descarta en
					// vez de dejar un valor que el servicio rechazaría.
					if (Number(next.quantityDelta) > 0) next.originId = '';
					return next;
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

	/** Cambiar de ubicación invalida líneas, procedencias y recepción enlazada. */
	const setLocation = useCallback(
		(token: string) => {
			void setFieldValue('location', token);
			void setFieldTouched('location', true);
			void setFieldValue('items', [emptyAjusteItem()]);
			void setFieldValue('relatedStockReceiptId', '');
			setOriginsByProduct({});
		},
		[setFieldValue, setFieldTouched],
	);

	const setRelatedReceipt = useCallback(
		(value: number | '') => {
			void setFieldValue('relatedStockReceiptId', value);
			// Las procedencias elegibles cambian con la recepción: un origen de
			// otra recepción dejaría de ser válido y hay que volver a elegirlo.
			void setFieldValue(
				'items',
				values.items.map((item) => ({ ...item, originId: '' as number | '' })),
			);
		},
		[setFieldValue, values.items],
	);

	/**
	 * Mensaje de Yup para un campo de una línea. Formik guarda los errores de un
	 * arreglo como `FormikErrors<T>[]` o como una cadena única (la del `test` de
	 * nivel arreglo); sólo el primer caso tiene mensajes por línea que mostrar
	 * junto a su control.
	 */
	const errorFor = useCallback(
		(index: number, field: keyof IAjusteItemDraft): string | undefined => {
			if (!Array.isArray(formik.errors.items)) return undefined;
			const lineErrors = formik.errors.items[index];
			if (!lineErrors || typeof lineErrors === 'string') return undefined;
			const message = (lineErrors as Record<string, unknown>)[field];
			return typeof message === 'string' ? message : undefined;
		},
		[formik.errors.items],
	);

	const clearResult = useCallback(() => setResult(null), []);
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
		receiptOptions,
		originsFor,
		totalsFor,
		errorFor,
		setLocation,
		setRelatedReceipt,
		setItem,
		addItem,
		removeItem,
		idempotentWrite,
		result,
		clearResult,
	};
}
