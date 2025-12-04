/**
 * Normaliza fechas entre input HTML (YYYY-MM-DD) y API.
 */

// Convierte variantes comunes a YYYY-MM-DD (o retorna '')
export function toInputDate(value?: string | null): string {
	if (!value) return '';
	const s = String(value).trim();
	if (!s) return '';

	// Ya en formato input
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

	// dd-mm-aaaa -> aaaa-mm-dd
	const m1 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;

	// ISO 8601
	const d = new Date(s);
	if (!isNaN(d.getTime())) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}
	return '';
}

// Asegura aaaa-mm-dd para la API desde input o dd-mm-aaaa
export function toApiDate(value?: string | null): string | null {
	if (!value) return null;
	const s = String(value).trim();
	if (!s) return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
	const m1 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
	const d = new Date(s);
	if (!isNaN(d.getTime())) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}
	return null;
}

export default {
	toInputDate,
	toApiDate,
};
