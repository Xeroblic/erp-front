import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WeeklySalesChart from '../WeeklySalesChart';

/**
 * Exportación XML del gráfico semanal: el reporte nombra distinto la fecha y el monto según
 * el modo, y cada etiqueta toma el primer campo con valor.
 */

const toastSpies = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }));

vi.mock('react-toastify', () => ({ toast: toastSpies }));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));
vi.mock('@/components/Chart', () => ({ default: () => null }));
vi.mock('@/hooks/useDarkMode', () => ({ default: () => ({ isDarkTheme: false }) }));
vi.mock('@/hooks/tour/home/useDashboardTour', () => ({ default: () => ({ startTour: vi.fn() }) }));

const exportedXml = vi.hoisted(() => ({ blob: null as Blob | null }));

beforeEach(() => {
	exportedXml.blob = null;
	Object.values(toastSpies).forEach((spy) => spy.mockClear());
	vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
		exportedXml.blob = blob as Blob;
		return 'blob:ventas';
	});
	vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
	vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

/** El Blob de jsdom no implementa `.text()`. */
const readBlob = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsText(blob);
	});

const renderChart = (results: Array<Record<string, unknown>>) =>
	render(
		<WeeklySalesChart
			dateRange='7d'
			setDateRange={vi.fn()}
			chartSeries={[{ name: 'Ventas', data: [] }]}
			chartCategories={[]}
			totalAmount={0}
			results={results}
		/>,
	);

describe('WeeklySalesChart — exportación XML', () => {
	it('toma el primer campo con valor y usa el respaldo cuando no hay ninguno', async () => {
		renderChart([
			{ sale_date: '2026-10-19', total_amount: 1200, id: 90 },
			{ sale_date: '', date: '2026-10-20', total_amount: 0, amount: '350.5', id: 91 },
			{ id: null },
		]);

		fireEvent.click(screen.getByTitle('Descargar XML'));

		expect(toastSpies.success).toHaveBeenCalledWith('Reporte XML descargado');
		if (!exportedXml.blob) throw new Error('No se generó el XML.');
		expect(await readBlob(exportedXml.blob)).toBe(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<sales>',
				'  <sale>',
				'    <date>2026-10-19</date>',
				'    <amount>1200</amount>',
				'    <id>90</id>',
				'  </sale>',
				'  <sale>',
				'    <date>2026-10-20</date>',
				'    <amount>350.5</amount>',
				'    <id>91</id>',
				'  </sale>',
				'  <sale>',
				'    <date>N/A</date>',
				'    <amount>0</amount>',
				'    <id></id>',
				'  </sale>',
				'</sales>',
			].join('\n'),
		);
	});

	it('avisa y no descarga cuando no hay ventas', () => {
		renderChart([]);

		fireEvent.click(screen.getByTitle('Descargar XML'));

		expect(toastSpies.warning).toHaveBeenCalledWith('No hay datos para exportar');
		expect(exportedXml.blob).toBeNull();
	});
});
