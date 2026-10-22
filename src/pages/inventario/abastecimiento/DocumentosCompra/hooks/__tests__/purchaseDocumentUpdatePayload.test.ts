import { describe, expect, it } from 'vitest';
import { getPurchaseDocument } from '@/mocks/services/purchaseDocuments.mock';
import { toFormValues, toUpdatePayload } from '../usePurchaseDocumentForm';

/**
 * Quien edita un documento sin `view-procurement-supplier` recibe 403 al
 * consultar un proveedor. Si la edición reenvía el proveedor que no cambió,
 * el backend lo vuelve a resolver y la edición termina en «El proveedor no
 * existe»: el proveedor sólo viaja cuando cambia.
 */

const SUBSIDIARY_ID = 4;
const DRAFT_INVOICE_ID = 42; // draftInvoiceDocument de `procurement.db.ts`, proveedor 7

describe('toUpdatePayload — proveedor en la edición de un documento', () => {
	it('editar una factura sin tocar el proveedor no lo reenvía', async () => {
		const { data: document } = await getPurchaseDocument(SUBSIDIARY_ID, DRAFT_INVOICE_ID);
		const values = { ...toFormValues(document, 'invoice'), notes: 'Nota corregida' };

		expect(toUpdatePayload(values, document)).not.toHaveProperty('supplier_id');
	});

	it('un proveedor distinto sí se envía', async () => {
		const { data: document } = await getPurchaseDocument(SUBSIDIARY_ID, DRAFT_INVOICE_ID);
		const values = { ...toFormValues(document, 'invoice'), supplier_id: 15 };

		expect(toUpdatePayload(values, document)).toHaveProperty('supplier_id', 15);
	});

	it('quitar el proveedor se envía como null', async () => {
		const { data: document } = await getPurchaseDocument(SUBSIDIARY_ID, DRAFT_INVOICE_ID);
		const values = { ...toFormValues(document, 'invoice'), supplier_id: '' as const };

		expect(toUpdatePayload(values, document)).toHaveProperty('supplier_id', null);
	});
});

describe('toUpdatePayload — costo de las líneas', () => {
	it('envía el costo de cada línea con dos decimales y su base', async () => {
		const { data: document } = await getPurchaseDocument(SUBSIDIARY_ID, DRAFT_INVOICE_ID);
		const values = toFormValues(document, 'invoice');
		const [firstLine] = values.items;
		values.items = [{ ...firstLine, unit_cost: '5712', unit_cost_basis: 'gross' }];

		expect(toUpdatePayload(values, document).items?.[0]).toMatchObject({
			unit_cost: '5712.00',
			unit_cost_basis: 'gross',
		});
	});

	it.each([
		['sin monto', { unit_cost: '', unit_cost_basis: 'net' as const }],
		['sin base', { unit_cost: '100', unit_cost_basis: '' as const }],
	])('una línea %s no se envía con un costo inventado', async (_case, cost) => {
		const { data: document } = await getPurchaseDocument(SUBSIDIARY_ID, DRAFT_INVOICE_ID);
		const values = toFormValues(document, 'invoice');
		values.items = [{ ...values.items[0], ...cost }];

		expect(() => toUpdatePayload(values, document)).toThrow();
	});
});
