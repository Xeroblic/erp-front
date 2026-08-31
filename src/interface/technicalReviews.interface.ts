// --- Estados de revisión y comerciales ---
export type ReviewStatus = 'pending' | 'in_review' | 'reviewed' | 'approved';

export type CommercialStatus =
	| 'unknown'
	| 'received'
	| 'in_review'
	| 'reviewed'
	| 'available_for_sale'
	| 'in_quotation'
	| 'reserved'
	| 'sold'
	| 'returned'
	| 'scrapped';

// Tipos de equipos soportados
export type EquipmentType = 'notebook' | 'desktop' | 'docking' | 'aio' | 'monitor';

// --- Interfaces de entidades ---

/**
 * Lote de productos para revisión técnica
 */
export interface IBatch {
	id: number;
	code?: string; // Código generado automáticamente por el backend
	name?: string; // Nombre o descripción del lote
	warehouse_id: number;
	warehouse?: {
		id: number;
		name: string;
	};
	customer_supplier_id: number;
	customer_supplier?: {
		id: number;
		name: string;
	};
	branch?: {
		id: number;
		name: string;
	};
	entry_date: string; // YYYY-MM-DD
	review_date?: string; // YYYY-MM-DD
	expected_quantity: number;
	received_quantity?: number;
	completed_quantity?: number;
	pending_count?: number;
	progress?: number;
	status: CommercialStatus;
	notes?: string | null;
	items_summary?: {
		total: number;
		by_equipment_type?: Record<EquipmentType, number>;
		by_review_status?: Partial<Record<ReviewStatus, number>>;
		by_current_status?: Partial<Record<CommercialStatus, number>>;
		by_grade?: Record<string, number>;
	};
	created_by?: {
		id: number;
		name: string;
	};
	updated_by?: {
		id: number;
		name: string;
	} | null;
	created_at?: string;
	updated_at?: string;
}

/**
 * Detalle de una serie/ítem en revisión técnica
 */
export interface IItem {
	id: number;
	batch_id: number;
	batch?: {
		id: number;
		code?: string;
		name?: string;
	};
	serial_number: string;
	product_id?: number | null;
	product?: {
		id: number;
		name: string;
	};
	warehouse_id?: number | null;
	warehouse?: {
		id: number;
		name: string;
	};
	customer_supplier_id?: number | null;
	customer_supplier?: {
		id: number;
		name: string;
	};
	equipment_type: EquipmentType;
	review_status: ReviewStatus;
	current_status: CommercialStatus;
	reviewed_at?: string; // Fecha de revisión
	grade?: string | null; // A, B, C, D, etc.
	suggested_grade?: string | null;
	confidence?: number | null; // 0-100
	breakdown?: Record<string, any>; // Desglose de cálculo de grado
	attributes_json?: Record<string, any>; // Atributos técnicos del equipo
	extra_attributes?: Record<string, any>; // Atributos extra
	traceability_id?: number | null; // ID de trazabilidad para cambios de estado comercial
	created_at?: string;
	updated_at?: string;
	details: Record<string, any> | null;
}

/**
 * Foto de la galería de una revisión técnica (asociada a un TechnicalReviewItem).
 * Normaliza las variantes del backend (`thumb`/`thumb_url`) a una sola forma.
 */
export interface ITechnicalReviewPhoto {
	id: number;
	url: string;
	thumb: string | null;
	alt: string | null;
	sort: number;
	source_url?: string | null;
	file_name?: string | null;
}

/**
 * Parámetros de filtrado para listado de lotes
 */
export interface FetchBatchesParams {
	warehouse_id?: number;
	status?: CommercialStatus;
	customer_supplier_id?: number;
	year?: number;
	start_date?: string; // YYYY-MM-DD
	end_date?: string; // YYYY-MM-DD
	search?: string; // Busca por serie dentro de los ítems del lote
	page?: number;
	per_page?: number;
	sort_by?: string;
	order?: 'asc' | 'desc';
}

/**
 * Parámetros de filtrado para listado de series de un lote
 */
export interface FetchBatchItemsParams {
	equipment_type?: EquipmentType;
	review_status?: ReviewStatus;
	current_status?: CommercialStatus;
	grade?: string;
	search?: string;
	page?: number;
	per_page?: number;
}

/**
 * Parámetros de filtrado para vista global de series
 */
export interface FetchItemsParams {
	batch_id?: number;
	warehouse_id?: number;
	equipment_type?: EquipmentType;
	review_status?: ReviewStatus;
	current_status?: CommercialStatus;
	grade?: string;
	serial_number?: string;
	search?: string;
	page?: number;
	per_page?: number;
}

/**
 * Payload para guardar/actualizar detalles de una serie
 */
export interface UpdateItemDetailsPayload {
	// Campos comunes a todos los tipos
	brand?: string;
	model?: string;
	line?: string | null;
	processor?: string;
	ram_size?: string | null;
	ram_slots?: string | null;
	ram_type?: string | null;
	has_no_ram?: boolean;
	storage_size?: string | null;
	storage_technology?: string | null;
	has_no_storage?: boolean;
	general_condition?: string;
	observations?: string | null;
	includes_power_adapter?: boolean;
	power_cable_status?: string | null;

	// Puertos (común para la mayoría)
	vga_ports?: number;
	hdmi_ports?: number;
	displayport_ports?: number;
	usb_a_ports?: number;
	type_c_ports?: number;
	usb_c_ports?: number;
	sd_readers?: number;
	rj45_ports?: number;
	has_wifi?: boolean;
	has_bluetooth?: boolean;
	all_ports_functional?: boolean;
	defective_ports_count?: number;

	// Notebook específicos
	includes_charger?: boolean;
	charger_status?: string; // Backend normaliza a extra_attributes.charger_status
	screen_inches?: string;
	screen_condition?: string;
	is_touchscreen?: boolean;
	keyboard_condition?: string;
	non_functional_keys_count?: number;
	keyboard_layout?: string;
	has_numeric_keypad?: boolean;
	has_backlit_keyboard?: boolean;
	touchpad_condition?: string;
	cover_condition?: string;
	hinge_condition?: string;
	speakers_condition?: string;
	powers_on?: boolean;
	bottom_condition?: string;
	battery_status?: string; // Estado o porcentaje (p.ej. "85%")
	operating_system?: string;

	// Desktop específicos
	has_cd_drive?: boolean;

	// AIO específicos
	stand_condition?: string;

	// Monitor específicos
	includes_power_cable?: boolean;
	includes_video_cable?: boolean;
	includes_stand?: boolean;
	other_includes?: string | null;
	has_usb_hub?: boolean;
	usb_hub_ports?: number;
	resolution?: string;
	frame_condition?: string;
	dvi_ports?: number;
	defective_ports_critical_count?: number;

	// Atributos extra dinámicos
	[key: string]: unknown;
}

/**
 * Payload para aprobar una serie
 */
export interface ApproveItemPayload {
	grade: string; // Grado final: A, B, C, D, etc.
	override_suggestion?: boolean; // Si se anula la sugerencia automática
	override_reason?: string; // Razón de anulación
}

/**
 * Payload para cambiar estado comercial (trazabilidad)
 */
export interface ChangeCommercialStatusPayload {
	new_status: CommercialStatus;
	reason?: string;
}

/**
 * Payload para reservar una serie
 */
export interface ReserveItemPayload {
	quotation_id: number;
}

/**
 * Payload para marcar como vendido
 */
export interface MarkAsSoldPayload {
	sale_id: number;
	customer_id: number;
}

/**
 * Regla de validación para formularios
 */
export interface IValidationRule {
	field_name: string;
	label: string;
	type: 'string' | 'number' | 'boolean' | 'select' | 'enum';
	required: boolean;
	options?: Array<{ value: string | number; label: string }>;
	min?: number;
	max?: number;
	pattern?: string;
	description?: string;
}

export interface ITechnicalReviewSchemaOption {
	value: string | number;
	label: string;
}

/** Metadata publicada por TechnicalReviewValidationSchemaService. */
export interface ITechnicalReviewSchemaField {
	type: string;
	label?: string;
	group?: string;
	allowed_values?: Array<string | number>;
	options?: ITechnicalReviewSchemaOption[];
	required?: boolean;
	min?: number;
	hint?: string;
	warning?: string;
}

export type ITechnicalReviewSchema = Record<string, ITechnicalReviewSchemaField>;

/**
 * Esquema de validación completo (común + por tipo)
 */
export interface IValidationRules {
	common: IValidationRule[];
	notebook?: IValidationRule[];
	desktop?: IValidationRule[];
	docking?: IValidationRule[];
	aio?: IValidationRule[];
	monitor?: IValidationRule[];
}

/**
 * Metadata de paginación
 */
export interface ListMeta {
	total: number;
	current_page: number;
	per_page: number;
	last_page: number;
}

/**
 * Estado del slice de revisiones técnicas
 */
export interface TechnicalReviewsState {
	// Lotes
	batches: IBatch[];
	batchesMeta: ListMeta;
	selectedBatch: IBatch | null;
	batchesLoading: boolean;
	endpointMode: 'subsidiaries' | 'branches';
	contextBranchId: number | null;
	contextSubsidiaryId: number | null;

	// Series/Ítems
	items: IItem[];
	itemsMeta: ListMeta;
	selectedItem: IItem | null;
	itemsLoading: boolean;
	itemDetailLoading: boolean;

	// Operaciones CRUD
	creating: boolean; // Crear serie
	updating: boolean; // Actualizar detalles
	deleting: boolean;

	// Operaciones de revisión
	startingReview: boolean;
	completingReview: boolean;
	approving: boolean;

	// Cambios de estado comercial
	changingStatus: boolean;

	// Validación y reglas
	validationRules: IValidationRules | null;
	validationRulesLoading: boolean;

	// Errores
	error: string | null;
	batchesError: string | null;
	itemsError: string | null;
	validationError: string | null;

	// Dashboard Stats
	dashboardStats: {
		total: number;
		pending: number;
		approved: number;
		rejected: number;
		loading: boolean;
		error: string | null;
	};

	// Traceability View
	traceabilityData: ITraceabilityHistoryResponse | null;
	traceabilityLoading: boolean;
}

export interface ITraceabilityHistoryResponse {
	item: {
		serial_number: string;
		equipment_type: string;
		grade: string;
		review_status: string;
		product: {
			id: number;
			sku: string;
			name: string;
		} | null;
	};
	traceability: {
		id: number;
		status: { value: string; label: string; color: string };
		warehouse: { id: number; name: string } | null;
		customer: unknown | null;
		sale_id: unknown | null;
		current_responsible: { id: number; name: string; user_image: string } | null;
		received_at: string | null;
		reviewed_at: string | null;
		available_at: string | null;
		sold_at: string | null;
	};
	history: {
		total: number;
		items: Array<{
			id: number;
			movement_type: { value: string; label: string };
			status: {
				from: { value: string; label: string } | null;
				to: { value: string; label: string };
			};
			warehouse: {
				from: { id: number; name: string } | null;
				to: { id: number; name: string };
			};
			performed_by: { id: number; name: string };
			reason: string;
			movement_date: string;
		}>;
	};
}
