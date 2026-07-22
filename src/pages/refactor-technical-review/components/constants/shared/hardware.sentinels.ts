export const HARDWARE_ABSENT_VALUE = '0';

export const HARDWARE_ABSENT_LABEL = 'No tiene';

export const isHardwareAbsent = (value: unknown): boolean => value === HARDWARE_ABSENT_VALUE;

export const formatHardwareDisplay = (value: unknown): string => {
	if (isHardwareAbsent(value)) return HARDWARE_ABSENT_LABEL;
	if (value === null || value === undefined || value === '') return '-';
	return String(value);
};
