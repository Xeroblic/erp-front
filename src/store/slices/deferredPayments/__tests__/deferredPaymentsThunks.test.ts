import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	DeferredPaymentsListResponse,
	IDeferredPaymentDocument,
	IDeferredPaymentsSummary,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsReducer, {
	DEFAULT_DEFERRED_PAYMENTS_FILTERS,
	fetchDeferredPaymentById,
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

const serviceSpies = vi.hoisted(() => ({
	getDocuments: vi.fn(),
	getDocument: vi.fn(),
	getSummary: vi.fn(),
}));

vi.mock('@/services/deferredPaymentsService', () => ({ default: serviceSpies }));

const listResponse: DeferredPaymentsListResponse = {
	data: [],
	meta: { current_page: 2, per_page: 20, total: 0, last_page: 1 },
};
const document = { id: 19, document_number: 'FAC-0019' } as IDeferredPaymentDocument;

const createStore = () => configureStore({ reducer: deferredPaymentsReducer });

beforeEach(() => {
	serviceSpies.getDocuments.mockReset();
	serviceSpies.getDocument.mockReset();
	serviceSpies.getSummary.mockReset();
});

describe('thunks API de pagos diferidos', () => {
	it('envía al servicio sólo los filtros aceptados por el endpoint', async () => {
		serviceSpies.getDocuments.mockResolvedValue(listResponse);
		const store = createStore();
		const filters = {
			...DEFAULT_DEFERRED_PAYMENTS_FILTERS,
			page: 2,
			per_page: 20,
			status: 'overdue' as const,
			search: 'FAC-0019',
		};

		await expect(
			store.dispatch(fetchDeferredPayments({ subsidiaryId: 4, filters })).unwrap(),
		).resolves.toEqual(listResponse);
		expect(serviceSpies.getDocuments).toHaveBeenCalledWith(
			4,
			{
				page: 2,
				per_page: 20,
				status: 'overdue',
				customer_sale_id: undefined,
				search: 'FAC-0019',
				due_before: undefined,
				due_after: undefined,
			},
			expect.any(AbortSignal),
		);
		expect(store.getState().meta).toEqual(listResponse.meta);
	});

	it('carga el summary temporal desde el servicio', async () => {
		const summary: IDeferredPaymentsSummary = {
			total_outstanding: '125000.00',
			overdue: { count: 3, amount: '45000.00' },
			due_within_7_days: { count: 2, amount: '30000.00' },
			current: { count: 5, amount: '50000.00' },
		};
		serviceSpies.getSummary.mockResolvedValue(summary);
		const store = createStore();

		const filters = {
			...DEFAULT_DEFERRED_PAYMENTS_FILTERS,
			page: 3,
			per_page: 50,
			status: 'overdue' as const,
			search: 'FAC-0019',
		};
		await expect(
			store.dispatch(fetchDeferredPaymentsSummary({ subsidiaryId: 4, filters })).unwrap(),
		).resolves.toEqual(summary);
		expect(serviceSpies.getSummary).toHaveBeenCalledWith(
			4,
			{
				status: 'overdue',
				customer_sale_id: undefined,
				search: 'FAC-0019',
				due_before: undefined,
				due_after: undefined,
			},
			expect.any(AbortSignal),
		);
		expect(store.getState().summary).toEqual(summary);
	});
	it('carga el detalle desde el servicio usando la subsidiaria efectiva', async () => {
		serviceSpies.getDocument.mockResolvedValue(document);
		const store = createStore();

		await expect(
			store.dispatch(fetchDeferredPaymentById({ subsidiaryId: 4, documentId: 19 })).unwrap(),
		).resolves.toEqual(document);
		expect(serviceSpies.getDocument).toHaveBeenCalledWith(4, 19, expect.any(AbortSignal));
		expect(store.getState().current).toEqual(document);
	});

	it('propaga la cancelación y no guarda un error falso', async () => {
		serviceSpies.getDocuments.mockImplementation(
			(_subsidiaryId: number, _params: unknown, signal: AbortSignal) =>
				new Promise<DeferredPaymentsListResponse>((_resolve, reject) => {
					signal.addEventListener(
						'abort',
						() => reject(new DOMException('Solicitud cancelada', 'AbortError')),
						{ once: true },
					);
				}),
		);
		const store = createStore();
		const request = store.dispatch(fetchDeferredPayments({ subsidiaryId: 4 }));
		request.abort();
		await request;

		expect(store.getState().loading).toBe(false);
		expect(store.getState().error).toBeNull();
	});
});
