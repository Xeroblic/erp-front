import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useInventoryReportSources from '@/pages/reportes/inventory-reports/hooks/useInventoryReportSources';
import { ReportsService } from '@/services/reports/reports.service';

const config = vi.hoisted(() => ({ mocks: true }));
vi.mock('@/config/inventoryStock.config', () => ({
	get default() {
		return config.mocks;
	},
}));
const getTypes = vi.hoisted(() => vi.fn<typeof ReportsService.getTypes>());
vi.mock('@/services/reports/reports.service', () => ({ ReportsService: { getTypes } }));

type TTypesResponse = Awaited<ReturnType<typeof ReportsService.getTypes>>;
const reportType = (key: string) => ({ key, name: key, formats: ['pdf', 'xlsx'] });

beforeEach(() => {
	config.mocks = true;
	getTypes.mockReset();
});

describe('useInventoryReportSources', () => {
	it('mientras no responde la lista de tipos sólo ofrece `stock`', () => {
		getTypes.mockReturnValue(
			new Promise<TTypesResponse>(() => {
				// Nunca responde.
			}),
		);

		const { result } = renderHook(() => useInventoryReportSources(2));

		expect(result.current.ready).toBe(false);
		expect(result.current.sourceOf('stock')).toBe('api');
		expect(result.current.sourceOf('stock_health')).toBeNull();
	});

	it('un tipo que informa el backend se lee de la API aunque haya datos simulados', async () => {
		// `fetchNormalized` desenvuelve `data`: en ejecución llega el arreglo, no el sobre.
		getTypes.mockResolvedValue([
			reportType('stock'),
			reportType('stock_health'),
		] as unknown as TTypesResponse);

		const { result } = renderHook(() => useInventoryReportSources(2));

		await waitFor(() => expect(result.current.ready).toBe(true));
		expect(getTypes).toHaveBeenCalledWith(2);
		expect(result.current.sourceOf('stock_health')).toBe('api');
		expect(result.current.sourceOf('replenishment')).toBe('mock');
	});

	it('sin la bandera de datos simulados, un tipo que no existe no tiene pestaña', async () => {
		config.mocks = false;
		getTypes.mockResolvedValue({ data: [reportType('stock')] });

		const { result } = renderHook(() => useInventoryReportSources(2));

		await waitFor(() => expect(result.current.ready).toBe(true));
		expect(result.current.sourceOf('stock')).toBe('api');
		expect(result.current.sourceOf('dead_stock')).toBeNull();
	});

	it('si la lista falla ofrece lo que no depende de ella', async () => {
		config.mocks = false;
		getTypes.mockRejectedValue(new Error('403'));

		const { result } = renderHook(() => useInventoryReportSources(2));

		await waitFor(() => expect(result.current.ready).toBe(true));
		expect(result.current.sourceOf('stock')).toBe('api');
		expect(result.current.sourceOf('stock_health')).toBeNull();
	});
});
