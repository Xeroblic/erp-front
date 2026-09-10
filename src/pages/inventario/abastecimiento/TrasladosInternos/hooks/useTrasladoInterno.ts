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
import { getInventoryWarehouses } from '@/services/procurement/inventoryStock.service';
import {
	locationStockParams,
	locationToken,
	warehouseIdFromToken,
} from '@/utils/inventoryLocation.util';
import {
	emptyTrasladoItem,
	TrasladoSchema,
} from '@/pages/inventario/abastecimiento/TrasladosInternos/types';
import type {
	ITrasladoFormValues,
	ITrasladoItemDraft,
} from '@/pages/inventario/abastecimiento/TrasladosInternos/types';
import type {
	IInventoryStockRow,
	IWarehouseStockMovement,
	IWarehouseStockMovementPayload,
	TStockCondition,
} from '@/interface/procurement.interface';

/** Nombre y SKU de lo trasladado, para que el resultado siga legible tras limpiar el formulario. */
export type TProductNames = Record<number, { name: string; sku: string }>;

export interface ITrasladoResult {
	movement: IWarehouseStockMovement;
	products: TProductNames;
	fromLabel: string;
	toLabel: string;
}

/**
 * Lógica del traslado interno (card 08, sección 9).
 *
 * Lo monta una sesión con `key` de usuario/filial/sucursal, igual que
 * `StockPorUbicacion`: un cambio de contexto desmonta el formulario en vez de
 * dejar que un efecto de limpieza alcance a borrarlo.
 */
export default function useTrasladoInterno(branchId: number, context: string) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [result, setResult] = useState<ITrasladoResult | null>(null);
	const [retry, setRetry] = useState(0);

	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo registrar el traslado.',
	});

	/**
	 * El catálogo del origen viaja por ref además de por render: `onSubmit` lo
	 * necesita para congelar nombre y SKU **antes** de escribir, y leerlo del
	 * estado obligaría a declarar la consulta encima del formulario del que esa
	 * misma consulta depende.
	 */
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
		initialValues: { from: '', to: '', reason: '', items: [emptyTrasladoItem()] },
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

			setResult({ movement, products, fromLabel, toLabel });
			const units = movement.items.reduce((total, item) => total + item.quantity, 0);
			toast.success(
				`${units} ${units === 1 ? 'unidad trasladada' : 'unidades trasladadas'} de ${fromLabel} a ${toLabel}.`,
			);
			// Conserva origen y destino: quien traslada suele encadenar varias
			// líneas entre las mismas dos ubicaciones. Sólo se limpia lo escrito.
			helpers.resetForm({
				values: {
					from: formValues.from,
					to: formValues.to,
					reason: '',
					items: [emptyTrasladoItem()],
				},
			});
			setRetry((value) => value + 1);
		},
	});

	const { values, setFieldValue, setFieldTouched } = formik;

	/* Stock vigente en el ORIGEN: alimenta el selector de producto y el saldo por línea. */
	const request = useMemo(
		() => ({
			branchId,
			ownerContext: `traslado:${context}:${session}`,
			params: values.from
				? { ...locationStockParams(values.from), page: 1, per_page: 100 }
				: {},
		}),
		[branchId, context, session, values.from],
	);
	const queryKey = inventoryStockQueryKey(request);
	const isCurrent = raw.ownerContext === queryKey;
	const originResponse = isCurrent ? raw.response : null;
	const originError = isCurrent ? raw.error : null;
	const loadingOrigin = Boolean(values.from) && (!isCurrent || raw.loading);

	const hasOrigin = Boolean(values.from);
	useEffect(() => {
		if (!hasOrigin) return undefined;
		const pending = dispatch(fetchInventoryStock(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry, hasOrigin]);

	const originRows: IInventoryStockRow[] = useMemo(
		() => originResponse?.data ?? [],
		[originResponse],
	);
	originRowsRef.current = originRows;

	/** Saldo de la condición elegida en el origen, para el aviso por línea. */
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
	 * Cambiar el origen invalida las líneas: los productos y saldos del origen
	 * anterior no existen necesariamente en el nuevo, y conservarlas produciría
	 * un 409 al confirmar en vez de un formulario coherente.
	 */
	const setOrigin = useCallback(
		(token: string) => {
			void setFieldValue('from', token);
			void setFieldTouched('from', true);
			void setFieldValue('items', [emptyTrasladoItem()]);
		},
		[setFieldValue, setFieldTouched],
	);

	/**
	 * Las unidades cuentan **una vez** aunque el traslado tenga dos efectos: es
	 * el criterio de aceptación de la card (5 se leen como 5, nunca como 10).
	 */
	const totalUnits = useMemo(
		() =>
			values.items.reduce((total, item) => {
				const quantity = Number(item.quantity);
				return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
			}, 0),
		[values.items],
	);

	/** Destinos elegibles: sólo ubicaciones de esta sucursal, nunca el origen. */
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

	/**
	 * Mensaje de Yup para un campo de una línea. Formik guarda los errores de un
	 * arreglo como `FormikErrors<T>[]` o como una cadena única (la del `test` de
	 * nivel arreglo); sólo el primer caso tiene mensajes por línea que mostrar
	 * junto a su control.
	 */
	const errorFor = useCallback(
		(index: number, field: keyof ITrasladoItemDraft): string | undefined => {
			if (!Array.isArray(formik.errors.items)) return undefined;
			const lineErrors = formik.errors.items[index];
			if (!lineErrors || typeof lineErrors === 'string') return undefined;
			const message = (lineErrors as Record<string, unknown>)[field];
			return typeof message === 'string' ? message : undefined;
		},
		[formik.errors.items],
	);

	const clearResult = useCallback(() => setResult(null), []);

	return {
		formik,
		warehouses,
		destinationOptions,
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
	};
}
