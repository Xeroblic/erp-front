import { useCallback, useMemo, useRef, useState } from 'react';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { receiveSaleReturn, startSaleReturn } from '@/services/salesService';
import type {
	IConfirmSaleReturnReceiptResponse,
	IConfirmSaleReturnRequest,
	ISaleReturn,
	IStartSaleReturnRequest,
} from '@/interface/sales.interface';
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import type { IReturnReceiptValues } from '../types';

export const RETURN_ALREADY_RECEIVED_CODE = 'RETURN_ALREADY_RECEIVED';

/** Venta sobre la que se escribe: la filial de la ruta y la venta. */
export interface ISaleReturnOwner {
	subsidiaryId: number;
	saleId: number;
}

export const isSameSaleOwner = (a: ISaleReturnOwner | null, b: ISaleReturnOwner): boolean =>
	a !== null && a.subsidiaryId === b.subsidiaryId && a.saleId === b.saleId;

/** Inicio con resultado incierto: lo que viajó, para repetirlo tal cual. */
export interface IStartReturnAttempt extends ISaleReturnOwner {
	payload: IStartSaleReturnRequest;
}

/** Recepción con resultado incierto, con los valores del formulario que la armaron. */
export interface IReceiveReturnAttempt extends ISaleReturnOwner {
	returnId: number;
	payload: IConfirmSaleReturnRequest;
	values: IReturnReceiptValues;
}

export interface IReturnSendOptions {
	onError?: (error: IProcurementResolvedError) => void;
}

/** Una escritura de la devolución: estado de su clave y el intento incierto, si hay. */
export interface IReturnWriteSlot<TAttempt, TResult> {
	/** Intento sin respuesta (timeout, red, operación en curso); `null` si no hay. */
	attempt: TAttempt | null;
	isSubmitting: boolean;
	error: IProcurementResolvedError | null;
	/** `true` mientras el intento admite reintentar con la misma clave. */
	canRetry: boolean;
	/** Envía un intento nuevo. Con uno incierto pendiente no envía: hay que reintentarlo o descartarlo. */
	send: (attempt: TAttempt, options?: IReturnSendOptions) => Promise<TResult | undefined>;
	/** Repite el intento incierto: mismo cuerpo y misma clave. */
	retry: (options?: IReturnSendOptions) => Promise<TResult | undefined>;
	/** Descarta el intento incierto y su clave, por decisión explícita del usuario. */
	discard: () => void;
	clearError: () => void;
}

export type TStartReturnSlot = IReturnWriteSlot<IStartReturnAttempt, ISaleReturn>;
export type TReceiveReturnSlot = IReturnWriteSlot<
	IReceiveReturnAttempt,
	IConfirmSaleReturnReceiptResponse
>;

export interface ISaleReturnWrites {
	start: TStartReturnSlot;
	receive: TReceiveReturnSlot;
	/** Escucha los cambios futuros, incluso si la escritura empezó en otro detalle. */
	subscribe: (listener: (owner: ISaleReturnOwner) => void) => () => void;
}

interface IUseSaleReturnWritesArgs {
	/**
	 * Una venta cambió por una devolución (iniciada, recibida o ya recibida por otro). La
	 * página refresca su listado; llega aunque el detalle ya se haya cerrado.
	 */
	onSaleChanged?: (owner: ISaleReturnOwner) => void;
}

/**
 * Escritura idempotente cuyo intento incierto sobrevive al modal y al detalle, como el
 * ingreso incierto de recepciones: la clave vive en `useIdempotentWrite` y el cuerpo
 * enviado, con su dueño, en este estado. Un éxito o un rechazo definitivo cierran el
 * intento; si no, se reintenta lo mismo o se descarta explícitamente.
 */
const useReturnWriteSlot = <TAttempt extends ISaleReturnOwner, TResult>(
	fallbackMessage: string,
	write: (attempt: TAttempt, headers: Record<string, string>) => Promise<TResult>,
	onSaleChanged: (owner: ISaleReturnOwner) => void,
): IReturnWriteSlot<TAttempt, TResult> => {
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage,
		renewKeyOnDefinitiveError: true,
	});
	const { submit, renewKey, clearError } = idempotentWrite;
	const [attempt, setAttempt] = useState<TAttempt | null>(null);
	// El intento viaja por ref además de por estado: `send` y `retry` lo leen en el
	// momento, sin esperar a que el render lo propague.
	const attemptRef = useRef<TAttempt | null>(null);

	const run = useCallback(
		async (next: TAttempt, options?: IReturnSendOptions): Promise<TResult | undefined> => {
			attemptRef.current = next;
			setAttempt(next);
			const failure: { error: IProcurementResolvedError | null } = { error: null };
			const result = await submit((headers) => write(next, headers), {
				onError: (error) => {
					failure.error = error;
					options?.onError?.(error);
				},
			});
			const uncertain = result === undefined && failure.error?.action === 'retry_same_key';
			// Doble envío ignorado por `useIdempotentWrite`: ni éxito ni error, nada cambia.
			const ignored = result === undefined && failure.error === null;
			if (!uncertain && !ignored) {
				attemptRef.current = null;
				setAttempt(null);
			}
			if (result !== undefined || failure.error?.code === RETURN_ALREADY_RECEIVED_CODE) {
				onSaleChanged(next);
			}
			return result;
		},
		[submit, write, onSaleChanged],
	);

	const send = useCallback(
		(next: TAttempt, options?: IReturnSendOptions) =>
			attemptRef.current ? Promise.resolve(undefined) : run(next, options),
		[run],
	);

	const retry = useCallback(
		(options?: IReturnSendOptions) =>
			attemptRef.current ? run(attemptRef.current, options) : Promise.resolve(undefined),
		[run],
	);

	const discard = useCallback(() => {
		attemptRef.current = null;
		setAttempt(null);
		renewKey();
	}, [renewKey]);

	return useMemo(
		() => ({
			attempt,
			isSubmitting: idempotentWrite.isSubmitting,
			error: idempotentWrite.error,
			canRetry: idempotentWrite.canRetry,
			send,
			retry,
			discard,
			clearError,
		}),
		[
			attempt,
			idempotentWrite.isSubmitting,
			idempotentWrite.error,
			idempotentWrite.canRetry,
			send,
			retry,
			discard,
			clearError,
		],
	);
};

const writeStart = (attempt: IStartReturnAttempt, headers: Record<string, string>) =>
	startSaleReturn(attempt.subsidiaryId, attempt.saleId, attempt.payload, headers);

const writeReceive = (attempt: IReceiveReturnAttempt, headers: Record<string, string>) =>
	receiveSaleReturn(attempt.subsidiaryId, attempt.saleId, attempt.payload, headers);

/**
 * Escrituras de la devolución física (iniciar y recibir) a nivel de página. Las monta
 * quien abre el detalle de venta, para que un intento incierto no se pierda al cerrar
 * el modal o el detalle: al reabrir la misma venta se reintenta con la misma clave.
 */
export const useSaleReturnWrites = ({
	onSaleChanged,
}: IUseSaleReturnWritesArgs = {}): ISaleReturnWrites => {
	const onSaleChangedRef = useRef(onSaleChanged);
	onSaleChangedRef.current = onSaleChanged;
	const listeners = useRef(new Set<(owner: ISaleReturnOwner) => void>());
	const subscribe = useCallback((listener: (owner: ISaleReturnOwner) => void) => {
		listeners.current.add(listener);
		return () => {
			listeners.current.delete(listener);
		};
	}, []);
	const notify = useCallback((owner: ISaleReturnOwner) => {
		onSaleChangedRef.current?.(owner);
		Array.from(listeners.current).forEach((listener) => listener(owner));
	}, []);

	const start = useReturnWriteSlot('No se pudo iniciar la devolución.', writeStart, notify);
	const receive = useReturnWriteSlot('No se pudo recibir la devolución.', writeReceive, notify);

	return useMemo(() => ({ start, receive, subscribe }), [start, receive, subscribe]);
};
