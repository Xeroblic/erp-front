import { defineConfig } from '@playwright/test';

/**
 * E2E con Playwright sobre el dev server de Vite.
 *
 * - Usa el Chrome del sistema (channel: 'chrome') para no descargar browsers.
 * - VITE_API_URL apunta a un puerto local SIN backend: toda petición no mockeada
 *   por `page.route` falla localmente y JAMÁS toca un ambiente real.
 * - Los specs viven en `e2e/` (fuera del include de Vitest).
 */
export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	retries: 0,
	// El dev server es uno solo: serializamos para evitar flakiness de HMR.
	workers: 1,
	reporter: [['list']],
	use: {
		baseURL: 'http://127.0.0.1:5199',
		channel: 'chrome',
		headless: true,
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
	},
	webServer: {
		// Puerto dedicado (≠ 5173 del dev diario) y SIN reutilizar servers ajenos:
		// garantiza que la app bajo test usa el API mockeable de 127.0.0.1:9999.
		// --host 127.0.0.1 es necesario: sin él Vite se ata a ::1 (IPv6) y el
		// health-check de Playwright sobre 127.0.0.1 nunca lo ve.
		command:
			'VITE_API_URL=http://127.0.0.1:9999/api pnpm dev --port 5199 --strictPort --host 127.0.0.1',
		url: 'http://127.0.0.1:5199',
		reuseExistingServer: false,
		timeout: 60_000,
	},
});
