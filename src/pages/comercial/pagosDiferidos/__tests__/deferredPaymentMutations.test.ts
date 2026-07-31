import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreateDeferredPaymentPayload } from '@/interface/deferredPayments.interface';
import {
	DEFERRED_PAYMENT_DETAIL_FIXTURES,
	DEFERRED_PAYMENT_LIST_FIXTURES,
	DEFERRED_PAYMENT_SUMMARY_FIXTURE,
	createDeferredPaymentFixture,
	updateDeferredPaymentFixture,
} from './deferredPaymentsScenarioFixtures';
import deferredPaymentsReducer, {
	clearDeferredPaymentMutation,
	createDeferredPayment,
	updateDeferredPayment,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

vi.mock('@/services/ApiService', () => ({
	default: { fetchData: vi.fn(), invalidateCache: vi.fn() },
}));

const originalRows = [...DEFERRED_PAYMENT_LIST_FIXTURES];
const originalDetails = { ...DEFERRED_PAYMENT_DETAIL_FIXTURES };
const originalSummary = {
	...DEFERRED_PAYMENT_SUMMARY_FIXTURE,
	overdue: { ...DEFERRED_PAYMENT_SUMMARY_FIXTURE.overdue },
	due_within_7_days: { ...DEFERRED_PAYMENT_SUMMARY_FIXTURE.due_within_7_days },
	current: { ...DEFERRED_PAYMENT_SUMMARY_FIXTURE.current },
};

const payload: CreateDeferredPaymentPayload = {
	customer_sale_id: 1,
	document_type: 'electronic_invoice',
	document_number: 'FD-ZF7-001',
	issue_date: '2026-07-28',
	due_date: '2026-08-27',
	purchase_order: null,
	notes: 'Documento creado desde ZF-7',
	assignee_ids: [101],
	items: [
		{
			product_id: null,
			code: 'SERV-ZF7',
			description: 'Servicio de prueba',
			quantity: 2,
			unit_price: 150000,
			serials: [],
		},
	],
};

const restoreMockUniverse = () => {
	DEFERRED_PAYMENT_LIST_FIXTURES.splice(0, DEFERRED_PAYMENT_LIST_FIXTURES.length, ...originalRows);
	Object.keys(DEFERRED_PAYMENT_DETAIL_FIXTURES).forEach((key) => {
		delete DEFERRED_PAYMENT_DETAIL_FIXTURES[Number(key)];
	});
	Object.assign(DEFERRED_PAYMENT_DETAIL_FIXTURES, originalDetails);
	Object.assign(DEFERRED_PAYMENT_SUMMARY_FIXTURE, originalSummary);
};

afterEach(() => {
	restoreMockUniverse();
	vi.useRealTimers();
});

describe('ZF-7 mutaciones de documentos diferidos', () => {
	it('crea un documento coherente y lo incorpora al universo mock', async () => {
		vi.useFakeTimers();
		const request = createDeferredPaymentFixture(payload);
		await vi.runAllTimersAsync();
		const result = await request;

		expect(result.document).toMatchObject({
			document_number: 'FD-ZF7-001',
			total_amount: '300000.00',
			outstanding_amount: '300000.00',
			paid_amount: '0.00',
			status: 'pending',
			notes: 'Documento creado desde ZF-7',
		});
		expect(DEFERRED_PAYMENT_LIST_FIXTURES.at(-1)?.id).toBe(result.document.id);
		expect(DEFERRED_PAYMENT_DETAIL_FIXTURES[result.document.id]).toEqual(result.document);
	});

	it('rechaza la edición de un documento pagado', async () => {
		vi.useFakeTimers();
		const expectation = expect(
			updateDeferredPaymentFixture(9, { notes: 'No debe guardarse' }),
		).rejects.toThrow('No se puede editar un documento pagado');
		await vi.runAllTimersAsync();
		await expectation;
	});

	it('permite limpiar notas y orden de compra durante la edición', async () => {
		vi.useFakeTimers();
		const noteRequest = updateDeferredPaymentFixture(1, { notes: null });
		await vi.runAllTimersAsync();
		const withoutNote = await noteRequest;

		const purchaseOrderRequest = updateDeferredPaymentFixture(2, { purchase_order: null });
		await vi.runAllTimersAsync();
		const withoutPurchaseOrder = await purchaseOrderRequest;

		expect(withoutNote.document.notes).toBeNull();
		expect(withoutPurchaseOrder.document.purchase_order).toBeNull();
	});
	it('expone carga y advertencia de cupo al crear', () => {
		const args = { subsidiaryId: 1, payload };
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const pending = deferredPaymentsReducer(
			initial,
			createDeferredPayment.pending('create-zf7', args),
		);
		const fulfilled = deferredPaymentsReducer(
			pending,
			createDeferredPayment.fulfilled(
				{
					document: DEFERRED_PAYMENT_DETAIL_FIXTURES[1],
					credit_limit_exceeded: true,
				},
				'create-zf7',
				args,
			),
		);

		expect(pending.creating).toBe(true);
		expect(fulfilled.creating).toBe(false);
		expect(fulfilled.current?.id).toBe(1);
		expect(fulfilled.lastMutationCreditLimitExceeded).toBe(true);
	});

	it('ignora respuestas obsoletas y limpia el error de mutación', () => {
		const args = { subsidiaryId: 1, documentId: 2, payload: { notes: 'Actualizada' } };
		const initial = deferredPaymentsReducer(undefined, { type: 'init' });
		const firstPending = deferredPaymentsReducer(
			initial,
			updateDeferredPayment.pending('update-first', args),
		);
		const secondPending = deferredPaymentsReducer(
			firstPending,
			updateDeferredPayment.pending('update-second', args),
		);
		const stale = deferredPaymentsReducer(
			secondPending,
			updateDeferredPayment.fulfilled(
				{
					document: DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
					credit_limit_exceeded: false,
				},
				'update-first',
				args,
			),
		);
		const rejected = deferredPaymentsReducer(
			stale,
			updateDeferredPayment.rejected(null, 'update-second', args, {
				message: 'Fallo controlado',
				errors: {},
			}),
		);
		const cleared = deferredPaymentsReducer(rejected, clearDeferredPaymentMutation());

		expect(stale.updating).toBe(true);
		expect(stale.current).toBeNull();
		expect(rejected.errorMutation).toBe('Fallo controlado');
		expect(cleared.errorMutation).toBeNull();
	});
});
