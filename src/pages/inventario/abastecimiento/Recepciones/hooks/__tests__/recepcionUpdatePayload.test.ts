import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getStockReceipt,
	resetStockReceiptsStoreForTests,
	updateStockReceipt,
} from '@/services/procurement/stockReceipts.service';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
import { toFormValues, toUpdatePayload } from '../useRecepcionForm';

/**
 * Misma regla que en documentos: corregir una recepción manual sin tocar el
 * proveedor no lo reenvía. Si lo reenviara, sin `view-procurement-supplier`
 * la consulta recibe 403 y la corrección termina en «El proveedor no existe».
 * Acá la consulta de proveedores siempre responde 403.
 */

vi.mock('@/services/procurement/procurementSuppliers.service', async () => {
	const mock = await import('@/mocks/services/procurementSuppliers.mock');
	return { ...mock, getProcurementSupplier: vi.fn(mock.getProcurementSupplier) };
});

const getSupplierMock = vi.mocked(getProcurementSupplier);

const SUBSIDIARY_ID = 4;
const DRAFT_MANUAL_ID = 70; // recepción manual en borrador de `procurement.db.ts`, proveedor 7

beforeEach(() => {
	getSupplierMock.mockRejectedValue({ response: { status: 403, data: {} } });
});

afterEach(() => {
	resetStockReceiptsStoreForTests();
	getSupplierMock.mockReset();
});

describe('toUpdatePayload — proveedor en la corrección de una recepción manual', () => {
	it('corregir sin tocar el proveedor no lo reenvía ni lo consulta', async () => {
		const { data: receipt, headers } = await getStockReceipt(SUBSIDIARY_ID, DRAFT_MANUAL_ID);
		const values = { ...toFormValues(receipt, ''), notes: 'Nota corregida' };

		const payload = toUpdatePayload(values, receipt);
		const { data: updated } = await updateStockReceipt(
			SUBSIDIARY_ID,
			DRAFT_MANUAL_ID,
			payload,
			{ etag: headers.etag },
		);

		expect(payload).not.toHaveProperty('supplier_id');
		expect(getSupplierMock).not.toHaveBeenCalled();
		expect(updated.notes).toBe('Nota corregida');
		expect(updated.supplier?.id).toBe(receipt.supplier?.id);
	});

	it('un proveedor distinto sí se envía', async () => {
		const { data: receipt } = await getStockReceipt(SUBSIDIARY_ID, DRAFT_MANUAL_ID);
		const values = { ...toFormValues(receipt, ''), supplier_id: 15 };

		expect(toUpdatePayload(values, receipt)).toHaveProperty('supplier_id', 15);
	});

	it('quitar el proveedor se envía como null', async () => {
		const { data: receipt } = await getStockReceipt(SUBSIDIARY_ID, DRAFT_MANUAL_ID);
		const values = { ...toFormValues(receipt, ''), supplier_id: '' as const };

		expect(toUpdatePayload(values, receipt)).toHaveProperty('supplier_id', null);
	});
});
