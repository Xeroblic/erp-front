/**
 * Integración de ApiService sobre BaseService + MSW: caché por TTL, dedupe de
 * requests en vuelo, invalidación y fetchNormalized. Se cuentan los hits reales
 * a la "red" para verificar que la capa de caché hace su trabajo.
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';

vi.mock('@/store', () => ({
	default: {
		getState: () => ({ auth: { access: 'test-token' } }),
		dispatch: vi.fn(),
	},
	logout: vi.fn(() => ({ type: 'auth/logout' })),
	setToken: vi.fn((payload: unknown) => ({ type: 'auth/setToken', payload })),
}));

import ApiService from '../ApiService';

let hits = 0;

const server = setupServer(
	http.get('*/cached-resource', async () => {
		hits += 1;
		await delay(10); // ventana para que el dedupe tenga requests "en vuelo"
		return HttpResponse.json({ data: { value: `hit-${hits}` } });
	}),
);

describe('ApiService (integración caché/dedupe)', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	beforeEach(() => {
		ApiService.clearCache();
		hits = 0;
	});
	afterEach(() => {
		server.resetHandlers();
		vi.restoreAllMocks();
	});
	afterAll(() => server.close());

	const getCached = (extra: Record<string, unknown> = {}) =>
		ApiService.fetchData<{ data: { value: string } }>({
			url: '/cached-resource',
			method: 'get',
			cacheTTLms: 60_000,
			...extra,
		});

	it('cachea GETs con cacheTTLms: la segunda llamada no toca la red', async () => {
		const first = await getCached();
		const second = await getCached();

		expect(hits).toBe(1);
		expect(second.data).toEqual(first.data);
	});

	it('expira la caché al vencer el TTL y vuelve a pedir', async () => {
		await getCached();
		expect(hits).toBe(1);

		// Avanzamos el reloj más allá del TTL solo para la verificación de caché.
		const realNow = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(realNow + 61_000);

		await getCached();
		expect(hits).toBe(2);
	});

	it('forceRefetch ignora la caché vigente', async () => {
		await getCached();
		await getCached({ forceRefetch: true });

		expect(hits).toBe(2);
	});

	it('dedupe: llamadas concurrentes idénticas comparten una sola request', async () => {
		const [a, b, c] = await Promise.all([
			getCached({ dedupe: true }),
			getCached({ dedupe: true }),
			getCached({ dedupe: true }),
		]);

		expect(hits).toBe(1);
		expect(a.data).toEqual(b.data);
		expect(b.data).toEqual(c.data);
	});

	it('invalidateCache(patrón) fuerza un nuevo fetch solo para las URLs que matchean', async () => {
		await getCached();
		expect(hits).toBe(1);

		ApiService.invalidateCache('/otra-cosa');
		await getCached();
		expect(hits).toBe(1); // patrón no matchea: la caché sigue viva

		ApiService.invalidateCache('/cached-resource');
		await getCached();
		expect(hits).toBe(2); // invalidada: refetch
	});

	it('fetchNormalized desempaqueta el wrapper { data } del backend', async () => {
		const value = await ApiService.fetchNormalized<{ value: string }>({
			url: '/cached-resource',
			method: 'get',
		});
		expect(value).toEqual({ value: 'hit-1' });
	});
});
