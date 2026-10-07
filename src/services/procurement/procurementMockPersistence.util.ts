/**
 * Persistencia local del store autoritativo de un servicio mock de
 * abastecimiento.
 *
 * Los stores de los mocks viven en `Map`/temporizadores de **módulo**:
 * sobreviven a un cambio de pantalla (SPA) pero no a una recarga real de la
 * pestaña. Sin esto, crear/publicar una recepción y recargar hace que el
 * `GET` vuelva a ver sólo la semilla de fixtures — un ID nuevo da 404, uno
 * sembrado editado reaparece con su versión original, y un `queued` en
 * curso se queda así para siempre porque perdió su `setTimeout`.
 *
 * El estado se guarda por partición (filial o sucursal) en `localStorage`,
 * namespaced por servicio y versionado: un cambio de forma del store sube la
 * versión para no deserializar datos de una forma vieja como si fueran
 * válidos. Las versiones **menores** del mismo namespace se borran al hidratar,
 * para que los bumps sucesivos no acumulen datos muertos hasta agotar la cuota.
 * Las mayores se conservan: una pestaña abierta con código anterior no puede
 * borrar lo que persistió otra pestaña ya actualizada.
 *
 * Sólo hace de transporte JSON — no sabe nada de recepciones ni documentos.
 * Cada servicio decide qué forma persistir y cómo reconciliar al hidratar.
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

const namespacePrefix = (namespace: string): string => `${STORAGE_KEY_PREFIX}:${namespace}:`;

const versionPrefix = (namespace: string, version: number): string =>
	`${namespacePrefix(namespace)}v${version}:`;

const buildStorageKey = (namespace: string, version: number, partitionId: number): string =>
	`${versionPrefix(namespace, version)}${partitionId}`;

const listKeysWithPrefix = (prefix: string): string[] => {
	const keys: string[] = [];
	for (let index = 0; index < window.localStorage.length; index += 1) {
		const key = window.localStorage.key(index);
		if (key?.startsWith(prefix)) keys.push(key);
	}
	return keys;
};

/** El sufijo tiene que ser la forma canónica de un entero: `''`, `'1e3'` o `'007'` no cuentan. */
const parseCanonicalInt = (value: string): number | null => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && String(parsed) === value ? parsed : null;
};

/** Versión de una clave del namespace (`v<N>:<partición>`), o `null` si no tiene esa forma. */
const versionOfKey = (key: string, namespace: string): number | null => {
	const rest = key.slice(namespacePrefix(namespace).length);
	const separator = rest.indexOf(':');
	if (!rest.startsWith('v') || separator === -1) return null;
	return parseCanonicalInt(rest.slice(1, separator));
};

const purgeOlderVersions = (namespace: string, version: number): void => {
	listKeysWithPrefix(namespacePrefix(namespace))
		.filter((key) => {
			const keyVersion = versionOfKey(key, namespace);
			return keyVersion !== null && keyVersion < version;
		})
		.forEach((key) => window.localStorage.removeItem(key));
};

/**
 * Parsea una entrada y la borra si no es un objeto JSON: un valor corrupto
 * quedaría ocupando cuota y fallando en cada hidratación.
 */
const readEntry = (key: string): unknown => {
	const raw = window.localStorage.getItem(key);
	if (raw === null) return null;

	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed === 'object' && parsed !== null) return parsed;
	} catch {
		// Cae al borrado de abajo.
	}
	window.localStorage.removeItem(key);
	return null;
};

const isQuotaExceeded = (error: unknown): boolean =>
	error instanceof DOMException &&
	(error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

const namespacesWarnedAboutQuota = new Set<string>();

/** Carga el estado persistido de una partición, o `null` si no existe o es ilegible. */
export const loadPersistedMockState = <T>(
	namespace: string,
	version: number,
	partitionId: number,
): T | null => {
	if (!hasLocalStorage()) return null;

	try {
		purgeOlderVersions(namespace, version);
		return readEntry(buildStorageKey(namespace, version, partitionId)) as T | null;
	} catch {
		return null;
	}
};

/**
 * Persiste el estado de una partición. Si falla, el mock sigue en memoria
 * para el resto de la sesión; la cuota agotada se avisa una vez por namespace
 * porque, si no, la persistencia se detiene sin que nadie lo note.
 */
export const savePersistedMockState = <T>(
	namespace: string,
	version: number,
	partitionId: number,
	state: T,
): void => {
	if (!hasLocalStorage()) return;

	try {
		window.localStorage.setItem(
			buildStorageKey(namespace, version, partitionId),
			JSON.stringify(state),
		);
	} catch (error) {
		if (isQuotaExceeded(error) && !namespacesWarnedAboutQuota.has(namespace)) {
			namespacesWarnedAboutQuota.add(namespace);
			// eslint-disable-next-line no-console
			console.warn(
				`[procurement-mock] localStorage sin cuota: «${namespace}» deja de persistirse en esta sesión.`,
				error,
			);
		}
	}
};

/**
 * Carga el estado persistido de **todas** las particiones de un namespace y
 * versión. Existe para el lector que no conoce la partición de antemano (por
 * ejemplo, resolver un producto por ID desde un store particionado por
 * filial); las entradas ilegibles se omiten.
 */
export const loadAllPersistedMockStates = <T>(
	namespace: string,
	version: number,
): [number, T][] => {
	if (!hasLocalStorage()) return [];

	const entries: [number, T][] = [];
	try {
		purgeOlderVersions(namespace, version);
		const prefix = versionPrefix(namespace, version);
		listKeysWithPrefix(prefix).forEach((key) => {
			const partitionId = parseCanonicalInt(key.slice(prefix.length));
			if (partitionId === null) return;
			const state = readEntry(key);
			if (state !== null) entries.push([partitionId, state as T]);
		});
	} catch {
		// Igual que `loadPersistedMockState`: un storage inaccesible no tumba el mock.
	}
	return entries;
};

/**
 * Borra **todo** lo persistido de un namespace (todas las particiones, todas
 * las versiones). Sólo para pruebas: `resetForTests` necesita simular un
 * entorno sin ningún dato previo, no sólo el de la partición de turno.
 */
export const clearAllPersistedMockState = (namespace: string): void => {
	if (!hasLocalStorage()) return;

	try {
		listKeysWithPrefix(namespacePrefix(namespace)).forEach((key) =>
			window.localStorage.removeItem(key),
		);
	} catch {
		// Igual que `loadAllPersistedMockStates`.
	}
};
