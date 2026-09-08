export const HARDWARE_NULLABLE_FIELDS = [
	'ram_size',
	'ram_slots',
	'ram_type',
	'storage_size',
	'storage_technology',
] as const;

export const applyHardwareAbsenceToPayload = (
	data: Record<string, unknown>,
): Record<string, unknown> => ({
	...data,
	...(data.has_no_ram === true
		? {
				ram_size: null,
				ram_slots: null,
				ram_type: null,
			}
		: {}),
	...(data.has_no_storage === true
		? {
				storage_size: null,
				storage_technology: null,
			}
		: {}),
});

/**
 * Campos que el servidor calcula a partir de otros y que el formulario sólo muestra.
 *
 * `loose_ports_count` deriva del desglose `loose_port_types`; el schema lo publica con
 * `derived_from` y su hint pide explícitamente no enviarlo. Sigue viviendo en el estado del
 * formulario porque se hidrata desde la respuesta, así que hay que quitarlo del payload.
 */
export const DERIVED_TECHNICAL_REVIEW_FIELDS = ['loose_ports_count'] as const;

/**
 * Campos que sólo existen en el estado del formulario: el backend no los declara en su
 * contrato ni tiene columna donde guardarlos, así que viajaban al vacío (Laravel ignora las
 * claves desconocidas en silencio, no las rechaza).
 *
 * - `battery_health` es la **etiqueta** de `battery_status` («Buena», «Sin Batería»), que se
 *   calcula acá para mostrarla. Lo que se persiste es el token en `battery_status`, o el
 *   número en `battery_percentage` cuando el equipo no es Dell.
 * - `screen_defects_count` quedó reemplazado por `spots_count` y `dead_pixels_count`.
 * - `second_battery_condition` es una columna que existe en la base pero que nunca recibió
 *   una fila, y el formulario le escribía la etiqueta en vez del token, así que el backend
 *   la habría rechazado. Salió del contrato junto con `battery_condition`.
 */
export const FORM_ONLY_TECHNICAL_REVIEW_FIELDS = [
	'battery_health',
	'screen_defects_count',
	'battery_condition',
	'second_battery_condition',
] as const;

const NON_PAYLOAD_FIELDS: readonly string[] = [
	...DERIVED_TECHNICAL_REVIEW_FIELDS,
	...FORM_ONLY_TECHNICAL_REVIEW_FIELDS,
];

export const filterTechnicalReviewPayload = (
	data: Record<string, unknown>,
	nullableFields: readonly string[],
): Record<string, unknown> => {
	const normalizedData = applyHardwareAbsenceToPayload(data);

	return Object.fromEntries(
		Object.entries(normalizedData).filter(([key, value]) => {
			if (NON_PAYLOAD_FIELDS.includes(key)) return false;
			if (nullableFields.includes(key)) return value !== undefined && value !== '';
			return value !== null && value !== undefined && value !== '';
		}),
	);
};
