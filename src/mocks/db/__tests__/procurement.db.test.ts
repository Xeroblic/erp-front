import { describe, expect, it } from 'vitest';
import {
	inventoryStockEnvelope,
	procurementCosts,
	procurementProducts,
} from '@/mocks/db/procurement.db';
import { parseDecimalString } from '@/utils/procurementDecimal.util';

/**
 * El mock **no es libre**: se copia de los ejemplos del contrato. Estas pruebas
 * recorren todos los fixtures para validar lo que el tipo no puede expresar:
 * la escala decimal, las cantidades enteras, `cost_basis` coherente con el
 * costo y la identidad neto + IVA = bruto. Las claves y sus tipos ya los
 * garantiza TypeScript, y los valores puntuales de cada fixture los ejercitan
 * las pruebas de los componentes que los consumen.
 */

const TWO_DECIMALS = /^-?\d+\.\d{2}$/;

const expectTwoDecimals = (value: string | null, label: string) => {
	if (value === null) return;
	expect(value, `${label} debe ser un decimal de dos posiciones`).toMatch(TWO_DECIMALS);
};

describe('fixtures de producto', () => {
	it.each(procurementProducts.map((product) => [product.sku, product] as const))(
		'%s transporta los importes como decimales de dos posiciones',
		(_sku, product) => {
			expectTwoDecimals(product.price, 'price');
			expectTwoDecimals(product.offer_price, 'offer_price');
			expectTwoDecimals(product.cost, 'cost');
		},
	);

	it('declara cost_basis unknown cuando no hay costo demostrable', () => {
		const withoutCost = procurementProducts.filter((product) => product.cost === null);

		expect(withoutCost.length).toBeGreaterThan(0);
		withoutCost.forEach((product) => {
			expect(product.cost_basis).toBe('unknown');
		});
	});
});

describe('fixtures de costo', () => {
	it.each(Object.entries(procurementCosts))(
		'%s transporta los importes como decimales de dos posiciones',
		(_id, cost) => {
			expectTwoDecimals(cost.entered_unit_amount, 'entered_unit_amount');
			expectTwoDecimals(cost.net_unit_amount, 'net_unit_amount');
			expectTwoDecimals(cost.vat_unit_amount, 'vat_unit_amount');
			expectTwoDecimals(cost.gross_unit_amount, 'gross_unit_amount');
			expectTwoDecimals(cost.effective_unit_amount, 'effective_unit_amount');
			expectTwoDecimals(cost.vat_rate_percent, 'vat_rate_percent');
		},
	);

	it.each(Object.entries(procurementCosts))(
		'%s mantiene neto + IVA = bruto tras el redondeo',
		(_id, cost) => {
			if (cost.net_unit_amount === null) return;

			const net = parseDecimalString(cost.net_unit_amount);
			const vat = parseDecimalString(cost.vat_unit_amount);
			const gross = parseDecimalString(cost.gross_unit_amount);

			expect(net).not.toBeNull();
			expect((net ?? 0n) + (vat ?? 0n)).toBe(gross);
		},
	);
});

describe('fixtures de stock', () => {
	it('usa cantidades enteras y desgloses que no se suman entre sí', () => {
		inventoryStockEnvelope.data.forEach((row) => {
			[
				row.physical_quantity,
				row.fit_quantity,
				row.unfit_quantity,
				row.documented_quantity,
				row.undocumented_quantity,
			].forEach((quantity) => {
				expect(Number.isInteger(quantity)).toBe(true);
			});

			// Condición y documentación son dos desgloses independientes del mismo
			// físico: cada uno cierra contra el total, y no se suman entre sí.
			expect(row.fit_quantity + row.unfit_quantity).toBe(row.physical_quantity);
			expect(row.documented_quantity + row.undocumented_quantity).toBe(row.physical_quantity);
		});
	});
});
