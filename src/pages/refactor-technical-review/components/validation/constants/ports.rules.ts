/**
 * ports.rules.ts
 * Catálogo de puertos compartido por `loose_port_types` y `defective_port_types`.
 *
 * Los dos campos son un **mapa `{tipo: cantidad}`**, no una lista de tipos: el formulario
 * captura un contador por tipo, igual que la cantidad de puertos del equipo, y así el total
 * no puede contradecir al detalle. El backend lo publica con `allowed_keys` (no
 * `allowed_values`) justamente para que el saneado por valores no descarte el objeto entero.
 *
 * Es el respaldo local de `TechnicalReviewValidationSchemaService::PORT_TYPES`: cuando el
 * schema remoto llega, sus `options` y sus límites mandan sobre estas constantes.
 */

export const ALLOWED_PORT_TYPES = [
	'vga',
	'hdmi',
	'displayport',
	'usb_a',
	'usb_c',
	'sd_reader',
	'rj45',
	'charging',
] as const;

export type PortTypeValue = (typeof ALLOWED_PORT_TYPES)[number];

/** Desglose de puertos por tipo. Un tipo sin puertos se omite; nunca se guarda en 0. */
export type PortTypeCounts = Record<string, number>;

export const PORT_TYPE_LABELS: Record<PortTypeValue, string> = {
	vga: 'VGA',
	hdmi: 'HDMI',
	displayport: 'DisplayPort',
	usb_a: 'USB-A',
	usb_c: 'USB-C',
	sd_reader: 'Lector SD',
	rj45: 'RJ45',
	charging: 'Puerto de carga',
};

export const PORT_TYPE_OPTIONS: Array<{ value: string; label: string }> = ALLOWED_PORT_TYPES.map(
	(value) => ({ value: value as string, label: PORT_TYPE_LABELS[value] }),
);

/**
 * Techo de puertos, el mismo para los buenos y para los malos: la grilla base de
 * cantidad de puertos, el desglose por tipo y el total del desglose. Declarar más
 * puertos buenos de los que después se pueden marcar como malos no tiene sentido.
 *
 * A diferencia de las opciones y los rótulos, este tope **no** lo gobierna el schema
 * remoto: el `value_max: 10` que el backend publica hoy está por retirarse y acotar el
 * formulario a diez le impediría al técnico registrar los puertos que el equipo tiene.
 * Mientras esa validación siga viva, un total mayor a diez vuelve con 422 en el
 * autoguardado.
 */
export const MIN_PORT_TYPE_COUNT = 1;
export const MAX_PORT_TYPE_COUNT = 20;

/** Tope de la suma del desglose; el backend valida el total, no sólo cada tipo. */
export const MAX_PORTS_TOTAL = 20;

/**
 * Las opciones que llegan del schema remoto se filtran contra este catálogo: el backend
 * sigue aceptando tipos que esta operación no maneja (DVI, por ejemplo) y ofrecerlos sólo
 * agrega ruido a la grilla. Contrapartida asumida: un tipo nuevo del backend no aparece
 * hasta agregarlo a `ALLOWED_PORT_TYPES`.
 */
export const filterPortOptions = (
	options: Array<{ value: string; label: string }>,
): Array<{ value: string; label: string }> =>
	options.filter((option) => (ALLOWED_PORT_TYPES as readonly string[]).includes(option.value));

/** Total de puertos del desglose. Sólo para mostrar: el servidor calcula el suyo. */
export const sumPortTypeCounts = (counts: PortTypeCounts | null | undefined): number =>
	Object.values(counts ?? {}).reduce((total, count) => total + (Number(count) || 0), 0);

/**
 * Deja el desglose en la forma que acepta el backend: sólo claves del catálogo y sólo
 * cantidades enteras dentro del rango. Un tipo en cero se omite, no se envía en 0.
 */
export const normalizePortTypeCounts = (
	value: unknown,
	allowedKeys: readonly string[] = ALLOWED_PORT_TYPES,
	min: number = MIN_PORT_TYPE_COUNT,
	max: number = MAX_PORT_TYPE_COUNT,
): PortTypeCounts => {
	// Las revisiones guardadas antes de este contrato tienen una lista de tipos
	// (`['hdmi','usb_c']`), que el backend ahora rechaza con 422. Se convierte contando
	// repeticiones, que es exactamente lo que la lista representaba.
	const entries: Array<[string, unknown]> = Array.isArray(value)
		? Object.entries(
				value.reduce<PortTypeCounts>((counts, item) => {
					if (typeof item !== 'string') return counts;
					return { ...counts, [item]: (counts[item] ?? 0) + 1 };
				}, {}),
			)
		: Object.entries((value ?? {}) as Record<string, unknown>);

	return entries.reduce<PortTypeCounts>((counts, [type, rawCount]) => {
		if (!allowedKeys.includes(type)) return counts;

		const count = Math.trunc(Number(rawCount));
		if (!Number.isFinite(count) || count < min) return counts;

		return { ...counts, [type]: Math.min(count, max) };
	}, {});
};

/** Aplica una cantidad a un tipo. Cero (o menos) borra la clave, no la deja en 0. */
export const setPortTypeCount = (
	counts: PortTypeCounts,
	type: string,
	count: number,
): PortTypeCounts => {
	const rest = Object.fromEntries(Object.entries(counts).filter(([key]) => key !== type));
	return count > 0 ? { ...rest, [type]: count } : rest;
};
