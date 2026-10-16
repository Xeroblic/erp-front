import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormik, type FormikProps } from 'formik';
import { toast } from 'react-toastify';
import type { ISaleReturn } from '@/interface/sales.interface';
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import { StartSaleReturnSchema, type IStartSaleReturnValues } from '../types';
import {
	isSameSaleOwner,
	type IStartReturnAttempt,
	type ISaleReturnOwner,
	type TStartReturnSlot,
} from './useSaleReturnWrites';

/** El 403 trae el cuerpo genérico: se explica qué falta y que reintentar no sirve. */
export const START_RETURN_FORBIDDEN_MESSAGE =
	'No tienes acceso para iniciar esta devolución: hace falta el permiso de devoluciones y alcanzar la filial y la sucursal de la venta. Pide a alguien con ese acceso que la inicie.';

interface IUseStartSaleReturnArgs {
	/** Escritura de página (`useSaleReturnWrites().start`): conserva el intento incierto. */
	slot: TStartReturnSlot;
	owner: ISaleReturnOwner;
	/**
	 * La devolución quedó iniciada (201) o ya existía (200). Recibe la venta del intento:
	 * la respuesta puede llegar con el detalle ya cerrado o mostrando otra venta.
	 */
	onStarted: (saleReturn: ISaleReturn, owner: ISaleReturnOwner) => void;
}

export interface IStartSaleReturn {
	formik: FormikProps<IStartSaleReturnValues>;
	isSubmitting: boolean;
	/** Mensaje del último rechazo, ya explicado para el 403. */
	errorMessage: string | null;
	/** Intento de esta venta sin respuesta: se reintenta igual o se descarta. */
	canRetry: boolean;
	/** Intento incierto de otra venta: bloquea iniciar aquí hasta resolverlo allá o descartarlo. */
	foreignAttempt: IStartReturnAttempt | null;
	retry: () => Promise<void>;
	discard: () => void;
}

const toErrorMessage = (error: IProcurementResolvedError): string =>
	error.status === 403 ? START_RETURN_FORBIDDEN_MESSAGE : error.message;

/**
 * Inicia la devolución de una venta cerrada (etapa 2). Una sola `Idempotency-Key` por
 * intento: el reintento tras un timeout la reusa con el mismo motivo, aunque el modal se
 * haya cerrado entre medio, y tras un rechazo definitivo se renueva.
 */
export const useStartSaleReturn = ({
	slot,
	owner,
	onStarted,
}: IUseStartSaleReturnArgs): IStartSaleReturn => {
	const ownAttempt = slot.attempt && isSameSaleOwner(slot.attempt, owner) ? slot.attempt : null;
	const foreignAttempt = slot.attempt && !ownAttempt ? slot.attempt : null;
	const onStartedRef = useRef(onStarted);
	onStartedRef.current = onStarted;

	// Al abrir, un rechazo definitivo de otra apertura no se arrastra; el intento
	// incierto sí, porque es lo único que permite recuperarlo.
	const slotRef = useRef(slot);
	slotRef.current = slot;
	useEffect(() => {
		if (!slotRef.current.canRetry) slotRef.current.clearError();
	}, []);

	const settle = useCallback(
		(attemptOwner: ISaleReturnOwner, saleReturn: ISaleReturn | undefined) => {
			if (!saleReturn) return;
			toast.success('Devolución iniciada. La venta queda abierta hasta recibirla.');
			onStartedRef.current(saleReturn, attemptOwner);
		},
		[],
	);

	const formik = useFormik<IStartSaleReturnValues>({
		initialValues: { reason: ownAttempt?.payload.reason ?? '' },
		validationSchema: StartSaleReturnSchema,
		onSubmit: async (values) => {
			const attempt = { ...owner, payload: { reason: values.reason.trim() } };
			settle(attempt, await slot.send(attempt));
		},
	});

	const retry = useCallback(async () => {
		const { attempt } = slotRef.current;
		if (!attempt) return;
		settle(attempt, await slotRef.current.retry());
	}, [settle]);

	const discard = useCallback(() => slotRef.current.discard(), []);

	const errorMessage = slot.error && !foreignAttempt ? toErrorMessage(slot.error) : null;
	const canRetry = slot.canRetry && ownAttempt !== null;

	return useMemo(
		() => ({
			formik,
			isSubmitting: slot.isSubmitting,
			errorMessage,
			canRetry,
			foreignAttempt,
			retry,
			discard,
		}),
		[formik, slot.isSubmitting, errorMessage, canRetry, foreignAttempt, retry, discard],
	);
};
