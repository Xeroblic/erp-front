import { describe, expect, it } from 'vitest';
import { STOCK_STATUS_ORDER, visibleStockStatus } from '../stockStatus';

describe('visibleStockStatus', () => {
	it('sin disponible gana al estado del umbral', () => {
		expect(visibleStockStatus(0, 'healthy')).toBe('out');
		expect(visibleStockStatus(-2, 'critical')).toBe('out');
	});

	it('con disponible conserva el estado del umbral', () => {
		expect(visibleStockStatus(3, 'critical')).toBe('critical');
		expect(visibleStockStatus(3, 'unconfigured')).toBe('unconfigured');
	});

	it('ordena de más a menos urgente', () => {
		expect(STOCK_STATUS_ORDER).toEqual(['out', 'critical', 'unconfigured', 'healthy']);
	});
});
