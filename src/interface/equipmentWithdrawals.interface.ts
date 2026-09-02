/**
 * Contrato de API — Retiros de equipos (ZB-83, congelado).
 * Fuente: zentria-erp-back/docs/pending-architecture/equipment-withdrawals/01-contrato-api.md
 *
 * Convenciones del contrato:
 * - Enums serializados como { value, label } (precedente: TechnicalReviewItemResource).
 * - Relaciones simples como { id, name }.
 * - Colecciones vía Resource::collection($paginator): { data, links, meta }.
 */

/** Enum serializado por el backend como objeto { value, label }. */
export interface IEnumOption<T extends string = string> {
	value: T;
	label: string;
}

// ─────────────────────────────── Enums ───────────────────────────────

export const WITHDRAWAL_TYPES = ['loan', 'permanent'] as const;
export type WithdrawalType = (typeof WITHDRAWAL_TYPES)[number];

/**
 * No existe `partially_returned`: un préstamo con devolución parcial sigue en
 * `confirmed` y el avance se lee en totals.pending_return.
 */
export const WITHDRAWAL_STATUSES = ['draft', 'confirmed', 'returned', 'cancelled'] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const WITHDRAWAL_RETURN_CONDITIONS = ['ok', 'needs_review'] as const;
export type WithdrawalReturnCondition = (typeof WITHDRAWAL_RETURN_CONDITIONS)[number];

export const EQUIPMENT_GRADES = ['A', 'B', 'C', 'M'] as const;
export type EquipmentGrade = (typeof EQUIPMENT_GRADES)[number];

// ──────────────────────────── Referencias ────────────────────────────

/** Relación simple { id, name }. */
export interface IEntityRef {
	id: number;
	name: string;
}

export interface IUserRef extends IEntityRef {}

/** Producto hijo por grado expuesto por series e ítems del retiro. */
export interface IWithdrawalProductRef extends IEntityRef {
	sku: string;
}

/** Contacto de cliente-proveedor (§11). En el recurso §6 puede ser null. */
export interface ICustomerSupplierContact {
	id: number;
	name: string;
	identifier: string | null;
	email: string | null;
	phone: string | null;
	is_active?: boolean;
}

/** Payload de creación de contactos del cliente-proveedor (§11). */
export interface ICreateCustomerSupplierContactPayload {
	name: string;
	identifier?: string | null;
	email?: string | null;
	phone?: string | null;
	is_active?: boolean;
}

/** PATCH de contacto (§11): el nombre sigue siendo obligatorio. */
export interface IUpdateCustomerSupplierContactPayload {
	name: string;
	identifier?: string | null;
	email?: string | null;
	phone?: string | null;
	is_active?: boolean;
}

/** Filtros paginados de GET customer-suppliers/{id}/contacts (§11). */
export interface IFetchCustomerSupplierContactsParams {
	active?: boolean;
	q?: string;
	page?: number;
	per_page?: number;
}

// ───────────────────────────── Totales ───────────────────────────────

/**
 * totals.items: ítems activos (no borrados); pending_return: activos sin
 * returned_at; returned: los que ya volvieron.
 */
export interface IWithdrawalTotals {
	items: number;
	pending_return: number;
	returned: number;
}

// ─────────────────────────────── Ítems ───────────────────────────────

/** Shape compartido por added/removed (WithdrawalItemDeltaResource, §3). */
export interface IWithdrawalItemDelta {
	id: number;
	technical_review_item_id: number;
	serial_number: string;
	grade: IEnumOption<EquipmentGrade>;
	product: IWithdrawalProductRef;
}

/** Ítem dentro del recurso completo (§6). */
export interface IEquipmentWithdrawalItem extends IWithdrawalItemDelta {
	current_status: IEnumOption<string>;
	added_by: IUserRef;
	returned_at: string | null;
	return_condition: IEnumOption<WithdrawalReturnCondition> | null;
	return_notes: string | null;
	returned_by: IUserRef | null;
}

// ────────────────────────── Impacto en stock ─────────────────────────

/**
 * Medido en la sucursal del retiro, no globalmente. available_before es el
 * disponible previo al delta puntual (respuesta liviana) o previo al retiro
 * entero (recurso completo).
 */
export interface IStockImpactProduct {
	product: IEntityRef;
	withdrawn: number;
	available_before: number;
	available_now: number;
}

export interface IStockImpact {
	applied: boolean;
	products: IStockImpactProduct[];
}

// ─────────────────────── Recurso canónico (§6) ───────────────────────

export interface IEquipmentWithdrawal {
	id: number;
	code: string;
	status: IEnumOption<WithdrawalStatus>;
	type: IEnumOption<WithdrawalType>;
	subsidiary: IEntityRef;
	branch: IEntityRef;
	customer_supplier: IEntityRef;
	contact: ICustomerSupplierContact | null;
	created_by: IUserRef | null;
	delivered_by: IUserRef | null;
	expected_return_at: string | null;
	confirmed_at: string | null;
	returned_at: string | null;
	cancelled_at: string | null;
	is_stale: boolean;
	notes: string | null;
	totals: IWithdrawalTotals;
	items: IEquipmentWithdrawalItem[];
	stock_impact: IStockImpact;
	created_at: string;
	updated_at: string;
}

export interface IEquipmentWithdrawalResourceResponse {
	data: IEquipmentWithdrawal;
}

export interface ICustomerSupplierContactResourceResponse {
	data: ICustomerSupplierContact;
}

/**
 * Elemento del listado (§9): omite items y stock_impact, conserva totals.
 */
export type IEquipmentWithdrawalListItem = Omit<IEquipmentWithdrawal, 'items' | 'stock_impact'>;

// ──────────────────── Respuesta liviana de ítems (§3) ────────────────

export interface IWithdrawalRejectedSerial {
	serial_number: string;
	/** Texto redactado por backend para el usuario final; no reescribir. */
	reason: string;
}

/** Respuesta de POST items / DELETE items/{item}: nunca devuelve los N ítems. */
export interface IWithdrawalItemsDelta {
	added: IWithdrawalItemDelta[];
	already_present: string[];
	removed: IWithdrawalItemDelta[];
	rejected: IWithdrawalRejectedSerial[];
	totals: IWithdrawalTotals;
	stock_impact: IStockImpact;
	updated_at: string;
}

export interface IWithdrawalItemsDeltaResponse {
	data: IWithdrawalItemsDelta;
}

// ───────────────────── Series elegibles (§1) ─────────────────────────

export interface IEligibleSerial {
	technical_review_item_id: number;
	serial_number: string;
	grade: IEnumOption<EquipmentGrade>;
	equipment_type: IEnumOption<string>;
	product: IWithdrawalProductRef;
	warehouse: IEntityRef;
	approved_at: string;
}

/** Disponibilidad por producto hijo; withdrawable es el tope real (I3). */
export interface IEligibilityAvailabilityEntry {
	product: IEntityRef;
	available: number;
	active_soft_holds: number;
	withdrawable: number;
}

// ───────────────────────── Paginador Laravel ─────────────────────────

export interface IPaginatorLinks {
	first: string | null;
	last: string | null;
	prev: string | null;
	next: string | null;
}

export interface IPaginatorMeta {
	current_page: number;
	from?: number | null;
	last_page: number;
	path?: string;
	per_page: number;
	to?: number | null;
	total: number;
}

export interface IWithdrawalsListResponse {
	data: IEquipmentWithdrawalListItem[];
	links: IPaginatorLinks;
	meta: IPaginatorMeta;
}

export interface IEligibleSerialsResponse {
	data: IEligibleSerial[];
	links: IPaginatorLinks;
	meta: IPaginatorMeta & { availability: IEligibilityAvailabilityEntry[] };
}

export interface ICustomerSupplierContactsListResponse {
	data: ICustomerSupplierContact[];
	links: IPaginatorLinks;
	meta: IPaginatorMeta;
}

// ─────────────────────────── Requests ────────────────────────────────

export interface ICreateWithdrawalPayload {
	/** Prohibido en scope branch (viene de la URL); requerido en scope subsidiary. */
	branch_id?: number;
	customer_supplier_id: number;
	/** Opcional al crear, obligatorio para confirmar. */
	customer_supplier_contact_id?: number | null;
	type: WithdrawalType;
	/** Solo con type: "loan"; after_or_equal:today. Con permanent → 422. */
	expected_return_at?: string | null;
	notes?: string | null;
	/** Misma semántica del endpoint de ítems (incluye already_present/rejected). */
	serial_numbers?: string[];
}

/** PATCH: solo cabecera; no toca series. customer_supplier_id no es editable. */
export interface IUpdateWithdrawalPayload {
	customer_supplier_contact_id?: number | null;
	type?: WithdrawalType;
	expected_return_at?: string | null;
	notes?: string | null;
}

export interface IAddWithdrawalItemsPayload {
	serial_numbers: string[];
}

export interface IRegisterReturnItemPayload {
	id: number;
	return_condition: WithdrawalReturnCondition;
	notes?: string | null;
}

export interface IRegisterReturnsPayload {
	items: IRegisterReturnItemPayload[];
}

// ─────────────────────────── Query params ────────────────────────────

export interface IFetchWithdrawalsParams {
	status?: WithdrawalStatus;
	type?: WithdrawalType;
	customer_supplier_id?: number;
	customer_supplier_contact_id?: number;
	/** Solo scope subsidiary. */
	branch_id?: number;
	stale?: boolean;
	/** Busca en code, notes y serial_number de ítems (ILIKE). */
	q?: string;
	page?: number;
	per_page?: number;
}

export interface IFetchEligibleSerialsParams {
	customer_supplier_id: number;
	/** Requerido solo en scope subsidiary. */
	branch_id?: number;
	grade?: EquipmentGrade;
	q?: string;
	page?: number;
	per_page?: number;
}

// Alias de dominio sin el prefijo histórico `I`, para que los consumidores
// del contrato ZB-83 puedan importar exactamente los nombres documentados.
export type EquipmentWithdrawal = IEquipmentWithdrawal;
export type WithdrawalItem = IEquipmentWithdrawalItem;
export type EligibleSerial = IEligibleSerial;
export type WithdrawalItemsDelta = IWithdrawalItemsDelta;
export type StockImpact = IStockImpact;
export type CustomerSupplierContact = ICustomerSupplierContact;
