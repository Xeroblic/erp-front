import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	DEFERRED_PAYMENTS_MOCK,
	DEFERRED_PAYMENTS_SUMMARY_MOCK,
	mockFetchDeferredPayments,
} from '@/store/slices/deferredPayments/deferredPaymentsMock';
import deferredPaymentsReducer, {
	DEFAULT_DEFERRED_PAYMENTS_FILTERS,
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { formatDeferredPaymentAmount, getDaysUntilDueText } from '../utils';

vi.mock('@/services/ApiService', () => ({
	default: { fetchData: vi.fn() },
}));

afterEach(() => {
	vi.useRealTimers();
});

describe('ZF-5 Pagos diferidos', () => {
	it('formatea montos y vencimientos para la UI', () => {
		expect(formatDeferredPaymentAmount('953980.00')).toBe('$ 953.980');
		expect(getDaysUntilDueText(5)).toBe('Vence en 5 días');
		expect(getDaysUntilDueText(0)).toBe('Vence hoy');
		expect(getDaysUntilDueText(-3)).toBe('Vencido 3 días');
	});

	it('mantiene un universo mock representativo y un summary coherente', () => {
		const overdue = DEFERRED_PAYMENTS_MOCK.filter((row) => row.is_overdue);
		const dueSoon = DEFERRED_PAYMENTS_MOCK.filter(
			(row) =>
				row.status !== 'paid' &&
				row.days_until_due !== null &&
				row.days_until_due >= 0 &&
				row.days_until_due <= 7,
		);
		const unpaid = DEFERRED_PAYMENTS_MOCK.filter(
			(row) => row.status !== 'paid' && Number(row.outstanding_amount) > 0,
		);
		const pending = DEFERRED_PAYMENTS_MOCK.filter((row) => row.status === 'pending');
		const expectedOutstanding = unpaid
			.reduce((total, row) => total + Number(row.outstanding_amount), 0)
			.toFixed(2);

		expect(DEFERRED_PAYMENTS_MOCK).toHaveLength(10);
		expect(overdue.length).toBeGreaterThanOrEqual(3);
		expect(dueSoon.length).toBeGreaterThanOrEqual(2);
		expect(
			DEFERRED_PAYMENTS_MOCK.filter((row) => row.status === 'paid').every(
				(row) => row.days_until_due === null,
			),
		).toBe(true);
		expect(DEFERRED_PAYMENTS_SUMMARY_MOCK.total_outstanding).toBe(expectedOutstanding);
		expect(DEFERRED_PAYMENTS_SUMMARY_MOCK.overdue.count).toBe(overdue.length);
		expect(DEFERRED_PAYMENTS_SUMMARY_MOCK.due_within_7_days.count).toBe(dueSoon.length);
		expect(DEFERRED_PAYMENTS_SUMMARY_MOCK.pending.count).toBe(pending.length);
	});

	it('filtra y pagina el mock como el endpoint congelado', async () => {
		vi.useFakeTimers();
		const request = mockFetchDeferredPayments({
			...DEFAULT_DEFERRED_PAYMENTS_FILTERS,
			status: 'overdue',
			per_page: 2,
		});
		await vi.runAllTimersAsync();
		const response = await request;

		expect(response.data).toHaveLength(2);
		expect(response.data.every((row) => row.is_overdue)).toBe(true);
		expect(response.meta.total).toBeGreaterThanOrEqual(3);
		expect(response.meta.current_page).toBe(1);
	});

	it('conserva filtros y acepta solo la respuesta vigente de la lista', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const filtered = deferredPaymentsReducer(
			initial,
			setDeferredPaymentsFilters({ status: 'overdue', page: 2 }),
		);
		const args = { subsidiaryId: 1, filters: filtered.filters };
		const pending = deferredPaymentsReducer(
			filtered,
			fetchDeferredPayments.pending('request-id', args),
		);
		const payload = {
			data: DEFERRED_PAYMENTS_MOCK.slice(0, 2),
			meta: { current_page: 2, per_page: 2, total: 10, last_page: 5 },
		};
		const fulfilled = deferredPaymentsReducer(
			pending,
			fetchDeferredPayments.fulfilled(payload, 'request-id', args),
		);

		expect(fulfilled.filters).toEqual(filtered.filters);
		expect(fulfilled.list).toEqual(payload.data);
		expect(fulfilled.meta).toEqual(payload.meta);
	});

	it('guarda el summary al resolver la solicitud vigente', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const args = { subsidiaryId: 1 };
		const pending = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentsSummary.pending('request-id', args),
		);
		const fulfilled = deferredPaymentsReducer(
			pending,
			fetchDeferredPaymentsSummary.fulfilled(
				DEFERRED_PAYMENTS_SUMMARY_MOCK,
				'request-id',
				args,
			),
		);

		expect(fulfilled.loadingSummary).toBe(false);
		expect(fulfilled.summary).toEqual(DEFERRED_PAYMENTS_SUMMARY_MOCK);
	});

	it('separa errores de lista y resumen', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const listArgs = { subsidiaryId: 1 };
		const listPending = deferredPaymentsReducer(
			initial,
			fetchDeferredPayments.pending('list-request', listArgs),
		);
		const listFailed = deferredPaymentsReducer(
			listPending,
			fetchDeferredPayments.rejected(null, 'list-request', listArgs, 'Error lista'),
		);
		const summaryArgs = { subsidiaryId: 1 };
		const summaryPending = deferredPaymentsReducer(
			listFailed,
			fetchDeferredPaymentsSummary.pending('summary-request', summaryArgs),
		);
		const summaryFailed = deferredPaymentsReducer(
			summaryPending,
			fetchDeferredPaymentsSummary.rejected(
				null,
				'summary-request',
				summaryArgs,
				'Error resumen',
			),
		);

		expect(summaryFailed.error).toBe('Error lista');
		expect(summaryFailed.errorSummary).toBe('Error resumen');
	});

	it('preserva la paginación al recargar y la limpia al cambiar de contexto o fallar', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const firstArgs = { subsidiaryId: 1 };
		const firstPending = deferredPaymentsReducer(
			initial,
			fetchDeferredPayments.pending('first-request', firstArgs),
		);
		const payload = {
			data: DEFERRED_PAYMENTS_MOCK.slice(0, 2),
			meta: { current_page: 1, per_page: 2, total: 10, last_page: 5 },
		};
		const loaded = deferredPaymentsReducer(
			firstPending,
			fetchDeferredPayments.fulfilled(payload, 'first-request', firstArgs),
		);
		const reloadPending = deferredPaymentsReducer(
			loaded,
			fetchDeferredPayments.pending('reload-request', firstArgs),
		);
		const failed = deferredPaymentsReducer(
			reloadPending,
			fetchDeferredPayments.rejected(null, 'reload-request', firstArgs, 'Error de lista'),
		);
		const contextPending = deferredPaymentsReducer(
			loaded,
			fetchDeferredPayments.pending('context-request', { subsidiaryId: 2 }),
		);

		expect(reloadPending.meta).toEqual(payload.meta);
		expect(failed.meta).toBeNull();
		expect(failed.list).toEqual([]);
		expect(contextPending.meta).toBeNull();
		expect(contextPending.list).toEqual([]);
		expect(contextPending.filters.page).toBe(1);
	});
	it('conserva el resumen al recargar el mismo contexto y lo limpia al fallar', () => {
		const args = { subsidiaryId: 1 };
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const pending = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentsSummary.pending('first-summary', args),
		);
		const loaded = deferredPaymentsReducer(
			pending,
			fetchDeferredPaymentsSummary.fulfilled(
				DEFERRED_PAYMENTS_SUMMARY_MOCK,
				'first-summary',
				args,
			),
		);
		const reloading = deferredPaymentsReducer(
			loaded,
			fetchDeferredPaymentsSummary.pending('reload-summary', args),
		);
		const failed = deferredPaymentsReducer(
			reloading,
			fetchDeferredPaymentsSummary.rejected(null, 'reload-summary', args, 'Error resumen'),
		);

		expect(reloading.summary).toEqual(DEFERRED_PAYMENTS_SUMMARY_MOCK);
		expect(failed.summary).toBeNull();
	});
	it('ignora un rechazo abortado', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const args = { subsidiaryId: 2 };
		const pending = deferredPaymentsReducer(
			initial,
			fetchDeferredPayments.pending('request-id', args),
		);
		const aborted = deferredPaymentsReducer(
			pending,
			fetchDeferredPayments.rejected(
				{ name: 'AbortError', message: 'Aborted' },
				'request-id',
				args,
			),
		);

		expect(pending.list).toEqual([]);
		expect(pending.meta).toBeNull();
		expect(aborted.error).toBeNull();
		expect(aborted.loading).toBe(false);
	});

	it('cancela realmente la espera del mock mediante AbortSignal', async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		const request = mockFetchDeferredPayments(
			DEFAULT_DEFERRED_PAYMENTS_FILTERS,
			controller.signal,
		);
		controller.abort();
		await expect(request).rejects.toMatchObject({ name: 'AbortError' });
	});
});
