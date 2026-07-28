import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	DEFERRED_PAYMENT_DETAILS_MOCK,
	DEFERRED_PAYMENTS_MOCK,
	mockFetchDeferredPaymentById,
} from '@/store/slices/deferredPayments/deferredPaymentsMock';
import deferredPaymentsReducer, {
	clearDeferredPaymentDetail,
	fetchDeferredPaymentById,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

vi.mock('@/services/ApiService', () => ({
	default: { fetchData: vi.fn() },
}));

afterEach(() => {
	vi.useRealTimers();
});

describe('ZF-6 detalle de pago diferido', () => {
	it('mantiene un detalle mock coherente con la fila del dashboard', () => {
		const row = DEFERRED_PAYMENTS_MOCK[1];
		const detail = DEFERRED_PAYMENT_DETAILS_MOCK[row.id];

		expect(detail).toMatchObject({
			id: row.id,
			document_number: row.document_number,
			status: row.status,
			outstanding_amount: row.outstanding_amount,
		});
		expect(Number(detail.paid_amount) + Number(detail.outstanding_amount)).toBe(
			Number(detail.total_amount),
		);
		expect(detail.items.length).toBeGreaterThan(0);
		expect(detail.payments.length).toBeGreaterThanOrEqual(2);
		expect(detail.payments.reduce((total, payment) => total + Number(payment.amount), 0)).toBe(
			Number(detail.paid_amount),
		);
		expect(detail.attachments.length).toBeGreaterThan(0);
	});

	it('genera cada abono después de la emisión del documento', () => {
		Object.values(DEFERRED_PAYMENT_DETAILS_MOCK).forEach((detail) => {
			detail.payments.forEach((payment) => {
				expect(payment.paid_at >= detail.issue_date).toBe(true);
				expect(payment.paid_at <= detail.due_date).toBe(true);
			});
		});
	});
	it('obtiene el detalle por ID y rechaza un documento inexistente', async () => {
		vi.useFakeTimers();
		const existingRequest = mockFetchDeferredPaymentById(2);
		await vi.runAllTimersAsync();
		await expect(existingRequest).resolves.toEqual(DEFERRED_PAYMENT_DETAILS_MOCK[2]);

		const missingExpectation = expect(mockFetchDeferredPaymentById(9999)).rejects.toThrow(
			'No se encontró el documento',
		);
		await vi.runAllTimersAsync();
		await missingExpectation;
	});

	it('guarda únicamente la respuesta vigente del detalle', () => {
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const firstArgs = { subsidiaryId: 1, documentId: 1 };
		const secondArgs = { subsidiaryId: 1, documentId: 2 };
		const firstPending = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentById.pending('first-detail', firstArgs),
		);
		const secondPending = deferredPaymentsReducer(
			firstPending,
			fetchDeferredPaymentById.pending('second-detail', secondArgs),
		);
		const staleFulfilled = deferredPaymentsReducer(
			secondPending,
			fetchDeferredPaymentById.fulfilled(
				DEFERRED_PAYMENT_DETAILS_MOCK[1],
				'first-detail',
				firstArgs,
			),
		);
		const currentFulfilled = deferredPaymentsReducer(
			staleFulfilled,
			fetchDeferredPaymentById.fulfilled(
				DEFERRED_PAYMENT_DETAILS_MOCK[2],
				'second-detail',
				secondArgs,
			),
		);

		expect(staleFulfilled.current).toBeNull();
		expect(staleFulfilled.loadingDetail).toBe(true);
		expect(currentFulfilled.current?.id).toBe(2);
		expect(currentFulfilled.loadingDetail).toBe(false);
	});

	it('conserva el mismo documento mientras se recarga', () => {
		const args = { subsidiaryId: 1, documentId: 2 };
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const firstPending = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentById.pending('first-load', args),
		);
		const loaded = deferredPaymentsReducer(
			firstPending,
			fetchDeferredPaymentById.fulfilled(
				DEFERRED_PAYMENT_DETAILS_MOCK[2],
				'first-load',
				args,
			),
		);
		const reloading = deferredPaymentsReducer(
			loaded,
			fetchDeferredPaymentById.pending('reload-detail', args),
		);

		expect(reloading.current?.id).toBe(2);
		expect(reloading.loadingDetail).toBe(true);
		expect(reloading.errorDetail).toBeNull();
	});

	it('expone el error vigente y permite limpiar el detalle', () => {
		const args = { subsidiaryId: 1, documentId: 9999 };
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const pending = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentById.pending('detail-error', args),
		);
		const rejected = deferredPaymentsReducer(
			pending,
			fetchDeferredPaymentById.rejected(
				null,
				'detail-error',
				args,
				'Documento no encontrado',
			),
		);
		const cleared = deferredPaymentsReducer(rejected, clearDeferredPaymentDetail());

		expect(rejected.current).toBeNull();
		expect(rejected.errorDetail).toBe('Documento no encontrado');
		expect(cleared.errorDetail).toBeNull();
		expect(cleared.detailSubsidiaryId).toBeNull();
	});

	it('cancela realmente la espera del detalle mock', async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		const abortExpectation = expect(
			mockFetchDeferredPaymentById(1, controller.signal),
		).rejects.toMatchObject({ name: 'AbortError' });

		controller.abort();
		await abortExpectation;
	});

	it('descarta el error de una solicitud de detalle abortada', () => {
		const args = { subsidiaryId: 1, documentId: 1 };
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const pending = deferredPaymentsReducer(
			initial,
			fetchDeferredPaymentById.pending('aborted-detail', args),
		);
		const aborted = deferredPaymentsReducer(
			pending,
			fetchDeferredPaymentById.rejected(
				{ name: 'AbortError', message: 'Aborted' },
				'aborted-detail',
				args,
			),
		);

		expect(aborted.loadingDetail).toBe(false);
		expect(aborted.errorDetail).toBeNull();
	});
});
