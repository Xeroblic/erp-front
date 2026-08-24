export const priceFormat = (price: number): string => {
	return price.toLocaleString('es-CL', {
		style: 'currency',
		currency: 'CLP',
	});
};

export const priceFormatWhitDecimals = (price: number): string => {
	return price.toLocaleString('es-CL', {
		style: 'currency',
		currency: 'CLP',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};
