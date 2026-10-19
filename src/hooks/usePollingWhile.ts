import { useCallback, useEffect, useRef, useState } from 'react';

export interface IUsePollingWhileOptions {
	/** Mientras sea `true` se consulta; al pasar a `false` se corta en el acto. */
	active: boolean;
	/** La consulta. Si devuelve una promesa, la siguiente espera a que termine. */
	poll: () => unknown;
	/**
	 * Identidad del recurso consultado (p. ej. `filial:id`). Al cambiar se
	 * descarta la consulta en curso y la espera vuelve a empezar desde cero.
	 */
	resetKey?: string | number;
	/** Primera espera. */
	initialDelayMs?: number;
	/** Techo de la espera creciente. */
	maxDelayMs?: number;
	/** Factor por el que crece la espera tras cada consulta. */
	backoffFactor?: number;
	/** Tras este tiempo (de reloj, desde que empezó) deja de consultar. */
	maxDurationMs?: number;
}

export interface IUsePollingWhileResult {
	/** Se agotó `maxDurationMs` sin que `active` pasara a `false`. */
	isExhausted: boolean;
	/** Consulta enseguida y reinicia la espera y el tope. */
	resume: () => void;
}

export const POLLING_INITIAL_DELAY_MS = 1500;
export const POLLING_MAX_DELAY_MS = 15_000;
export const POLLING_BACKOFF_FACTOR = 2;
export const POLLING_MAX_DURATION_MS = 2 * 60_000;

const isDocumentHidden = () =>
	typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * Consulta periódica mientras se cumpla una condición, sin martillar al
 * servidor:
 *
 * - **Espera creciente** (1,5 s → 3 s → 6 s → … hasta 15 s) con `setTimeout`
 *   encadenado: la siguiente consulta se programa recién cuando la anterior
 *   terminó, así que nunca se solapan.
 * - **Tope**: un temporizador propio vence a los `maxDurationMs` aunque haya
 *   una consulta colgada; desde ahí no sale ninguna más y se marca
 *   `isExhausted`. `resume()` consulta enseguida y vuelve a empezar.
 * - **Pestaña oculta**: no consulta mientras `document` está oculto; al
 *   volver consulta una vez enseguida y sigue con la espera que llevaba.
 *
 * Se limpia al desmontar, al cambiar `resetKey` y en cuanto `active` pasa a
 * `false`: una respuesta que llega tarde no programa nada más.
 *
 * La consulta en camino se recuerda entre sesiones: si `resume()` (o volver a
 * `active`) llega mientras la anterior del mismo recurso sigue pendiente, se
 * espera su respuesta en vez de lanzar otra encima.
 */
const usePollingWhile = ({
	active,
	poll,
	resetKey,
	initialDelayMs = POLLING_INITIAL_DELAY_MS,
	maxDelayMs = POLLING_MAX_DELAY_MS,
	backoffFactor = POLLING_BACKOFF_FACTOR,
	maxDurationMs = POLLING_MAX_DURATION_MS,
}: IUsePollingWhileOptions): IUsePollingWhileResult => {
	const pollRef = useRef(poll);
	useEffect(() => {
		pollRef.current = poll;
	}, [poll]);

	const [isExhausted, setIsExhausted] = useState(false);
	/** Cada `resume()` abre una sesión nueva del efecto. */
	const [session, setSession] = useState(0);
	/** La sesión abierta por `resume()` consulta sin esperar el primer intervalo. */
	const pollImmediatelyRef = useRef(false);
	/** Consulta en camino, de la sesión que sea, y de qué recurso. */
	const inFlightRef = useRef<{
		key: IUsePollingWhileOptions['resetKey'];
		promise: Promise<void>;
	} | null>(null);

	useEffect(() => {
		if (!active) return undefined;

		let cancelled = false;
		/** Se agotó el tope: no se consulta más hasta `resume()`. */
		let stopped = false;
		/** Esta sesión ya está consultando (o esperando la consulta anterior). */
		let busy = false;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let delay = initialDelayMs;

		const clearTimer = () => {
			if (timer === null) return;
			clearTimeout(timer);
			timer = null;
		};

		const runPoll = async () => {
			const promise = (async () => {
				try {
					await pollRef.current();
				} catch {
					// Quien consulta maneja su propio error; acá sólo importa el ritmo.
				}
			})();
			const entry = { key: resetKey, promise };
			inFlightRef.current = entry;
			await promise;
			if (inFlightRef.current === entry) inFlightRef.current = null;
		};

		/** Una consulta. Devuelve si corresponde programar la siguiente. */
		const tick = async (): Promise<boolean> => {
			if (cancelled || stopped || busy) return false;
			busy = true;
			try {
				const pending = inFlightRef.current;
				// La de una sesión anterior del mismo recurso sirve como esta consulta.
				if (pending && pending.key === resetKey) await pending.promise;
				else await runPoll();
			} finally {
				busy = false;
			}
			if (cancelled || stopped) return false;
			delay = Math.min(delay * backoffFactor, maxDelayMs);
			return true;
		};

		const schedule = () => {
			clearTimer();
			if (cancelled || stopped || isDocumentHidden()) return;
			timer = setTimeout(() => {
				timer = null;
				void tick().then((shouldContinue) => {
					if (shouldContinue) schedule();
				});
			}, delay);
		};

		const pollNow = async () => {
			clearTimer();
			if (await tick()) schedule();
		};

		const handleVisibilityChange = () => {
			if (isDocumentHidden()) clearTimer();
			// Al volver: una consulta enseguida (si no había una ya en camino).
			else void pollNow();
		};

		// Vence por su cuenta: no depende de que la consulta en curso termine.
		const deadline = setTimeout(() => {
			stopped = true;
			clearTimer();
			setIsExhausted(true);
		}, maxDurationMs);

		document.addEventListener('visibilitychange', handleVisibilityChange);

		if (pollImmediatelyRef.current) {
			pollImmediatelyRef.current = false;
			void pollNow();
		} else {
			schedule();
		}

		return () => {
			cancelled = true;
			clearTimer();
			clearTimeout(deadline);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			setIsExhausted(false);
		};
	}, [active, resetKey, session, initialDelayMs, maxDelayMs, backoffFactor, maxDurationMs]);

	const resume = useCallback(() => {
		pollImmediatelyRef.current = true;
		setIsExhausted(false);
		setSession((current) => current + 1);
	}, []);

	return { isExhausted: active && isExhausted, resume };
};

export default usePollingWhile;
