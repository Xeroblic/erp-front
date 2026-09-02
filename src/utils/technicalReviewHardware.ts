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

export const filterTechnicalReviewPayload = (
	data: Record<string, unknown>,
	nullableFields: readonly string[],
): Record<string, unknown> => {
	const normalizedData = applyHardwareAbsenceToPayload(data);

	return Object.fromEntries(
		Object.entries(normalizedData).filter(([key, value]) => {
			if (DERIVED_TECHNICAL_REVIEW_FIELDS.includes(key as 'loose_ports_count')) return false;
			if (nullableFields.includes(key)) return value !== undefined && value !== '';
			return value !== null && value !== undefined && value !== '';
		}),
	);
};
