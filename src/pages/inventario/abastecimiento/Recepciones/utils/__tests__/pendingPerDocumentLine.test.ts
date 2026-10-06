import { describe, expect, it } from 'vitest';
import { withinPendingPerDocumentLine } from '../pendingPerDocumentLine';

describe('withinPendingPerDocumentLine', () => {
	it('acepta varias filas de una línea mientras su suma no supere lo pendiente', () => {
		expect(
			withinPendingPerDocumentLine([
				{ purchase_document_line_id: 601, pending_quantity: 5, quantity: 2 },
				{ purchase_document_line_id: 601, pending_quantity: 5, quantity: 3 },
			]),
		).toBe(true);
	});

	it('rechaza filas que caben una a una pero juntas superan lo pendiente', () => {
		expect(
			withinPendingPerDocumentLine([
				{ purchase_document_line_id: 601, pending_quantity: 5, quantity: 3 },
				{ purchase_document_line_id: 601, pending_quantity: 5, quantity: 3 },
			]),
		).toBe(false);
	});

	it('suma por línea: el exceso de una no se compensa con el saldo de otra', () => {
		expect(
			withinPendingPerDocumentLine([
				{ purchase_document_line_id: 601, pending_quantity: 2, quantity: 3 },
				{ purchase_document_line_id: 602, pending_quantity: 9, quantity: 1 },
			]),
		).toBe(false);
	});

	it('toma el tope de cualquier fila de la línea, aunque la primera no lo traiga', () => {
		expect(
			withinPendingPerDocumentLine([
				{ purchase_document_line_id: 601, quantity: 3 },
				{ purchase_document_line_id: 601, pending_quantity: 4, quantity: 2 },
			]),
		).toBe(false);
	});

	it('sin tope conocido o sin línea del documento, no bloquea', () => {
		expect(
			withinPendingPerDocumentLine([
				{ purchase_document_line_id: 601, quantity: 99 },
				{ pending_quantity: 1, quantity: 50 },
			]),
		).toBe(true);
	});
});
