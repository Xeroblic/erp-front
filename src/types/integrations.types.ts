/**
 * Tipos e interfaces para el módulo de Integraciones
 * Basado en la documentación oficial de la API
 */

export type IntegrationProvider = 'woocommerce';
export type IntegrationMode = 'webhook' | 'read' | 'read_write';
export type ResolutionStatus = 'pending' | 'mapped' | 'ignored';

/**
 * Integración - Recurso completo
 */
export interface Integration {
	id: string;
	subsidiary_id: number;
	name: string;
	provider: IntegrationProvider;
	base_url: string;
	mode: IntegrationMode;
	is_active: boolean;
	scopes: string[] | null;
	allowed_ips: string[] | null;
	params: Record<string, any> | null;
	api_key_prefix: string;
	has_api_key: boolean;
	has_consumer_secret: boolean;
	has_api_token: boolean;
	has_webhook_secret: boolean;
	last_success_at: string | null;
	last_error_at: string | null;
	last_error_msg: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Payload para crear una integración
 */
export interface CreateIntegrationPayload {
	name: string;
	provider: IntegrationProvider;
	base_url: string;
	mode: IntegrationMode;
	is_active: boolean;
	consumer_key?: string; // Solo para modo REST
	consumer_secret?: string; // Solo para modo REST
	[key: string]: any;
}

/**
 * Payload para editar una integración
 */
export interface UpdateIntegrationPayload {
	name?: string;
	is_active?: boolean;
	rotate_api_key?: boolean;
	rotate_webhook_secret?: boolean;
	[key: string]: any;
}

/**
 * Respuesta al crear una integración (incluye secretos one-time)
 */
export interface CreateIntegrationResponse {
	message: string;
	data: Integration;
	webhook_secret?: string; // Solo una vez
	api_key?: string; // Solo una vez
}

/**
 * Respuesta al editar con rotación
 */
export interface UpdateIntegrationResponse {
	message: string;
	data: Integration;
	webhook_secret?: string; // Solo si se rotó
	api_key?: string; // Solo si se rotó
}

/**
 * Producto no mapeado de WooCommerce
 */
export interface UnmappedWooCommerceProduct {
	id: number;
	integration_id: string;
	sale_id: number;
	external_line_id: string;
	external_product_id: number;
	external_variation_id: number | null;
	// Alias para compatibilidad
	woocommerce_product_id: number;
	sku: string;
	name: string;
	price: string;
	quantity: number;
	stock_quantity?: number;
	status?: string;
	wc_order_id: number;
	resolution_status: ResolutionStatus;
	mapped_product_id: number | null;
	mapped_at: string | null;
	created_at: string;
	integration: {
		id: string;
		provider: IntegrationProvider;
		name: string;
	};
	sale: {
		id: number;
		sale_number: string;
		status: string;
		total_amount: string;
	};
	mapped_product: {
		id: number;
		name: string;
		sku: string;
	} | null;
	line_item_data: Record<string, any>;
}

/**
 * Payload para mapear un producto
 */
export interface MapProductPayload {
	erp_sku: string;
	product_id?: number;
	[key: string]: any;
}

/**
 * Venta importada desde WooCommerce
 */
export interface WooCommerceSale {
	id: number;
	sale_number: string;
	wc_order_id: number;
	status: string;
	total_amount: string;
	customer: {
		name: string;
		email: string;
	};
	items_count: number;
	created_at: string;
}

/**
 * Respuesta al verificar/importar orden
 */
export interface CheckOrImportOrderResponse {
	message: string;
	exists: boolean;
	imported?: boolean;
	sale: WooCommerceSale;
}

/**
 * Respuesta al importar órdenes faltantes
 */
export interface ImportMissingOrdersResponse {
	message: string;
	result: {
		imported: number;
		after: string;
		new_cursor: string;
	};
}

/**
 * Respuesta al sincronizar stock
 */
export interface SyncStockResponse {
	message: string;
	result: {
		synced: number;
		failed: number;
		products: Array<{
			sku: string;
			status: 'success' | 'failed';
			message?: string;
		}>;
	};
}

/**
 * Payload para sincronizar stock
 */
export interface SyncStockPayload {
	skus?: string[];
	[key: string]: any;
}

/**
 * Producto sincronizado ERP ↔ WooCommerce
 */
export interface SyncedProduct {
	id: number;
	name: string;
	sku: string;
	stock: number;
	external_product_id: number;
	external_variation_id: number | null;
	integration: {
		id: string;
		name: string;
		provider: IntegrationProvider;
	};
	synced_at: string;
}

/**
 * Parámetros de consulta para listado de integraciones
 */
export interface IntegrationsQueryParams {
	provider?: IntegrationProvider;
	active?: boolean;
	per_page?: number;
}

/**
 * Parámetros de consulta para productos no mapeados
 */
export interface UnmappedProductsQueryParams {
	status?: ResolutionStatus;
	search?: string;
	wc_order_id?: number;
	sort_by?: string;
	sort_direction?: 'asc' | 'desc';
	per_page?: number;
}

/**
 * Parámetros de consulta para productos mapeados
 */
export interface MappedProductsQueryParams {
	search?: string;
	mapped_from?: string;
	mapped_to?: string;
	sort_by?: string;
	sort_direction?: 'asc' | 'desc';
	per_page?: number;
}

/**
 * Parámetros de consulta para productos sincronizados
 */
export interface SyncedProductsQueryParams {
	search?: string;
	external_product_id?: number;
	filter_by_integration?: boolean;
	per_page?: number;
}

// ==================== WOOCOMMERCE — IMPORTACIÓN DE TÉRMINOS ====================

/**
 * Taxonomías soportadas por la importación de términos del backend.
 * `categories` → categorías · `brands` → marcas.
 */
export type WooTaxonomy = 'categories' | 'brands';

/**
 * Payload para programar la importación masiva de términos
 * (categorías/marcas) desde WooCommerce hacia el ERP.
 * `POST /import-terms`
 */
export interface ImportTermsPayload {
	taxonomies: WooTaxonomy[];
	branch_id?: number;
}

/**
 * Respuesta al programar la importación de términos.
 * Devuelve el identificador del lote (job en cola) para consultar su estado.
 * NOTA: nombre exacto del campo del lote a confirmar con backend.
 */
export interface ImportTermsResponse {
	message: string;
	batch_id?: string;
}

/**
 * Estado/progreso de un lote (job batch de Laravel) de importación de términos.
 * `GET /import-terms/status`
 */
export interface ImportTermsStatus {
	batch_id: string;
	name?: string;
	total_jobs: number;
	pending_jobs: number;
	processed_jobs: number;
	failed_jobs: number;
	/** Progreso 0-100 entregado por el backend. */
	progress: number;
	cancelled: boolean;
	finished: boolean;
	created_at?: string;
	finished_at?: string | null;
	results?: unknown[];
}

/**
 * Parámetros de consulta para el estado de importación de términos.
 */
export interface ImportTermsStatusQueryParams {
	batch_id?: string;
}
