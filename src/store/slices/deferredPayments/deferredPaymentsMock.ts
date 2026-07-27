import type {
	DeferredPaymentsFilters,
	DeferredPaymentsListResponse,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
} from '@/interface/deferredPayments.interface';

const toIsoDate = (daysFromToday: number): string => {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + daysFromToday);
	return date.toISOString().slice(0, 10);
};

const createRow = (
	id: number,
	daysUntilDue: number,
	status: IDeferredPaymentListItem['status'],
	total: number,
	outstanding: number,
	company: string,
	rut: string,
): IDeferredPaymentListItem => ({
	id,
	document_number: `FD-${String(id).padStart(4, '0')}`,
	document_type: id % 3 === 0 ? 'invoice' : 'electronic_invoice',
	purchase_order: id % 2 === 0 ? `OC-${202600 + id}` : null,
	total_amount: total.toFixed(2),
	outstanding_amount: outstanding.toFixed(2),
	status,
	is_overdue: daysUntilDue < 0 && status !== 'paid',
	days_until_due: status === 'paid' ? null : daysUntilDue,
	due_date: toIsoDate(daysUntilDue),
	issue_date: toIsoDate(daysUntilDue - 30),
	customer: { id, billing_company: company, rut },
});

export const DEFERRED_PAYMENTS_MOCK: IDeferredPaymentListItem[] = [
	createRow(1, -32, 'pending', 1250000, 1250000, 'Comercial Andina Ltda.', '76.111.111-1'),
	createRow(2, -18, 'partially_paid', 980000, 430000, 'Transportes del Sur SpA', '76.222.222-2'),
	createRow(3, -4, 'pending', 620000, 620000, 'Servicios Cordillera SA', '96.333.333-3'),
	createRow(4, 2, 'pending', 450000, 450000, 'Constructora Pacífico Ltda.', '76.444.444-4'),
	createRow(5, 6, 'partially_paid', 890000, 290000, 'Inversiones Norte SpA', '76.555.555-5'),
	createRow(6, 12, 'pending', 340000, 340000, 'Distribuidora Central Ltda.', '76.666.666-6'),
	createRow(7, 21, 'partially_paid', 1500000, 750000, 'Tecnología Austral SpA', '76.777.777-7'),
	createRow(8, 35, 'pending', 275000, 275000, 'Maestranza Horizonte Ltda.', '76.888.888-8'),
	createRow(9, 48, 'paid', 730000, 0, 'Importadora Los Andes SA', '96.999.999-9'),
	createRow(10, 60, 'pending', 510000, 510000, 'Logística Metropolitana SpA', '77.000.000-0'),
];

const sumOutstanding = (rows: IDeferredPaymentListItem[]): number =>
	rows.reduce((total, row) => total + Number(row.outstanding_amount), 0);

const summaryGroup = (rows: IDeferredPaymentListItem[]) => ({
	count: rows.length,
	amount: sumOutstanding(rows).toFixed(2),
});

const hasOutstandingBalance = (row: IDeferredPaymentListItem): boolean =>
	row.status !== 'paid' && Number(row.outstanding_amount) > 0;

const unpaidRows = DEFERRED_PAYMENTS_MOCK.filter(hasOutstandingBalance);

export const DEFERRED_PAYMENTS_SUMMARY_MOCK: IDeferredPaymentsSummary = {
	total_outstanding: sumOutstanding(unpaidRows).toFixed(2),
	overdue: summaryGroup(unpaidRows.filter((row) => row.is_overdue)),
	due_within_7_days: summaryGroup(
		unpaidRows.filter(
			(row) =>
				row.days_until_due !== null && row.days_until_due >= 0 && row.days_until_due <= 7,
		),
	),
	pending: summaryGroup(DEFERRED_PAYMENTS_MOCK.filter((row) => row.status === 'pending')),
};

const waitForMock = async (signal?: AbortSignal): Promise<void> =>
	new Promise((resolve, reject) => {
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		const onAbort = () => {
			if (timeoutId) clearTimeout(timeoutId);
			reject(new DOMException('Solicitud cancelada', 'AbortError'));
		};
		timeoutId = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, 250);
		if (signal?.aborted) onAbort();
		else signal?.addEventListener('abort', onAbort, { once: true });
	});

export const mockFetchDeferredPaymentsSummary = async (
	signal?: AbortSignal,
): Promise<IDeferredPaymentsSummary> => {
	await waitForMock(signal);
	return DEFERRED_PAYMENTS_SUMMARY_MOCK;
};

export const mockFetchDeferredPayments = async (
	filters: DeferredPaymentsFilters,
	signal?: AbortSignal,
): Promise<DeferredPaymentsListResponse> => {
	await waitForMock(signal);
	const normalizedSearch = filters.search?.trim().toLocaleLowerCase('es-CL');
	const filtered = DEFERRED_PAYMENTS_MOCK.filter((row) => {
		const matchesStatus =
			!filters.status ||
			(filters.status === 'overdue' ? row.is_overdue : row.status === filters.status);
		const matchesCustomer =
			!filters.customer_sale_id || row.customer.id === filters.customer_sale_id;
		const searchable =
			`${row.document_number} ${row.customer.billing_company} ${row.customer.rut} ${row.purchase_order ?? ''}`.toLocaleLowerCase(
				'es-CL',
			);
		const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
		const matchesDueAfter = !filters.due_after || row.due_date >= filters.due_after;
		const matchesDueBefore = !filters.due_before || row.due_date <= filters.due_before;
		return (
			matchesStatus && matchesCustomer && matchesSearch && matchesDueAfter && matchesDueBefore
		);
	});
	const sorted = [...filtered].sort((left, right) => left.due_date.localeCompare(right.due_date));
	const start = (filters.page - 1) * filters.per_page;
	return {
		data: sorted.slice(start, start + filters.per_page),
		meta: {
			current_page: filters.page,
			per_page: filters.per_page,
			total: sorted.length,
			last_page: Math.max(1, Math.ceil(sorted.length / filters.per_page)),
		},
	};
};
