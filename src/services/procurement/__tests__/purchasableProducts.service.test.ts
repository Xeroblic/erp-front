import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	PURCHASABLE_PRODUCTS_PER_PAGE,
	searchPurchasableProducts,
} from '@/services/procurement/purchasableProducts.service';

/**
 * Consulta del catálogo real para las líneas de compra
 * (`SubsidiaryProductsController@index`): sólo productos no serializados y
 * activos, búsqueda en el servidor y filas reducidas a lo que el selector usa.
 */

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

beforeEach(() => {
	apiSpies.fetchData.mockReset();
});

describe('searchPurchasableProducts', () => {
	it('pide sólo no serializados y activos, con el término en `q`', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });

		await searchPurchasableProducts(4, '  cable ');

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/4/products',
			method: 'get',
			params: {
				q: 'cable',
				serial_tracking: false,
				is_active: true,
				order_by: 'name',
				order_dir: 'asc',
				per_page: PURCHASABLE_PRODUCTS_PER_PAGE,
			},
		});
	});

	it('sin término no manda `q`', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });

		await searchPurchasableProducts(4, '');

		const [config] = apiSpies.fetchData.mock.calls[0] as [{ params: Record<string, unknown> }];
		expect(config.params).not.toHaveProperty('q');
	});

	it('reduce la fila del catálogo y descarta las que no tienen id o nombre', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({
			data: {
				data: [
					{ id: 11, sku: 'CAB-1', name: 'Cable HDMI', brand: { id: 2, name: 'Ugreen' } },
					{ id: 12, sku: null, name: 'Mouse', brand: null },
					{ id: 'x', name: 'Roto' },
				],
				meta: { total: 45 },
			},
		});

		const page = await searchPurchasableProducts(4, 'c');

		expect(page).toEqual({
			data: [
				{ id: 11, sku: 'CAB-1', name: 'Cable HDMI', brand_name: 'Ugreen' },
				{ id: 12, sku: null, name: 'Mouse', brand_name: null },
			],
			has_more: true,
		});
	});
});
