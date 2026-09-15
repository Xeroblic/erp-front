/** Pestañas de la página: cada una es un flujo de escritura independiente. */
export const AJUSTES_TRASLADOS_TABS = ['ajuste', 'traslado'] as const;

export type AjustesTrasladosTab = (typeof AJUSTES_TRASLADOS_TABS)[number];

/** Parámetro de búsqueda que hace enlazable cada pestaña (`?tab=traslado`). */
export const AJUSTES_TRASLADOS_TAB_PARAM = 'tab';

export const DEFAULT_AJUSTES_TRASLADOS_TAB: AjustesTrasladosTab = 'ajuste';

export const isAjustesTrasladosTab = (value: unknown): value is AjustesTrasladosTab =>
	typeof value === 'string' && (AJUSTES_TRASLADOS_TABS as readonly string[]).includes(value);

/**
 * Motivo por el que la página no monta los formularios. `ready` es el único
 * estado que los monta: el resto se resuelve antes de pintar pestañas.
 */
export type AjustesTrasladosAccess = 'loading' | 'no-branch' | 'forbidden' | 'disabled' | 'ready';
