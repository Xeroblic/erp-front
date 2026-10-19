import { describe, expect, it } from 'vitest';
import type { IStockReceipt } from '@/interface/procurement.interface';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES } from '../../types';
import type { IStockReceiptFormValues } from '../../types';
import { toCreatePayload, toUpdatePayload } from '../stockReceiptPayload';

const withDocumentValues: IStockReceiptFormValues = {
	...EMPTY_RECEPCION_VALUES,
	mode: 'with_document',
	purchase_document_id: 44,
	warehouse_id: 8,
	received_on: '2026-09-04',
	notes: '   ',
	items: [
		{ ...EMPTY_RECEPCION_LINE, id: 901, purchase_document_line_id: 601, quantity: '5' },
		{ ...EMPTY_RECEPCION_LINE, purchase_document_line_id: 602, quantity: '0' },
	],
};

const manualValues: IStockReceiptFormValues = {
	...EMPTY_RECEPCION_VALUES,
	mode: 'manual',
	warehouse_id: 8,
	received_on: '2026-09-04',
	reason: '  Devolución de cliente  ',
	notes: ' Caja abierta ',
	items: [
		{
			...EMPTY_RECEPCION_LINE,
			product_id: 31,
			quantity: '3',
			unit_cost: '1500,5',
			unit_cost_basis: 'net',
		},
		{ ...EMPTY_RECEPCION_LINE, product_id: 32, quantity: '1' },
	],
};

describe('toCreatePayload', () => {
	it('con documento: sólo las líneas recibidas, sin motivo ni proveedor', () => {
		expect(toCreatePayload(withDocumentValues)).toEqual({
			purchase_document_id: 44,
			warehouse_id: 8,
			received_on: '2026-09-04',
			notes: null,
			items: [{ id: 901, purchase_document_line_id: 601, quantity: 5 }],
		});
	});

	it('sin documento: proveedor ausente como null, costo en decimal y textos recortados', () => {
		expect(toCreatePayload(manualValues)).toEqual({
			purchase_document_id: null,
			supplier_id: null,
			warehouse_id: 8,
			received_on: '2026-09-04',
			reason: 'Devolución de cliente',
			notes: 'Caja abierta',
			items: [
				{
					id: undefined,
					product_id: 31,
					quantity: 3,
					unit_cost: '1500.50',
					unit_cost_basis: 'net',
				},
				{
					id: undefined,
					product_id: 32,
					quantity: 1,
					unit_cost: null,
					unit_cost_basis: null,
				},
			],
		});
	});

	it('sin documento: un proveedor elegido viaja como número', () => {
		expect(toCreatePayload({ ...manualValues, supplier_id: 7 })).toHaveProperty(
			'supplier_id',
			7,
		);
	});
});

describe('toUpdatePayload', () => {
	const receipt = { supplier: null } as unknown as IStockReceipt;

	it('con documento: no envía motivo ni proveedor, y omite las líneas en 0', () => {
		expect(toUpdatePayload(withDocumentValues, receipt)).toEqual({
			warehouse_id: 8,
			received_on: '2026-09-04',
			notes: null,
			items: [{ id: 901, purchase_document_line_id: 601, quantity: 5 }],
		});
	});

	it('sin documento y sin proveedor antes ni ahora: no reenvía el proveedor', () => {
		const payload = toUpdatePayload(manualValues, receipt);

		expect(payload).not.toHaveProperty('supplier_id');
		expect(payload.reason).toBe('Devolución de cliente');
		expect(payload.items).toHaveLength(2);
	});
});
