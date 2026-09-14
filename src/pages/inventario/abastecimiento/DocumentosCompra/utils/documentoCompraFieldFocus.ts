/**
 * Foco en el primer campo inválido del formulario de documento de compra, con
 * el mismo criterio que `CreateEditDeferredPaymentModal` (pagos diferidos):
 * al enviar con errores, el primer campo en orden visual se desplaza al centro
 * y recibe el foco.
 *
 * A diferencia de pagos diferidos, acá los `id` del DOM no coinciden con los
 * nombres de Formik (`supplier_id` → `documento-supplier`), así que cada campo
 * declara su `id` explícitamente.
 */

/** Rutas con punto de cada mensaje de error (`items.0.quantity`, `supplier_id`, …). */
export const collectValidationErrorPaths = (value: unknown, prefix = ''): string[] => {
	if (typeof value === 'string') return prefix ? [prefix] : [];
	if (Array.isArray(value))
		return value.flatMap((entry, index) =>
			collectValidationErrorPaths(entry, prefix ? `${prefix}.${index}` : String(index)),
		);
	if (value !== null && typeof value === 'object')
		return Object.entries(value).flatMap(([key, entry]) =>
			collectValidationErrorPaths(entry, prefix ? `${prefix}.${key}` : key),
		);
	return [];
};

/** Datos del documento, en el orden en que se ven en el modal: `[campo Formik, id del DOM]`. */
const DOCUMENT_FIELDS: ReadonlyArray<readonly [string, string]> = [
	['document_type', 'documento-type'],
	['supplier_id', 'documento-supplier'],
	['document_number', 'documento-number'],
	['issue_date', 'documento-issue-date'],
	['total_amount', 'documento-total-amount'],
	['notes', 'documento-notes'],
];

/** Campos de cada línea, en orden visual. El `id` de la línea es `items.{índice}.{campo}`. */
const LINE_FIELDS = ['quantity', 'product_id', 'unit_cost', 'unit_cost_basis'] as const;

/** La fila de envío se muestra después de las líneas. */
const SHIPPING_FIELDS: ReadonlyArray<readonly [string, string]> = [
	['shipping_cost', 'shipping-cost'],
	['shipping_cost_basis', 'shipping-cost-basis'],
];

export const getFirstInvalidDocumentoCompraFieldId = (errors: unknown): string | null => {
	const errorPaths = collectValidationErrorPaths(errors);
	const hasErrorAt = (fieldName: string): boolean =>
		errorPaths.some((path) => path === fieldName || path.startsWith(`${fieldName}.`));

	const documentField = DOCUMENT_FIELDS.find(([fieldName]) => hasErrorAt(fieldName));
	if (documentField) return documentField[1];

	const lineIndexes = [
		...new Set(
			errorPaths
				.map((path) => /^items\.(\d+)\./.exec(path)?.[1])
				.filter((index): index is string => index !== undefined)
				.map(Number),
		),
	].sort((first, second) => first - second);
	const lineField = lineIndexes
		.flatMap((lineIndex) => LINE_FIELDS.map((fieldName) => `items.${lineIndex}.${fieldName}`))
		.find(hasErrorAt);
	if (lineField) return lineField;

	const shippingField = SHIPPING_FIELDS.find(([fieldName]) => hasErrorAt(fieldName));
	return shippingField ? shippingField[1] : null;
};

/** Desplaza al centro y enfoca el primer campo inválido, si existe en el DOM. */
export const focusFirstInvalidDocumentoCompraField = (errors: unknown): void => {
	const fieldId = getFirstInvalidDocumentoCompraFieldId(errors);
	if (!fieldId) return;
	const field = document.getElementById(fieldId);
	if (!(field instanceof HTMLElement)) return;
	field.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
	field.focus({ preventScroll: true });
};
