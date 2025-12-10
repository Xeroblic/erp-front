/**
 * Utility functions for formatting data display
 */

/**
 * Format currency values
 */
export const formatCurrency = (
	amount: number,
	currency: string = 'USD',
	locale: string = 'es-ES',
): string => {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
};

/**
 * Format date values
 */
export const formatDate = (
	date: string | Date,
	locale: string = 'es-CL',
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	},
): string => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format datetime values
 */
export const formatDateTime = (
	date: string | Date,
	locale: string = 'es-ES',
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	},
): string => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format numbers with locale-specific formatting
 */
export const formatNumber = (
	number: number,
	locale: string = 'es-ES',
	options: Intl.NumberFormatOptions = {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	},
): string => {
	return new Intl.NumberFormat(locale, options).format(number);
};

/**
 * Format percentage values
 */
export const formatPercentage = (
	value: number,
	locale: string = 'es-ES',
	decimals: number = 2,
): string => {
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value / 100);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
	// Remove all non-numeric characters
	const cleaned = phone.replace(/\D/g, '');

	// Format as (XXX) XXX-XXXX
	if (cleaned.length === 10) {
		return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
	}

	// Return original if not 10 digits
	return phone;
};

/**
 * Format relative time (e.g., "hace 2 horas", "en 3 días")
 */
export const formatRelativeTime = (date: string | Date, locale: string = 'es'): string => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffInMs = dateObj.getTime() - now.getTime();
	const diffInSeconds = Math.floor(diffInMs / 1000);
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	const diffInHours = Math.floor(diffInMinutes / 60);
	const diffInDays = Math.floor(diffInHours / 24);

	if (Math.abs(diffInDays) > 7) {
		return formatDate(dateObj, locale);
	}

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

	if (Math.abs(diffInDays) >= 1) {
		return rtf.format(diffInDays, 'day');
	}
	if (Math.abs(diffInHours) >= 1) {
		return rtf.format(diffInHours, 'hour');
	}
	if (Math.abs(diffInMinutes) >= 1) {
		return rtf.format(diffInMinutes, 'minute');
	}

	return rtf.format(diffInSeconds, 'second');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
	return text.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
	);
};

/**
 * Format document number (add separators)
 */
export const formatDocumentNumber = (number: string | number): string => {
	const str = number.toString();
	return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Format inventory quantity with unit
 */
export const formatQuantity = (quantity: number, unit?: string, decimals: number = 2): string => {
	const formattedQuantity = formatNumber(quantity, 'es-ES', {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	});

	return unit ? `${formattedQuantity} ${unit}` : formattedQuantity;
};

/**
 * Format address as single line
 */
export const formatAddress = (address: {
	street?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
}): string => {
	const parts = [
		address.street,
		address.city,
		address.state,
		address.postal_code,
		address.country,
	].filter(Boolean);

	return parts.join(', ');
};

/**
 * Format tax ID (RUT, RFC, etc.)
 */
export const formatTaxId = (taxId: string, format: 'RUT' | 'RFC' | 'NIT' = 'RFC'): string => {
	const cleaned = taxId.replace(/\D/g, '');

	switch (format) {
		case 'RUT':
			// Format Chilean RUT: XX.XXX.XXX-X
			if (cleaned.length >= 8) {
				const number = cleaned.slice(0, -1);
				const verifier = cleaned.slice(-1);
				return `${number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${verifier}`;
			}
			break;
		case 'RFC':
			// Mexican RFC format
			return taxId.toUpperCase();
		case 'NIT':
			// Colombian NIT format
			return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	return taxId;
};
