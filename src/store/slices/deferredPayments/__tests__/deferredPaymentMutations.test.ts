import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentAbono } from '@/interface/deferredPayments.interface';
import deferredPaymentsReducer, {
	markDeferredPaymentPaid,
	registerDeferredPayment,
	uploadDeferredPaymentReceipt,
	voidDeferredPayment,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

const serviceSpies = vi.hoisted(() => ({
	registerPayment: vi.fn(),
	markDocumentPaid: vi.fn(),
	uploadDeferredPaymentAttachment: vi.fn(),
	deletePayment: vi.fn(),
}));
vi.mock('@/services/deferredPaymentsService', () => ({ default: serviceSpies }));

const payment = {
	id: 31,
	amount: '50000.00',
	paid_at: '2026-08-03',
	method: 'transfer',
	notes: null,
	attachments: [],
} satisfies IDeferredPaymentAbono;
const payload = {
	amount: '50000.00',
	paid_at: '2026-08-03',
	method: 'transfer' as const,
	notes: null,
};
const createStore = () => configureStore({ reducer: deferredPaymentsReducer });
const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

beforeEach(() => Object.values(serviceSpies).forEach((spy) => spy.mockReset()));

describe('mutaciones ZF-8 de pagos diferidos', () => {
	it('mantiene ciclos independientes para registrar y marcar pagada', async () => {
		const registration = deferred<IDeferredPaymentAbono>();
		const closing = deferred<IDeferredPaymentAbono>();
		serviceSpies.registerPayment.mockReturnValue(registration.promise);
		serviceSpies.markDocumentPaid.mockReturnValue(closing.promise);
		const store = createStore();

		const registerRequest = store.dispatch(
			registerDeferredPayment({ subsidiaryId: 4, documentId: 7, payload }),
		);
		const closeRequest = store.dispatch(
			markDeferredPaymentPaid({ subsidiaryId: 4, documentId: 7 }),
		);
		expect(store.getState().recordingPayment).toBe(true);
		expect(store.getState().markingPaid).toBe(true);

		closing.resolve(payment);
		await closeRequest;
		expect(store.getState().markingPaid).toBe(false);
		expect(store.getState().recordingPayment).toBe(true);
		registration.resolve(payment);
		await registerRequest;
		expect(store.getState().recordingPayment).toBe(false);
	});

	it('ignora una respuesta obsoleta hasta completar la solicitud vigente', async () => {
		const first = deferred<IDeferredPaymentAbono>();
		const second = deferred<IDeferredPaymentAbono>();
		serviceSpies.registerPayment
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const store = createStore();
		const firstRequest = store.dispatch(
			registerDeferredPayment({ subsidiaryId: 4, documentId: 7, payload }),
		);
		const secondRequest = store.dispatch(
			registerDeferredPayment({ subsidiaryId: 4, documentId: 7, payload }),
		);

		first.resolve(payment);
		await firstRequest;
		expect(store.getState().recordingPayment).toBe(true);
		second.resolve({ ...payment, id: 32 });
		await secondRequest;
		expect(store.getState().recordingPayment).toBe(false);
		expect(store.getState().paymentRequestId).toBeNull();
	});

	it('ignora el aborto del comprobante sin dejar loading ni error falso', async () => {
		serviceSpies.uploadDeferredPaymentAttachment.mockImplementation(
			(
				_subsidiaryId: number,
				_documentId: number,
				_paymentId: number,
				_file: File,
				signal: AbortSignal,
			) =>
				new Promise((_resolve, reject) => {
					signal.addEventListener(
						'abort',
						() => reject(new DOMException('Solicitud cancelada', 'AbortError')),
						{ once: true },
					);
				}),
		);
		const store = createStore();
		const request = store.dispatch(
			uploadDeferredPaymentReceipt({
				subsidiaryId: 4,
				documentId: 7,
				paymentId: 31,
				file: new File(['x'], 'pago.pdf', { type: 'application/pdf' }),
			}),
		);
		request.abort();
		await request;

		expect(store.getState().uploadingReceipt).toBe(false);
		expect(store.getState().errorReceipt).toBeNull();
	});

	it('expone el abono en curso y conserva el error literal al anular', async () => {
		const deletion = deferred<{ message: string }>();
		serviceSpies.deletePayment.mockReturnValue(deletion.promise);
		const store = createStore();
		const request = store.dispatch(
			voidDeferredPayment({ subsidiaryId: 4, documentId: 7, paymentId: 31 }),
		);
		expect(store.getState().voidingPaymentId).toBe(31);
		deletion.reject({
			response: { data: { message: 'El abono pertenece a otro documento.' } },
		});
		await request;
		expect(store.getState().voidingPaymentId).toBeNull();
		expect(store.getState().errorVoid).toBe('El abono pertenece a otro documento.');
	});
});
