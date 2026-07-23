import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/ApiService', () => ({
	default: { fetchData: vi.fn() },
}));
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

afterEach(() => {
	vi.useRealTimers();
});

describe('ZF-5 Pagos diferidos', () => {
	it('formatea montos y vencimientos para la UI', () => {
		expect(formatDeferredPaymentAmount('953980.00')).toBe('$ 953.980');
		expect(getDaysUntilDueText(5)).toBe('Vence en 5 d\u00EDas');
		expect(getDaysUntilDueText(0)).toBe('Vence hoy');
		expect(getDaysUntilDueText(-3)).toBe('Vencido 3 d\u00EDas');
	});

	it('mantiene un universo mock representativo y un summary coherente', () => {
		const overdue = DEFERRED_PAYMENTS_MOCK.filter((row) => row.is_overdue);
		const dueSoon = DEFERRED_PAYMENTS_MOCK.filter(
			(row) => row.status !== 'paid' && row.days_until_due >= 0 && row.days_until_due <= 7,
		);
		const expectedOutstanding = DEFERRED_PAYMENTS_MOCK.reduce(
			(total, row) => total + Number(row.outstanding_amount),
			0,
		).toFixed(2);

		expect(DEFERRED_PAYMENTS_MOCK).toHaveLength(10);
		expect(overdue.length).toBeGreaterThanOrEqual(3);
		expect(dueSoon.length).toBeGreaterThanOrEqual(2);
		expect(DEFERRED_PAYMENTS_MOCK.some((row) => row.status === 'paid')).toBe(true);
		expect(DEFERRED_PAYMENTS_SUMMARY_MOCK.total_outstanding).toBe(expectedOutstanding);
		expect(DEFERRED_PAYMENTS_SUMMARY_MOCK.overdue.count).toBe(overdue.length);
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

	it('actualiza filtros solo mediante su reducer dedicado', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const filtered = deferredPaymentsReducer(
			initial,
			setDeferredPaymentsFilters({ status: 'overdue', page: 2 }),
		);
		const payload = {
			data: DEFERRED_PAYMENTS_MOCK.slice(0, 2),
			meta: { current_page: 2, per_page: 2, total: 10, last_page: 5 },
		};
		const fulfilled = deferredPaymentsReducer(
			filtered,
			fetchDeferredPayments.fulfilled(payload, 'request-id', {
				subsidiaryId: 1,
				filters: filtered.filters,
			}),
		);

		expect(fulfilled.filters).toEqual(filtered.filters);
		expect(fulfilled.list).toEqual(payload.data);
		expect(fulfilled.meta).toEqual(payload.meta);
	});

	it('guarda el summary al resolver su thunk', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const fulfilled = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentsSummary.fulfilled(DEFERRED_PAYMENTS_SUMMARY_MOCK, 'request-id', {
				subsidiaryId: 1,
			}),
		);

		expect(fulfilled.loadingSummary).toBe(false);
		expect(fulfilled.summary).toEqual(DEFERRED_PAYMENTS_SUMMARY_MOCK);
	});
});
