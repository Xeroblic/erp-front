import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import deferredPaymentsReducer, {
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { useDeferredPaymentActions } from '../hooks/useDeferredPaymentActions';

const serviceSpies = vi.hoisted(() => ({
	registerPayment: vi.fn(),
	markDocumentPaid: vi.fn(),
	uploadDeferredPaymentAttachment: vi.fn(),
	getDocument: vi.fn(),
	getDocuments: vi.fn(),
	getSummary: vi.fn(),
}));
vi.mock('@/services/deferredPaymentsService', () => ({ default: serviceSpies }));

const document = {
	id: 7,
	outstanding_amount: '100000.00',
} as IDeferredPaymentDocument;
const payment = {
	id: 31,
	amount: '100000.00',
	paid_at: '2026-08-03',
	method: 'transfer',
	notes: null,
	attachments: [],
};
const createStore = () =>
	configureStore({ reducer: { deferredPayments: deferredPaymentsReducer } });
const renderActions = (
	filters: { page: number; per_page: number; search: string } | null = null,
) => {
	const store = createStore();
	if (filters) store.dispatch(setDeferredPaymentsFilters(filters));
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);
	return { store, ...renderHook(() => useDeferredPaymentActions(document, 4), { wrapper }) };
};

beforeEach(() => {
	Object.values(serviceSpies).forEach((spy) => spy.mockReset());
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
	it('registra el abono y su comprobante en una sola operación atómica', async () => {
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
			closed = await result.current.actions.confirmMarkPaid();
		});

		expect(closed).toBe(true);
		expect(serviceSpies.registerPayment).toHaveBeenCalledOnce();
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
		expect(serviceSpies.uploadDeferredPaymentAttachment).not.toHaveBeenCalled();
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
			closed = await result.current.actions.confirmMarkPaid();
		});
		expect(closed).toBe(false);
		expect(result.current.state.pendingMarkPaidReceipt?.paymentId).toBe(payment.id);
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
		expect(serviceSpies.uploadDeferredPaymentAttachment).toHaveBeenCalledOnce();

		await act(async () => {
			expect(await result.current.actions.confirmMarkPaid()).toBe(true);
		});
		expect(serviceSpies.markDocumentPaid).toHaveBeenCalledOnce();
		expect(serviceSpies.uploadDeferredPaymentAttachment).toHaveBeenCalledTimes(2);
		await waitFor(() => expect(result.current.state.pendingMarkPaidReceipt).toBeNull());
		expect(serviceSpies.getDocument).toHaveBeenCalled();
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
