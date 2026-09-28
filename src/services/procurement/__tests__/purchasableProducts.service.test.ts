import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	PURCHASABLE_PRODUCTS_PER_PAGE,
	createPurchasableProduct,
	findPurchasableProductBySku,
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

describe('createPurchasableProduct', () => {
	const payload = {
		name: 'Mouse inalámbrico',
		sku: 'LOGN-MOUS-A1B',
		brand_id: 3,
		product_type: 'general',
		serial_tracking: false,
		is_active: true,
		category_ids: [12],
	};

	it('crea en el catálogo real de la filial y lee el `ProductResource` envuelto en `data`', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({
			data: {
				data: {
					id: 250,
					sku: 'LOGN-MOUS-A1B',
					name: 'Mouse inalámbrico',
					brand: { id: 3, name: 'Logitech' },
					product_type: 'general',
					serial_tracking: false,
					is_active: true,
					// `ProductResource` devuelve las categorías como objetos.
					category_ids: [{ id: 12, name: 'Accesorios', slug: 'accesorios' }],
				},
			},
		});

		const product = await createPurchasableProduct(4, payload);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/4/products',
			method: 'post',
			data: payload,
		});
		expect(product).toEqual({
			id: 250,
			sku: 'LOGN-MOUS-A1B',
			name: 'Mouse inalámbrico',
			brand_name: 'Logitech',
			serial_tracking: false,
			is_active: true,
			brand_id: 3,
			product_type: 'general',
			category_ids: [12],
		});
	});

	it('informa si el producto creado lleva serie, para no seleccionarlo en la línea', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({
			data: { data: { id: 251, sku: null, name: 'Notebook', serial_tracking: true } },
		});

		const product = await createPurchasableProduct(4, { ...payload, serial_tracking: true });

		expect(product.serial_tracking).toBe(true);
	});

	it('falla si la respuesta no trae el producto', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: { data: null } });

		await expect(createPurchasableProduct(4, payload)).rejects.toThrow();
	});
});

describe('findPurchasableProductBySku', () => {
	const row = (id: number, sku: string, extra: Record<string, unknown> = {}) => ({
		id,
		sku,
		name: `Producto ${id}`,
		...extra,
	});
	const page = (rows: unknown[], lastPage: number) => ({
		data: { data: rows, meta: { last_page: lastPage } },
	});

	it('busca el SKU sin filtrar por serie ni estado, de lo más nuevo a lo más antiguo', async () => {
		apiSpies.fetchData.mockResolvedValueOnce(
			page([row(1, 'LOGN-MOUS-A1BX'), row(2, 'LOGN-MOUS-A1B', { is_active: false })], 1),
		);

		const product = await findPurchasableProductBySku(4, 'LOGN-MOUS-A1B');

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/4/products',
			method: 'get',
			params: {
				q: 'LOGN-MOUS-A1B',
				order_by: 'id',
				order_dir: 'desc',
				per_page: 50,
				page: 1,
			},
		});
		expect(product).toEqual({
			id: 2,
			sku: 'LOGN-MOUS-A1B',
			name: 'Producto 2',
			brand_name: null,
			serial_tracking: false,
			is_active: false,
			brand_id: null,
			product_type: null,
			category_ids: [],
		});
	});

	it('recorre las páginas siguientes hasta dar con el SKU exacto', async () => {
		apiSpies.fetchData
			.mockResolvedValueOnce(page([row(9, 'LOGN-MOUS-A1BX')], 2))
			.mockResolvedValueOnce(page([row(3, 'LOGN-MOUS-A1B')], 2));

		const product = await findPurchasableProductBySku(4, 'LOGN-MOUS-A1B');

		expect(product?.id).toBe(3);
		expect(apiSpies.fetchData).toHaveBeenCalledTimes(2);
		const [, secondCall] = apiSpies.fetchData.mock.calls as [
			unknown,
			[{ params: { page: number } }],
		];
		expect(secondCall[0].params.page).toBe(2);
	});

	it('sin coincidencia exacta en ninguna página devuelve null', async () => {
		apiSpies.fetchData.mockResolvedValueOnce(page([row(1, 'LOGN-MOUS-A1BX')], 1));

		await expect(findPurchasableProductBySku(4, 'LOGN-MOUS-A1B')).resolves.toBeNull();
		expect(apiSpies.fetchData).toHaveBeenCalledTimes(1);
	});
});
