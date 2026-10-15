import { describe, expect, it } from 'vitest';
import type { NotificationEventDTO } from '@/interface/notifications.interface';
import criticalStockProductLink from '../criticalStockLink';

const notice = (event: NotificationEventDTO | null) => ({ event });

const criticalEvent = (overrides: Partial<NotificationEventDTO> = {}): NotificationEventDTO => ({
	id: 10,
	type_key: 'inventory.critical-stock-entered',
	module: 'inventory',
	payload: { product_id: 42, product_name: 'Notebook Lenovo', threshold: 5 },
	...overrides,
});

describe('criticalStockProductLink', () => {
	it.each([
		'inventory.critical-stock-entered',
		'inventory.critical-stock-reminder',
		'inventory.critical-stock-recovered',
	])('%s enlaza a la ficha de inventario del producto con su permiso', (typeKey) => {
		expect(criticalStockProductLink(notice(criticalEvent({ type_key: typeKey })))).toEqual({
			to: '/inventario/stock/42',
			authority: ['view-product'],
		});
	});

	it('otro tipo de aviso no enlaza aunque traiga product_id', () => {
		expect(
			criticalStockProductLink(notice(criticalEvent({ type_key: 'product.updated' }))),
		).toBeNull();
	});

	it.each([
		['sin product_id', {}],
		['product_id nulo', { product_id: null }],
		['product_id como texto', { product_id: '42' }],
		['product_id no entero', { product_id: 4.2 }],
		['product_id cero', { product_id: 0 }],
	])('%s no enlaza', (_caso, payload) => {
		expect(criticalStockProductLink(notice(criticalEvent({ payload })))).toBeNull();
	});

	it('sin evento o sin payload no enlaza', () => {
		expect(criticalStockProductLink(notice(null))).toBeNull();
		expect(criticalStockProductLink(notice(criticalEvent({ payload: null })))).toBeNull();
	});
});
