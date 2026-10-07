import { describe, expect, it, vi } from 'vitest';
import type { ReportsService } from '@/services/reports/reports.service';
import reducer, {
	clearInventoryReports,
	type ReportsState,
} from '@/store/slices/reports/reportSlice';
import {
	fetchInventoryReport,
	fetchReportResults,
	inventoryReportQueryKey,
	type IInventoryReportRequest,
} from '@/store/slices/reports/reportsThunks';
import type { TInventoryReportResult } from '@/interface/inventoryReports.interface';

const request = (values: Partial<IInventoryReportRequest> = {}): IInventoryReportRequest => ({
	ownerContext: 'user:2',
	subsidiaryId: 2,
	type: 'stock_health',
	source: 'mock',
	params: { branchId: null },
	branches: [{ id: 4, name: 'Casa Matriz' }],
	...values,
});

const result = (quantity: number): TInventoryReportResult => ({
	type: 'stock',
	rows: [{ sku: 'A', product_name: 'A', branch_name: 'Todas', quantity, updated_at: null }],
});

const initial = reducer(undefined, { type: '@@init' });
const pending = (state: ReportsState, requestId: string, arg = request()) =>
	reducer(state, fetchInventoryReport.pending(requestId, arg));

const getResults = vi.hoisted(() => vi.fn<typeof ReportsService.getResults>());

vi.mock('@/services/reports/reports.service', () => ({
	ReportsService: { getResults },
}));

describe('reportSlice · Reportes › Inventario', () => {
	it('sólo la última petición resuelve la consulta de su tipo', () => {
		const stock = request({ type: 'stock', source: 'api' });
		let state = pending(initial, 'old', stock);
		state = pending(state, 'new', stock);

		state = reducer(state, fetchInventoryReport.fulfilled(result(1), 'old', stock));
		expect(state.inventory.stock).toMatchObject({ result: null, loading: true });

		state = reducer(state, fetchInventoryReport.fulfilled(result(2), 'new', stock));
		expect(state.inventory.stock).toMatchObject({
			ownerContext: inventoryReportQueryKey(stock),
			requestId: 'new',
			result: result(2),
			loading: false,
		});
	});

	it('cada tipo tiene su consulta: Estadísticas lee dos a la vez', () => {
		let state = pending(initial, 'health');
		state = pending(
			state,
			'dead',
			request({ type: 'dead_stock', params: { branchId: null, days: 0 } }),
		);

		expect(state.inventory.stock_health?.requestId).toBe('health');
		expect(state.inventory.dead_stock?.requestId).toBe('dead');
	});

	it('la clave cambia con la sucursal, la fuente o el dueño, así no se pinta otro contexto', () => {
		const base = inventoryReportQueryKey(request());

		expect(inventoryReportQueryKey(request({ params: { branchId: 4 } }))).not.toBe(base);
		expect(inventoryReportQueryKey(request({ source: 'api' }))).not.toBe(base);
		expect(inventoryReportQueryKey(request({ ownerContext: 'otro:2' }))).not.toBe(base);
		expect(inventoryReportQueryKey(request())).toBe(base);
	});

	it('un abort no se muestra como error; un rechazo sí, con mensaje por defecto', () => {
		const aborted = reducer(
			pending(initial, 'r1'),
			fetchInventoryReport.rejected(
				Object.assign(new Error('cancelada'), { name: 'AbortError' }),
				'r1',
				request(),
			),
		);
		expect(aborted.inventory.stock_health).toMatchObject({ loading: false, error: null });

		const failed = reducer(
			pending(initial, 'r2'),
			fetchInventoryReport.rejected(new Error('boom'), 'r2', request()),
		);
		expect(failed.inventory.stock_health?.error).toBe('No pudimos cargar el reporte.');
	});

	it('no toca `loading` ni `error`, que comparten Ventas y el dashboard', () => {
		const shared: ReportsState = { ...initial, loading: true, error: 'ventas' };

		let state = pending(shared, 'r1');
		state = reducer(state, fetchInventoryReport.rejected(new Error('boom'), 'r1', request()));

		expect(state).toMatchObject({ loading: true, error: 'ventas' });
		expect(reducer(state, clearInventoryReports()).inventory).toEqual({});
	});
});

describe('reportSlice · resultados agregados (Ventas y dashboard)', () => {
	const args = { subsidiaryId: 2, type: 'sales', filters: { date_from: '2026-01-01' } };
	const abortError = Object.assign(new Error('cancelada'), { name: 'AbortError' });

	it('el abort de la consulta anterior no apaga el `loading` de la nueva ni pisa sus filas', () => {
		let state = reducer(initial, fetchReportResults.pending('old', args));
		state = reducer(state, fetchReportResults.pending('new', args));
		state = reducer(state, fetchReportResults.rejected(abortError, 'old', args));

		expect(state).toMatchObject({ loading: true, error: null });

		state = reducer(state, fetchReportResults.fulfilled([{ id: 1 }], 'old', args));
		expect(state.aggregatedResults).toBeNull();

		state = reducer(state, fetchReportResults.fulfilled([{ id: 2 }], 'new', args));
		expect(state).toMatchObject({ loading: false, aggregatedResults: [{ id: 2 }] });
	});

	it('pide de a 200 filas hasta una página incompleta y las junta', async () => {
		const page = (size: number, offset: number) =>
			Array.from({ length: size }, (_, index) => ({ id: offset + index }));
		getResults
			.mockResolvedValueOnce({ data: page(200, 0) })
			.mockResolvedValueOnce({ data: page(5, 200) });

		const action = await fetchReportResults({
			...args,
			filters: { ...args.filters, per_page: 10 },
		})(vi.fn(), () => ({}), undefined);

		expect(fetchReportResults.fulfilled.match(action)).toBe(true);
		expect(action.payload).toHaveLength(205);
		expect(getResults.mock.calls.map((call) => call[2])).toEqual([
			{ date_from: '2026-01-01', per_page: 200, page: 1 },
			{ date_from: '2026-01-01', per_page: 200, page: 2 },
		]);
		expect(getResults.mock.calls[0][3]).toBeInstanceOf(AbortSignal);
	});
});
