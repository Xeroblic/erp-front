import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import BaseService from '../BaseService';
import tokenManager from '../auth/tokenManager';
import store from '@/store';

// 1. MOCKEAR EL STORE
vi.mock('@/store', () => ({
	default: {
		getState: vi.fn(() => ({ auth: { access: 'initial-token' } })),
		dispatch: vi.fn(),
	},
	logout: vi.fn(() => ({ type: 'auth/logout' })),
	setToken: vi.fn((payload) => ({ type: 'auth/setToken', payload })),
}));

// Helper para crear tokens falsos reales (para que tokenManager no falle)
const createValidToken = () => {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
	return `${header}.${body}.signature`;
};

// 2. CONFIGURAR MSW GLOBAL
const server = setupServer(
	http.get('*/api/protected', ({ request }) => {
		const authHeader = request.headers.get('Authorization');
		if (authHeader === 'Bearer expired-token') return new HttpResponse(null, { status: 401 });
		if (authHeader === 'Bearer new-valid-token') return HttpResponse.json({ success: true });
		return new HttpResponse(null, { status: 403 });
	}),
	http.post('*/refresh', () => {
		return HttpResponse.json({ access_token: 'new-valid-token' });
	}),
);

describe('BaseService Integration', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

	afterEach(() => {
		server.resetHandlers();
		tokenManager.clearTokens();
		vi.clearAllMocks();
	});

	afterAll(() => server.close());

	it('debería refrescar el token y reintentar la petición al recibir 401', async () => {
		tokenManager.setAccessToken('expired-token');
		const response = await BaseService.get('/api/protected');
		expect(response.status).toBe(200);
		expect(response.data).toEqual({ success: true });
		expect(tokenManager.getAccessToken()).toBe('new-valid-token');
	});

	it('debería hacer logout si el refresh falla y no hay salvación', async () => {
		server.use(
			http.post('*/refresh', () => {
				return new HttpResponse(null, { status: 401 });
			}),
		);

		tokenManager.setAccessToken('expired-token');

		try {
			await BaseService.get('/api/protected');
		} catch (error: any) {
			expect(error.response?.status).toBe(401);
			expect(store.dispatch).toHaveBeenCalledWith({ type: 'auth/logout' });
			expect(tokenManager.getAccessToken()).toBeNull();
		}
	});

	it('debería RECUPERAR la sesión (sin logout) si el refresh falla pero ya existe un token nuevo en memoria', async () => {
		// Generamos un token JWT real válido
		const validToken = createValidToken();

		// 1. Configuramos MSW para este caso específico
		server.use(
			// El refresh falla
			http.post('*/refresh', () => {
				return new HttpResponse(null, { status: 401 });
			}),
			// Endpoint protegido: ACEPTA el token válido dinámico
			http.get('*/api/protected', ({ request }) => {
				const h = request.headers.get('Authorization');
				// Si el reintento llega con el token válido, devolvemos 200
				if (h === `Bearer ${validToken}`) return HttpResponse.json({ success: true });
				// Si llega con el viejo, devolvemos 401
				if (h === 'Bearer expired-token') return new HttpResponse(null, { status: 401 });
				// Cualquier otra cosa
				return new HttpResponse(null, { status: 403 });
			}),
		);

		// 2. Simulamos que "otra pestaña" ya puso el token válido en memoria
		tokenManager.setAccessToken(validToken);

		// 3. Forzamos la petición con el token VIEJO para provocar el 401 inicial
		const response = await BaseService.get('/api/protected', {
			headers: { Authorization: 'Bearer expired-token' },
		});

		// 4. Verificaciones
		expect(response.status).toBe(200); // ¡ÉXITO!
		expect(store.dispatch).not.toHaveBeenCalledWith({ type: 'auth/logout' });
	});
});
