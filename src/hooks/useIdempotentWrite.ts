import { useCallback, useRef, useState } from 'react';
import {
	buildProcurementWriteHeaders,
	createIdempotencyKey,
	shouldRetryWithSameKey,
} from '@/utils/procurementWrite.util';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';

/**
 * Ciclo de vida de una escritura idempotente del módulo de abastecimiento.
 *
 * Existe porque la regla del contrato es fácil de invertir por accidente:
 * **un reintento por timeout reusa la misma `Idempotency-Key`**, y sólo tras un
 * error definitivo con el payload corregido se genera una clave nueva. Generar
 * una clave en cada clic convierte el reintento de una recepción en una segunda
 * recepción; conservarla tras corregir el payload produce
 * `409 IDEMPOTENCY_KEY_REUSED`.
 *
 * El hook no hace HTTP: entrega la clave y las cabeceras, y decide si la
 * siguiente tentativa conserva o renueva la clave según el error.
 */

export interface IIdempotentWriteState {
	/** Clave de la tentativa actual. Estable entre reintentos por timeout. */
	idempotencyKey: string;
	isSubmitting: boolean;
	error: IProcurementResolvedError | null;
	/** `true` mientras el error admita reintentar con la misma clave. */
	canRetry: boolean;
}

export interface IUseIdempotentWriteResult extends IIdempotentWriteState {
	/**
	 * Ejecuta la escritura. Recibe las cabeceras ya armadas (`Idempotency-Key` y,
	 * si hay ETag, `If-Match`) para pasarlas al thunk o al servicio.
	 */
	submit: <TResult>(
		write: (headers: Record<string, string>) => Promise<TResult>,
	) => Promise<TResult | undefined>;
	/**
	 * Descarta la clave actual y genera una nueva. Se llama al **corregir el
	 * payload** tras un error definitivo, nunca antes de un reintento.
	 */
	renewKey: () => void;
	/** Limpia el error sin tocar la clave. */
	clearError: () => void;
}

export interface IUseIdempotentWriteOptions {
	/** `ETag` vigente del recurso, para el `If-Match` de los PATCH que lo exigen. */
	etag?: string | null;
	/** Texto de respaldo si la respuesta no trae `message`. */
	fallbackMessage?: string;
}

const useIdempotentWrite = (
	options: IUseIdempotentWriteOptions = {},
): IUseIdempotentWriteResult => {
	const { etag = null, fallbackMessage } = options;

	const [idempotencyKey, setIdempotencyKey] = useState<string>(() => createIdempotencyKey());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<IProcurementResolvedError | null>(null);
	const [canRetry, setCanRetry] = useState(false);

	// La clave viaja por ref además de por estado: `submit` la lee en el momento
	// del envío sin depender de que el render haya alcanzado a propagarla.
	const keyRef = useRef(idempotencyKey);
	const inFlightRef = useRef(false);

	const renewKey = useCallback(() => {
		const nextKey = createIdempotencyKey();
		keyRef.current = nextKey;
		setIdempotencyKey(nextKey);
		setError(null);
		setCanRetry(false);
	}, []);

	const clearError = useCallback(() => {
		setError(null);
		setCanRetry(false);
	}, []);

	const submit = useCallback(
		async <TResult>(
			write: (headers: Record<string, string>) => Promise<TResult>,
		): Promise<TResult | undefined> => {
			// Doble submit: un segundo clic con la misma clave sería idempotente en
			// el backend, pero devolvería 409 OPERATION_IN_PROGRESS y ensuciaría la
			// pantalla con un error que el usuario no provocó.
			if (inFlightRef.current) return undefined;

			inFlightRef.current = true;
			setIsSubmitting(true);
			setError(null);
			setCanRetry(false);

			try {
				const result = await write(
					buildProcurementWriteHeaders({ idempotencyKey: keyRef.current, etag }),
				);
				// Escritura exitosa: la clave queda consumida. La siguiente escritura
				// desde este formulario es otra operación y necesita clave propia.
				const nextKey = createIdempotencyKey();
				keyRef.current = nextKey;
				setIdempotencyKey(nextKey);

				return result;
			} catch (caught) {
				setError(resolveProcurementError(caught, fallbackMessage));
				// La clave NO se renueva acá: si el reintento es válido debe ir con la
				// misma, y si el usuario corrige el payload llamará a `renewKey`.
				setCanRetry(shouldRetryWithSameKey(caught));

				return undefined;
			} finally {
				inFlightRef.current = false;
				setIsSubmitting(false);
			}
		},
		[etag, fallbackMessage],
	);

	return { idempotencyKey, isSubmitting, error, canRetry, submit, renewKey, clearError };
};

export default useIdempotentWrite;
