import { describe, expect, it } from 'vitest';
import {
	divideRoundHalfUp,
	formatDecimalAmount,
	formatDecimalCents,
	parseDecimalString,
} from '@/utils/procurementDecimal.util';
import {
	isAggregatedCost,
	isMixedBasisCost,
	isUnknownCost,
	previewCostBreakdown,
} from '@/utils/procurementCost.util';
import { mixedBasisCost, netEnteredCost, unknownCost } from '@/mocks/db/procurement.db';

describe('procurementDecimal.util', () => {
	it('parsea el string decimal del contrato sin pasar por float', () => {
		expect(parseDecimalString('5712.00')).toBe(571200n);
		expect(parseDecimalString('0.1')).toBe(10n);
		expect(parseDecimalString('-4800.55')).toBe(-480055n);
	});

	it('devuelve null ante un importe que no es decimal, en vez de asumir cero', () => {
		expect(parseDecimalString('')).toBeNull();
		expect(parseDecimalString('abc')).toBeNull();
		expect(parseDecimalString(null)).toBeNull();
		expect(parseDecimalString(undefined)).toBeNull();
	});

	it('conserva los centavos que un float perdería', () => {
		// 0.1 + 0.2 en float da 0.30000000000000004; sobre centésimas es exacto.
		const total = (parseDecimalString('0.1') ?? 0n) + (parseDecimalString('0.2') ?? 0n);

		expect(formatDecimalCents(total)).toBe('0.30');
	});

	it('redondea half-up, no half-even', () => {
		// 2,5 → 3 y 3,5 → 4: half-even daría 2 y 4.
		expect(divideRoundHalfUp(5n, 2n)).toBe(3n);
		expect(divideRoundHalfUp(7n, 2n)).toBe(4n);
	});

	it('formatea en es-CL y no convierte un importe desconocido en $0', () => {
		expect(formatDecimalAmount('5712.00', 'CLP')).toBe('$5.712,00');
		expect(formatDecimalAmount('1234567.89', 'CLP')).toBe('$1.234.567,89');
		expect(formatDecimalAmount(null, 'CLP')).toBeNull();
	});
});

describe('previewCostBreakdown', () => {
	it('deriva IVA y bruto desde una entrada neta', () => {
		// Regla del contrato: IVA = neto × 0,19 half-up a 2; bruto = neto + IVA.
		expect(previewCostBreakdown('4800.00', 'net')).toEqual({
			net_unit_amount: '4800.00',
			vat_unit_amount: '912.00',
			gross_unit_amount: '5712.00',
			vat_rate_percent: '19.00',
		});
	});

	it('deriva neto e IVA desde una entrada bruta', () => {
		// Regla del contrato: neto = bruto / 1,19 half-up a 2; IVA = bruto − neto.
		expect(previewCostBreakdown('5712.00', 'gross')).toEqual({
			net_unit_amount: '4800.00',
			vat_unit_amount: '912.00',
			gross_unit_amount: '5712.00',
			vat_rate_percent: '19.00',
		});
	});

	it('mantiene neto + IVA = bruto tras redondear', () => {
		// 6100 / 1,19 = 5126,0504…: el IVA se calcula por diferencia, no por
		// producto, para que la identidad se conserve tras el redondeo.
		const preview = previewCostBreakdown('6100.00', 'gross');

		expect(preview).not.toBeNull();
		const net = parseDecimalString(preview?.net_unit_amount ?? '') ?? 0n;
		const vat = parseDecimalString(preview?.vat_unit_amount ?? '') ?? 0n;
		const gross = parseDecimalString(preview?.gross_unit_amount ?? '') ?? 0n;

		expect(preview?.net_unit_amount).toBe('5126.05');
		expect(net + vat).toBe(gross);
	});

	it('acepta la coma decimal ya normalizada y rechaza montos inválidos', () => {
		expect(previewCostBreakdown('100', 'net')?.gross_unit_amount).toBe('119.00');
		expect(previewCostBreakdown('', 'net')).toBeNull();
		expect(previewCostBreakdown('-100.00', 'net')).toBeNull();
	});
});

describe('detectores de estado del costo', () => {
	it('reconoce el costo desconocido del contrato', () => {
		expect(isUnknownCost(unknownCost)).toBe(true);
		expect(isUnknownCost(netEnteredCost)).toBe(false);
	});

	it('distingue el agregado de base mixta del de base única', () => {
		expect(isMixedBasisCost(mixedBasisCost)).toBe(true);
		expect(isMixedBasisCost(netEnteredCost)).toBe(false);
	});

	it('reconoce el agregado por la ausencia de monto ingresado', () => {
		expect(isAggregatedCost(mixedBasisCost)).toBe(true);
		expect(isAggregatedCost(netEnteredCost)).toBe(false);
	});
});
