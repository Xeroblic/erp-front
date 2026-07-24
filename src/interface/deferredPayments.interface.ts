export type DeferredPaymentStatus = 'pending' | 'partially_paid' | 'paid';
export type DeferredPaymentStatusFilter = DeferredPaymentStatus | 'overdue';
export type DeferredPaymentDocumentType = 'electronic_invoice' | 'invoice' | 'receipt' | 'other';
export type DeferredPaymentSort = 'due_date';

export interface IDeferredPaymentsSummaryGroup {
	count: number;
	amount: string;
}

export interface IDeferredPaymentsSummary {
	total_outstanding: string;
	overdue: IDeferredPaymentsSummaryGroup;
	due_within_7_days: IDeferredPaymentsSummaryGroup;
	pending: IDeferredPaymentsSummaryGroup;
}

export interface IDeferredPaymentCustomer {
	id: number;
	billing_company: string;
	rut: string;
}

export interface IDeferredPaymentListItem {
	id: number;
	document_number: string;
	document_type: DeferredPaymentDocumentType;
	purchase_order: string | null;
	total_amount: string;
	outstanding_amount: string;
	status: DeferredPaymentStatus;
	is_overdue: boolean;
	days_until_due: number | null;
	due_date: string;
	issue_date: string;
	customer: IDeferredPaymentCustomer;
}

export interface DeferredPaymentsFilters {
	page: number;
	per_page: number;
	status?: DeferredPaymentStatusFilter;
	customer_sale_id?: number;
	search?: string;
	due_before?: string;
	due_after?: string;
	sort: DeferredPaymentSort;
}

export interface DeferredPaymentsPaginationMeta {
	current_page: number;
	per_page: number;
	total: number;
	last_page: number;
}

export interface DeferredPaymentsListResponse {
	data: IDeferredPaymentListItem[];
	meta: DeferredPaymentsPaginationMeta;
}
