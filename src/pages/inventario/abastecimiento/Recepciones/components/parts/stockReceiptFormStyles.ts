/**
 * Superficies del formulario de recepción, compartidas por sus pasos. Son las
 * mismas que `PurchaseDocumentFormModal` para que ambos modales luzcan iguales.
 */
export const RECEPCION_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-xs dark:border-zinc-700 dark:bg-zinc-900';
export const RECEPCION_ITEM_CLASSNAME =
	'rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50';
export const RECEPCION_SUBTITLE_CLASSNAME = 'text-sm font-normal text-zinc-600 dark:text-zinc-400';
/** Fondo blanco en todos los campos, igual que en `PurchaseDocumentFormModal`. */
export const RECEPCION_FIELD_CLASSNAME = 'bg-white! dark:bg-zinc-900!';
/**
 * `SelectReact` ya es blanco en reposo, pero con foco se vuelve transparente y
 * deja ver el gris de la card. Sólo aplica con foco: no pisa el deshabilitado.
 */
export const RECEPCION_SELECT_CLASSNAME = 'focus-within:bg-white! dark:focus-within:bg-zinc-900!';
