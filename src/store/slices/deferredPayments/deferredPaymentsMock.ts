import type {
	CreateDeferredPaymentPayload,
	DeferredPaymentMutationResponse,
	DeferredPaymentsFilters,
	DeferredPaymentsListResponse,
	IDeferredPaymentDocument,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
	UpdateDeferredPaymentPayload,
} from '@/interface/deferredPayments.interface';

const toIsoDate = (daysFromToday: number): string => {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + daysFromToday);
	return date.toISOString().slice(0, 10);
};

const addDaysToIsoDate = (isoDate: string, days: number): string => {
	const date = new Date(`${isoDate}T12:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + days);
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

const createDetail = (row: IDeferredPaymentListItem, index: number): IDeferredPaymentDocument => {
	const paidAmount = Number(row.total_amount) - Number(row.outstanding_amount);
	const hasPayments = paidAmount > 0;
	const firstPaymentAmount = paidAmount * 0.6;
	let paymentAmounts: number[] = [];
	if (hasPayments) paymentAmounts = [paidAmount];
	if (hasPayments && row.id === 2)
		paymentAmounts = [firstPaymentAmount, paidAmount - firstPaymentAmount];
	const firstItemAmount = Number(row.total_amount) * 0.6;
	const secondItemAmount = Number(row.total_amount) - firstItemAmount;
	return {
		...row,
		paid_amount: paidAmount.toFixed(2),
		notes:
			index % 2 === 0
				? 'Cliente con seguimiento de cobranza coordinado por el equipo comercial.'
				: null,
		assignees: [
			{
				id: 101 + (index % 3),
				name: index % 2 === 0 ? 'María González' : 'Carlos Muñoz',
				email: index % 2 === 0 ? 'maria.gonzalez@zentria.cl' : 'carlos.munoz@zentria.cl',
				avatar_url: null,
			},
		],
		items: [
			{
				id: row.id * 10 + 1,
				product_id: null,
				code: `SERV-${row.id}-A`,
				description: 'Servicio principal facturado',
				quantity: 1,
				unit_price: firstItemAmount.toFixed(2),
				serials: index % 3 === 0 ? [`SER-${row.id}-001`] : [],
			},
			{
				id: row.id * 10 + 2,
				product_id: null,
				code: `SERV-${row.id}-B`,
				description: 'Servicio complementario',
				quantity: 1,
				unit_price: secondItemAmount.toFixed(2),
				serials: [],
			},
		],
		payments: paymentAmounts.map((amount, paymentIndex) => ({
			id: row.id * 100 + paymentIndex + 1,
			amount: amount.toFixed(2),
			paid_at: addDaysToIsoDate(row.issue_date, paymentIndex + 1),
			method: 'transfer',
			notes: `Abono ${paymentIndex + 1} registrado por transferencia bancaria.`,
			attachments: [
				{
					id: row.id * 1000 + paymentIndex + 1,
					file_name: `comprobante-${row.document_number}-${paymentIndex + 1}.pdf`,
					mime_type: 'application/pdf',
					size: 148_320 + paymentIndex * 1_024,
					url: `/mock/pagos-diferidos/${row.id}/comprobante-${paymentIndex + 1}.pdf`,
				},
			],
		})),
		attachments: [
			{
				id: row.id * 1000 + 2,
				file_name: `documento-${row.document_number}.pdf`,
				mime_type: 'application/pdf',
				size: 284_672,
				url: `/mock/pagos-diferidos/${row.id}/documento.pdf`,
			},
		],
	};
};

export const DEFERRED_PAYMENT_DETAILS_MOCK: Record<number, IDeferredPaymentDocument> =
	DEFERRED_PAYMENTS_MOCK.reduce<Record<number, IDeferredPaymentDocument>>(
		(details, row, index) => ({ ...details, [row.id]: createDetail(row, index) }),
		{},
	);
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
	current: summaryGroup(
		unpaidRows.filter((row) => row.days_until_due !== null && row.days_until_due > 7),
	),
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

const MOCK_CREDIT_LIMIT = 2_000_000;

const daysUntilDate = (isoDate: string): number => {
	const target = new Date(`${isoDate}T12:00:00.000Z`);
	const today = new Date();
	today.setUTCHours(12, 0, 0, 0);
	return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

const calculatePayloadTotal = (items: CreateDeferredPaymentPayload['items']): number =>
	items.reduce((total, item) => total + item.quantity * Number(item.unit_price), 0);

const toListItem = (document: IDeferredPaymentDocument): IDeferredPaymentListItem => ({
	id: document.id,
	document_number: document.document_number,
	document_type: document.document_type,
	purchase_order: document.purchase_order,
	total_amount: document.total_amount,
	outstanding_amount: document.outstanding_amount,
	status: document.status,
	is_overdue: document.is_overdue,
	days_until_due: document.days_until_due,
	due_date: document.due_date,
	issue_date: document.issue_date,
	customer: document.customer,
});

const refreshMockSummary = (): void => {
	const outstandingRows = DEFERRED_PAYMENTS_MOCK.filter(hasOutstandingBalance);
	Object.assign(DEFERRED_PAYMENTS_SUMMARY_MOCK, {
		total_outstanding: sumOutstanding(outstandingRows).toFixed(2),
		overdue: summaryGroup(outstandingRows.filter((row) => row.is_overdue)),
		due_within_7_days: summaryGroup(
			outstandingRows.filter(
				(row) =>
					row.days_until_due !== null &&
					row.days_until_due >= 0 &&
					row.days_until_due <= 7,
			),
		),
		pending: summaryGroup(DEFERRED_PAYMENTS_MOCK.filter((row) => row.status === 'pending')),
	});
};

const mutationResponse = (document: IDeferredPaymentDocument): DeferredPaymentMutationResponse => ({
	document,
	credit_limit_exceeded: Number(document.total_amount) > MOCK_CREDIT_LIMIT,
});

export const mockCreateDeferredPayment = async (
	payload: CreateDeferredPaymentPayload,
	signal?: AbortSignal,
): Promise<DeferredPaymentMutationResponse> => {
	await waitForMock(signal);
	const id = Math.max(0, ...DEFERRED_PAYMENTS_MOCK.map((row) => row.id)) + 1;
	const total = calculatePayloadTotal(payload.items);
	const daysUntilDue = daysUntilDate(payload.due_date);
	const customer = DEFERRED_PAYMENTS_MOCK.find(
		(row) => row.customer.id === payload.customer_sale_id,
	)?.customer ?? {
		id: payload.customer_sale_id,
		billing_company: `Cliente #${payload.customer_sale_id}`,
		rut: 'RUT no disponible',
	};
	const document: IDeferredPaymentDocument = {
		id,
		document_number: payload.document_number,
		document_type: payload.document_type,
		purchase_order: payload.purchase_order,
		total_amount: total.toFixed(2),
		outstanding_amount: total.toFixed(2),
		paid_amount: '0.00',
		status: 'pending',
		is_overdue: daysUntilDue < 0,
		days_until_due: daysUntilDue,
		due_date: payload.due_date,
		issue_date: payload.issue_date,
		customer,
		notes: payload.notes,
		assignees: payload.assignee_ids.map((assigneeId) => ({
			id: assigneeId,
			name: `Usuario ${assigneeId}`,
			email: `usuario.${assigneeId}@zentria.cl`,
			avatar_url: null,
		})),
		items: payload.items.map((item, index) => ({
			...item,
			id: id * 10 + index + 1,
			unit_price: Number(item.unit_price).toFixed(2),
		})),
		payments: [],
		attachments: [],
	};
	DEFERRED_PAYMENTS_MOCK.push(toListItem(document));
	DEFERRED_PAYMENT_DETAILS_MOCK[id] = document;
	refreshMockSummary();
	return mutationResponse(document);
};

export const mockUpdateDeferredPayment = async (
	documentId: number,
	payload: UpdateDeferredPaymentPayload,
	signal?: AbortSignal,
): Promise<DeferredPaymentMutationResponse> => {
	await waitForMock(signal);
	const current = DEFERRED_PAYMENT_DETAILS_MOCK[documentId];
	if (!current) throw new Error('No se encontró el documento de pago diferido');
	if (current.status === 'paid') throw new Error('No se puede editar un documento pagado');

	const items = payload.items ?? current.items;
	const total = payload.items
		? calculatePayloadTotal(payload.items)
		: Number(current.total_amount);
	const paidAmount = Number(current.paid_amount);
	const outstandingAmount = Math.max(0, total - paidAmount);
	const dueDate = payload.due_date ?? current.due_date;
	const daysUntilDue = daysUntilDate(dueDate);
	const customerSaleId = payload.customer_sale_id ?? current.customer.id;
	const customer = DEFERRED_PAYMENTS_MOCK.find((row) => row.customer.id === customerSaleId)
		?.customer ?? {
		id: customerSaleId,
		billing_company: `Cliente #${customerSaleId}`,
		rut: 'RUT no disponible',
	};
	let status: IDeferredPaymentDocument['status'] = 'pending';
	if (paidAmount > 0) status = 'partially_paid';
	if (outstandingAmount === 0) status = 'paid';
	const document: IDeferredPaymentDocument = {
		...current,
		document_number: payload.document_number ?? current.document_number,
		document_type: payload.document_type ?? current.document_type,
		purchase_order:
			payload.purchase_order === undefined ? current.purchase_order : payload.purchase_order,
		total_amount: total.toFixed(2),
		outstanding_amount: outstandingAmount.toFixed(2),
		status,
		is_overdue: status !== 'paid' && daysUntilDue < 0,
		days_until_due: status === 'paid' ? null : daysUntilDue,
		due_date: dueDate,
		issue_date: payload.issue_date ?? current.issue_date,
		customer,
		notes: payload.notes === undefined ? current.notes : payload.notes,
		assignees: payload.assignee_ids
			? payload.assignee_ids.map((assigneeId) => ({
					id: assigneeId,
					name: `Usuario ${assigneeId}`,
					email: `usuario.${assigneeId}@zentria.cl`,
					avatar_url: null,
				}))
			: current.assignees,
		items: items.map((item, index) => ({
			...item,
			id: 'id' in item ? item.id : documentId * 10 + index + 1,
			unit_price: Number(item.unit_price).toFixed(2),
		})),
	};
	DEFERRED_PAYMENT_DETAILS_MOCK[documentId] = document;
	const listIndex = DEFERRED_PAYMENTS_MOCK.findIndex((row) => row.id === documentId);
	if (listIndex >= 0) DEFERRED_PAYMENTS_MOCK[listIndex] = toListItem(document);
	refreshMockSummary();
	return mutationResponse(document);
};
export const mockFetchDeferredPaymentsSummary = async (
	signal?: AbortSignal,
): Promise<IDeferredPaymentsSummary> => {
	await waitForMock(signal);
	return DEFERRED_PAYMENTS_SUMMARY_MOCK;
};

export const mockFetchDeferredPaymentById = async (
	documentId: number,
	signal?: AbortSignal,
): Promise<IDeferredPaymentDocument> => {
	await waitForMock(signal);
	const document = DEFERRED_PAYMENT_DETAILS_MOCK[documentId];
	if (!document) throw new Error('No se encontró el documento de pago diferido');
	return document;
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
