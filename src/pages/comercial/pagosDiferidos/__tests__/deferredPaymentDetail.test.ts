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
		expect(detail.payments.length).toBeGreaterThan(0);
		expect(detail.attachments.length).toBeGreaterThan(0);
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
