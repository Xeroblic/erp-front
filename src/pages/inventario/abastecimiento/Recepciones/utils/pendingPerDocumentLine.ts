/**
 * Línea «con documento» tal como la entrega Yup al validar: los campos llegan
 * ya convertidos a número, o ausentes.
 */
export interface IValidatedDocumentLine {
	purchase_document_line_id?: number;
	pending_quantity?: number;
	quantity?: number;
}

/**
 * Una recepción corregida puede traer varias filas contra la misma línea del
 * documento: el tope por fila no alcanza, la suma de esas filas tampoco puede
 * superar lo pendiente de la línea. Sin `pending_quantity` no hay tope que
 * comparar y la línea se acepta.
 */
export const withinPendingPerDocumentLine = (items: IValidatedDocumentLine[]): boolean => {
	const totals = new Map<number, { sum: number; pending: number | undefined }>();
	items.forEach((line) => {
		if (line.purchase_document_line_id === undefined) return;
		const current = totals.get(line.purchase_document_line_id) ?? {
			sum: 0,
			pending: line.pending_quantity,
		};
		totals.set(line.purchase_document_line_id, {
			sum: current.sum + (line.quantity ?? 0),
			pending: current.pending ?? line.pending_quantity,
		});
	});
	return [...totals.values()].every(
		({ sum, pending }) => pending === undefined || sum <= pending,
	);
};
