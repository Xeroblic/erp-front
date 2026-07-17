import { test, expect } from '@playwright/test';
import { API, API_HOST, mockAuthenticatedApi, doLogin } from './support/api';

test.describe('Autenticación', () => {
	test('una ruta protegida sin sesión redirige a /login', async ({ page }) => {
		// Sin sesión y sin backend: el guard debe expulsar al login.
		await page.route(`${API_HOST}/**`, (route) =>
			route.fulfill({ status: 401, json: { message: 'No autenticado' } }),
		);

		await page.goto('/dashboard');

		await expect(page).toHaveURL(/\/login/);
		await expect(page.locator('#email')).toBeVisible();
	});

	test('login exitoso navega al dashboard', async ({ page }) => {
		await mockAuthenticatedApi(page);

		await doLogin(page);

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
	});

	test('login con credenciales inválidas muestra el error del backend y no navega', async ({
		page,
	}) => {
		await mockAuthenticatedApi(page);
		// Override: el login falla (la última route registrada gana).
		await page.route(`${API}/login`, (route) =>
			route.fulfill({ status: 422, json: { message: 'Credenciales inválidas' } }),
		);

		await doLogin(page);

		// El error llega como toast de react-toastify.
		await expect(page.locator('.Toastify')).toContainText('Credenciales inválidas', {
			timeout: 10_000,
		});
		await expect(page).toHaveURL(/\/login/);
	});
});
