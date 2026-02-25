export function formatDateInput(val: string): string {
	if (!val) return '';
	const clean = val.replace(/\D/g, '').slice(0, 8);
	let result = '';
	if (clean.length > 0) result += clean.slice(0, 2);
	if (clean.length > 2) result += '/' + clean.slice(2, 4);
	if (clean.length > 4) result += '/' + clean.slice(4, 8);
	return result;
}

export function parseFormattedDate(val: string): Date | null {
	if (!val || val.length !== 10) return null;
	const parts = val.split('/');
	if (parts.length !== 3) return null;
	const day = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10);
	const year = parseInt(parts[2], 10);

	if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000 || year > 3000) return null;

	const d = new Date(year, month - 1, day, 0, 0, 0);
	if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) {
		return null;
	}
	return d;
}
