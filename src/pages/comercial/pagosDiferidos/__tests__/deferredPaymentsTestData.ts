import type {
	IDeferredPaymentDocument,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
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
	customer: { id, billing_company: company, contact_name: null, rut },
});

export const DEFERRED_PAYMENT_LIST_FIXTURES: IDeferredPaymentListItem[] = [
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
					url: `/test-data/pagos-diferidos/${row.id}/comprobante-${paymentIndex + 1}.pdf`,
				},
			],
		})),
		attachments: [
			{
				id: row.id * 1000 + 2,
				file_name: `documento-${row.document_number}.pdf`,
				mime_type: 'application/pdf',
				size: 284_672,
				url: `/test-data/pagos-diferidos/${row.id}/documento.pdf`,
			},
		],
	};
};

export const DEFERRED_PAYMENT_DETAIL_FIXTURES: Record<number, IDeferredPaymentDocument> =
	DEFERRED_PAYMENT_LIST_FIXTURES.reduce<Record<number, IDeferredPaymentDocument>>(
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

const unpaidRows = DEFERRED_PAYMENT_LIST_FIXTURES.filter(hasOutstandingBalance);

export const DEFERRED_PAYMENT_SUMMARY_FIXTURE: IDeferredPaymentsSummary = {
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
