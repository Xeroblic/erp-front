import { test, expect, type Page } from '@playwright/test';
import { API, mockAuthenticatedApi, doLogin } from './support/api';

/**
 * Flujo de negocio COTIZACIONES:
 * - el listado renderiza las cotizaciones con su estado
 * - el gating por estado: "Convertir a venta" SOLO existe para las aprobadas
 * - la conversión pasa por el modal de confirmación y refleja "Convertida"
 */

const quoteRow = (id: number, status: string, customerName: string) => ({
	id,
	quote_number: `COT-${id}`,
	status,
	is_converted_to_sale: false,
	sale_id: null,
	customer: { name: customerName },
	quote_date: '2026-07-01',
	expiry_date: '2026-08-01',
	total_amount: '150000',
	items: [],
});

const mockQuotesApi = async (page: Page) => {
	const state = { converted: false };

	await page.route(`${API}/subsidiaries/3/quotes**`, async (route) => {
		const req = route.request();
		const url = req.url();

		if (req.method() === 'POST' && url.includes('/convert-to-sale')) {
			state.converted = true;
			await route.fulfill({
				json: { message: 'Cotización convertida', sale: { id: 501, sale_number: 'V-501' } },
			});
			return;
		}

		if (req.method() === 'GET' && url.includes('/items')) {
			await route.fulfill({ json: { data: [] } });
			return;
		}

		// Listado: tras convertir, la 102 vuelve como convertida (refetch).
		await route.fulfill({
			json: {
				data: [
					quoteRow(101, 'draft', 'Cliente Borrador'),
					quoteRow(102, state.converted ? 'converted' : 'approved', 'Cliente Aprobado'),
				],
				meta: { total: 2, current_page: 1, per_page: 10, last_page: 1 },
			},
		});
	});

	return state;
};

test.describe('Cotizaciones', () => {
	test('lista, gating por estado y conversión a venta', async ({ page }) => {
		await mockAuthenticatedApi(page);
		await mockQuotesApi(page);

		await doLogin(page);
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

		// Navegación client-side como un usuario real (sidebar → Comercial →
		// Cotizaciones). OJO: un page.goto directo a la URL protegida cae en
		// /sin-permisos porque AuthorityCheck evalúa antes del rehydrate de
		// redux-persist (bug conocido de deep-link).
		await page.locator('aside').getByText('Comercial', { exact: true }).first().click();
		// (hay otro link "Cotizaciones" en los Enlaces Rápidos del dashboard)
		await page.locator('aside').getByRole('link', { name: 'Cotizaciones' }).click();
		await expect(page).toHaveURL(/\/comercial\/cotizaciones/);

		// Render del listado con sus estados
		const draftRow = page.locator('tr', { hasText: 'Cliente Borrador' });
		const approvedRow = page.locator('tr', { hasText: 'Cliente Aprobado' });
		await expect(draftRow).toBeVisible({ timeout: 15_000 });
		await expect(approvedRow).toBeVisible();
		await expect(draftRow.getByText('Borrador', { exact: true })).toBeVisible();
		await expect(approvedRow.getByText('Aprobada', { exact: true })).toBeVisible();

		// GATING: el botón "Convertir a venta" (emerald) solo existe en la aprobada;
		// la draft ofrece "Enviar" (zinc) y NO convertir.
		const convertBtn = approvedRow.locator('button.bg-emerald-600');
		await expect(convertBtn).toHaveCount(1);
		await expect(draftRow.locator('button.bg-emerald-600')).toHaveCount(0);
		await expect(draftRow.locator('button.bg-zinc-600')).toHaveCount(1);

		// Conversión: modal de confirmación → Confirmar → toast + estado Convertida
		await convertBtn.click();
		await expect(page.getByText('¿Generar orden de venta?')).toBeVisible();
		await page.getByRole('button', { name: 'Confirmar', exact: true }).click();

		await expect(page.locator('.Toastify')).toContainText('Cotización convertida a venta', {
			timeout: 10_000,
		});
		await expect(approvedRow.getByText('Convertida')).toBeVisible({ timeout: 10_000 });
		await expect(approvedRow.locator('button.bg-emerald-600')).toHaveCount(0);
	});
});
