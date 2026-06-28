export type IntegrationProvider = 'woocommerce';
export type IntegrationMode = 'webhook' | 'read' | 'read_write';
export type ResolutionStatus = 'pending' | 'mapped' | 'ignored';


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

export interface CreateIntegrationPayload {
	name: string;
	provider: IntegrationProvider;
	base_url: string;
	mode: IntegrationMode;
	is_active: boolean;
	consumer_key?: string;
	consumer_secret?: string; 
	[key: string]: any;
}

export interface UpdateIntegrationPayload {
	name?: string;
	is_active?: boolean;
	rotate_api_key?: boolean;
	rotate_webhook_secret?: boolean;
	[key: string]: any;
}

export interface CreateIntegrationResponse {
	message: string;
	data: Integration;
	webhook_secret?: string;
	api_key?: string;
}

export interface UpdateIntegrationResponse {
	message: string;
	data: Integration;
	webhook_secret?: string;
	api_key?: string;
}

export interface UnmappedWooCommerceProduct {
	id: number;
	integration_id: string;
	sale_id: number;
	external_line_id: string;
	external_product_id: number;
	external_variation_id: number | null;
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

export interface MapProductPayload {
	erp_sku: string;
	product_id?: number;
	[key: string]: any;
}

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

export interface CheckOrImportOrderResponse {
	message: string;
	exists: boolean;
	imported?: boolean;
	sale: WooCommerceSale;
}

export interface ImportMissingOrdersResponse {
	message: string;
	result: {
		imported: number;
		after: string;
		new_cursor: string;
	};
}

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

export interface SyncStockPayload {
	skus?: string[];
	[key: string]: any;
}

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

export interface IntegrationsQueryParams {
	provider?: IntegrationProvider;
	active?: boolean;
	per_page?: number;
}

export interface UnmappedProductsQueryParams {
	status?: ResolutionStatus;
	search?: string;
	wc_order_id?: number;
	sort_by?: string;
	sort_direction?: 'asc' | 'desc';
	per_page?: number;
}

export interface MappedProductsQueryParams {
	search?: string;
	mapped_from?: string;
	mapped_to?: string;
	sort_by?: string;
	sort_direction?: 'asc' | 'desc';
	per_page?: number;
}

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

/**
 * Payload para deshacer una importación de términos (`POST /import-terms/undo`).
 * `taxonomies` es opcional; si se omite, el backend deshace ambas.
 */
export interface UndoImportTermsPayload {
	taxonomies?: WooTaxonomy[];
}

/** Término omitido al deshacer (por estar en uso) con el motivo. */
export interface UndoImportTermsTermDetail {
	id: number;
	name: string;
	/** `has_products` (tiene productos) · `has_children` (tiene subcategorías). */
	reason: string;
}

/**
 * Respuesta de deshacer importación de términos. Solo borra marcas/categorías que la
 * integración creó y que hoy no están en uso; informa cuántas se borraron y cuántas se
 * omitieron, con el detalle por taxonomía. (Forma verificada contra
 * WooTermImportUndoService::undo.)
 */
export interface UndoImportTermsResponse {
	message: string;
	deleted: number;
	skipped_in_use: number;
	orphan_links_cleaned: number;
	details: {
		brands: UndoImportTermsTermDetail[];
		categories: UndoImportTermsTermDetail[];
	};
	/** Presente solo en el 409 (hay una importación en progreso). */
	batch_id?: string;
}

// ==================== WOOCOMMERCE — PRODUCTOS ====================

/**
 * Bloque `woocommerce` del producto sincronizado (#3 / quick-create).
 */
export interface WooProductWooMeta {
	external_product_id: number | null;
	external_variation_id: number | null;
	integration_id: string | null;
	published_at: string | null;
	last_synced_at: string | null;
	last_error_at: string | null;
	last_error_msg: string | null;
}

/**
 * Producto del ERP vinculado / publicado en WooCommerce (#3 Get Synced Products).
 */
export interface WooProduct {
	id: number;
	name: string;
	sku: string;
	commercial_sku?: string | null;
	grade?: string | null;
	branch_id?: number;
	price?: number | string | null;
	offer_price?: number | string | null;
	sync_stock_with_woo?: boolean;
	woocommerce?: WooProductWooMeta | null;
	product_type?: string | null;
	updated_at?: string;
}

/**
 * Payload para la creación rápida de producto (#4).
 * Registra el producto en el ERP y lo manda a publicar en Woo.
 * NOTA: formato de `image` (URL/base64/multipart) a confirmar con backend; el
 * formulario actual usa URL.
 */
export interface QuickProductPayload {
	name: string;
	sku: string;
	price: number;
	stock: number;
	/** URL de imagen de internet; el backend la descarga y la deja cargada. */
	image_url?: string;
	short_description?: string;
	long_description?: string;
	brand_id?: number;
	category_ids?: number[];
	branch_id?: number;
	sync_stock_with_woo?: boolean;
}

/**
 * Respuesta de la creación rápida de producto.
 */
export interface QuickProductResponse {
	message: string;
	data?: WooProduct;
}

/**
 * Body opcional compartido por publicar/despublicar/sincronizar (#5,#6,#8,#9,#10).
 */
export interface WooSyncStockPayload {
	sync_stock_with_woo?: boolean;
}

/**
 * Respuesta de publicar/despublicar un producto (#5,#6).
 */
export interface WooProductActionResponse {
	message: string;
	data?: WooProduct;
}

/**
 * Lado local (ERP) del diagnóstico (#7).
 */
export interface WooRemoteLocalState {
	external_product_id: number | null;
	external_variation_id: number | null;
	integration_id: string | null;
	sync_stock_with_woo: boolean;
	price: number | null;
	stock: number | null;
}

/**
 * Lado remoto (WooCommerce) del diagnóstico (#7). Es `null` si el producto
 * no está vinculado o no se encontró en la tienda.
 */
export interface WooRemoteRemoteState {
	id: number;
	status: string | null;
	price: string | number | null;
	sale_price: string | number | null;
	stock: number | null;
}

/**
 * Estado remoto (#7): contrasta el producto del ERP con el de WooCommerce.
 * `GET /products/{product}/remote`
 */
export interface WooRemoteState {
	local: WooRemoteLocalState;
	remote: WooRemoteRemoteState | null;
}

// ==================== WOOCOMMERCE — EMPAREJAMIENTO MANUAL ====================

export type WooPriceResolution = 'keep_erp' | 'keep_woo';

export interface WooCompareParams {
	external_product_id?: number;
	external_sku?: string;
}

export interface WooCompareResult {
	erp: {
		name: string;
		sku: string;
		price: number | string | null;
	};
	woo: {
		id: number;
		name: string;
		sku: string;
		price: number | string | null;
	};
	prices_match: boolean;
	already_linked: boolean;
	already_linked_to?: number | null;
}

export interface WooCandidatesParams {
	q?: string;
	per_page?: number;
}

export interface WooCandidate {
	id: number;
	name: string;
	sku: string;
	price: string | number | null;
	status: string | null;
	stock_quantity: number | null;
	permalink: string | null;
	already_linked: boolean;
}

export interface WooLinkPayload {
	external_product_id?: number;
	external_sku?: string;
	sync_stock_with_woo?: boolean;
	price_resolution?: WooPriceResolution;
}

export interface WooLinkResponse {
	message: string;
	data?: WooProduct;
	woo_url?: string;
}

export interface WooLinkConflictDetail {
	message: string;
	erp_price: number | string | null;
	woo_price: number | string | null;
}

export interface WooUnlinkResponse {
	message: string;
	data?: WooProduct;
}

/**
 * Respuesta de la desvinculación masiva ERP ↔ WooCommerce de una subsidiaria
 * (`POST .../products/unlink-all`). En `dry_run` informa cuántos productos se
 * desvincularían (`to_unlink`) sin tocar nada; en ejecución real encola el job y devuelve
 * cuántos se encolaron (`queued`, 0 si no había nada). El soft-delete es reversible.
 * (Forma verificada contra WooProductLinkController::destroyAll.)
 */
export interface WooUnlinkAllResponse {
	message?: string;
	dry_run?: boolean;
	/** Dry-run: cantidad de productos que se desvincularían. */
	to_unlink?: number;
	/** Ejecución real: cantidad de productos encolados para desvincular (0 si nada). */
	queued?: number;
}

export interface WooProductsQueryParams {
	search?: string;
	only_errors?: boolean | number | string;
	per_page?: number;
	integration_id?: string;
}

// ==================== CATÁLOGO DE WEBHOOKS ENTRANTES ====================
// GET /integrations/webhooks/catalog — catálogo dinámico (global, no por subsidiaria)
// de los webhooks entrantes que el ERP soporta por proveedor. Cada entrada agrupa sus
// topics/eventos, los efectos sobre inventario/reservas (por estado de pedido o por
// campo de producto), la autenticación y notas de comportamiento.

/** Endpoint declarado por el catálogo (recepción o health-check). */
export interface WebhookCatalogEndpoint {
	method: string;
	url_template: string;
	description?: string;
}

/** Evento/topic concreto que el webhook puede recibir. */
export interface WebhookCatalogTopic {
	topic: string; // ej. "order.created", "product.updated"
	description: string | null;
}

/** Efecto sobre inventario/venta según el estado del pedido (webhook de órdenes). */
export interface WebhookCatalogStatusEffect {
	statuses: string[];
	effect: string;
}

/** Efecto de sincronización según el campo del producto (webhook de productos). */
export interface WebhookCatalogFieldEffect {
	fields: string[];
	effect: string;
}

/** Una entrada del catálogo: un webhook de un proveedor. */
export interface WebhookCatalogEntry {
	provider: string; // ej. "woocommerce"
	provider_label: string; // ej. "WooCommerce"
	key: string; // ej. "woocommerce.orders"
	description: string | null;
	endpoint: WebhookCatalogEndpoint | null;
	health_check: WebhookCatalogEndpoint | null;
	auth: string | null;
	topics: WebhookCatalogTopic[];
	status_effects: WebhookCatalogStatusEffect[] | null;
	field_effects: WebhookCatalogFieldEffect[] | null;
	notes: string[] | null;
}

export interface WebhookCatalogResponse {
	data: WebhookCatalogEntry[];
}

