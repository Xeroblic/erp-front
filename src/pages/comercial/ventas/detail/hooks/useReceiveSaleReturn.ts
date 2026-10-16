import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik, type FormikProps } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { fetchSaleReturn, receiveSaleReturn } from '@/services/salesService';
import listBranchWarehouses from '@/services/procurement/branchWarehouses.service';
import type { IConfirmSaleReturnRequest, ISaleReturn } from '@/interface/sales.interface';
import type { IStockReceiptWarehouse } from '@/interface/procurement.interface';
import {
	getProcurementErrorMessage,
	type IProcurementResolvedError,
} from '@/utils/procurementErrors.util';
import { buildReturnReceiptSchema, type IReturnReceiptValues } from '../types';
import {
	buildReturnReceiptValues,
	describeReturnReceipt,
	groupReturnFieldErrors,
	toConfirmReturnRequest,
	toOfferedWarehouseKeys,
} from '../utils/saleReturnReceipt';

export const RETURN_ALREADY_RECEIVED_CODE = 'RETURN_ALREADY_RECEIVED';

/** El 403 trae el cuerpo genérico: se dice qué sucursal puede faltar y que reintentar no sirve. */
export const RECEIVE_RETURN_FORBIDDEN_MESSAGE =
	'No tienes acceso a una de las sucursales que toca esta recepción: la de cada ítem, la de cada serie o la de cada bodega elegida. Pide a alguien con acceso a esas sucursales que la reciba; reintentar no cambia el resultado.';

const LOAD_FALLBACK_MESSAGE = 'No se pudo cargar la devolución.';

const WAREHOUSES_FALLBACK_MESSAGE =
	'No se pudieron cargar las bodegas de la sucursal: por ahora sólo puedes recibir en «Sin ubicación» o dejar cada serie en su bodega.';

type TReturnLoadState =
	| { status: 'loading' }
	| { status: 'ready'; saleReturn: ISaleReturn }
	| { status: 'error'; message: string };

interface IUseReceiveSaleReturnArgs {
	subsidiaryId: number;
	saleId: number;
	returnId: number;
	/** La recepción quedó confirmada. */
	onReceived: () => void;
	/** Otra recepción del mismo ciclo ganó: hay que releer la venta. */
	onAlreadyReceived: () => void;
}

export interface IReceiveSaleReturn {
	load: TReturnLoadState;
	formik: FormikProps<IReturnReceiptValues>;
	/** Bodegas de cada sucursal a la que vuelve algo, activas e inactivas. */
	warehousesByBranch: ReadonlyMap<number, IStockReceiptWarehouse[]>;
	/** Falla al listar bodegas: no bloquea, deja sólo «Sin ubicación». */
	warehousesError: string | null;
	/** Por `sale_item_id`: errores `items.N…` del último rechazo. */
	itemErrors: Record<number, string[]>;
	/** Rechazo general del último intento, ya explicado para el 403. */
	errorMessage: string | null;
	isSubmitting: boolean;
	/** Sin respuesta del servidor: se reintenta con la misma clave y el formulario bloqueado. */
	canRetry: boolean;
	retry: () => Promise<void>;
	reload: () => void;
}

const toErrorMessage = (error: IProcurementResolvedError): string =>
	error.status === 403 ? RECEIVE_RETURN_FORBIDDEN_MESSAGE : error.message;

/** Sucursales distintas a las que vuelve algo, sin `null`. */
const branchIdsOf = (saleReturn: ISaleReturn): number[] =>
	Array.from(
		new Set(
			saleReturn.items
				.map((item) => item.branch_id)
				.filter((branchId): branchId is number => branchId !== null),
		),
	);

/**
 * Recepción de una devolución de la etapa 2. Lee la devolución y las bodegas de cada
 * sucursal a la que vuelve algo, arma el formulario por ítem y envía todo de una vez.
 * Una sola `Idempotency-Key` por intento: el reintento tras un timeout repite el mismo
 * cuerpo con la misma clave.
 */
export const useReceiveSaleReturn = ({
	subsidiaryId,
	saleId,
	returnId,
	onReceived,
	onAlreadyReceived,
}: IUseReceiveSaleReturnArgs): IReceiveSaleReturn => {
	const [load, setLoad] = useState<TReturnLoadState>({ status: 'loading' });
	const [warehousesByBranch, setWarehousesByBranch] = useState<
		ReadonlyMap<number, IStockReceiptWarehouse[]>
	>(() => new Map());
	const [warehousesError, setWarehousesError] = useState<string | null>(null);
	const [itemErrors, setItemErrors] = useState<Record<number, string[]>>({});
	const [generalErrors, setGeneralErrors] = useState<string[]>([]);
	const [attempt, setAttempt] = useState(0);
	const lastPayloadRef = useRef<IConfirmSaleReturnRequest | null>(null);

	const write = useIdempotentWrite({
		fallbackMessage: 'No se pudo recibir la devolución.',
		renewKeyOnDefinitiveError: true,
	});
	const { submit } = write;

	useEffect(() => {
		const controller = new AbortController();
		setLoad({ status: 'loading' });
		setWarehousesError(null);
		void (async () => {
			try {
				const saleReturn = await fetchSaleReturn(
					subsidiaryId,
					saleId,
					returnId,
					controller.signal,
				);
				const branchIds = branchIdsOf(saleReturn);
				const results = await Promise.allSettled(
					branchIds.map((branchId) => listBranchWarehouses(branchId, controller.signal)),
				);
				if (controller.signal.aborted) return;
				const byBranch = new Map<number, IStockReceiptWarehouse[]>();
				results.forEach((result, index) => {
					if (result.status === 'fulfilled') byBranch.set(branchIds[index], result.value);
				});
				setWarehousesByBranch(byBranch);
				// El listado exige `view-warehouse`, aparte del permiso de devoluciones: sin
				// él se puede recibir igual, en «Sin ubicación» o conservando la bodega.
				if (results.some((result) => result.status === 'rejected')) {
					setWarehousesError(WAREHOUSES_FALLBACK_MESSAGE);
				}
				setLoad({ status: 'ready', saleReturn });
			} catch (error: unknown) {
				if (controller.signal.aborted) return;
				setLoad({
					status: 'error',
					message: getProcurementErrorMessage(error, LOAD_FALLBACK_MESSAGE),
				});
			}
		})();
		return () => controller.abort();
	}, [subsidiaryId, saleId, returnId, attempt]);

	const saleReturn = load.status === 'ready' ? load.saleReturn : null;

	const validationSchema = useMemo(() => {
		const offered = new Map(
			Array.from(warehousesByBranch.entries()).map(([branchId, warehouses]) => [
				branchId,
				toOfferedWarehouseKeys(warehouses),
			]),
		);
		return buildReturnReceiptSchema(saleReturn?.items ?? [], offered);
	}, [saleReturn, warehousesByBranch]);

	const initialValues = useMemo(
		() => buildReturnReceiptValues(saleReturn?.items ?? []),
		[saleReturn],
	);

	const send = useCallback(
		async (payload: IConfirmSaleReturnRequest, values: IReturnReceiptValues) => {
			if (!saleReturn) return;
			lastPayloadRef.current = payload;
			setItemErrors({});
			setGeneralErrors([]);
			const response = await submit(
				(headers) => receiveSaleReturn(subsidiaryId, saleId, payload, headers),
				{
					onError: (error) => {
						if (error.code === RETURN_ALREADY_RECEIVED_CODE) {
							toast.info(error.message);
							onAlreadyReceived();
							return;
						}
						const grouped = groupReturnFieldErrors(
							error.fieldErrors,
							saleReturn,
							values,
						);
						setItemErrors(grouped.byItem);
						setGeneralErrors(grouped.general);
					},
				},
			);
			if (!response) return;
			lastPayloadRef.current = null;
			toast.success(describeReturnReceipt(response));
			onReceived();
		},
		[saleReturn, submit, subsidiaryId, saleId, onReceived, onAlreadyReceived],
	);

	const formik = useFormik<IReturnReceiptValues>({
		initialValues,
		enableReinitialize: true,
		validationSchema,
		onSubmit: async (values) => {
			if (!saleReturn) return;
			await send(toConfirmReturnRequest(saleReturn, values), values);
		},
	});
	const valuesRef = useRef(formik.values);
	valuesRef.current = formik.values;

	const retry = useCallback(async () => {
		if (lastPayloadRef.current) await send(lastPayloadRef.current, valuesRef.current);
	}, [send]);

	const reload = useCallback(() => setAttempt((value) => value + 1), []);

	// El 422 por ítem ya se marca en su ítem: aquí va sólo lo que no nombra un ítem.
	let errorMessage: string | null = null;
	if (write.error && write.error.code !== RETURN_ALREADY_RECEIVED_CODE) {
		errorMessage = [toErrorMessage(write.error), ...generalErrors].join(' ');
	}

	return {
		load,
		formik,
		warehousesByBranch,
		warehousesError,
		itemErrors,
		errorMessage,
		isSubmitting: write.isSubmitting,
		canRetry: write.canRetry,
		retry,
		reload,
	};
};
