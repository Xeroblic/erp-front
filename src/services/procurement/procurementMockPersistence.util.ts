/**
 * Persistencia local del store autoritativo de un servicio mock de
 * abastecimiento (hallazgo 1, revisión ZF-110).
 *
 * Los stores de `stockReceipts.service` y `purchaseDocuments.service` viven
 * en `Map`/temporizadores de **módulo**: sobreviven a un cambio de pantalla
 * (SPA) pero no a una recarga real de la pestaña, que reinstancia el módulo
 * desde cero. Sin esto, crear/publicar una recepción y recargar hace que el
 * `GET` vuelva a ver sólo la semilla de fixtures — un ID nuevo da 404, uno
 * sembrado editado reaparece con su versión original, y un `queued` en
 * curso se queda así para siempre porque perdió su `setTimeout`.
 *
 * Este helper persiste el estado por filial en `localStorage`, namespaced
 * por servicio y versionado: un cambio de forma del store (agregar un campo,
 * cambiar cómo se serializa un `Map`) sube la versión para no deserializar
 * datos de una forma vieja como si fueran válidos.
 *
 * Sólo hace de transporte JSON — no sabe nada de recepciones ni documentos.
 * Cada servicio decide qué forma persistir y cómo reconciliar al hidratar
 * (por ejemplo, reprogramar el worker de una recepción `queued`).
 */

const STORAGE_KEY_PREFIX = 'zentria-erp:procurement-mock';

const hasLocalStorage = (): boolean => {
	try {
		return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
	} catch {
		// Algunos navegadores lanzan al acceder a `localStorage` en modo privado
		// estricto: el mock sigue funcionando en memoria, sólo sin persistencia.
		return false;
	}
};

const buildStorageKey = (namespace: string, version: number, subsidiaryId: number): string =>
	`${STORAGE_KEY_PREFIX}:${namespace}:v${version}:${subsidiaryId}`;

/** Carga el estado persistido de una filial, o `null` si no existe o es ilegible. */
export const loadPersistedMockState = <T>(
	namespace: string,
	version: number,
	subsidiaryId: number,
): T | null => {
	if (!hasLocalStorage()) return null;

	try {
		const raw = window.localStorage.getItem(buildStorageKey(namespace, version, subsidiaryId));
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		// JSON corrupto o cuota excedida al leer no debería tumbar el mock.
		return null;
	}
};

/** Persiste el estado de una filial. Falla en silencio (cuota, modo privado). */
export const savePersistedMockState = <T>(
	namespace: string,
	version: number,
	subsidiaryId: number,
	state: T,
): void => {
	if (!hasLocalStorage()) return;

	try {
		window.localStorage.setItem(
			buildStorageKey(namespace, version, subsidiaryId),
			JSON.stringify(state),
		);
	} catch {
		// Cuota excedida u otro fallo de almacenamiento: el mock sigue
		// funcionando en memoria para el resto de la sesión.
	}
};

/**
 * Borra **todo** lo persistido de un namespace (todas las filiales, todas
 * las versiones). Sólo para pruebas: `resetForTests` necesita simular un
 * entorno sin ningún dato previo, no sólo el de la filial de turno.
 */
export const clearAllPersistedMockState = (namespace: string): void => {
	if (!hasLocalStorage()) return;

	try {
		const prefix = `${STORAGE_KEY_PREFIX}:${namespace}:`;
		const keysToRemove: string[] = [];
		for (let index = 0; index < window.localStorage.length; index += 1) {
			const key = window.localStorage.key(index);
			if (key && key.startsWith(prefix)) keysToRemove.push(key);
		}
		keysToRemove.forEach((key) => window.localStorage.removeItem(key));
	} catch {
		// Ver `savePersistedMockState`.
	}
};
