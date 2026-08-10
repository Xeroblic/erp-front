import { describe, expect, it, vi } from 'vitest';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsTestData';
import deferredPaymentsReducer, {
	clearDeferredPaymentDetail,
	fetchDeferredPaymentById,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

vi.mock('@/services/ApiService', () => ({
	default: { fetchData: vi.fn() },
}));

describe('ZF-6 detalle de pago diferido', () => {
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
				DEFERRED_PAYMENT_DETAIL_FIXTURES[1],
				'first-detail',
				firstArgs,
			),
		);
		const currentFulfilled = deferredPaymentsReducer(
			staleFulfilled,
			fetchDeferredPaymentById.fulfilled(
				DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
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
				DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
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
