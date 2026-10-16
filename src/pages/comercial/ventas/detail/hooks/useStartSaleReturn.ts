import { useCallback, useMemo, useRef } from 'react';
import { useFormik, type FormikProps } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { startSaleReturn } from '@/services/salesService';
import type { ISaleReturn, IStartSaleReturnRequest } from '@/interface/sales.interface';
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import { StartSaleReturnSchema, type IStartSaleReturnValues } from '../types';

/** El 403 trae el cuerpo genérico: se explica qué falta y que reintentar no sirve. */
export const START_RETURN_FORBIDDEN_MESSAGE =
	'No tienes acceso para iniciar esta devolución: hace falta el permiso de devoluciones y alcanzar la filial y la sucursal de la venta. Pide a alguien con ese acceso que la inicie.';

interface IUseStartSaleReturnArgs {
	subsidiaryId: number;
	saleId: number;
	/** La devolución quedó iniciada (201) o ya existía (200). */
	onStarted: (saleReturn: ISaleReturn) => void;
}

export interface IStartSaleReturn {
	formik: FormikProps<IStartSaleReturnValues>;
	isSubmitting: boolean;
	/** Mensaje del último rechazo, ya explicado para el 403. */
	errorMessage: string | null;
	/** Sin respuesta del servidor: se reintenta con la misma clave y el motivo bloqueado. */
	canRetry: boolean;
	retry: () => Promise<void>;
}

const toErrorMessage = (error: IProcurementResolvedError): string =>
	error.status === 403 ? START_RETURN_FORBIDDEN_MESSAGE : error.message;

/**
 * Inicia la devolución de una venta cerrada (etapa 2). Una sola `Idempotency-Key` por
 * intento: el reintento tras un timeout la reusa con el mismo motivo, y tras un rechazo
 * definitivo se renueva para el motivo corregido.
 */
export const useStartSaleReturn = ({
	subsidiaryId,
	saleId,
	onStarted,
}: IUseStartSaleReturnArgs): IStartSaleReturn => {
	const write = useIdempotentWrite({
		fallbackMessage: 'No se pudo iniciar la devolución.',
		renewKeyOnDefinitiveError: true,
	});
	const { submit } = write;
	// Lo que viajó en el intento: el reintento lo repite tal cual, aunque el render cambie.
	const lastPayloadRef = useRef<IStartSaleReturnRequest | null>(null);

	const send = useCallback(
		async (payload: IStartSaleReturnRequest): Promise<void> => {
			lastPayloadRef.current = payload;
			const saleReturn = await submit((headers) =>
				startSaleReturn(subsidiaryId, saleId, payload, headers),
			);
			if (!saleReturn) return;
			lastPayloadRef.current = null;
			toast.success('Devolución iniciada. La venta queda abierta hasta recibirla.');
			onStarted(saleReturn);
		},
		[submit, subsidiaryId, saleId, onStarted],
	);

	const formik = useFormik<IStartSaleReturnValues>({
		initialValues: { reason: '' },
		validationSchema: StartSaleReturnSchema,
		onSubmit: async (values) => {
			await send({ reason: values.reason.trim() });
		},
	});

	const retry = useCallback(async () => {
		if (lastPayloadRef.current) await send(lastPayloadRef.current);
	}, [send]);

	const errorMessage = write.error ? toErrorMessage(write.error) : null;

	return useMemo(
		() => ({
			formik,
			isSubmitting: write.isSubmitting,
			errorMessage,
			canRetry: write.canRetry,
			retry,
		}),
		[formik, write.isSubmitting, errorMessage, write.canRetry, retry],
	);
};
