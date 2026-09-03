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
	'dvi',
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
	dvi: 'DVI',
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
 * Contador de puertos «buenos» por cada tipo del catálogo: los cinco tipos de equipo
 * declaran exactamente los mismos puertos como buenos que como sueltos o defectuosos, con
 * el mismo nombre de campo. Es el espejo de `PORT_TYPE_COUNTERS` del backend, y las cinco
 * secciones arman su grilla desde acá para que ambos lados no vuelvan a desincronizarse.
 *
 * El orden es el del catálogo, que es el que el schema remoto devuelve.
 */
export interface PortCounterField {
	/** Tipo del catálogo, el mismo que usan `loose_port_types` y `defective_port_types`. */
	type: PortTypeValue;
	/** Columna que persiste la cantidad de puertos de ese tipo. */
	column: string;
	/** Rótulo largo, el mismo que publica el schema. */
	label: string;
	/** Rótulo corto, para las grillas que ponen el tipo encima del contador. */
	short: string;
}

export const PORT_COUNTER_FIELDS: readonly PortCounterField[] = [
	{ type: 'vga', column: 'vga_ports', label: 'Puertos VGA', short: 'VGA' },
	{ type: 'hdmi', column: 'hdmi_ports', label: 'Puertos HDMI', short: 'HDMI' },
	{
		type: 'displayport',
		column: 'displayport_ports',
		label: 'Puertos DisplayPort',
		short: 'DP',
	},
	{ type: 'dvi', column: 'dvi_ports', label: 'Puertos DVI', short: 'DVI' },
	{ type: 'usb_a', column: 'usb_a_ports', label: 'Puertos USB-A', short: 'USB-A' },
	{ type: 'usb_c', column: 'usb_c_ports', label: 'Puertos USB-C', short: 'USB-C' },
	{ type: 'sd_reader', column: 'sd_readers', label: 'Lectores SD', short: 'SD' },
	{ type: 'rj45', column: 'rj45_ports', label: 'Puertos RJ45', short: 'RJ45' },
	{ type: 'charging', column: 'charging_ports', label: 'Puertos de carga', short: 'Carga' },
];

export const MIN_PORT_TYPE_COUNT = 1;

/**
 * Techo de cordura del formulario, no una regla de negocio.
 *
 * El backend dejó de acotar los contadores y el desglose: el `max:10` que rechazaba una
 * docking con doce USB-A ya no existe, y el schema tampoco publica `value_max`. El único
 * límite que queda es el de la columna —`smallint` de PostgreSQL—, así que es el que el
 * formulario respeta: alcanza para cualquier equipo real y evita mandar un valor que la
 * base rechazaría por desbordamiento.
 */
export const MAX_PORT_COUNT = 32_767;

/**
 * Las opciones que llegan del schema remoto se filtran contra este catálogo, que hoy es el
 * mismo que publica el backend: el filtro queda como guarda ante un tipo que este
 * formulario todavía no sabe mostrar. Contrapartida asumida: un tipo nuevo del backend no
 * aparece hasta agregarlo a `ALLOWED_PORT_TYPES`.
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
	max: number = MAX_PORT_COUNT,
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
