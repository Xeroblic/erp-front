import { describe, expect, it } from 'vitest';
import type { IStockReceipt } from '@/interface/procurement.interface';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES } from '../../types';
import type { IStockReceiptFormValues } from '../../types';
import { switchReceiptMode, toFormValues } from '../stockReceiptFormValues';

/** Sólo los campos que lee `toFormValues`. */
const manualReceipt = {
	id: 70,
	purchase_document: null,
	warehouse: { id: 8 },
	supplier: { id: 7 },
	received_on: '2026-09-04',
	reason: null,
	notes: null,
	items: [
		{
			id: 901,
			purchase_document_line_id: null,
			product: { id: 31 },
			quantity: 3,
			cost: { entered_unit_amount: '1500.00', entered_basis: 'net' },
		},
		{
			id: 902,
			purchase_document_line_id: null,
			product: { id: 32 },
			quantity: 1,
			cost: { entered_unit_amount: null, entered_basis: 'unknown' },
		},
	],
} as unknown as IStockReceipt;

describe('toFormValues', () => {
	it('alta: abre «con documento», sin líneas y con la bodega por omisión', () => {
		expect(toFormValues(null, 8)).toEqual({
			...EMPTY_RECEPCION_VALUES,
			warehouse_id: 8,
			items: [],
		});
	});

	it('alta desde un documento: lo deja elegido', () => {
		const values = toFormValues(null, '', 44);

		expect(values.mode).toBe('with_document');
		expect(values.purchase_document_id).toBe(44);
		expect(values.items).toEqual([]);
	});

	it('corrección: toma modo, bodega, proveedor y líneas de la recepción', () => {
		expect(toFormValues(manualReceipt, 15)).toEqual({
			mode: 'manual',
			purchase_document_id: '',
			warehouse_id: 8,
			supplier_id: 7,
			received_on: '2026-09-04',
			reason: '',
			notes: '',
			items: [
				{
					id: 901,
					purchase_document_line_id: '',
					product_id: 31,
					quantity: '3',
					unit_cost: '1500.00',
					unit_cost_basis: 'net',
				},
				{
					id: 902,
					purchase_document_line_id: '',
					product_id: 32,
					quantity: '1',
					unit_cost: '',
					// `unknown` no es una base elegible en el formulario.
					unit_cost_basis: '',
				},
			],
		});
	});
});

describe('switchReceiptMode', () => {
	const common = {
		warehouse_id: 8,
		received_on: '2026-09-04',
		notes: 'Llegó en dos cajas',
	} as const;

	it('a «sin documento»: suelta el documento y parte con una línea vacía', () => {
		const withDocument: IStockReceiptFormValues = {
			...EMPTY_RECEPCION_VALUES,
			...common,
			purchase_document_id: 44,
			items: [{ ...EMPTY_RECEPCION_LINE, purchase_document_line_id: 601, quantity: '5' }],
		};

		expect(switchReceiptMode(withDocument, 'manual')).toEqual({
			...withDocument,
			mode: 'manual',
			purchase_document_id: '',
			items: [{ ...EMPTY_RECEPCION_LINE }],
		});
	});

	it('a «con documento»: suelta motivo, proveedor y líneas manuales', () => {
		const manual: IStockReceiptFormValues = {
			...EMPTY_RECEPCION_VALUES,
			...common,
			mode: 'manual',
			supplier_id: 7,
			reason: 'Devolución',
			items: [{ ...EMPTY_RECEPCION_LINE, product_id: 31 }],
		};

		expect(switchReceiptMode(manual, 'with_document')).toEqual({
			...manual,
			mode: 'with_document',
			supplier_id: '',
			reason: '',
			items: [],
		});
	});

	it('la línea vacía es una copia: editarla no altera la plantilla compartida', () => {
		const next = switchReceiptMode(EMPTY_RECEPCION_VALUES, 'manual');

		expect(next.items[0]).not.toBe(EMPTY_RECEPCION_LINE);
	});
});
