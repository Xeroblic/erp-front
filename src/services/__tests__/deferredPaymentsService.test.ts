import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	CreateDeferredPaymentApiPayload,
	DeferredPaymentsListResponse,
	IDeferredPaymentAbono,
	IDeferredPaymentCreditProfile,
	IDeferredPaymentDocument,
	IDeferredPaymentsSummary,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn(), invalidateCache: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

const document: IDeferredPaymentDocument = {
	id: 7,
	document_number: '1900',
	document_type: 'electronic_invoice',
	purchase_order: null,
	total_amount: '953980.00',
	paid_amount: '300000.00',
	outstanding_amount: '653980.00',
	status: 'partially_paid',
	is_overdue: false,
	days_until_due: 30,
	issue_date: '2026-07-22',
	due_date: '2026-08-21',
	customer: {
		id: 4,
		billing_company: 'Importadora Automarco Spa',
		contact_name: 'Ana Pérez',
		rut: '84854200-8',
	},
	notes: null,
	assignees: [],
	items: [],
	payments: [],
	attachments: [],
};
const payment: IDeferredPaymentAbono = {
	id: 3,
	amount: '300000.00',
	paid_at: '2026-08-01',
	method: 'transfer',
	notes: null,
	attachments: [],
};
const summary: IDeferredPaymentsSummary = {
	total_outstanding: '125000.00',
	overdue: { count: 3, amount: '45000.00' },
	due_within_7_days: { count: 2, amount: '30000.00' },
	current: { count: 5, amount: '50000.00' },
};
const listResponse: DeferredPaymentsListResponse = {
	data: [document],
	meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
};
beforeEach(() => {
	apiSpies.fetchData.mockReset();
	apiSpies.invalidateCache.mockReset();
});

describe('deferredPaymentsService', () => {
	it('consulta la lista paginada con filtros y señal', async () => {
		const controller = new AbortController();
		apiSpies.fetchData.mockResolvedValue({ data: listResponse } as never);

		await expect(
			deferredPaymentsService.getDocuments(
				4,
				{
					page: 2,
					per_page: 20,
					status: 'overdue',
					search: '1900',
					due_after: '2026-07-01',
				},
				controller.signal,
			),
		).resolves.toEqual({
			...listResponse,
			data: [document],
		});
		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/4/deferred-payments',
			method: 'get',
			params: {
				page: 2,
				per_page: 20,
				status: 'overdue',
				search: '1900',
				due_before: undefined,
				due_after: '2026-07-01',
			},
			cacheTTLms: 15_000,
			signal: controller.signal,
		});
	});

	it('normaliza recursos Laravel para summary y detalle', async () => {
		apiSpies.fetchData
			.mockResolvedValueOnce({ data: { data: summary } } as never)
			.mockResolvedValueOnce({ data: { data: document } } as never);

		const filters = { status: 'overdue' as const, search: 'andina' };
		await expect(deferredPaymentsService.getSummary(4, filters)).resolves.toEqual(summary);
		await expect(deferredPaymentsService.getDocument(4, 7)).resolves.toEqual(document);
		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				url: '/subsidiaries/4/deferred-payments/summary',
				params: filters,
			}),
		);
		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ url: '/subsidiaries/4/deferred-payments/7' }),
		);
	});

	it('crea documentos e invalida el caché del módulo', async () => {
		const payload: CreateDeferredPaymentApiPayload = {
			customer_sale_id: 4,
			document_type: 'electronic_invoice',
			document_number: '1900',
			issue_date: '2026-07-22',
			due_date: '2026-08-21',
			total_amount: '953980.00',
		};
		const created = {
			document: { ...document, issue_date: '2026-07-22', due_date: '2026-08-21' },
			credit_limit_exceeded: false,
		};
		apiSpies.fetchData.mockResolvedValue({
			data: { data: document, credit_limit_exceeded: false },
		} as never);

		await expect(deferredPaymentsService.createDocument(4, payload)).resolves.toEqual(created);
		expect(apiSpies.fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/subsidiaries/4/deferred-payments',
				method: 'post',
				data: payload,
			}),
		);
		expect(apiSpies.invalidateCache).toHaveBeenCalledWith('/subsidiaries/4/deferred-payments');
	});

	it('tolera creación plana y conserva fechas ISO al actualizar', async () => {
		apiSpies.fetchData
			.mockResolvedValueOnce({ data: document } as never)
			.mockResolvedValueOnce({
				data: { data: document, credit_limit_exceeded: true },
			} as never);

		await expect(
			deferredPaymentsService.createDocument(4, {
				customer_sale_id: 4,
				document_type: 'electronic_invoice',
				document_number: '1901',
				issue_date: '2026-07-23',
				total_amount: '1000.00',
			}),
		).resolves.toMatchObject({
			document: { id: 7, issue_date: '2026-07-22' },
			credit_limit_exceeded: false,
		});
		await expect(
			deferredPaymentsService.updateDocument(4, 7, {
				issue_date: '2026-07-24',
				due_date: null,
			}),
		).resolves.toEqual({ document, credit_limit_exceeded: true });

		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				data: expect.objectContaining({ issue_date: '2026-07-23' }),
			}),
		);
		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				method: 'patch',
				data: { issue_date: '2026-07-24', due_date: null },
			}),
		);
	});
	it('registra, anula y completa abonos usando las rutas documentadas', async () => {
		apiSpies.fetchData
			.mockResolvedValueOnce({ data: { data: payment } } as never)
			.mockResolvedValueOnce({ data: { message: 'Abono anulado correctamente.' } } as never)
			.mockResolvedValueOnce({ data: payment } as never);

		await deferredPaymentsService.registerPayment(4, 7, {
			amount: '300000.00',
			paid_at: '2026-08-01',
			method: 'transfer',
		});
		await deferredPaymentsService.deletePayment(4, 7, 3);
		await deferredPaymentsService.markDocumentPaid(4, 7);

		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				url: '/subsidiaries/4/deferred-payments/7/payments',
				data: { amount: '300000.00', paid_at: '2026-08-01', method: 'transfer' },
			}),
		);
		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				url: '/subsidiaries/4/deferred-payments/7/payments/3',
				method: 'delete',
			}),
		);
		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			3,
			expect.objectContaining({
				url: '/subsidiaries/4/deferred-payments/7/mark-paid',
				method: 'post',
			}),
		);
	});

	it('obtiene y actualiza el perfil de crédito del cliente', async () => {
		const profile: IDeferredPaymentCreditProfile = {
			id: null,
			customer_sale_id: 8,
			is_active: true,
			payment_term_days: 30,
			credit_limit: null,
			notes: null,
		};
		apiSpies.fetchData
			.mockResolvedValueOnce({ data: { data: profile } } as never)
			.mockResolvedValueOnce({ data: profile } as never);

		await expect(deferredPaymentsService.getCreditProfile(4, 8)).resolves.toEqual(profile);
		await expect(
			deferredPaymentsService.updateCreditProfile(4, 8, { credit_limit: '5000000.00' }),
		).resolves.toEqual(profile);
		expect(apiSpies.fetchData).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				url: '/subsidiaries/4/customer-sales/8/credit-profile',
				method: 'put',
			}),
		);
	});
});
