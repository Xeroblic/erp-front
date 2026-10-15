import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import {
	listProductPurchaseHistory,
	listProductSuppliers,
} from '@/services/procurement/productPurchases.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import { normalizePageParams } from '@/utils/procurementPagination.util';
import {
	PROCUREMENT_PER_PAGE_DEFAULT,
	PROCUREMENT_PER_PAGE_MAX,
	type IProductPurchaseHistoryParams,
	type IProductPurchaseHistoryResponse,
	type IProductSuppliersResponse,
	type ISupplierCompact,
} from '@/interface/procurement.interface';
import {
	PURCHASE_HISTORY_FILTERS_INITIAL_VALUES,
	PurchaseHistoryFiltersSchema,
	toPurchaseHistoryFilters,
	type IPurchaseHistoryFilterValues,
} from '@/pages/inventario/Inventario/InventarioProducto/components/purchaseHistoryFilters.schema';

/**
 * Por qué no se pudieron leer las compras. Un 404 (producto de otra filial) y
 * un 403 no se reintentan: volver a pedir daría lo mismo. Sus mensajes son
 * propios porque los de Laravel para esos códigos llegan en inglés.
 */
export interface IProductPurchasesError {
	kind: 'not_found' | 'forbidden' | 'other';
	message: string;
}

export const resolveProductPurchasesError = (error: unknown): IProductPurchasesError => {
	const { status, message } = resolveProcurementError(
		error,
		'No pudimos cargar las compras de este producto.',
	);
	if (status === 404)
		return {
			kind: 'not_found',
			message: 'Este producto no pertenece a la filial activa: no hay compras que mostrar.',
		};
	if (status === 403)
		return {
			kind: 'forbidden',
			message: 'No tienes permiso para ver las compras de este producto.',
		};
	return { kind: 'other', message };
};

interface IKeyedResult<T> {
	key: string;
	response: T | null;
	error: IProductPurchasesError | null;
}

export interface IPurchasesRequestState<T> {
	response: T | null;
	error: IProductPurchasesError | null;
	loading: boolean;
	retry: () => void;
}

/**
 * Cada resultado queda asociado a la clave que lo pidió y sólo se expone
 * mientras sea la vigente: una respuesta tardía (otra página, otro filtro,
 * otro producto) nunca pisa a la actual. Al cambiar la clave se aborta la
 * petición anterior.
 */
const useKeyedRequest = <T>(
	key: string,
	load: (signal: AbortSignal) => Promise<T>,
): IPurchasesRequestState<T> => {
	const [result, setResult] = useState<IKeyedResult<T> | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		load(controller.signal).then(
			(response) => {
				if (!controller.signal.aborted) setResult({ key, response, error: null });
			},
			(error: unknown) => {
				if (controller.signal.aborted) return;
				setResult({ key, response: null, error: resolveProductPurchasesError(error) });
			},
		);
		return () => controller.abort();
	}, [key, load, attempt]);

	const current = result?.key === key ? result : null;
	// Sin el resultado anterior, el reintento vuelve a mostrar la carga.
	const retry = useCallback(() => {
		setResult(null);
		setAttempt((value) => value + 1);
	}, []);

	return useMemo(
		() => ({
			response: current?.response ?? null,
			error: current?.error ?? null,
			loading: current === null,
			retry,
		}),
		[current, retry],
	);
};

/**
 * Proveedores: de entrada se piden de a 100 (el máximo del contrato) para que
 * la lista y el filtro del historial los muestren todos de una vez en el caso
 * normal. Si el usuario elige otro tamaño en el paginador, manda el suyo.
 */
export const PRODUCT_SUPPLIERS_PER_PAGE = PROCUREMENT_PER_PAGE_MAX;

export interface IProductPurchasesOptions {
	subsidiaryId: number;
	productId: number;
}

/**
 * Compras del producto en la filial (§12): proveedores que lo vendieron, con
 * el sugerido, y el historial paginado con filtros. El orden, la sugerencia y
 * los conteos los decide el backend; aquí no se recalcula nada.
 */
const useProductPurchases = ({ subsidiaryId, productId }: IProductPurchasesOptions) => {
	const [suppliersPagination, setSuppliersPagination] = useState(() =>
		normalizePageParams({ page: 1, per_page: PRODUCT_SUPPLIERS_PER_PAGE }),
	);
	const loadSuppliers = useCallback(
		(signal: AbortSignal) =>
			listProductSuppliers(subsidiaryId, productId, suppliersPagination, signal),
		[subsidiaryId, productId, suppliersPagination],
	);
	const suppliers = useKeyedRequest<IProductSuppliersResponse>(
		`${subsidiaryId}:${productId}:suppliers:${suppliersPagination.page}:${suppliersPagination.per_page}`,
		loadSuppliers,
	);

	// Son filtros de un listado: Formik guarda los valores y Yup marca una
	// fecha inválida, que no viaja (ver `toPurchaseHistoryFilters`).
	const formik = useFormik<IPurchaseHistoryFilterValues>({
		initialValues: PURCHASE_HISTORY_FILTERS_INITIAL_VALUES,
		validationSchema: PurchaseHistoryFiltersSchema,
		onSubmit: () => undefined,
	});
	const { setFieldValue, setFieldTouched, resetForm } = formik;
	const [pagination, setPagination] = useState(() =>
		normalizePageParams({ page: 1, per_page: PROCUREMENT_PER_PAGE_DEFAULT }),
	);
	const {
		supplier_id: supplierId,
		received_from: receivedFrom,
		received_to: receivedTo,
	} = toPurchaseHistoryFilters(formik.values);
	const hasFilters =
		supplierId !== undefined || receivedFrom !== undefined || receivedTo !== undefined;
	const historyParams = useMemo(
		(): IProductPurchaseHistoryParams => ({
			supplier_id: supplierId,
			received_from: receivedFrom,
			received_to: receivedTo,
			page: pagination.page,
			per_page: pagination.per_page,
		}),
		[supplierId, receivedFrom, receivedTo, pagination],
	);
	const loadHistory = useCallback(
		(signal: AbortSignal) =>
			listProductPurchaseHistory(subsidiaryId, productId, historyParams, signal),
		[subsidiaryId, productId, historyParams],
	);
	const history = useKeyedRequest<IProductPurchaseHistoryResponse>(
		`${subsidiaryId}:${productId}:history:${JSON.stringify(historyParams)}`,
		loadHistory,
	);

	const setFilter = useCallback(
		(field: keyof IPurchaseHistoryFilterValues, value: string) => {
			setPagination((current) => ({ ...current, page: 1 }));
			void setFieldValue(field, value);
			void setFieldTouched(field, true, false);
		},
		[setFieldValue, setFieldTouched],
	);
	const clearFilters = useCallback(() => {
		setPagination((current) => ({ ...current, page: 1 }));
		resetForm();
	}, [resetForm]);
	// El paginador ya vuelve a la página 1 al cambiar el tamaño; aquí sólo se
	// acota `per_page` al máximo del contrato (un valor fuera de rango es 422).
	const paginateHistory = useCallback(
		(page: number, perPage: number) =>
			setPagination(normalizePageParams({ page, per_page: perPage })),
		[],
	);
	const paginateSuppliers = useCallback(
		(page: number, perPage: number) =>
			setSuppliersPagination(normalizePageParams({ page, per_page: perPage })),
		[],
	);

	// El filtro ofrece los proveedores que vendieron el producto, en el orden
	// del backend. Las compras sin proveedor no tienen filtro propio.
	const supplierOptions = useMemo(
		(): ISupplierCompact[] => suppliers.response?.data.map((row) => row.supplier) ?? [],
		[suppliers.response],
	);

	return {
		suppliers,
		paginateSuppliers,
		history,
		paginateHistory,
		formik,
		setFilter,
		clearFilters,
		hasFilters,
		supplierOptions,
	};
};

export default useProductPurchases;

export type TProductPurchases = ReturnType<typeof useProductPurchases>;
