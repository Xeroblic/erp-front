export type HardwareDetails = Record<string, unknown>;

export const hasNoRam = (details: HardwareDetails): boolean => details.has_no_ram === true;
export const hasNoStorage = (details: HardwareDetails): boolean => details.has_no_storage === true;

export const getHardwareDisplayValue = (details: HardwareDetails, key: string): string | null => {
	if (key === 'ram_size' && hasNoRam(details)) return 'No tiene';
	if (key === 'storage_size' && hasNoStorage(details)) return 'No tiene';
	if (
		(hasNoRam(details) && (key === 'ram_slots' || key === 'ram_type')) ||
		(hasNoStorage(details) && key === 'storage_technology')
	) {
		return '';
	}
	return null;
};
