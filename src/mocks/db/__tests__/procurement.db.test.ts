import { describe, expect, it } from 'vitest';
import {
	allowedActionsByState,
	inventoryStockEnvelope,
	procurementCosts,
	procurementProducts,
	unknownCost,
} from '@/mocks/db/procurement.db';
import type { IProcurementCost, IProcurementProduct } from '@/interface/procurement.interface';
import { parseDecimalString } from '@/utils/procurementDecimal.util';

/**
 * El mock **no es libre**: se copia de los ejemplos del contrato. Estas pruebas
 * son el guardarraíl de esa regla — validan que los fixtures cumplen la forma y
 * las invariantes que el contrato promete, para que reemplazarlos por la llamada
 * real no obligue a tocar un componente.
 *
 * TypeScript ya obliga a que las claves existan; lo que se comprueba acá es lo
 * que el tipo no puede expresar: la escala decimal, las cantidades enteras, la
 * distinción entre `null` y `[]`, y la identidad neto + IVA = bruto.
 */

const TWO_DECIMALS = /^-?\d+\.\d{2}$/;

const expectTwoDecimals = (value: string | null, label: string) => {
	if (value === null) return;
	expect(value, `${label} debe ser un decimal de dos posiciones`).toMatch(TWO_DECIMALS);
};

const PRODUCT_KEYS: (keyof IProcurementProduct)[] = [
	'id',
	'sku',
	'commercial_sku',
	'name',
	'short_description',
	'serial_tracking',
	'grade',
	'currency_code',
	'price',
	'offer_price',
	'cost',
	'cost_basis',
	'brand',
	'categories',
	'image',
	'is_active',
];

const COST_KEYS: (keyof IProcurementCost)[] = [
	'currency_code',
	'entered_unit_amount',
	'entered_basis',
	'vat_rate_percent',
	'net_unit_amount',
	'vat_unit_amount',
	'gross_unit_amount',
	'effective_unit_amount',
	'effective_basis',
	'source',
	'calculation',
];

describe('fixtures de producto', () => {
	it.each(procurementProducts.map((product) => [product.sku, product] as const))(
		'%s declara todas las claves pactadas de la ficha',
		(_sku, product) => {
			// «No omitir claves pactadas porque una relación no se cargó»: una ficha
			// a la que le falte `image` obliga a cada vista a defenderse sola.
			PRODUCT_KEYS.forEach((key) => {
				expect(product).toHaveProperty(key);
			});
		},
	);

	it.each(procurementProducts.map((product) => [product.sku, product] as const))(
		'%s usa null para la ausencia singular y [] para la colección vacía',
		(_sku, product) => {
			expect(product.categories).toBeInstanceOf(Array);
			// `brand` ausente es null, nunca `{}` ni una cadena vacía.
			expect(product.brand === null || typeof product.brand === 'object').toBe(true);
			expect(product.image === null || typeof product.image === 'object').toBe(true);
		},
	);

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
		'%s declara todas las claves del bloque',
		(_id, cost) => {
			COST_KEYS.forEach((key) => {
				expect(cost).toHaveProperty(key);
			});
		},
	);

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

	it('deja el costo desconocido con importes y tasa en null, no en cero', () => {
		// La trampa que este fixture existe para prevenir: `"0.00"` se formatea
		// como $0 y afirma que la unidad fue gratis.
		expect(unknownCost.entered_unit_amount).toBeNull();
		expect(unknownCost.net_unit_amount).toBeNull();
		expect(unknownCost.vat_unit_amount).toBeNull();
		expect(unknownCost.gross_unit_amount).toBeNull();
		expect(unknownCost.effective_unit_amount).toBeNull();
		expect(unknownCost.vat_rate_percent).toBeNull();
		expect(unknownCost.effective_basis).toBe('unknown');
		expect(unknownCost.source).toBe('unknown');
		expect(unknownCost.calculation).toBe('unknown');
	});

	it('anula el monto ingresado en el agregado heterogéneo', () => {
		expect(procurementCosts.mixedBasisCost.entered_unit_amount).toBeNull();
		expect(procurementCosts.mixedBasisCost.entered_basis).toBeNull();
		expect(procurementCosts.mixedBasisCost.effective_basis).toBe('mixed');
	});
});

describe('fixtures de allowed_actions y envoltorio', () => {
	it('entrega siempre un array, también cuando no hay acciones', () => {
		Object.values(allowedActionsByState).forEach((actions) => {
			expect(actions).toBeInstanceOf(Array);
		});
		expect(allowedActionsByState.documentCancelled).toEqual([]);
	});

	it('respeta la forma {data, context, links, meta} del contrato', () => {
		expect(inventoryStockEnvelope.data).toBeInstanceOf(Array);
		expect(inventoryStockEnvelope.context).toBeDefined();
		expect(inventoryStockEnvelope.links).toHaveProperty('next');
		expect(inventoryStockEnvelope.meta.per_page).toBe(15);
	});

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

	it('presenta Sin ubicación como warehouse null, no como ausencia de la clave', () => {
		expect(inventoryStockEnvelope.context).toHaveProperty('warehouse');
		expect(inventoryStockEnvelope.context?.warehouse).toBeNull();
		expect(inventoryStockEnvelope.context?.scope).toBe('unlocated');
	});
});
