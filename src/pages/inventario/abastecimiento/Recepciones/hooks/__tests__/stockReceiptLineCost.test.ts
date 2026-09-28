import { describe, expect, it } from 'vitest';
import { optionalCostEntrySchema } from '@/components/procurement';
import { displayedCostBasis, nextLineCost } from '../useStockReceiptForm';

/**
 * Costo de una línea de recepción manual. La base vacía se mostraba como
 * «Costo bruto c/ IVA» sin marcar y aun así el envío exigía «Indica si el
 * monto es neto o bruto», sin forma visible de hacerlo. Ahora la base vacía
 * se muestra neta, igual que el documento de compra, y escribir un monto fija
 * esa base; borrarlo deja ambos vacíos (costo desconocido).
 */

describe('displayedCostBasis', () => {
	it('sin base elegida se muestra neta, como el documento de compra', () => {
		expect(displayedCostBasis('')).toBe('net');
		expect(displayedCostBasis('net')).toBe('net');
		expect(displayedCostBasis('gross')).toBe('gross');
	});
});

describe('nextLineCost', () => {
	it('escribir un monto sin base fija la base que se muestra', () => {
		const next = nextLineCost({ unit_cost_basis: '' }, '$14.280');

		expect(next).toEqual({ unit_cost: '14280', unit_cost_basis: 'net' });
		expect(optionalCostEntrySchema.isValidSync(next)).toBe(true);
	});

	it('conserva la base que el usuario eligió', () => {
		expect(nextLineCost({ unit_cost_basis: 'gross' }, '$14.280')).toEqual({
			unit_cost: '14280',
			unit_cost_basis: 'gross',
		});
	});

	it('borrar el monto deja el costo desconocido, que sigue siendo válido', () => {
		const next = nextLineCost({ unit_cost_basis: 'net' }, '');

		expect(next).toEqual({ unit_cost: '', unit_cost_basis: '' });
		expect(optionalCostEntrySchema.isValidSync(next)).toBe(true);
	});
});
