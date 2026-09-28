import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getPurchaseDocument,
	resetPurchaseDocumentsStoreForTests,
	updatePurchaseDocument,
} from '@/services/procurement/purchaseDocuments.service';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
import { toFormValues, toUpdatePayload } from '../useDocumentoCompraForm';

/**
 * Quien edita un documento sin `view-procurement-supplier` recibe 403 al
 * consultar un proveedor. Si la edición reenvía el proveedor que no cambió,
 * el servicio lo vuelve a resolver y la edición termina en «El proveedor no
 * existe». Acá la consulta de proveedores siempre responde 403.
 */

vi.mock('@/services/procurement/procurementSuppliers.service', async () => {
	const mock = await import('@/mocks/services/procurementSuppliers.mock');
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
