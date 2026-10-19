import { describe, expect, it } from 'vitest';
import { EMPTY_DOCUMENTO_LINE, EMPTY_DOCUMENTO_VALUES } from '../../types';
import type { IPurchaseDocumentFormValues } from '../../types';
import {
	formatGrossTotal,
	getDocumentTotalCents,
	getLineGrossTotalCents,
	getShippingTotalCents,
} from '../purchaseDocumentTotals';

describe('getLineGrossTotalCents', () => {
	it('con costo bruto multiplica el unitario por la cantidad', () => {
		expect(getLineGrossTotalCents('2', '1000', 'gross')).toBe(200000n);
	});

	it('con costo neto suma el IVA antes de multiplicar', () => {
		expect(getLineGrossTotalCents('2', '1000', 'net')).toBe(238000n);
	});

	it('sin cantidad entera positiva, sin base o sin costo no calcula', () => {
		expect(getLineGrossTotalCents('0', '1000', 'gross')).toBeNull();
		expect(getLineGrossTotalCents('1.5', '1000', 'gross')).toBeNull();
		expect(getLineGrossTotalCents('2', '1000', '')).toBeNull();
		expect(getLineGrossTotalCents('2', '', 'gross')).toBeNull();
	});
});

describe('totales del documento', () => {
	const values: IPurchaseDocumentFormValues = {
		...EMPTY_DOCUMENTO_VALUES,
		include_shipping: true,
		shipping_cost: '5000',
		shipping_cost_basis: 'gross',
		items: [
			{ ...EMPTY_DOCUMENTO_LINE, quantity: '2', unit_cost: '1000', unit_cost_basis: 'gross' },
			// Línea incompleta: no suma, pero tampoco anula el total.
			{ ...EMPTY_DOCUMENTO_LINE, quantity: '3', unit_cost: '', unit_cost_basis: 'gross' },
		],
	};

	it('el envío cuenta como una línea de cantidad 1', () => {
		expect(getShippingTotalCents(values)).toBe(500000n);
	});

	it('sin envío marcado no hay total de envío, aunque quede un monto escrito', () => {
		expect(getShippingTotalCents({ ...values, include_shipping: false })).toBeNull();
	});

	it('suma las líneas calculables más el envío', () => {
		expect(getDocumentTotalCents(values)).toBe(700000n);
		expect(getDocumentTotalCents({ ...values, include_shipping: false })).toBe(200000n);
	});
});

describe('formatGrossTotal', () => {
	it('sin total devuelve null para que la vista muestre su marcador', () => {
		expect(formatGrossTotal(null)).toBeNull();
	});

	it('formatea los centavos como monto en pesos', () => {
		expect(formatGrossTotal(700000n)).toMatch(/7\.000/);
	});
});
