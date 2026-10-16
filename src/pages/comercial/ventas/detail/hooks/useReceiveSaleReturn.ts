import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik, type FormikProps } from 'formik';
import { toast } from 'react-toastify';
import { fetchSaleReturn } from '@/services/salesService';
import listBranchWarehouses from '@/services/procurement/branchWarehouses.service';
import type { IConfirmSaleReturnReceiptResponse, ISaleReturn } from '@/interface/sales.interface';
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
import {
	RETURN_ALREADY_RECEIVED_CODE,
	isSameSaleOwner,
	type IReceiveReturnAttempt,
	type IReturnSendOptions,
	type ISaleReturnOwner,
	type TReceiveReturnSlot,
} from './useSaleReturnWrites';

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
	/** Escritura de página (`useSaleReturnWrites().receive`): conserva el intento incierto. */
	slot: TReceiveReturnSlot;
	subsidiaryId: number;
	saleId: number;
	returnId: number;
	/**
	 * La recepción quedó confirmada, o ya la había confirmado otro. Recibe la venta del
	 * intento: la respuesta puede llegar con el detalle cerrado o mostrando otra venta.
	 */
	onSettled: (owner: ISaleReturnOwner) => void;
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
	/** Intento de esta devolución sin respuesta: se reintenta igual o se descarta. */
	canRetry: boolean;
	/** Intento incierto de otra venta: bloquea recibir aquí hasta resolverlo allá o descartarlo. */
	foreignAttempt: IReceiveReturnAttempt | null;
	retry: () => Promise<void>;
	discard: () => void;
	reload: () => void;
}

type TReceiveWrite = (
	options: IReturnSendOptions,
) => Promise<IConfirmSaleReturnReceiptResponse | undefined>;

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
	slot,
	subsidiaryId,
	saleId,
	returnId,
	onSettled,
}: IUseReceiveSaleReturnArgs): IReceiveSaleReturn => {
	const [load, setLoad] = useState<TReturnLoadState>({ status: 'loading' });
	const [warehousesByBranch, setWarehousesByBranch] = useState<
		ReadonlyMap<number, IStockReceiptWarehouse[]>
	>(() => new Map());
	const [warehousesError, setWarehousesError] = useState<string | null>(null);
	const [itemErrors, setItemErrors] = useState<Record<number, string[]>>({});
	const [generalErrors, setGeneralErrors] = useState<string[]>([]);
	const [loadAttempt, setLoadAttempt] = useState(0);
	const ownAttempt =
		slot.attempt &&
		isSameSaleOwner(slot.attempt, { subsidiaryId, saleId }) &&
		slot.attempt.returnId === returnId
			? slot.attempt
			: null;
	const foreignAttempt = slot.attempt && !ownAttempt ? slot.attempt : null;
	const slotRef = useRef(slot);
	slotRef.current = slot;
	const onSettledRef = useRef(onSettled);
	onSettledRef.current = onSettled;

	// Al abrir, un rechazo definitivo de otra apertura no se arrastra; el intento
	// incierto sí, porque es lo único que permite recuperarlo.
	useEffect(() => {
		if (!slotRef.current.canRetry) slotRef.current.clearError();
	}, []);

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
	}, [subsidiaryId, saleId, returnId, loadAttempt]);

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

	// Con un intento incierto de esta devolución al abrir, el formulario vuelve tal como
	// se envió. Se fija al montar: un rechazo posterior cierra el intento y no debe
	// reinicializar lo que el usuario está corrigiendo.
	const [attemptValues] = useState(() => ownAttempt?.values ?? null);
	const initialValues = useMemo(
		() => attemptValues ?? buildReturnReceiptValues(saleReturn?.items ?? []),
		[attemptValues, saleReturn],
	);

	const handleError = useCallback(
		(error: IProcurementResolvedError, values: IReturnReceiptValues) => {
			if (!saleReturn) return;
			if (error.code === RETURN_ALREADY_RECEIVED_CODE) {
				toast.info(error.message);
				return;
			}
			const grouped = groupReturnFieldErrors(error.fieldErrors, saleReturn, values);
			setItemErrors(grouped.byItem);
			setGeneralErrors(grouped.general);
		},
		[saleReturn],
	);

	/**
	 * Corre el envío o el reintento y avisa con la venta del intento, no la de este
	 * render: la respuesta puede llegar con el detalle ya cerrado o en otra venta.
	 */
	const run = useCallback(
		async (write: TReceiveWrite, attempt: IReceiveReturnAttempt) => {
			setItemErrors({});
			setGeneralErrors([]);
			const failure: { error: IProcurementResolvedError | null } = { error: null };
			const response = await write({
				onError: (error) => {
					failure.error = error;
					handleError(error, attempt.values);
				},
			});
			if (response) {
				toast.success(describeReturnReceipt(response));
				onSettledRef.current(attempt);
			} else if (failure.error?.code === RETURN_ALREADY_RECEIVED_CODE) {
				onSettledRef.current(attempt);
			}
		},
		[handleError],
	);

	const formik = useFormik<IReturnReceiptValues>({
		initialValues,
		enableReinitialize: true,
		validationSchema,
		onSubmit: async (values) => {
			if (!saleReturn) return;
			const attempt: IReceiveReturnAttempt = {
				subsidiaryId,
				saleId,
				returnId,
				payload: toConfirmReturnRequest(saleReturn, values),
				values,
			};
			await run((options) => slotRef.current.send(attempt, options), attempt);
		},
	});

	const retry = useCallback(async () => {
		const { attempt } = slotRef.current;
		if (!attempt) return;
		await run((options) => slotRef.current.retry(options), attempt);
	}, [run]);

	const discard = useCallback(() => {
		setItemErrors({});
		setGeneralErrors([]);
		slotRef.current.discard();
	}, []);

	const reload = useCallback(() => setLoadAttempt((value) => value + 1), []);

	// El 422 por ítem ya se marca en su ítem: aquí va sólo lo que no nombra un ítem.
	let errorMessage: string | null = null;
	if (slot.error && !foreignAttempt && slot.error.code !== RETURN_ALREADY_RECEIVED_CODE) {
		errorMessage = [toErrorMessage(slot.error), ...generalErrors].join(' ');
	}

	return {
		load,
		formik,
		warehousesByBranch,
		warehousesError,
		itemErrors,
		errorMessage,
		isSubmitting: slot.isSubmitting,
		canRetry: slot.canRetry && ownAttempt !== null,
		foreignAttempt,
		retry,
		discard,
		reload,
	};
};
