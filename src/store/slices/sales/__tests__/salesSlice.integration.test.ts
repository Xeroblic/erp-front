/**
 * Integración de VENTAS: thunks reales + reducer real + MSW.
 * El negocio clave: listar con filtros limpios (sin params vacíos), soportar los
 * dos shapes de paginación del backend (raíz Laravel y meta), eliminar con
 * decremento, y el recálculo de total al editar un ítem.
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const { toastSuccess, toastError } = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock('react-toastify', () => ({
	toast: { success: toastSuccess, error: toastError },
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
import salesReducer, {
	fetchSales,
	fetchSaleById,
	deleteSale,
	updateSaleItem,
	setCurrentSale,
	selectSales,
	selectSalesPagination,
	selectCurrentSale,
	selectSalesLoading,
} from '../salesSlice';
import { makeIntegrationStore } from '@/test-utils/integrationStore';
import type { ISale, ISaleItem } from '@/interface/sales.interface';
import type { RootState } from '@/store/rootReducer';

const SUBSIDIARY = 7;

const sale = (id: number, extra: Partial<ISale> = {}): ISale =>
	({
		id,
		sale_number: `V-${id}`,
		status: 'pending',
		total_amount: '10000',
		items: [],
		...extra,
	}) as unknown as ISale;

let lastListUrl: URL | null = null;

const server = setupServer(
	http.get(`*/subsidiaries/${SUBSIDIARY}/sales`, ({ request }) => {
		lastListUrl = new URL(request.url);
		// Shape "raíz Laravel": paginación en la raíz del payload.
		return HttpResponse.json({
			data: [sale(1), sale(2)],
			current_page: 2,
			last_page: 5,
			total: 93,
			per_page: 20,
		});
	}),
	http.get(`*/subsidiaries/${SUBSIDIARY}/sales/2`, () =>
		HttpResponse.json({ data: sale(2, { status: 'processing' }) }),
	),
	http.delete(`*/subsidiaries/${SUBSIDIARY}/sales/1`, () => HttpResponse.json({})),
);

const makeStore = () => makeIntegrationStore({ ventas: salesReducer });
// Los selectores del slice tipan RootState completo; el store de prueba solo
// registra `ventas`, así que ajustamos el tipo en el punto de lectura.
const asRoot = (s: { ventas: ReturnType<typeof salesReducer> }) => s as unknown as RootState;

describe('salesSlice (integración)', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	beforeEach(() => {
		ApiService.clearCache();
		lastListUrl = null;
	});
	afterEach(() => {
		server.resetHandlers();
		vi.clearAllMocks();
	});
	afterAll(() => server.close());

	it('fetchSales llena la lista y la paginación desde el shape raíz de Laravel', async () => {
		const store = makeStore();
		await store.dispatch(fetchSales({ subsidiaryId: SUBSIDIARY, page: 2 })).unwrap();

		const state = asRoot(store.getState());
		expect(selectSales(state).map((s) => s.id)).toEqual([1, 2]);
		expect(selectSalesPagination(state)).toEqual({
			currentPage: 2,
			totalPages: 5,
			totalSales: 93,
			perPage: 20,
		});
		expect(selectSalesLoading(state).fetch).toBe(false);
	});

	it('fetchSales soporta el shape con meta anidada', async () => {
		server.use(
			http.get(`*/subsidiaries/${SUBSIDIARY}/sales`, () =>
				HttpResponse.json({
					data: [sale(9)],
					meta: { current_page: 3, last_page: 4, total: 61, per_page: 15 },
				}),
			),
		);
		const store = makeStore();
		await store.dispatch(fetchSales({ subsidiaryId: SUBSIDIARY })).unwrap();

		expect(selectSalesPagination(asRoot(store.getState()))).toEqual({
			currentPage: 3,
			totalPages: 4,
			totalSales: 61,
			perPage: 15,
		});
	});

	it('fetchSales limpia los filtros vacíos de la query y conserva los válidos', async () => {
		const store = makeStore();
		await store
			.dispatch(
				fetchSales({
					subsidiaryId: SUBSIDIARY,
					filters: { status: 'pending', customer_id: '', with_customer: 1 },
				}),
			)
			.unwrap();

		expect(lastListUrl).not.toBeNull();
		const params = lastListUrl!.searchParams;
		expect(params.get('status')).toBe('pending');
		expect(params.get('with_customer')).toBe('1');
		expect(params.has('customer_id')).toBe(false); // vacío => excluido
		expect(params.get('page')).toBe('1');
		expect(params.get('per_page')).toBe('20');
	});

	it('fetchSaleById carga currentSale', async () => {
		const store = makeStore();
		await store.dispatch(fetchSaleById({ subsidiaryId: SUBSIDIARY, id: 2 })).unwrap();

		const current = selectCurrentSale(asRoot(store.getState()));
		expect(current?.id).toBe(2);
		expect(current?.status).toBe('processing');
	});

	it('deleteSale elimina de la lista, decrementa el total y limpia currentSale si coincide', async () => {
		const store = makeStore();
		await store.dispatch(fetchSales({ subsidiaryId: SUBSIDIARY })).unwrap();
		store.dispatch(setCurrentSale(sale(1)));

		await store.dispatch(deleteSale({ subsidiaryId: SUBSIDIARY, id: 1 })).unwrap();

		const state = asRoot(store.getState());
		expect(selectSales(state).map((s) => s.id)).toEqual([2]);
		expect(selectSalesPagination(state).totalSales).toBe(92);
		expect(selectCurrentSale(state)).toBeNull();
		expect(toastSuccess).toHaveBeenCalledWith('Venta eliminada exitosamente');
	});

	it('fetchSales con error del backend: lista vacía, loading false y toast de error', async () => {
		server.use(
			http.get(`*/subsidiaries/${SUBSIDIARY}/sales`, () =>
				HttpResponse.json({ message: 'Sin acceso a la subsidiaria' }, { status: 403 }),
			),
		);
		const store = makeStore();
		await expect(
			store.dispatch(fetchSales({ subsidiaryId: SUBSIDIARY })).unwrap(),
		).rejects.toBeTruthy();

		const state = asRoot(store.getState());
		expect(selectSales(state)).toEqual([]);
		expect(selectSalesLoading(state).fetch).toBe(false);
		expect(toastError).toHaveBeenCalledWith('Sin acceso a la subsidiaria');
	});

	it('updateSaleItem recalcula el total de la venta desde sus ítems', async () => {
		const items = [
			{ id: 1, total: '5000' },
			{ id: 2, total: '3000' },
		] as unknown as ISaleItem[];
		const store = makeStore();
		server.use(
			http.get(`*/subsidiaries/${SUBSIDIARY}/sales`, () =>
				HttpResponse.json({ data: [sale(1, { items, total_amount: '8000' })] }),
			),
		);
		await store.dispatch(fetchSales({ subsidiaryId: SUBSIDIARY })).unwrap();

		store.dispatch(
			updateSaleItem({
				saleId: 1,
				item: { id: 2, total: '4500' } as unknown as ISaleItem,
			}),
		);

		const updated = selectSales(asRoot(store.getState())).find((s) => s.id === 1);
		expect(updated?.total_amount).toBe('9500'); // 5000 + 4500
	});
});
