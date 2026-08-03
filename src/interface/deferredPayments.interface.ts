export type DeferredPaymentStatus = 'pending' | 'partially_paid' | 'paid';
export type DeferredPaymentStatusFilter = DeferredPaymentStatus | 'overdue';
export type DeferredPaymentDocumentType = 'electronic_invoice' | 'invoice' | 'receipt' | 'other';
export type DeferredPaymentSort = 'due_date';
export type DeferredPaymentMethod = 'transfer' | 'deposit' | 'check' | 'cash' | 'other';

export interface IDeferredPaymentsSummaryGroup {
	count: number;
	amount: string;
}

export interface IDeferredPaymentsSummary {
	total_outstanding: string;
	overdue: IDeferredPaymentsSummaryGroup;
	due_within_7_days: IDeferredPaymentsSummaryGroup;
	current: IDeferredPaymentsSummaryGroup;
}

export interface IDeferredPaymentCustomer {
	id: number;
	billing_company: string | null;
	rut: string;
	contact_name: string | null;
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

export interface IDeferredPaymentAssignee {
	id: number;
	name: string;
	email: string;
	avatar_url?: string | null;
}

export interface IDeferredPaymentItem {
	id: number;
	product_id: number | null;
	code: string;
	description: string;
	quantity: number;
	unit_price: string;
	serials: string[];
}

export interface IDeferredPaymentAttachment {
	id: number;
	file_name: string;
	mime_type: string;
	size: number;
	url: string;
}

export interface IDeferredPaymentAbono {
	id: number;
	amount: string;
	paid_at: string | null;
	method: DeferredPaymentMethod | null;
	notes: string | null;
	attachments: IDeferredPaymentAttachment[];
}

export interface IDeferredPaymentDocument extends IDeferredPaymentListItem {
	paid_amount: string;
	notes: string | null;
	assignees: IDeferredPaymentAssignee[];
	items: IDeferredPaymentItem[];
	payments: IDeferredPaymentAbono[];
	attachments: IDeferredPaymentAttachment[];
}

export interface IDeferredPaymentWriteItem {
	product_id: null;
	code: string;
	description: string;
	quantity: number;
	unit_price: number | string;
	serials: string[];
}

export interface CreateDeferredPaymentPayload {
	customer_sale_id: number;
	document_type: DeferredPaymentDocumentType;
	document_number: string;
	issue_date: string;
	due_date: string;
	purchase_order: string | null;
	notes: string | null;
	assignee_ids: number[];
	items: IDeferredPaymentWriteItem[];
}

export type UpdateDeferredPaymentPayload = Partial<CreateDeferredPaymentPayload>;

export interface DeferredPaymentMutationResponse {
	document: IDeferredPaymentDocument;
	credit_limit_exceeded: boolean;
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

export interface DeferredPaymentApiListParams {
	page?: number;
	per_page?: number;
	status?: DeferredPaymentStatusFilter;
	customer_sale_id?: number;
	search?: string;
	due_before?: string;
	due_after?: string;
}
export type DeferredPaymentApiSummaryParams = Pick<
	DeferredPaymentApiListParams,
	'status' | 'customer_sale_id' | 'search' | 'due_before' | 'due_after'
>;

export interface CreateDeferredPaymentApiItemPayload {
	product_id?: number | null;
	code?: string | null;
	description: string;
	quantity?: number;
	unit_price?: string;
	serials?: string[];
}

export interface CreateDeferredPaymentApiPayload {
	customer_sale_id: number;
	document_type: DeferredPaymentDocumentType;
	document_number: string;
	issue_date: string;
	due_date?: string | null;
	total_amount: string;
	purchase_order?: string | null;
	notes?: string | null;
	assignee_ids?: number[];
	items?: CreateDeferredPaymentApiItemPayload[];
}

export type UpdateDeferredPaymentApiPayload = Partial<CreateDeferredPaymentApiPayload>;

export interface DeferredPaymentMutationApiResponse {
	document: IDeferredPaymentDocument;
	credit_limit_exceeded: boolean;
}

export interface RegisterDeferredPaymentPayload {
	amount: string;
	paid_at: string;
	method: DeferredPaymentMethod;
	notes: string | null;
}

export interface DeferredPaymentDeleteResponse {
	message: string;
}

export interface IDeferredPaymentCreditProfile {
	id: number | null;
	customer_sale_id: number;
	is_active: boolean;
	payment_term_days: number;
	credit_limit: string | null;
	notes: string | null;
}

export interface UpdateDeferredPaymentCreditProfilePayload {
	is_active?: boolean | null;
	payment_term_days?: number | null;
	credit_limit?: string | null;
	notes?: string | null;
}
