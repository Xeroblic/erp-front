/**
 * Integración del flujo de COTIZACIONES: thunks reales + reducer real + HTTP
 * interceptado con MSW. Cubre el ciclo de negocio: listar → crear → aprobar →
 * convertir a venta (marca optimista) → eliminar.
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

// BaseService importa el store real para leer el token: lo aislamos.
vi.mock('@/store', () => ({
	default: {
		getState: () => ({ auth: { access: 'test-token' } }),
		dispatch: vi.fn(),
	},
	logout: vi.fn(() => ({ type: 'auth/logout' })),
	setToken: vi.fn((payload: unknown) => ({ type: 'auth/setToken', payload })),
}));

import ApiService from '@/services/ApiService';
import quotesReducer, {
	fetchQuotes,
	createQuote,
	updateQuote,
	deleteQuote,
	convertQuoteToSale,
	selectQuotes,
	selectQuoteMeta,
	selectQuotesState,
} from '../quotesSlice';
import { makeIntegrationStore } from '@/test-utils/integrationStore';
import type { Quote } from '@/interface/quotes.interface';

const SUBSIDIARY = 7;

const quote = (id: number, status = 'draft', extra: Partial<Quote> = {}): Quote =>
	({
		id,
		quote_number: `COT-${id}`,
		status,
		is_converted_to_sale: false,
		sale_id: null,
		total_amount: '10000',
		...extra,
	}) as unknown as Quote;

let lastConvertBody: unknown = null;

const server = setupServer(
	http.get(`*/subsidiaries/${SUBSIDIARY}/quotes`, () =>
		HttpResponse.json({
			data: [quote(1), quote(3, 'sent'), quote(2, 'approved')],
			meta: { total: 3, current_page: 1, per_page: 10, last_page: 1 },
		}),
	),
	http.post(`*/subsidiaries/${SUBSIDIARY}/quotes`, () =>
		HttpResponse.json({ data: quote(10, 'draft') }),
	),
	http.patch(`*/subsidiaries/${SUBSIDIARY}/quotes/3`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return HttpResponse.json({ data: quote(3, (body.status as string) ?? 'sent') });
	}),
	http.post(`*/subsidiaries/${SUBSIDIARY}/quotes/2/convert-to-sale`, async ({ request }) => {
		lastConvertBody = await request.json();
		// El backend responde { message, sale } — NO devuelve la cotización.
		return HttpResponse.json({
			message: 'Cotización convertida',
			sale: { id: 501, sale_number: 'V-501' },
		});
	}),
	http.delete(`*/subsidiaries/${SUBSIDIARY}/quotes/1`, () => HttpResponse.json({})),
);

const makeStore = () => makeIntegrationStore({ cotizaciones: quotesReducer });
type Store = ReturnType<typeof makeStore>;

const loadList = async (store: Store) => {
	await store.dispatch(fetchQuotes({ subsidiaryId: SUBSIDIARY })).unwrap();
};

describe('quotesSlice (integración)', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	beforeEach(() => {
		ApiService.clearCache();
		lastConvertBody = null;
	});
	afterEach(() => {
		server.resetHandlers();
		vi.clearAllMocks();
	});
	afterAll(() => server.close());

	it('fetchQuotes llena la lista ordenada por id desc y la meta de paginación', async () => {
		const store = makeStore();
		await loadList(store);

		const state = store.getState();
		expect(selectQuotes(state).map((q) => q.id)).toEqual([3, 2, 1]);
		expect(selectQuoteMeta(state)).toEqual({
			total: 3,
			currentPage: 1,
			perPage: 10,
			lastPage: 1,
		});
		expect(selectQuotesState(state).loadingList).toBe(false);
	});

	it('createQuote agrega la cotización (reordenada) e incrementa el total', async () => {
		const store = makeStore();
		await loadList(store);

		await store.dispatch(createQuote({ subsidiaryId: SUBSIDIARY, data: {} as never })).unwrap();

		const state = store.getState();
		expect(selectQuotes(state).map((q) => q.id)).toEqual([10, 3, 2, 1]);
		expect(selectQuoteMeta(state).total).toBe(4);
		expect(toastSuccess).toHaveBeenCalledWith('Cotización creada correctamente');
	});

	it('updateQuote (aprobar) refleja el nuevo estado en la lista', async () => {
		const store = makeStore();
		await loadList(store);

		await store
			.dispatch(
				updateQuote({
					subsidiaryId: SUBSIDIARY,
					quoteId: 3,
					data: { status: 'approved' } as never,
				}),
			)
			.unwrap();

		const updated = selectQuotes(store.getState()).find((q) => q.id === 3);
		expect(updated?.status).toBe('approved');
		expect(toastSuccess).toHaveBeenCalledWith('Cotización actualizada');
	});

	it('convertQuoteToSale marca la cotización como convertida (optimista) y enlaza la venta', async () => {
		const store = makeStore();
		await loadList(store);

		await store.dispatch(convertQuoteToSale({ subsidiaryId: SUBSIDIARY, quoteId: 2 })).unwrap();

		// El POST envía sale_number: null (el backend lo autogenera)
		expect(lastConvertBody).toEqual({ sale_number: null });

		const converted = selectQuotes(store.getState()).find((q) => q.id === 2);
		expect(converted?.status).toBe('converted');
		expect(converted?.is_converted_to_sale).toBe(true);
		expect(converted?.sale_id).toBe(501);
		expect(toastSuccess).toHaveBeenCalledWith('Cotización convertida a venta');
		expect(selectQuotesState(store.getState()).convertLoading).toBe(false);
	});

	it('convertQuoteToSale rechazada: propaga el mensaje del backend y NO marca la cotización', async () => {
		server.use(
			http.post(`*/subsidiaries/${SUBSIDIARY}/quotes/2/convert-to-sale`, () =>
				HttpResponse.json({ message: 'La cotización no tiene ítems' }, { status: 422 }),
			),
		);
		const store = makeStore();
		await loadList(store);

		await expect(
			store.dispatch(convertQuoteToSale({ subsidiaryId: SUBSIDIARY, quoteId: 2 })).unwrap(),
		).rejects.toBe('La cotización no tiene ítems');

		const state = store.getState();
		const notConverted = selectQuotes(state).find((q) => q.id === 2);
		expect(notConverted?.status).toBe('approved');
		expect(notConverted?.is_converted_to_sale).toBe(false);
		expect(selectQuotesState(state).error).toBe('La cotización no tiene ítems');
		expect(selectQuotesState(state).convertLoading).toBe(false);
		expect(toastError).toHaveBeenCalledWith('La cotización no tiene ítems');
	});

	it('deleteQuote la elimina de la lista y decrementa el total', async () => {
		const store = makeStore();
		await loadList(store);

		await store.dispatch(deleteQuote({ subsidiaryId: SUBSIDIARY, quoteId: 1 })).unwrap();

		const state = store.getState();
		expect(selectQuotes(state).map((q) => q.id)).toEqual([3, 2]);
		expect(selectQuoteMeta(state).total).toBe(2);
		expect(toastSuccess).toHaveBeenCalledWith('Cotización eliminada');
	});
});
