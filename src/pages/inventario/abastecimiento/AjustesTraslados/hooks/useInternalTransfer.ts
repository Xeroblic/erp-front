import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	createWarehouseStockMovementThunk,
	fetchInventoryStock,
	inventoryStockQueryKey,
} from '@/store/slices/procurement/inventoryStockSlice';
import {
	getInventoryWarehouses,
	listInventoryStock,
} from '@/services/procurement/inventoryStock.service';
import {
	locationStockParams,
	locationToken,
	warehouseIdFromToken,
} from '@/utils/inventoryLocation.util';
import {
	emptyTrasladoItem,
	TrasladoSchema,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/transfer.types';
import type {
	ITrasladoFormValues,
	ITrasladoItemDraft,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/transfer.types';
import useStepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useStepWizard';
import {
	NO_PRESELECTION,
	resolvePreselectedLocation,
	TRASLADO_STEPS,
	type IAjustesTrasladosPreselection,
	type TTrasladoStep,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';
import {
	findLocationStockRows,
	LOCATION_STOCK_PAGE_SIZE,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/locationStockLookup';
import type {
	IInventoryStockRow,
	IWarehouseStockMovement,
	IWarehouseStockMovementPayload,
	TStockCondition,
} from '@/interface/procurement.interface';

/** Nombre y SKU de lo trasladado, para que el resultado siga legible tras limpiar el formulario. */
export type TProductNames = Record<number, { name: string; sku: string }>;

interface IPreselectedProductLookup {
	from: string;
	productId: number;
	lastPage: number;
}

export interface ITrasladoResult {
	movement: IWarehouseStockMovement;
	products: TProductNames;
	fromLabel: string;
	toLabel: string;
}

/**
 * Lo monta una sesión con `key` de usuario/filial/sucursal: un cambio de
 * contexto desmonta el formulario en vez de dejar que un efecto de limpieza
 * alcance a borrarlo.
 */
export default function useInternalTransfer(
	branchId: number,
	context: string,
	preselection: IAjustesTrasladosPreselection = NO_PRESELECTION,
) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [result, setResult] = useState<ITrasladoResult | null>(null);
	const [retry, setRetry] = useState(0);
	// Los errores de línea se muestran desde el primer intento de avanzar del
	// paso de productos, no sólo tras un envío.
	const [itemsChecked, setItemsChecked] = useState(false);

	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	const [initialOrigin] = useState(
		() => resolvePreselectedLocation(preselection.location, warehouses) ?? '',
	);
	/**
	 * Producto de la URL, a la espera del stock del origen: sólo se elige si el
	 * origen lo tiene. Se consume una vez y cambiar el origen antes lo descarta.
	 */
	const pendingProductRef = useRef<number | null>(initialOrigin ? preselection.productId : null);
	// Si no viene en la primera página se busca en las siguientes y su fila se
	// suma a las del origen: sin ella tampoco se ofrecería en el selector.
	const lookupStartedRef = useRef(false);
	const [productLookup, setProductLookup] = useState<IPreselectedProductLookup | null>(null);
	const [resolvedRow, setResolvedRow] = useState<{
		from: string;
		row: IInventoryStockRow;
	} | null>(null);

	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo registrar el traslado.',
		renewKeyOnDefinitiveError: true,
	});

	// `onSubmit` congela nombre y SKU antes de escribir; la consulta del origen
	// depende del formulario, así que sus filas le llegan por ref.
	const originRowsRef = useRef<IInventoryStockRow[]>([]);

	const labelFor = useCallback(
		(token: string): string => {
			if (!token) return '';
			const warehouseId = warehouseIdFromToken(token);
			if (warehouseId === null) return 'Sin ubicación';
			return warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '';
		},
		[warehouses],
	);

	const formik = useFormik<ITrasladoFormValues>({
		initialValues: { from: initialOrigin, to: '', reason: '', items: [emptyTrasladoItem()] },
		validationSchema: TrasladoSchema,
		onSubmit: async (formValues, helpers) => {
			const payload: IWarehouseStockMovementPayload = {
				from_warehouse_id: warehouseIdFromToken(formValues.from),
				to_warehouse_id: warehouseIdFromToken(formValues.to),
				reason: formValues.reason.trim(),
				items: formValues.items.map((item) => ({
					product_id: Number(item.productId),
					quantity: Number(item.quantity),
					condition: item.condition,
				})),
			};
			const products: TProductNames = {};
			formValues.items.forEach((item) => {
				const row = originRowsRef.current.find(
					(candidate) => candidate.product.id === item.productId,
				);
				if (row)
					products[row.product.id] = { name: row.product.name, sku: row.product.sku };
			});
			const fromLabel = labelFor(formValues.from);
			const toLabel = labelFor(formValues.to);

			const movement = await idempotentWrite.submit((headers) =>
				dispatch(
					createWarehouseStockMovementThunk({
						branchId,
						payload,
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			);
			if (!movement) return;

			// Su saldo quedó viejo tras el traslado; el origen se vuelve a pedir.
			setResolvedRow(null);
			setResult({ movement, products, fromLabel, toLabel });
			const units = movement.items.reduce((total, item) => total + item.quantity, 0);
			toast.success(
				`${units} ${units === 1 ? 'unidad trasladada' : 'unidades trasladadas'} de ${fromLabel} a ${toLabel}.`,
			);
			// Origen y destino se conservan: suelen encadenarse varios traslados
			// entre las mismas dos ubicaciones.
			helpers.resetForm({
				values: {
					from: formValues.from,
					to: formValues.to,
					reason: '',
					items: [emptyTrasladoItem()],
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
			ownerContext: `traslado:${context}:${session}`,
			params: values.from
				? {
						...locationStockParams(values.from),
						page: 1,
						per_page: LOCATION_STOCK_PAGE_SIZE,
					}
				: {},
		}),
		[branchId, context, session, values.from],
	);
	const queryKey = inventoryStockQueryKey(request);
	const isCurrent = raw.ownerContext === queryKey;
	const originResponse = isCurrent ? raw.response : null;
	const originError = isCurrent ? raw.error : null;
	const loadingFirstPage = Boolean(values.from) && (!isCurrent || raw.loading);
	// Mientras se busca el producto preseleccionado el selector sigue «cargando»:
	// así nadie elige otro producto que la búsqueda luego pisaría.
	const loadingOrigin = loadingFirstPage || productLookup !== null;

	const hasOrigin = Boolean(values.from);
	useEffect(() => {
		if (!hasOrigin) return undefined;
		const pending = dispatch(fetchInventoryStock(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry, hasOrigin]);

	const originRows: IInventoryStockRow[] = useMemo(() => {
		const rows = originResponse?.data ?? [];
		if (
			!resolvedRow ||
			resolvedRow.from !== values.from ||
			rows.some((row) => row.product.id === resolvedRow.row.product.id)
		)
			return rows;
		return [...rows, resolvedRow.row];
	}, [originResponse, resolvedRow, values.from]);
	originRowsRef.current = originRows;

	useEffect(() => {
		const pending = pendingProductRef.current;
		if (pending === null || loadingFirstPage || productLookup !== null) return;
		if (originRows.some((row) => row.product.id === pending)) {
			pendingProductRef.current = null;
			const [first, ...rest] = values.items;
			// Sólo sobre la línea en blanco con que abre el asistente.
			if (rest.length === 0 && first && first.productId === '')
				void setFieldValue('items', [{ ...first, productId: pending }]);
			return;
		}
		const lastPage = originResponse?.meta.last_page ?? 1;
		if (originError || lookupStartedRef.current || lastPage <= 1) {
			pendingProductRef.current = null;
			return;
		}
		lookupStartedRef.current = true;
		setProductLookup({ from: values.from, productId: pending, lastPage });
	}, [
		loadingFirstPage,
		productLookup,
		originRows,
		originResponse,
		originError,
		values.from,
		values.items,
		setFieldValue,
	]);

	useEffect(() => {
		if (!productLookup) return undefined;
		const controller = new AbortController();
		const { from, productId, lastPage } = productLookup;
		findLocationStockRows(
			listInventoryStock,
			branchId,
			from,
			[productId],
			lastPage,
			controller.signal,
		).then(
			(found) => {
				if (controller.signal.aborted) return;
				const row = found.get(productId);
				if (row) setResolvedRow({ from, row });
				setProductLookup(null);
			},
			() => {
				// Un error al buscar se trata como si el origen no lo tuviera: el
				// producto se descarta y el traslado sigue disponible.
				if (!controller.signal.aborted) setProductLookup(null);
			},
		);
		return () => controller.abort();
	}, [branchId, productLookup]);

	const balanceFor = useCallback(
		(productId: number | '', condition: TStockCondition): number | null => {
			if (productId === '') return null;
			const row = originRows.find((candidate) => candidate.product.id === productId);
			if (!row) return null;
			return condition === 'fit' ? row.fit_quantity : row.unfit_quantity;
		},
		[originRows],
	);

	const setItem = useCallback(
		(index: number, patch: Partial<ITrasladoItemDraft>) => {
			void setFieldValue(
				'items',
				values.items.map((item, position) =>
					position === index ? { ...item, ...patch } : item,
				),
			);
		},
		[setFieldValue, values.items],
	);

	const addItem = useCallback(() => {
		void setFieldValue('items', [...values.items, emptyTrasladoItem()]);
	}, [setFieldValue, values.items]);

	const removeItem = useCallback(
		(index: number) => {
			const next = values.items.filter((_, position) => position !== index);
			void setFieldValue('items', next.length ? next : [emptyTrasladoItem()]);
		},
		[setFieldValue, values.items],
	);

	/**
	 * Cambiar el origen invalida las líneas: sus productos y saldos pueden no
	 * existir en el nuevo, y conservarlas acabaría en un 409 al confirmar.
	 *
	 * Un único `setValues` para que la validación vea el origen nuevo: con
	 * `setFieldValue` + `setFieldTouched` cada llamada valida el estado anterior.
	 */
	const setOrigin = useCallback(
		(token: string) => {
			pendingProductRef.current = null;
			setProductLookup(null);
			setResolvedRow(null);
			void setValues({ ...values, from: token, items: [emptyTrasladoItem()] }, true);
			void setTouched({ ...touched, from: true }, false);
			setItemsChecked(false);
		},
		[setValues, setTouched, values, touched],
	);

	// Las unidades cuentan una vez aunque el traslado tenga dos efectos: 5 se
	// leen como 5, nunca como 10.
	const totalUnits = useMemo(
		() =>
			values.items.reduce((total, item) => {
				const quantity = Number(item.quantity);
				return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
			}, 0),
		[values.items],
	);

	const destinationOptions = useMemo(
		() =>
			[
				{ value: locationToken(null), label: 'Sin ubicación' },
				...warehouses.map((warehouse) => ({
					value: locationToken(warehouse.id),
					label: warehouse.name,
				})),
			].filter((option) => option.value !== values.from),
		[warehouses, values.from],
	);

	/** Resumen del paso «Motivo y confirmación». Sólo líneas completas. */
	const summary = useMemo(() => {
		const locationName = (token: string): string => {
			if (token === locationToken(null)) return 'Sin ubicación';
			return (
				warehouses.find((warehouse) => locationToken(warehouse.id) === token)?.name ??
				'Ubicación desconocida'
			);
		};
		const lines = values.items.flatMap((item, index) => {
			const quantity = Number(item.quantity);
			if (item.productId === '' || !Number.isInteger(quantity) || quantity <= 0) return [];
			const product = originRows.find((row) => row.product.id === item.productId)?.product;
			return [
				{
					key: `${item.productId}-${item.condition}-${index}`,
					name: product?.name ?? `Producto #${item.productId}`,
					sku: product?.sku ?? null,
					condition: item.condition,
					quantity,
				},
			];
		});
		return {
			from: values.from ? locationName(values.from) : null,
			to: values.to ? locationName(values.to) : null,
			lines,
		};
	}, [values.from, values.to, values.items, warehouses, originRows]);

	/**
	 * Formik guarda los errores de un arreglo como `FormikErrors<T>[]` o como la
	 * cadena del `test` de nivel arreglo; sólo el primero trae mensajes por línea.
	 *
	 * Se esperan al primer intento de avanzar o enviar: elegir el origen valida
	 * el formulario entero y marcaría en rojo líneas que nadie editó aún.
	 */
	const errorFor = useCallback(
		(index: number, field: keyof ITrasladoItemDraft): string | undefined => {
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
		async (key: TTrasladoStep): Promise<string | undefined> => {
			const errors = await validateForm();
			if (key === 'route') {
				void setFieldTouched('from', true, false);
				void setFieldTouched('to', true, false);
				return errors.from ?? errors.to;
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
			return errors.reason;
		},
		[validateForm, setFieldTouched],
	);

	const wizard = useStepWizard(TRASLADO_STEPS, validateStep);
	const { restartAt, finish } = wizard;

	const { submitForm } = formik;
	const submit = useCallback(() => finish(submitForm), [finish, submitForm]);

	const clearResult = useCallback(() => {
		setResult(null);
		restartAt(0);
	}, [restartAt]);

	return {
		formik,
		warehouses,
		destinationOptions,
		summary,
		originRows,
		loadingOrigin,
		originError,
		balanceFor,
		errorFor,
		setOrigin,
		setItem,
		addItem,
		removeItem,
		totalUnits,
		idempotentWrite,
		result,
		clearResult,
		wizard,
		submit,
	};
}
