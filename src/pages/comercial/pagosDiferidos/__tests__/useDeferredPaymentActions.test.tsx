import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	IDeferredPaymentAbono,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsReducer, {
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { useDeferredPaymentActions } from '../hooks/useDeferredPaymentActions';

const toastSpies = vi.hoisted(() => ({ success: vi.fn() }));
const serviceSpies = vi.hoisted(() => ({
	registerPayment: vi.fn(),
	deletePayment: vi.fn(),
	markDocumentPaid: vi.fn(),
	uploadDeferredPaymentAttachment: vi.fn(),
	getDocument: vi.fn(),
	getDocuments: vi.fn(),
	getSummary: vi.fn(),
}));
vi.mock('react-toastify', () => ({ toast: toastSpies }));
vi.mock('@/services/deferredPaymentsService', () => ({ default: serviceSpies }));

const document = {
	id: 7,
	status: 'partially_paid',
	outstanding_amount: '100000.00',
} as IDeferredPaymentDocument;
const otherDocument = {
	...document,
	id: 8,
} as IDeferredPaymentDocument;
const payment: IDeferredPaymentAbono = {
	id: 31,
	amount: '100000.00',
	paid_at: '2026-08-03',
	method: 'transfer',
	notes: null,
	attachments: [],
};
const createStore = () =>
	configureStore({ reducer: { deferredPayments: deferredPaymentsReducer } });
interface DeferredPaymentActionHookProps {
	currentDocument: IDeferredPaymentDocument | null;
	currentSubsidiaryId: number | null;
}
const renderActions = (
	filters: { page: number; per_page: number; search: string } | null = null,
) => {
	const store = createStore();
	if (filters) store.dispatch(setDeferredPaymentsFilters(filters));
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);
	return {
		store,
		...renderHook<ReturnType<typeof useDeferredPaymentActions>, DeferredPaymentActionHookProps>(
			({ currentDocument, currentSubsidiaryId }) =>
				useDeferredPaymentActions(currentDocument, currentSubsidiaryId),
			{
				wrapper,
				initialProps: { currentDocument: document, currentSubsidiaryId: 4 },
			},
		),
	};
};

beforeEach(() => {
	Object.values(serviceSpies).forEach((spy) => spy.mockReset());
	toastSpies.success.mockReset();
	serviceSpies.getDocument.mockResolvedValue(document);
	serviceSpies.getDocuments.mockResolvedValue({
		data: [],
		meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
	});
	serviceSpies.getSummary.mockResolvedValue({
		total_outstanding: '0.00',
		overdue: { count: 0, amount: '0.00' },
		due_within_7_days: { count: 0, amount: '0.00' },
		current: { count: 0, amount: '0.00' },
	});
});

describe('useDeferredPaymentActions', () => {
	it('registra el abono y su comprobante en una única operación atómica', async () => {
		serviceSpies.registerPayment.mockResolvedValue(payment);
		const file = new File(['comprobante'], 'abono.pdf', { type: 'application/pdf' });
		const { result } = renderActions();

		await act(async () => {
			await result.current.formik.setValues({
				amount: '50000',
				paid_at: '2026-08-03',
				method: 'transfer',
				notes: '',
				receipt: file,
			});
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(serviceSpies.registerPayment).toHaveBeenCalledWith(
			4,
			document.id,
			{
				amount: '50000.00',
				paid_at: '2026-08-03',
				method: 'transfer',
				notes: null,
				receipt: file,
			},
			expect.any(AbortSignal),
		);
		expect(serviceSpies.uploadDeferredPaymentAttachment).not.toHaveBeenCalled();
		expect(result.current.state.pendingMarkPaidReceipt).toBeNull();
		expect(toastSpies.success).toHaveBeenCalledWith('Abono registrado correctamente');
		expect(toastSpies.success).toHaveBeenCalledOnce();
	});

	it('permite cerrar el documento después de fallar un registro con comprobante', async () => {
		serviceSpies.registerPayment.mockRejectedValue(new Error('No se pudo registrar'));
		serviceSpies.markDocumentPaid.mockResolvedValue(payment);
		const file = new File(['comprobante'], 'abono.pdf', { type: 'application/pdf' });
		const { result } = renderActions();

		await act(async () => {
			await result.current.formik.setValues({
				amount: '50000',
				paid_at: '2026-08-03',
				method: 'transfer',
				notes: '',
				receipt: file,
			});
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});
		let closed = false;
		await act(async () => {
			closed = await result.current.actions.markPaid();
		});

		expect(closed).toBe(true);
		expect(serviceSpies.registerPayment).toHaveBeenCalledOnce();
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
		expect(serviceSpies.uploadDeferredPaymentAttachment).not.toHaveBeenCalled();
		expect(toastSpies.success).toHaveBeenCalledWith(
			'Documento marcado como pagado correctamente',
		);
		expect(toastSpies.success).toHaveBeenCalledOnce();
	});
	it('reintenta solo el comprobante cuando falla después del cierre manual', async () => {
		serviceSpies.markDocumentPaid.mockResolvedValue(payment);
		serviceSpies.uploadDeferredPaymentAttachment
			.mockRejectedValueOnce(new Error('Upload temporalmente no disponible'))
			.mockResolvedValueOnce({ id: 90, file_name: 'cierre.pdf' });
		const file = new File(['comprobante'], 'cierre.pdf', { type: 'application/pdf' });
		const { result } = renderActions({ page: 3, per_page: 50, search: 'FAC-0099' });

		await act(async () => {
			await result.current.actions.setMarkPaidReceipt(file);
		});
		let closed = true;
		await act(async () => {
			closed = await result.current.actions.markPaid();
		});
		expect(closed).toBe(true);
		expect(result.current.state.pendingMarkPaidReceipt?.paymentId).toBe(payment.id);
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
		expect(serviceSpies.uploadDeferredPaymentAttachment).toHaveBeenCalledOnce();
		expect(toastSpies.success).toHaveBeenCalledWith(
			'Documento marcado como pagado correctamente',
		);

		await act(async () => {
			expect(await result.current.actions.retryMarkPaidReceipt()).toBe(true);
		});
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
		expect(serviceSpies.uploadDeferredPaymentAttachment).toHaveBeenCalledTimes(2);
		expect(toastSpies.success).toHaveBeenCalledOnce();
		await waitFor(() => expect(result.current.state.pendingMarkPaidReceipt).toBeNull());
		expect(serviceSpies.getDocument).toHaveBeenCalledTimes(2);
		expect(serviceSpies.getDocuments).toHaveBeenCalledWith(
			4,
			expect.objectContaining({ page: 3, per_page: 50, search: 'FAC-0099' }),
			expect.any(AbortSignal),
		);
		expect(serviceSpies.getSummary).toHaveBeenCalledWith(
			4,
			{
				status: undefined,
				customer_sale_id: undefined,
				search: 'FAC-0099',
				due_before: undefined,
				due_after: undefined,
			},
			expect.any(AbortSignal),
		);
		expect(serviceSpies.getDocuments).toHaveBeenCalledOnce();
		expect(serviceSpies.getSummary).toHaveBeenCalledOnce();
	});

	it('no restaura ni reutiliza un comprobante descartado al abortar el reintento', async () => {
		serviceSpies.markDocumentPaid.mockResolvedValueOnce(payment).mockResolvedValueOnce({
			...payment,
			id: 32,
		});
		let uploadSignal: AbortSignal | undefined;
		serviceSpies.uploadDeferredPaymentAttachment
			.mockRejectedValueOnce(new Error('Upload temporalmente no disponible'))
			.mockImplementationOnce(
				(
					_subsidiaryId: number,
					_documentId: number,
					_paymentId: number,
					_file: File,
					signal: AbortSignal,
				) =>
					new Promise<never>((_resolve, reject) => {
						uploadSignal = signal;
						signal.addEventListener('abort', () =>
							reject(new DOMException('Aborted', 'AbortError')),
						);
					}),
			);
		const file = new File(['comprobante'], 'cierre.pdf', { type: 'application/pdf' });
		const { result, rerender } = renderActions();

		await act(async () => {
			await result.current.actions.setMarkPaidReceipt(file);
		});
		await act(async () => {
			expect(await result.current.actions.markPaid()).toBe(true);
		});
		expect(result.current.state.pendingMarkPaidReceipt?.documentId).toBe(document.id);

		let retry: Promise<boolean>;
		act(() => {
			retry = result.current.actions.retryMarkPaidReceipt();
		});
		await waitFor(() => expect(uploadSignal).toBeDefined());
		act(() => result.current.actions.dismissMarkPaidReceipt());
		rerender({ currentDocument: otherDocument, currentSubsidiaryId: 4 });
		await act(async () => {
			expect(await retry).toBe(false);
		});

		expect(uploadSignal?.aborted).toBe(true);
		expect(result.current.state.pendingMarkPaidReceipt).toBeNull();
		await act(async () => {
			expect(await result.current.actions.markPaid()).toBe(true);
		});
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledTimes(2);
		expect(serviceSpies.uploadDeferredPaymentAttachment).toHaveBeenCalledTimes(2);
		expect(serviceSpies.markDocumentPaid).toHaveBeenLastCalledWith(
			4,
			otherDocument.id,
			expect.any(AbortSignal),
		);
	});

	it('mantiene el refresco del listado y resumen al cerrar el detalle', async () => {
		let listSignal: AbortSignal | undefined;
		let summarySignal: AbortSignal | undefined;
		serviceSpies.registerPayment.mockResolvedValue(payment);
		serviceSpies.getDocuments.mockImplementation(
			(_subsidiaryId: number, _filters: unknown, signal: AbortSignal) =>
				new Promise<never>(() => {
					listSignal = signal;
				}),
		);
		serviceSpies.getSummary.mockImplementation(
			(_subsidiaryId: number, _filters: unknown, signal: AbortSignal) =>
				new Promise<never>(() => {
					summarySignal = signal;
				}),
		);
		const { result, rerender } = renderActions();

		await act(async () => {
			await result.current.formik.setValues({
				amount: '50000',
				paid_at: '2026-08-03',
				method: 'transfer',
				notes: '',
				receipt: null,
			});
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});
		await waitFor(() => {
			expect(listSignal).toBeDefined();
			expect(summarySignal).toBeDefined();
		});
		rerender({ currentDocument: null, currentSubsidiaryId: 4 });

		expect(listSignal?.aborted).toBe(false);
		expect(summarySignal?.aborted).toBe(false);
	});

	it('permite descartar un comprobante pendiente sin repetir el cierre manual', async () => {
		serviceSpies.markDocumentPaid.mockResolvedValue(payment);
		serviceSpies.uploadDeferredPaymentAttachment.mockRejectedValue(
			new Error('El archivo no cumple el formato'),
		);
		const { result, store } = renderActions();

		await act(async () => {
			await result.current.actions.setMarkPaidReceipt(
				new File(['contenido'], 'comprobante.pdf', { type: 'application/pdf' }),
			);
		});
		await act(async () => {
			expect(await result.current.actions.markPaid()).toBe(true);
		});
		expect(result.current.state.pendingMarkPaidReceipt).not.toBeNull();
		expect(store.getState().deferredPayments.errorReceipt).toBe(
			'El archivo no cumple el formato',
		);

		act(() => result.current.actions.dismissMarkPaidReceipt());
		expect(result.current.state.pendingMarkPaidReceipt).toBeNull();
		expect(store.getState().deferredPayments.errorReceipt).toBeNull();
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
	});

	it('descarta el comprobante pendiente al anular y ejecuta un cierre nuevo', async () => {
		serviceSpies.markDocumentPaid
			.mockResolvedValueOnce(payment)
			.mockResolvedValueOnce({ ...payment, id: 32 });
		serviceSpies.uploadDeferredPaymentAttachment.mockRejectedValueOnce(
			new Error('Upload temporalmente no disponible'),
		);
		serviceSpies.deletePayment.mockResolvedValue({ message: 'Abono anulado correctamente' });
		const { result } = renderActions();

		await act(async () => {
			await result.current.actions.setMarkPaidReceipt(
				new File(['contenido'], 'comprobante.pdf', { type: 'application/pdf' }),
			);
		});
		await act(async () => {
			expect(await result.current.actions.markPaid()).toBe(true);
		});
		expect(result.current.state.pendingMarkPaidReceipt?.paymentId).toBe(payment.id);

		await act(async () => {
			expect(await result.current.actions.voidPayment(payment)).toBe(true);
		});
		expect(result.current.state.pendingMarkPaidReceipt).toBeNull();

		await act(async () => {
			expect(await result.current.actions.markPaid()).toBe(true);
		});
		expect(serviceSpies.deletePayment).toHaveBeenCalledWith(
			4,
			document.id,
			payment.id,
			expect.any(AbortSignal),
		);
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledTimes(2);
		expect(serviceSpies.uploadDeferredPaymentAttachment).toHaveBeenCalledOnce();
	});

	it('limpia el error de mutación antes de abrir otro flujo', async () => {
		serviceSpies.registerPayment.mockRejectedValue(new Error('El comprobante no es válido'));
		const { result, store } = renderActions();

		await act(async () => {
			await result.current.formik.setValues({
				amount: '50000',
				paid_at: '2026-08-03',
				method: 'transfer',
				notes: '',
				receipt: null,
			});
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});
		expect(store.getState().deferredPayments.errorPayment).toBe('El comprobante no es válido');

		act(() => result.current.actions.clearMutationErrors());
		expect(store.getState().deferredPayments.errorPayment).toBeNull();
	});

	it('conserva los valores de Formik y el mensaje literal ante un 422', async () => {
		serviceSpies.registerPayment.mockRejectedValue({
			response: {
				data: {
					message: 'El abono excede el saldo pendiente del documento.',
					errors: { amount: ['El abono excede el saldo pendiente del documento.'] },
				},
			},
		});
		const { result, store } = renderActions();
		await act(async () => {
			await result.current.formik.setValues({
				amount: '99999',
				paid_at: '2026-08-03',
				method: 'transfer',
				notes: 'referencia que debe conservarse',
				receipt: null,
			});
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(result.current.formik.values.amount).toBe('99999');
		expect(result.current.formik.values.notes).toBe('referencia que debe conservarse');
		expect(store.getState().deferredPayments.errorPayment).toBe(
			'El abono excede el saldo pendiente del documento.',
		);
	});
});
