import { describe, expect, it } from 'vitest';
import { parseDecimalString } from '@/utils/procurementDecimal.util';
import {
	isAggregatedCost,
	isMixedBasisCost,
	isUnknownCost,
	previewCostBreakdown,
} from '@/utils/procurementCost.util';
import { mixedBasisCost, netEnteredCost, unknownCost } from '@/mocks/db/procurement.db';

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
