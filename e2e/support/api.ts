import type { Page } from '@playwright/test';

/**
 * La app (levantada por el webServer de playwright.config) apunta a este host
 * SIN backend: todo lo que no mockeemos con page.route falla localmente y
 * nunca llega a un ambiente real.
 */
export const API_HOST = 'http://127.0.0.1:9999';
export const API = `${API_HOST}/api`;

/** JWT falso pero decodificable: tokenManager del front valida el claim exp. */
export const makeJwt = (expInSeconds = 3600): string => {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
	const body = Buffer.from(
		JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expInSeconds }),
	).toString('base64');
	return `${header}.${body}.firma`;
};

/**
 * Perfil de un super-admin con contexto organizacional completo
 * (branch 30 → subsidiary 3), suficiente para pasar guards y resolver
 * `useCurrentBranch` en las páginas de negocio.
 */
export const PERFIL_SUPER_ADMIN = {
	data: {
		pk: 15,
		name: 'E2E Admin',
		cargo: 'admin',
		all_permissions: ['super-admin'],
		global_roles: ['super-admin'],
		branch: { id: 30, branch_name: 'Sucursal E2E', subsidiary: { id: 3, name: 'Sub E2E' } },
		access: {
			subsidiaries: [{ id: 3, name: 'Sub E2E' }],
			branches: [{ id: 30, name: 'Sucursal E2E' }],
		},
		visible: {
			subsidiaries: [{ id: 3, name: 'Sub E2E' }],
			branches: [{ id: 30, name: 'Sucursal E2E' }],
		},
	},
};

/**
 * Mockea la API para una sesión válida:
 * - catch-all: cualquier endpoint no mockeado responde vacío (sin tocar la red)
 * - POST /login → token
 * - GET /perfil → perfil super-admin
 *
 * Los specs pueden registrar page.route ADICIONALES después de llamar esto:
 * Playwright evalúa las rutas en orden inverso (la última registrada gana).
 */
export const mockAuthenticatedApi = async (page: Page): Promise<void> => {
	await page.route(`${API_HOST}/**`, (route) =>
		route.fulfill({ json: { data: [] }, status: 200 }),
	);
	await page.route(`${API}/login`, (route) =>
		route.fulfill({ json: { token: makeJwt() }, status: 200 }),
	);
	await page.route(`${API}/perfil*`, (route) =>
		route.fulfill({ json: PERFIL_SUPER_ADMIN, status: 200 }),
	);
};

/** Completa el formulario de login y envía. */
export const doLogin = async (page: Page): Promise<void> => {
	await page.goto('/login');
	await page.locator('#email').fill('e2e@zentria.cl');
	await page.locator('#password').fill('secreta123');
	await page.getByRole('button', { name: 'Iniciar sesión' }).click();
};
