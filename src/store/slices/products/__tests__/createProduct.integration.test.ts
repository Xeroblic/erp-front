/**
 * Integración del ALTA de producto: createProduct real + MSW, verificando el
 * cuerpo que llega al backend según la entidad. `StoreSubsidiaryProductRequest`
 * declara `stock => nullable|integer|min:0|max:0` (el stock vive en una
 * sucursal), mientras que el alta por sucursal sigue aceptando stock inicial.
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw/http';
import ApiService from '@/services/ApiService';
import { makeIntegrationStore } from '@/test-utils/integrationStore';
import productsReducer, { createProduct } from '../productsSlice';

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

const SUBSIDIARY = 7;
const BRANCH = 3;

const receivedBodies: Record<string, Record<string, unknown>> = {};

const echoProduct = (key: string) =>
	http.post(`*/${key}/products`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		receivedBodies[key] = body;
		return HttpResponse.json({ data: { id: 99, ...body } }, { status: 201 });
	});

const server = setupServer(
	echoProduct(`subsidiaries/${SUBSIDIARY}`),
	echoProduct(`branches/${BRANCH}`),
);

const makeStore = () => makeIntegrationStore({ products: productsReducer });

const PRODUCT_DATA = { name: 'Notebook', sku: 'NB-01', brand_id: 2, price: 1000, stock: 5 };

describe('createProduct (integración)', () => {
	beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
	beforeEach(() => ApiService.clearCache());
	afterEach(() => {
		server.resetHandlers();
		vi.clearAllMocks();
		Object.keys(receivedBodies).forEach((key) => delete receivedBodies[key]);
	});
	afterAll(() => server.close());

	it('no envía stock en el alta por filial', async () => {
		await makeStore()
			.dispatch(
				createProduct({
					entityParam: 'subsidiaries',
					entityId: SUBSIDIARY,
					data: PRODUCT_DATA,
					categoryIds: [],
				}),
			)
			.unwrap();

		const body = receivedBodies[`subsidiaries/${SUBSIDIARY}`];
		expect(body).toBeDefined();
		expect(body).not.toHaveProperty('stock');
		expect(body).toMatchObject({ name: 'Notebook', sku: 'NB-01', brand_id: 2 });
	});

	it('envía el stock inicial en el alta por sucursal', async () => {
		await makeStore()
			.dispatch(
				createProduct({
					entityParam: 'branches',
					entityId: BRANCH,
					data: PRODUCT_DATA,
					categoryIds: [],
				}),
			)
			.unwrap();

		expect(receivedBodies[`branches/${BRANCH}`]).toMatchObject({ stock: 5 });
	});
});
