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
} from '@/pages/inventario/abastecimiento/AjustesTraslados/ajuste.types';
import type {
	IAjusteFormValues,
	IAjusteItemDraft,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/ajuste.types';
import useStepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useStepWizard';
import {
	AJUSTE_STEPS,
	type TAjusteStep,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';
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
 * Lógica del ajuste por conteo (card 08, sección 11).
 *
 * El ajuste corrige el saldo de la ubicación elegida: no se enlaza a una
 * recepción ni atribuye egresos a una compra. El servicio consume lo más
 * antiguo primero (FIFO), que es lo que el usuario espera al «quitar de la
 * ubicación».
 */
export default function useAjusteInventario(
	branchId: number,
	context: string,
	subsidiaryId: number | null = null,
) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [result, setResult] = useState<IAjusteResult | null>(null);
	const [retry, setRetry] = useState(0);
	// Las líneas muestran sus errores tras intentar avanzar del paso de
	// productos, no sólo tras un envío: el asistente valida antes de confirmar.
	const [itemsChecked, setItemsChecked] = useState(false);

	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	/**
	 * Los productos elegibles salen del **catálogo**, no del stock vigente de la
	 * ubicación: un conteo que encuentra unidades de un producto que quedó en
	 * cero —o que nunca estuvo en esa bodega— tiene que poder nombrarlo. El
	 * stock se sigue consultando, pero para informar el saldo y validar los
	 * egresos, no para decidir qué se puede corregir.
	 */
	const products = useMemo<IProcurementProduct[]>(
		() => getInventoryAdjustableProducts(subsidiaryId),
		[subsidiaryId],
	);
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
			location: '',
			reason: '',
			notes: '',
			items: [emptyAjusteItem()],
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
	 * Un único `setValues` valida con los valores nuevos. Encadenar
	 * `setFieldValue` + `setFieldTouched` hacía que cada llamada validara con el
	 * estado anterior, y la ubicación recién elegida quedaba en rojo como vacía.
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
	 * Mensaje de Yup para un campo de una línea. Formik guarda los errores de un
	 * arreglo como `FormikErrors<T>[]` o como una cadena única (la del `test` de
	 * nivel arreglo); sólo el primer caso tiene mensajes por línea que mostrar
	 * junto a su control.
	 *
	 * Sólo se muestran tras un intento de envío: cambiar la ubicación marca ese
	 * campo como tocado y Formik valida el formulario entero, lo que llenaba de
	 * errores las líneas en blanco que el usuario todavía no editó.
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

	/** Valida sólo los campos de un paso y marca como tocados sólo esos. */
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

	const wizard = useStepWizard(AJUSTE_STEPS, validateStep);
	const { restartAt, finish } = wizard;

	const { submitForm } = formik;
	const submit = useCallback(() => finish(submitForm), [finish, submitForm]);

	/**
	 * Cierra el resultado y empieza otro movimiento desde el primer paso. El
	 * resultado reemplaza al asistente mientras está visible: al confirmar no se
	 * vuelve a la selección de productos. La ubicación se conserva.
	 */
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
