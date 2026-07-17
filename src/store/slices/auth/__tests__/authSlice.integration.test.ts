/**
 * Integración de AUTH: login → perfil (/perfil) → logout, con thunks y reducer
 * reales y HTTP interceptado por MSW. Verifica el contrato del perfil
 * (permisos + roles + cargo → authority) y la limpieza de sesión.
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock('react-toastify', () => ({
	toast: { success: vi.fn(), error: toastError },
}));

// BaseService lee el token del store real en sus interceptores: lo aislamos.
// El token "de verdad" para estos tests vive en tokenManager (memoria).
vi.mock('@/store', () => ({
	default: {
		getState: () => ({ auth: { access: undefined } }),
		dispatch: vi.fn(),
	},
	logout: vi.fn(() => ({ type: 'auth/logout' })),
	setToken: vi.fn((payload: unknown) => ({ type: 'auth/setToken', payload })),
}));

import ApiService from '@/services/ApiService';
import tokenManager from '@/services/auth/tokenManager';
import authReducer, {
	loginThunk,
	logoutThunk,
	userMeThunk,
	type AuthState,
} from '../authSlice';
import { makeIntegrationStore } from '@/test-utils/integrationStore';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';

// JWT falso pero decodificable (tokenManager valida exp).
const makeJwt = (expInSeconds = 3600) => {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expInSeconds }));
	return `${header}.${body}.firma`;
};

const PERFIL_OK = {
	data: {
		pk: 15,
		name: 'Benja',
		cargo: 'vendedor',
		all_permissions: ['view-sales', 'create-quote'],
		direct_permissions: ['view-sales'],
		global_roles: ['seller'],
		access: { subsidiaries: [{ id: 3, name: 'Sub 3' }], branches: [{ id: 30, name: 'Suc 30' }] },
		visible: { subsidiaries: [{ id: 3, name: 'Sub 3' }], branches: [{ id: 30, name: 'Suc 30' }] },
	},
};

let loginCalls = 0;
let logoutCalled = false;

const server = setupServer(
	http.post('*/login', async ({ request }) => {
		loginCalls += 1;
		const body = (await request.json()) as { email?: string; password?: string };
		if (body.password === 'correcta') {
			return HttpResponse.json({ token: makeJwt() });
		}
		return HttpResponse.json({ message: 'Credenciales inválidas' }, { status: 422 });
	}),
	http.get('*/perfil', () => HttpResponse.json(PERFIL_OK)),
	http.post('*/logout', () => {
		logoutCalled = true;
		return HttpResponse.json({});
	}),
);

const makeStore = () => makeIntegrationStore({ auth: authReducer });
const authOf = (store: ReturnType<typeof makeStore>): AuthState => store.getState().auth;
// userMeThunk/logoutThunk tipan `state: RootState` completo; este store solo
// registra `auth` (los thunks solo leen esa rama), así que tipamos el dispatch.
const dispatchOf = (store: ReturnType<typeof makeStore>) =>
	store.dispatch as ThunkDispatch<RootState, unknown, UnknownAction>;

describe('authSlice (integración)', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	beforeEach(() => {
		ApiService.clearCache();
		tokenManager.clearTokens();
		loginCalls = 0;
		logoutCalled = false;
	});
	afterEach(() => {
		server.resetHandlers();
		vi.clearAllMocks();
	});
	afterAll(() => server.close());

	it('login exitoso guarda el token en memoria y pre-autentica el estado', async () => {
		const store = makeStore();
		await store
			.dispatch(loginThunk({ email: 'a@b.cl', password: 'correcta' }))
			.unwrap();

		const auth = authOf(store);
		expect(auth.isAuthenticated).toBe(true);
		expect(auth.access).toBeTruthy();
		expect(tokenManager.getAccessToken()).toBe(auth.access);
		expect(auth.loading).toBe(false);
	});

	it('login con credenciales inválidas propaga el mensaje del backend y no autentica', async () => {
		const store = makeStore();
		await expect(
			store.dispatch(loginThunk({ email: 'a@b.cl', password: 'mala' })).unwrap(),
		).rejects.toBe('Credenciales inválidas');

		const auth = authOf(store);
		expect(auth.isAuthenticated).toBe(false);
		expect(auth.error).toBe('Credenciales inválidas');
		expect(tokenManager.getAccessToken()).toBeNull();
		expect(loginCalls).toBe(1);
	});

	it('userMe consolida el perfil: authority = permisos + roles + cargo, con scopes', async () => {
		tokenManager.setAccessToken(makeJwt());
		const store = makeStore();

		await dispatchOf(store)(userMeThunk()).unwrap();

		const auth = authOf(store);
		expect(auth.isAuthenticated).toBe(true);
		expect(auth.user?.id).toBe(15); // /perfil entrega pk, se normaliza a id
		// authority combina permisos únicos + roles + cargo
		expect(auth.permisos).toEqual(
			expect.arrayContaining(['view-sales', 'create-quote', 'seller', 'vendedor']),
		);
		expect(auth.user?.permisos).toEqual(['view-sales', 'create-quote']);
		expect(auth.user?.roles).toEqual(['seller']);
		expect(auth.user?.access?.branches).toEqual([{ id: 30, name: 'Suc 30', subsidiary: null }]);
		expect(auth.userLastFetched).toBeTypeOf('number');
	});

	it('userMe sin token: rechaza con "Token inválido" sin llamar a la API ni mostrar toast', async () => {
		const store = makeStore();

		await expect(dispatchOf(store)(userMeThunk()).unwrap()).rejects.toMatchObject({
			message: 'Token inválido',
			isUnauthorized: true,
		});

		expect(authOf(store).isAuthenticated).toBe(false);
		expect(toastError).not.toHaveBeenCalled();
	});

	it('userMe con 401 del backend: marca no autenticado sin toast (sesión expirada)', async () => {
		server.use(
			http.get('*/perfil', () =>
				HttpResponse.json({ message: 'No autenticado' }, { status: 401 }),
			),
			// El interceptor de BaseService intenta refresh ante un 401: también falla.
			http.post('*/refresh', () => new HttpResponse(null, { status: 401 })),
		);
		tokenManager.setAccessToken(makeJwt());
		const store = makeStore();

		await expect(dispatchOf(store)(userMeThunk()).unwrap()).rejects.toBeTruthy();

		expect(authOf(store).isAuthenticated).toBe(false);
		expect(toastError).not.toHaveBeenCalled();
	});

	it('logoutThunk postea /logout y limpia token + estado', async () => {
		const store = makeStore();
		await store
			.dispatch(loginThunk({ email: 'a@b.cl', password: 'correcta' }))
			.unwrap();

		await dispatchOf(store)(logoutThunk()).unwrap();

		const auth = authOf(store);
		expect(logoutCalled).toBe(true);
		expect(auth.isAuthenticated).toBe(false);
		expect(auth.access).toBeUndefined();
		expect(auth.user).toBeUndefined();
		expect(auth.permisos).toEqual([]);
		expect(tokenManager.getAccessToken()).toBeNull();
	});
});
