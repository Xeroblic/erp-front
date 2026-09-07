/**
 * Superficies y textos del modal de cotización, calibrados para que el contraste
 * aguante en claro y en oscuro.
 *
 * La jerarquía de fondos en oscuro va de menor a mayor claridad —cuerpo `zinc-950`,
 * tarjeta `zinc-900`, panel anidado `zinc-800`—: un panel más oscuro que su tarjeta se
 * confundiría con el fondo del modal en vez de leerse como un bloque aparte. Los bordes
 * usan `zinc-700`, no `zinc-800`: sobre `zinc-900` este último es casi invisible.
 */

/** Tarjeta de primer nivel dentro del cuerpo del modal. */
export const QUOTATION_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';

/** Texto de apoyo bajo el título de una tarjeta. */
export const QUOTATION_SUBTITLE_CLASSNAME = 'text-sm font-normal text-zinc-600 dark:text-zinc-400';

/** Texto secundario dentro de una tarjeta (ayudas, notas al pie). */
export const QUOTATION_MUTED_TEXT_CLASSNAME = 'text-zinc-600 dark:text-zinc-400';

/** Panel anidado dentro de una tarjeta. */
export const QUOTATION_PANEL_CLASSNAME =
	'rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60';

/**
 * Contenedor de un ítem de la lista. Lleva relleno propio además del borde: en oscuro un
 * borde `zinc-700` sobre `zinc-900` no alcanza para agrupar una fila con muchos controles.
 */
export const QUOTATION_ITEM_CLASSNAME =
	'rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50';

/** Caja de un valor calculado; contrasta con el relleno del ítem que la contiene. */
export const QUOTATION_READONLY_VALUE_CLASSNAME =
	'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100';

/** Valor destacado (totales, importes calculados). */
export const QUOTATION_VALUE_TEXT_CLASSNAME = 'font-medium text-zinc-900 dark:text-zinc-100';
