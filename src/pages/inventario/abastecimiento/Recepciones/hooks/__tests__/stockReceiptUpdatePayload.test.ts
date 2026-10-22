import { describe, expect, it } from 'vitest';
import { getStockReceipt } from '@/mocks/services/stockReceipts.mock';
import { toFormValues } from '../../utils/stockReceiptFormValues';
import { toUpdatePayload } from '../../utils/stockReceiptPayload';

/**
 * Misma regla que en documentos: corregir una recepción manual sin tocar el
 * proveedor no lo reenvía. Si lo reenviara, sin `view-procurement-supplier`
 * la consulta recibe 403 y la corrección termina en «El proveedor no existe».
 */

const SUBSIDIARY_ID = 4;
const DRAFT_MANUAL_ID = 70; // recepción manual en borrador de `procurement.db.ts`, proveedor 7

describe('toUpdatePayload — proveedor en la corrección de una recepción manual', () => {
	it('corregir sin tocar el proveedor no lo reenvía', async () => {
		const { data: receipt } = await getStockReceipt(SUBSIDIARY_ID, DRAFT_MANUAL_ID);
		const values = { ...toFormValues(receipt, ''), notes: 'Nota corregida' };

		expect(toUpdatePayload(values, receipt)).not.toHaveProperty('supplier_id');
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
