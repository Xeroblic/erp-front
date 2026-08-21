export const toPriceNumber = (value: string | number | null | undefined): number | null => {
	if (value === null || value === undefined || value === '') return null;
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : null;
};

export const pricesMatch = (
	a: string | number | null | undefined,
	b: string | number | null | undefined,
	backendFallback = false,
): boolean => {
	const na = toPriceNumber(a);
	const nb = toPriceNumber(b);
	if (na === null || nb === null) return backendFallback;
	return Math.abs(na - nb) < 0.01;
};
