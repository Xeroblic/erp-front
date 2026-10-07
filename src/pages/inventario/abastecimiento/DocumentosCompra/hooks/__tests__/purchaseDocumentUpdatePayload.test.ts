import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getPurchaseDocument,
	resetPurchaseDocumentsStoreForTests,
	updatePurchaseDocument,
} from '@/mocks/services/purchaseDocuments.mock';
import { getProcurementSupplier } from '@/mocks/services/procurementSuppliers.mock';
import { toFormValues, toUpdatePayload } from '../usePurchaseDocumentForm';

/**
 * Quien edita un documento sin `view-procurement-supplier` recibe 403 al
 * consultar un proveedor. Si la edición reenvía el proveedor que no cambió,
 * el servicio lo vuelve a resolver y la edición termina en «El proveedor no
 * existe». Se prueba contra el doble de documentos, que vuelve a resolver el
 * proveedor que recibe; la consulta de proveedores siempre responde 403.
 */

vi.mock('@/mocks/services/procurementSuppliers.mock', async (importOriginal) => {
	const mock =
		await importOriginal<typeof import('@/mocks/services/procurementSuppliers.mock')>();
	return { ...mock, getProcurementSupplier: vi.fn(mock.getProcurementSupplier) };
});

const getSupplierMock = vi.mocked(getProcurementSupplier);

const SUBSIDIARY_ID = 4;
const DRAFT_INVOICE_ID = 42; // draftInvoiceDocument de `procurement.db.ts`, proveedor 7

beforeEach(() => {
	getSupplierMock.mockRejectedValue({ response: { status: 403, data: {} } });
});

afterEach(() => {
	resetPurchaseDocumentsStoreForTests();
	getSupplierMock.mockReset();
});

describe('toUpdatePayload — proveedor en la edición de un documento', () => {
	it('editar una factura sin tocar el proveedor no lo reenvía ni lo consulta', async () => {
		const { data: document, headers } = await getPurchaseDocument(
			SUBSIDIARY_ID,
			DRAFT_INVOICE_ID,
		);
		const values = { ...toFormValues(document, 'invoice'), notes: 'Nota corregida' };

		const payload = toUpdatePayload(values, document);
		const { data: updated } = await updatePurchaseDocument(
			SUBSIDIARY_ID,
			DRAFT_INVOICE_ID,
			payload,
			{ etag: headers.etag },
		);

		expect(payload).not.toHaveProperty('supplier_id');
		expect(getSupplierMock).not.toHaveBeenCalled();
		expect(updated.notes).toBe('Nota corregida');
		expect(updated.supplier?.id).toBe(document.supplier?.id);
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
