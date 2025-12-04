/**
 * Technical Reviews - Field Helpers Constants
 * Helpers compartidos para manipulación de campos
 */

/**
 * Extraer valor de un campo que puede ser objeto {value, label} o string/number
 */
export const extractFieldValue = (field: any): string => {
	if (field == null) return '';
	if (typeof field === 'object' && field !== null) {
		if ('value' in field) return String(field.value ?? '');
		if ('label' in field) return String(field.label ?? '');
		return JSON.stringify(field);
	}
	return String(field);
};

/**
 * Extraer valor numérico de un string o número
 */
export const extractNumericValue = (value: any): number | null => {
	if (value == null) return null;
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const match = value.match(/-?\d+(?:\.\d+)?/);
		return match ? parseFloat(match[0]) : null;
	}
	return null;
};

/**
 * Normalizar valor de objeto {value, label} a string
 */
export const normalizeOptionValue = (value: any): string | null => {
	if (value == null) return null;
	if (typeof value === 'object' && value !== null && 'value' in value) {
		return String(value.value);
	}
	return String(value);
};

/**
 * Validar si un valor está vacío
 */
export const isEmpty = (value: any): boolean => {
	if (value == null) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (typeof value === 'number') return false;
	if (typeof value === 'boolean') return false;
	if (typeof value === 'object') {
		if ('value' in value) return isEmpty(value.value);
		return Object.keys(value).length === 0;
	}
	return true;
};

/**
 * Formatear porcentaje de batería
 */
export const formatBatteryPercentage = (value: number | null | undefined): string => {
	if (value == null) return 'N/A';
	return `${value}%`;
};

/**
 * Formatear RAM size (asegurar GB al final)
 */
export const formatRAMSize = (value: string | null | undefined): string => {
	if (!value) return '';
	const normalized = value.trim().toUpperCase();
	if (normalized.endsWith('GB')) return normalized;
	// Si es solo número, agregar GB
	if (/^\d+$/.test(normalized)) return `${normalized}GB`;
	return normalized;
};

/**
 * Formatear storage size (asegurar GB/TB al final)
 */
export const formatStorageSize = (value: string | null | undefined): string => {
	if (!value) return '';
	const normalized = value.trim().toUpperCase();
	if (normalized.endsWith('GB') || normalized.endsWith('TB')) return normalized;
	// Si es solo número, asumimos GB
	if (/^\d+$/.test(normalized)) return `${normalized}GB`;
	return normalized;
};

/**
 * Formatear watts (asegurar W al final)
 */
export const formatWatts = (value: string | null | undefined): string => {
	if (!value) return '';
	const normalized = value.trim().toUpperCase();
	if (normalized.endsWith('W')) return normalized;
	// Si es solo número, agregar W
	if (/^\d+$/.test(normalized)) return `${normalized}W`;
	return normalized;
};

/**
 * Formatear pulgadas (asegurar " al final)
 */
export const formatScreenInches = (value: string | null | undefined): string => {
	if (!value) return '';
	const normalized = value.trim();
	if (normalized.endsWith('"') || normalized.endsWith('\"')) return normalized;
	// Si es número con decimal o entero, agregar "
	if (/^\d+(\.\d+)?$/.test(normalized)) return `${normalized}"`;
	return normalized;
};

/**
 * Parsear battery_status que puede venir como porcentaje o categoría
 */
export const parseBatteryStatus = (
	value: string | number | null | undefined,
): {
	status: string | null;
	percentage: number | null;
} => {
	if (value == null) return { status: null, percentage: null };

	// Si es número, convertir a porcentaje y determinar status
	if (typeof value === 'number') {
		const percentage = value;
		let status = 'poor';
		if (percentage >= 80) status = 'excellent';
		else if (percentage >= 60) status = 'good';
		else if (percentage >= 40) status = 'fair';
		return { status, percentage };
	}

	// Si es string con %
	const strValue = String(value).trim();
	const percentMatch = strValue.match(/(\d+)\s*%?/);
	if (percentMatch) {
		const percentage = parseInt(percentMatch[1]);
		let status = 'poor';
		if (percentage >= 80) status = 'excellent';
		else if (percentage >= 60) status = 'good';
		else if (percentage >= 40) status = 'fair';
		return { status, percentage };
	}

	// Es una categoría
	const lowerValue = strValue.toLowerCase();
	if (['excellent', 'good', 'fair', 'poor', 'no_battery'].includes(lowerValue)) {
		return { status: lowerValue, percentage: null };
	}

	return { status: null, percentage: null };
};
