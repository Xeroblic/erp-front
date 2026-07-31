import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';

const createDocument = (
	id: number,
	status: IDeferredPaymentDocument['status'],
): IDeferredPaymentDocument => ({
	id,
	document_number: `FD-TEST-${id}`,
	document_type: 'invoice',
	purchase_order: null,
	total_amount: '2500000.00',
	outstanding_amount: status === 'paid' ? '0.00' : '2500000.00',
	paid_amount: status === 'paid' ? '2500000.00' : '0.00',
	status,
	is_overdue: false,
	days_until_due: status === 'paid' ? null : 15,
	due_date: '2026-08-15',
	issue_date: '2026-07-31',
	notes: 'Documento de prueba',
	customer: {
		id: 1,
		billing_company: 'Cliente de prueba SpA',
		rut: '76.123.456-7',
		contact_name: 'Contacto Prueba',
	},
	assignees: [{ id: 37, name: 'Responsable', email: 'responsable@example.com' }],
	items: [
		{
			id: id * 10,
			product_id: null,
			code: 'SERV',
			description: 'Servicio de prueba',
			quantity: 1,
			unit_price: '2500000.00',
			serials: ['SER-1-001'],
		},
	],
	payments: [],
	attachments: [],
});

export const DEFERRED_PAYMENT_DOCUMENT_FIXTURES = [
	createDocument(1, 'pending'),
	createDocument(2, 'partially_paid'),
	createDocument(3, 'paid'),
] satisfies IDeferredPaymentDocument[];
