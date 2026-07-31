import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	CreateDeferredPaymentPayload,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { DEFERRED_PAYMENT_DETAILS_MOCK } from '@/store/slices/deferredPayments/deferredPaymentsMock';
import deferredPaymentsReducer, {
	createDeferredPayment,
	updateDeferredPayment,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

const serviceSpies = vi.hoisted(() => ({
	createDocument: vi.fn(),
	updateDocument: vi.fn(),
}));

vi.mock('@/store/slices/deferredPayments/deferredPaymentsConfig', () => ({ default: false }));
vi.mock('@/services/deferredPaymentsService', () => ({
	default: serviceSpies,
}));

const payload: CreateDeferredPaymentPayload = {
	customer_sale_id: 4,
	document_type: 'electronic_invoice',
	document_number: '1900',
	issue_date: '2026-07-22',
	due_date: '2026-08-21',
	purchase_order: '2525',
	notes: 'Documento conectado a la API',
	assignee_ids: [12, 15],
	items: [
		{
			product_id: null,
			code: '3080M-I5-10600-A',
			description: 'Lenovo ThinkCentre M80',
			quantity: 2,
			unit_price: 476990,
			serials: ['87MJNK3', '394CNK3'],
		},
	],
};

const createStore = () =>
	configureStore({
		reducer: { deferredPayments: deferredPaymentsReducer },
	});

describe('ZF-7 mutaciones mediante API', () => {
	beforeEach(() => {
		serviceSpies.createDocument.mockReset();
		serviceSpies.updateDocument.mockReset();
	});

	it('adapta y envía el formulario de creación al servicio real', async () => {
		const document = DEFERRED_PAYMENT_DETAILS_MOCK[1] as IDeferredPaymentDocument;
		serviceSpies.createDocument.mockResolvedValue({
			document,
			credit_limit_exceeded: true,
		});
		const store = createStore();

		await expect(
			store.dispatch(createDeferredPayment({ subsidiaryId: 9, payload })).unwrap(),
		).resolves.toEqual({ document, credit_limit_exceeded: true });

		expect(serviceSpies.createDocument).toHaveBeenCalledWith(
			9,
			{
				customer_sale_id: 4,
				document_type: 'electronic_invoice',
				document_number: '1900',
				issue_date: '2026-07-22',
				due_date: '2026-08-21',
				total_amount: '953980.00',
				purchase_order: '2525',
				notes: 'Documento conectado a la API',
				assignee_ids: [12, 15],
				items: [
					{
						product_id: null,
						code: '3080M-I5-10600-A',
						description: 'Lenovo ThinkCentre M80',
						quantity: 2,
						unit_price: '476990.00',
						serials: ['87MJNK3', '394CNK3'],
					},
				],
			},
			expect.any(AbortSignal),
		);
	});

	it('envía un PATCH parcial sin inventar total cuando no cambian los ítems', async () => {
		const document = DEFERRED_PAYMENT_DETAILS_MOCK[2] as IDeferredPaymentDocument;
		serviceSpies.updateDocument.mockResolvedValue({
			document,
			credit_limit_exceeded: true,
		});
		const store = createStore();

		await expect(
			store
				.dispatch(
					updateDeferredPayment({
						subsidiaryId: 9,
						documentId: 2,
						payload: { notes: 'Nota actualizada' },
					}),
				)
				.unwrap(),
		).resolves.toEqual({ document, credit_limit_exceeded: true });

		expect(serviceSpies.updateDocument).toHaveBeenCalledWith(
			9,
			2,
			{ notes: 'Nota actualizada' },
			expect.any(AbortSignal),
		);
	});
});
