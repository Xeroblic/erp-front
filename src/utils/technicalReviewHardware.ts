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

export const filterTechnicalReviewPayload = (
	data: Record<string, unknown>,
	nullableFields: readonly string[],
): Record<string, unknown> => {
	const normalizedData = applyHardwareAbsenceToPayload(data);

	return Object.fromEntries(
		Object.entries(normalizedData).filter(([key, value]) => {
			if (nullableFields.includes(key)) return value !== undefined && value !== '';
			return value !== null && value !== undefined && value !== '';
		}),
	);
};
