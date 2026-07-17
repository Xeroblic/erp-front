/**
 * Integración de PRODUCTOS: fetchProductsList real + MSW, verificando la
 * normalización de negocio que consume la UI: flags de sincronización con Woo
 * (badge "publicado en Woo"), soft-holds (unidades apartadas), hijos
 * serializados y las estadísticas computadas de la lista.
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

vi.mock('react-toastify', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/store', () => ({
	default: {
		getState: () => ({ auth: { access: 'test-token' } }),
		dispatch: vi.fn(),
	},
	logout: vi.fn(() => ({ type: 'auth/logout' })),
	setToken: vi.fn((payload: unknown) => ({ type: 'auth/setToken', payload })),
}));

import ApiService from '@/services/ApiService';
import productsReducer, { fetchProductsList, type ProductsState } from '../productsSlice';
import { makeIntegrationStore } from '@/test-utils/integrationStore';

const SUBSIDIARY = 7;

// Payload crudo tal como lo entrega el backend (strings numéricos, flags '0'/'1').
// OJO contrato: `toBoolean` del helper acepta boolean y string ('1'/'true'),
// pero NO números — un `is_active: 0` numérico caería al fallback `true`.
const RAW_PRODUCTS = [
	{
		id: 1,
		sku: 'NB-001',
		name: 'Notebook padre',
		is_parent: '1',
		serial_tracking: '1',
		is_active: '1',
		price: '250000',
		is_synced_with_woo: '1',
		woo_links_count: '2',
		synced_children_count: 1,
		soft_holds: { quantity: '3', pending_sales_count: 2, web: '2', manual: 1 },
		children: [
			{
				id: 11,
				sku: 'NB-001-A',
				name: 'Notebook grado A',
				grade: 'A',
				stock: '4',
				is_synced_with_woo: '1',
				soft_holds: { quantity: 1, pending_sales_count: 1, web: 1, manual: 0 },
			},
		],
	},
	{
		id: 2,
		sku: 'ACC-01',
		name: 'Accesorio simple',
		is_active: '0',
		price: '5000',
		offer_price: '3990',
		is_synced_with_woo: false,
		soft_holds: null,
	},
];

const server = setupServer(
	http.get(`*/subsidiaries/${SUBSIDIARY}/products`, () =>
		HttpResponse.json({
			data: RAW_PRODUCTS,
			meta: { total: 2, current_page: 1, per_page: 15, last_page: 1 },
		}),
	),
);

const makeStore = () => makeIntegrationStore({ products: productsReducer });
const productsOf = (store: ReturnType<typeof makeStore>): ProductsState =>
	store.getState().products;

const loadList = async (store: ReturnType<typeof makeStore>) => {
	await store
		.dispatch(
			fetchProductsList({ entityParam: 'subsidiaries', entityId: SUBSIDIARY, params: {} }),
		)
		.unwrap();
};

describe('productsSlice (integración)', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	beforeEach(() => ApiService.clearCache());
	afterEach(() => {
		server.resetHandlers();
		vi.clearAllMocks();
	});
	afterAll(() => server.close());

	it('normaliza los flags de sincronización con Woo (badge y contadores)', async () => {
		const store = makeStore();
		await loadList(store);

		const [parent, accessory] = productsOf(store).items;
		expect(parent.is_synced_with_woo).toBe(true); // 1 → true
		expect(parent.woo_links_count).toBe(2); // '2' → 2
		expect(parent.synced_children_count).toBe(1);
		expect(accessory.is_synced_with_woo).toBe(false); // 0 → false
	});

	it('normaliza soft_holds propios y de los hijos (unidades apartadas)', async () => {
		const store = makeStore();
		await loadList(store);

		const [parent, accessory] = productsOf(store).items;
		expect(parent.soft_holds).toEqual({
			quantity: 3,
			pending_sales_count: 2,
			web: 2,
			manual: 1,
		});
		expect(parent.children?.[0]?.soft_holds?.quantity).toBe(1);
		expect(accessory.soft_holds).toBeNull();
	});

	it('normaliza los hijos serializados (variantes por grado) con tipos correctos', async () => {
		const store = makeStore();
		await loadList(store);

		const parent = productsOf(store).items[0];
		expect(parent.is_parent).toBe(true);
		expect(parent.serial_tracking).toBe(true);
		expect(parent.children).toHaveLength(1);
		expect(parent.children?.[0]).toMatchObject({
			id: 11,
			sku: 'NB-001-A',
			grade: 'A',
			is_synced_with_woo: true,
		});
	});

	it('computa las estadísticas de la lista (activos, con oferta, serializados)', async () => {
		const store = makeStore();
		await loadList(store);

		expect(productsOf(store).stats).toMatchObject({
			total: 2,
			actives: 1,
			inactives: 1,
			with_offer: 1, // solo el accesorio tiene offer_price > 0
			serial_tracked: 1, // solo el notebook padre
		});
	});

	it('llena la meta de paginación y apaga el loading', async () => {
		const store = makeStore();
		await loadList(store);

		const state = productsOf(store);
		expect(state.meta).toEqual({ total: 2, current_page: 1, per_page: 15, last_page: 1 });
		expect(state.loading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('error del backend: rejectValue con el mensaje y estado consistente', async () => {
		server.use(
			http.get(`*/subsidiaries/${SUBSIDIARY}/products`, () =>
				HttpResponse.json({ message: 'Subsidiaria no encontrada' }, { status: 404 }),
			),
		);
		const store = makeStore();

		await expect(loadList(store)).rejects.toBe('Subsidiaria no encontrada');

		const state = productsOf(store);
		expect(state.loading).toBe(false);
		expect(state.error).toBe('Subsidiaria no encontrada');
		expect(state.items).toEqual([]);
	});
});
