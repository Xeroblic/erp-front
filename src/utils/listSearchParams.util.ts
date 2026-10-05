/**
 * Lectura tolerante de filtros de listado guardados en la URL. Un valor
 * desconocido o mal formado cae al valor por defecto en vez de romper la
 * vista: los enlaces viejos o editados a mano siguen abriendo.
 */

/** Tope de `per_page` del backend (`ValidatesPagination::MAX_PER_PAGE`). */
export const LIST_MAX_PER_PAGE = 100;

/** Fecha de negocio `AAAA-MM-DD` que existe en el calendario; si no, `''`. */
export const parseBusinessDateParam = (value: string | null): string => {
	const match = value === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return '';
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const date = new Date(Date.UTC(year, month - 1, day));
	const exists = date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
	return exists ? match[0] : '';
};

/** Entero positivo sin ceros a la izquierda ni decimales; si no, `null`. */
export const parseIdParam = (value: string | null): number | null =>
	value !== null && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;

/** Página o tamaño de página: entero positivo hasta `max`; si no, `fallback`. */
export const parsePageParam = (
	value: string | null,
	fallback: number,
	max = Number.MAX_SAFE_INTEGER,
): number => {
	const parsed = parseIdParam(value);
	return parsed !== null && parsed <= max ? parsed : fallback;
};

const isOption = <TValue extends string>(
	value: string | null,
	allowed: readonly TValue[],
): value is TValue => value !== null && (allowed as readonly string[]).includes(value);

/** Valor de una lista cerrada (estado, tipo…); si no está, `fallback`. */
export const parseOptionParam = <TValue extends string>(
	value: string | null,
	allowed: readonly TValue[],
	fallback: TValue,
): TValue => (isOption(value, allowed) ? value : fallback);

/**
 * Reemplaza en `previous` sólo las claves que son filtros del listado y deja
 * intactas las demás (p. ej. `?purchase_document_id=` de Recepciones, que abre
 * el alta y no filtra nada).
 */
export const mergeListParams = (
	previous: URLSearchParams,
	ownedKeys: readonly string[],
	next: URLSearchParams,
): URLSearchParams => {
	const merged = new URLSearchParams(previous);
	ownedKeys.forEach((key) => merged.delete(key));
	next.forEach((value, key) => merged.set(key, value));
	return merged;
};

/**
 * `state` de la navegación de un listado a una ficha: guarda su query para que
 * «Volver al listado» regrese a la misma vista filtrada.
 */
export interface IListReturnState {
	listSearch: string;
}

export const listReturnState = (search: string): IListReturnState => ({ listSearch: search });

/**
 * Lee la query de vuelta desde un `location.state` cualquiera. Sólo acepta una
 * query (`?…`); cualquier otra cosa vuelve al listado sin filtros.
 */
export const readListReturnSearch = (state: unknown): string => {
	if (typeof state !== 'object' || state === null || !('listSearch' in state)) return '';
	const { listSearch } = state;
	return typeof listSearch === 'string' && listSearch.startsWith('?') ? listSearch : '';
};
