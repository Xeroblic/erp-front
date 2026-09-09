/**
 * Contrato de abastecimiento e inventario ubicado (PR #67 del backend, rama
 * `docs/procurement-stock-receipts`, `frontend-guide.md`).
 *
 * Ninguno de estos endpoints existe todavía: el módulo se construye contra los
 * fixtures de `@/mocks/db/procurement.db`. Estos tipos copian la sección 2 del
 * contrato campo por campo para que, el día que exista el backend, reemplazar el
 * fixture por la llamada real no obligue a tocar un componente.
 *
 * Reglas transversales del contrato que se reflejan aquí:
 * - Importes: strings decimales de dos decimales. Cantidades: enteros. Nada float.
 * - Ausencia singular: `null`. Colección vacía: `[]`. Ninguna clave pactada se omite.
 * - `allowed_actions` siempre es array.
 */

/**
 * Importe monetario tal como viaja en el contrato: string decimal de dos
 * decimales (`"5712.00"`). No es `number` a propósito — el redondeo half-up del
 * IVA lo hace el backend y pasarlo por float pierde el centavo.
 */
export type TDecimalString = string;

/** Fecha de negocio `YYYY-MM-DD`. */
export type TBusinessDate = string;

/** Timestamp ISO 8601 con offset. */
export type TIsoTimestamp = string;

/* =================================================
   Producto para construir vistas
   ================================================= */

export interface IProcurementBrand {
	id: number;
	name: string;
	slug: string;
}

export interface IProcurementCategory {
	id: number;
	name: string;
	slug: string;
}

/** Imagen actual del producto. URLs y alt ausentes son `null`. */
export interface IProcurementProductImage {
	id: number;
	url: string | null;
	thumb: string | null;
	alt: string | null;
	source_url: string | null;
}

/**
 * Base del costo de catálogo de `product.cost`. Sin base histórica demostrable
 * el contrato exige `"unknown"`: ese costo no se muestra como neto ni como bruto.
 */
export type TProductCostBasis = 'net' | 'gross' | 'unknown';

/**
 * Ficha completa de producto. Las listas del módulo la traen embebida por fila:
 * ninguna vista pide un producto extra para pintar una tabla.
 *
 * `cost` es el costo de catálogo existente, no la última compra ni una valoración
 * de las unidades de esa bodega.
 */
export interface IProcurementProduct {
	id: number;
	sku: string;
	commercial_sku: string | null;
	name: string;
	short_description: string | null;
	serial_tracking: boolean;
	grade: string | null;
	currency_code: string;
	price: TDecimalString | null;
	offer_price: TDecimalString | null;
	cost: TDecimalString | null;
	cost_basis: TProductCostBasis;
	brand: IProcurementBrand | null;
	categories: IProcurementCategory[];
	image: IProcurementProductImage | null;
	is_active: boolean;
}

/* =================================================
   Compactos reutilizables
   ================================================= */

export interface ISupplierCompact {
	id: number;
	display_name: string;
	rut: string;
	is_active: boolean;
}

/** `invoice` = factura, `receipt` = boleta. */
export type TPurchaseDocumentType = 'invoice' | 'receipt';

export interface IPurchaseDocumentCompact {
	id: number;
	document_type: TPurchaseDocumentType;
	document_number: string;
	issue_date: TBusinessDate;
}

/**
 * Bodega compacta. `null` no es un dato faltante: es la ubicación **Sin
 * ubicación**, vendible y trasladable dentro de la sucursal.
 */
export interface IWarehouseCompact {
	id: number;
	name: string;
}

/* =================================================
   Costo de compra: entrada y respuesta son diferentes
   ================================================= */

/** Base que el usuario digita. Solo `net` o `gross`, en factura y en boleta. */
export type TCostEntryBasis = 'net' | 'gross';

/** Base efectiva de una respuesta. `mixed` solo aparece en agregados. */
export type TCostEffectiveBasis = 'net' | 'gross' | 'mixed' | 'unknown';

/** Base ingresada de una respuesta. `unknown` cuando el costo se desconoce. */
export type TCostEnteredBasis = 'net' | 'gross' | 'unknown';

export type TCostSource = 'document' | 'declared' | 'unknown';

export type TCostCalculation = 'single_price' | 'weighted_within_receipt' | 'unknown';

/**
 * Entrada de costo. Es **todo** lo que se envía: monto y base. El IVA, el neto
 * derivado, el bruto derivado y el costo efectivo los calcula y persiste el
 * backend; el contrato rechaza que el cliente los mande.
 */
export interface IProcurementCostEntry {
	unit_cost: TDecimalString;
	unit_cost_basis: TCostEntryBasis;
}

/**
 * Costo de toda respuesta de compra. Reemplaza al campo plano
 * `unit_cost_basis`, que permanece solo en entradas.
 *
 * Costo desconocido: mismos campos, importes y tasa `null`, bases `unknown`,
 * `source: "unknown"`, `calculation: "unknown"`. No mostrar `null` como $0.
 *
 * Agregado heterogéneo: `entered_unit_amount` y `entered_basis` en `null`, y
 * `effective_basis: "mixed"` si combina bases efectivas distintas.
 */
export interface IProcurementCost {
	currency_code: string;
	entered_unit_amount: TDecimalString | null;
	entered_basis: TCostEnteredBasis | null;
	vat_rate_percent: TDecimalString | null;
	net_unit_amount: TDecimalString | null;
	vat_unit_amount: TDecimalString | null;
	gross_unit_amount: TDecimalString | null;
	effective_unit_amount: TDecimalString | null;
	effective_basis: TCostEffectiveBasis;
	source: TCostSource;
	calculation: TCostCalculation;
}

/* =================================================
   Acciones disponibles
   ================================================= */

/**
 * Acciones que el backend declara en `allowed_actions` según estado **y**
 * autorización. No sustituyen la autorización al ejecutar la acción: la
 * botonera las usa para saber qué ofrecer, los guards para saber qué permitir.
 */
export type TProcurementAllowedAction =
	// Proveedores
	| 'update'
	| 'deactivate'
	| 'restore'
	// Documentos de compra
	| 'confirm'
	| 'cancel'
	| 'create_receipt'
	| 'add_attachment'
	// Recepciones físicas
	| 'post'
	| 'retry'
	| 'reverse'
	| 'link_purchase_document';

/* =================================================
   Envoltorio, paginación y contexto
   ================================================= */

/** Enlaces de paginación estándar de Laravel. */
export interface IApiPaginationLinks {
	first: string | null;
	last: string | null;
	prev: string | null;
	next: string | null;
}

export interface IApiPaginationMetaLink {
	url: string | null;
	label: string;
	active: boolean;
}

/**
 * `meta` estándar de Laravel. Los totales y contadores son de toda la consulta
 * autorizada, no solo de la página.
 */
export interface IApiPaginationMeta {
	current_page: number;
	from: number | null;
	last_page: number;
	links: IApiPaginationMetaLink[];
	path: string;
	per_page: number;
	to: number | null;
	total: number;
}

/** Recurso individual: `{"data": {...}}`, con `context` opcional al mismo nivel. */
export interface IApiResourceEnvelope<TData, TContext = never> {
	data: TData;
	context?: TContext;
}

/**
 * Listado paginado. `context`, cuando el endpoint lo declara, va al mismo nivel
 * que `data`.
 */
export interface IApiCollectionEnvelope<TItem, TContext = never> {
	data: TItem[];
	context?: TContext;
	links: IApiPaginationLinks;
	meta: IApiPaginationMeta;
}

/** Alcance de una consulta de stock: sucursal completa, bodega o Sin ubicación. */
export type TInventoryScope = 'branch' | 'warehouse' | 'unlocated';

/** `context` de los listados de stock por ubicación. */
export interface IInventoryLocationContext {
	scope: TInventoryScope;
	branch_id: number;
	warehouse: IWarehouseCompact | null;
}

/** Fila agregada de stock físico actual por producto y ubicación. */
export interface IInventoryStockRow {
	product: IProcurementProduct;
	physical_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
	documented_quantity: number;
	undocumented_quantity: number;
}

export type TInventoryOriginType = 'stock_receipt' | 'initial_stock' | 'inventory_adjustment';

/** Procedencia contable actual; no identifica unidades físicas sin serie. */
export interface IInventoryStockOriginRow {
	origin_id: number;
	origin_type: TInventoryOriginType;
	stock_receipt_id: number | null;
	received_on: TBusinessDate | null;
	supplier: ISupplierCompact | null;
	purchase_document: IPurchaseDocumentCompact | null;
	physical_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
}

type IInventoryBranchLocationParams = {
	warehouse_id?: never;
	unlocated?: never;
};

type IInventoryWarehouseLocationParams = {
	warehouse_id: number;
	unlocated?: never;
};

type IInventoryUnlocatedLocationParams = {
	warehouse_id?: never;
	unlocated: 1;
};

/** Los filtros de ubicación son mutuamente excluyentes por contrato. */
export type IInventoryLocationParams =
	| IInventoryBranchLocationParams
	| IInventoryWarehouseLocationParams
	| IInventoryUnlocatedLocationParams;

export type IInventoryStockListParams = IInventoryLocationParams &
	Partial<IProcurementPageParams> & {
		search?: string;
	};

export type IInventoryOriginsParams = IInventoryLocationParams &
	Partial<IProcurementPageParams> & {
		purchase_document_id?: number;
		supplier_id?: number;
	};

export type IInventoryStockResponse = IApiCollectionEnvelope<
	IInventoryStockRow,
	IInventoryLocationContext
> & { context: IInventoryLocationContext };

export interface IInventoryOriginsContext extends IInventoryLocationContext {
	product: IProcurementProduct;
}

export type IInventoryOriginsResponse = IApiCollectionEnvelope<
	IInventoryStockOriginRow,
	IInventoryOriginsContext
> & { context: IInventoryOriginsContext };

/* =================================================
   Proveedores — sección 5 del contrato
   ================================================= */

/**
 * Resumen de compras de la ficha de proveedor. Cuenta recepciones `posted`, no
 * facturas ni líneas duplicadas. Sin compras: conteos en `0` y
 * `last_purchase_on: null` — eso se muestra como «sin compras», nunca como un
 * hueco vacío que parezca roto.
 */
export interface IProcurementSupplierPurchaseSummary {
	last_purchase_on: TBusinessDate | null;
	received_units: number;
	products_supplied_count: number;
	receipt_count: number;
}

/**
 * Ficha completa de proveedor comercial de compras.
 *
 * No confundir con `ISupplier` de revisión técnica (`@/interface/supplier.interface.ts`
 * y `@/interface/products.interface.ts`): son entidades distintas de dominios distintos.
 * El `Supplier` de revisión técnica **no se migra** a este módulo y ningún selector de
 * proveedor de abastecimiento debe ofrecerlo — de ahí el nombre `IProcurementSupplier`
 * en vez de `ISupplier`, para que la colisión de nombres no tiente a mezclarlos.
 */
export interface IProcurementSupplier {
	id: number;
	rut: string;
	company_name: string | null;
	contact_name: string | null;
	business_activity: string | null;
	billing_address: string | null;
	billing_commune_id: number | null;
	shipping_address: string | null;
	shipping_commune_id: number | null;
	phone: string | null;
	email: string | null;
	/** Calculado por el servidor. No es un campo del formulario. */
	display_name: string;
	/** No es un campo del formulario: se cambia con `deactivate`/`restore`. */
	is_active: boolean;
	created_at: TIsoTimestamp;
	updated_at: TIsoTimestamp;
	allowed_actions: TProcurementAllowedAction[];
	purchase_summary: IProcurementSupplierPurchaseSummary;
}

/**
 * Fila resumida del listado: id, rut, display_name, company_name, contact_name,
 * business_activity, email, phone, is_active. Sin `purchase_summary` a propósito
 * — el contrato es explícito en que ese resumen es caro y no va por fila.
 */
export interface IProcurementSupplierListRow {
	id: number;
	rut: string;
	display_name: string;
	company_name: string | null;
	contact_name: string | null;
	business_activity: string | null;
	email: string | null;
	phone: string | null;
	is_active: boolean;
}

/**
 * Cuerpo de entrada, igual en alta (`POST`) y en los campos editables de
 * edición (`PATCH`). `display_name` e `is_active` quedan fuera a propósito: ni
 * se digitan ni se envían.
 */
export interface IProcurementSupplierPayload {
	rut: string;
	company_name: string | null;
	contact_name: string | null;
	business_activity: string | null;
	billing_address: string | null;
	billing_commune_id: number | null;
	shipping_address: string | null;
	shipping_commune_id: number | null;
	phone: string | null;
	email: string | null;
}

/**
 * Filtros del listado de proveedores. `is_active` e `include_inactive` son
 * **excluyentes entre sí** — la UI los modela como una sola elección (activos
 * por defecto / inactivos / todos), nunca como dos checkboxes independientes
 * que permitan combinarlos.
 */
export interface IProcurementSupplierListFilters {
	search?: string;
	is_active?: 0 | 1;
	include_inactive?: 1;
}

export type IProcurementSupplierListParams = IProcurementSupplierListFilters &
	Partial<IProcurementPageParams>;

/**
 * Proveedor en conflicto tal como llega en el `existing_supplier` del 409 de
 * RUT duplicado (sección 5 y 16 del contrato). `is_active: false` es la señal
 * de que el conflicto es sobre un proveedor eliminado y corresponde ofrecer
 * restaurar como decisión explícita, nunca automática.
 */
export interface IProcurementSupplierRutConflict {
	id: number;
	display_name: string;
	is_active: boolean;
}

/* =================================================
   Documentos de compra — sección 6 del contrato
   ================================================= */

/** Estados documentales. La cobertura vive aparte, en `reception_status`. */
export type TPurchaseDocumentStatus = 'draft' | 'confirmed' | 'cancelled';

/**
 * Cobertura de recepción del documento completo. `null` en `draft`/`cancelled`
 * (sección 6): un documento sin confirmar no tiene nada que cubrir todavía, y
 * uno anulado no la conserva. Sólo aparece en `confirmed`.
 */
export type TPurchaseDocumentReceptionStatus = 'pending' | 'partially_received' | 'received';

/**
 * Fila de `received_distribution`: dónde ingresó **originalmente** cada
 * cantidad cubierta, no el stock actual de esa bodega — vender no la mueve ni
 * la libera.
 */
export interface IPurchaseDocumentReceivedDistributionRow {
	branch_id: number;
	warehouse: IWarehouseCompact | null;
	quantity: number;
}

/**
 * Línea de documento con su cobertura. `sku_snapshot`/`name_snapshot` son el
 * producto tal como se compró, mientras que `product` es la ficha vigente —
 * pueden divergir si el catálogo cambió después.
 *
 * `accounted_quantity = received_quantity + initial_stock_allocated_quantity`
 * `remaining_quantity = quantity - accounted_quantity`
 * El backend las calcula; acá sólo se transportan.
 */
export interface IPurchaseDocumentLine {
	id: number;
	product: IProcurementProduct;
	sku_snapshot: string;
	name_snapshot: string;
	quantity: number;
	cost: IProcurementCost;
	notes: string | null;
	received_quantity: number;
	initial_stock_allocated_quantity: number;
	accounted_quantity: number;
	remaining_quantity: number;
	received_distribution: IPurchaseDocumentReceivedDistributionRow[];
}

/** `related_counts` del detalle: listas paginadas aparte, nunca incrustadas. */
export interface IPurchaseDocumentRelatedCounts {
	stock_receipts: number;
	initial_stock_allocations: number;
	attachments: number;
}

/**
 * Fila del listado (sección 6). Sin `items` ni `supplier_snapshot`: esos son
 * caros y sólo viajan en el detalle, igual que `purchase_summary` en
 * proveedores no va por fila.
 */
export interface IPurchaseDocumentListRow {
	id: number;
	document_type: TPurchaseDocumentType;
	document_number: string;
	issue_date: TBusinessDate;
	currency_code: string;
	total_amount: TDecimalString | null;
	status: TPurchaseDocumentStatus;
	reception_status: TPurchaseDocumentReceptionStatus | null;
	supplier: ISupplierCompact | null;
	items_count: number;
	created_at: TIsoTimestamp;
	allowed_actions: TProcurementAllowedAction[];
}

/**
 * Ficha completa. `supplier_snapshot` es la ficha **histórica** del
 * proveedor al momento de confirmar — no sus datos actuales — y por eso vive
 * separada de `supplier` (compacto, vigente, heredado de la fila). En
 * `draft` es siempre `null`: el snapshot se fija recién al confirmar.
 */
export interface IPurchaseDocument extends IPurchaseDocumentListRow {
	supplier_snapshot: IProcurementSupplier | null;
	notes: string | null;
	items: IPurchaseDocumentLine[];
	related_counts: IPurchaseDocumentRelatedCounts;
	confirmed_at: TIsoTimestamp | null;
	cancelled_at: TIsoTimestamp | null;
	cancellation_reason: string | null;
	updated_at: TIsoTimestamp;
}

/**
 * Línea de entrada, igual en alta y en `items` de edición. Sin `id`: crea.
 * Con `id`: actualiza esa línea. El contrato exige `unit_cost` y
 * `unit_cost_basis` obligatorios por línea, cantidad positiva.
 */
export interface IPurchaseDocumentLineInput {
	id?: number;
	product_id: number;
	quantity: number;
	unit_cost: TDecimalString;
	unit_cost_basis: TCostEntryBasis;
	notes: string | null;
}

/**
 * Cuerpo de alta (`POST`). La factura exige `supplier_id`; la boleta lo
 * permite `null`. `total_amount` es informativo y nullable — no se reemplaza
 * por la suma de unitarios redondeados.
 */
export interface IPurchaseDocumentCreatePayload {
	document_type: TPurchaseDocumentType;
	supplier_id: number | null;
	document_number: string;
	issue_date: TBusinessDate;
	currency_code: string;
	total_amount: TDecimalString | null;
	notes: string | null;
	items: IPurchaseDocumentLineInput[];
}

/**
 * Cuerpo de `PATCH`, sólo válido en `draft`. Todo opcional: un campo ausente
 * se conserva. `items` ausente conserva las líneas; presente **reemplaza**
 * toda la colección (línea con `id` actualiza, sin `id` crea, omitida
 * elimina). `items: []` es inválido — se valida en el servicio, no acá.
 */
export type IPurchaseDocumentUpdatePayload = Partial<
	Omit<IPurchaseDocumentCreatePayload, 'items'>
> & { items?: IPurchaseDocumentLineInput[] };

/** Motivo obligatorio de `cancel`. Libera el folio para reutilizarlo. */
export interface IPurchaseDocumentCancelPayload {
	reason: string;
}

/**
 * Filtros del listado (sección 6): folio/proveedor/RUT vía `search`, más los
 * cuatro filtros exactos y el rango de emisión.
 */
export interface IPurchaseDocumentListFilters {
	search?: string;
	document_type?: TPurchaseDocumentType;
	status?: TPurchaseDocumentStatus;
	reception_status?: TPurchaseDocumentReceptionStatus;
	supplier_id?: number;
	issued_from?: TBusinessDate;
	issued_to?: TBusinessDate;
}

export type IPurchaseDocumentListParams = IPurchaseDocumentListFilters &
	Partial<IProcurementPageParams>;

/* =================================================
   Recepciones físicas — sección 7 del contrato
   ================================================= */

/**
 * Persona que solicitó una acción de auditoría (`posted_by` de una recepción,
 * `actor` de una operación de inventario). El contrato la nombra en prosa sin
 * darle sección de tipos propia; se factoriza acá porque `posted_by` **no**
 * representa a un worker anónimo (sección 7) — es quien pidió contabilizar,
 * no el proceso asíncrono que lo ejecutó.
 */
export interface IProcurementActorCompact {
	id: number;
	name: string;
}

/**
 * Ciclo de estados de una recepción (sección 7): `draft` editable sin stock →
 * `queued` procesando → `posted` o `failed`; más `cancelled` (sin efecto
 * físico) y `reversed` (compensada, con historia conservada).
 */
export type TStockReceiptStatus =
	| 'draft'
	| 'queued'
	| 'posted'
	| 'failed'
	| 'reversed'
	| 'cancelled';

/**
 * Bloque `processing` de una recepción `queued`/`failed`. `next_retry_at` es
 * del worker, no de un reintento manual: el contrato prohíbe reencolar a
 * mano una recepción en `queued`.
 */
export interface IStockReceiptProcessing {
	attempt_count: number;
	last_attempt_at: TIsoTimestamp | null;
	next_retry_at: TIsoTimestamp | null;
}

/**
 * Línea de recepción. `purchase_document_line_id` es `null` en el alta sin
 * documento; `cost` se deriva del documento (`source: "document"`) o se
 * declara sin él (`source: "declared"`/`"unknown"`) — nunca se sobrescribe
 * cuando viene de un documento.
 */
export interface IStockReceiptItem {
	id: number;
	product: IProcurementProduct;
	sku_snapshot: string;
	name_snapshot: string;
	purchase_document_line_id: number | null;
	quantity: number;
	cost: IProcurementCost;
}

/**
 * Fila del listado (sección 7): id, subsidiary_id, branch_id, status,
 * warehouse compacto, supplier compacto, purchase_document compacto,
 * received_on, items_count, total_quantity, created_at, posted_at,
 * allowed_actions.
 */
export interface IStockReceiptListRow {
	id: number;
	subsidiary_id: number;
	branch_id: number;
	status: TStockReceiptStatus;
	warehouse: IWarehouseCompact;
	supplier: ISupplierCompact | null;
	purchase_document: IPurchaseDocumentCompact | null;
	received_on: TBusinessDate;
	items_count: number;
	total_quantity: number;
	created_at: TIsoTimestamp;
	posted_at: TIsoTimestamp | null;
	allowed_actions: TProcurementAllowedAction[];
}

/**
 * Ficha completa. El detalle agrega `reason`, `notes`, `items`,
 * `inventory_operation_id`, `reversal_operation_id`, `queued_at`,
 * `failed_at`, `reversed_at`, `cancellation_reason`, `reversal_reason`,
 * `failure_code`, `failure_message`, `processing`, `updated_at` (sección 7).
 * `posted_by` no está en esa enumeración literal del contrato, pero la misma
 * sección lo exige en prosa («posted_by no representa a un worker anónimo»)
 * y los criterios de aceptación de la card lo verifican — se incluye acá
 * como el resto de los campos derivados de una regla escrita sin ejemplo
 * literal (mismo criterio que `unknownCost` en el fixture).
 */
export interface IStockReceipt extends IStockReceiptListRow {
	reason: string | null;
	notes: string | null;
	items: IStockReceiptItem[];
	inventory_operation_id: string | null;
	reversal_operation_id: string | null;
	queued_at: TIsoTimestamp | null;
	failed_at: TIsoTimestamp | null;
	reversed_at: TIsoTimestamp | null;
	cancellation_reason: string | null;
	reversal_reason: string | null;
	failure_code: string | null;
	failure_message: string | null;
	processing: IStockReceiptProcessing;
	posted_by: IProcurementActorCompact | null;
	updated_at: TIsoTimestamp;
}

/** Línea de entrada del alta **con documento**: sólo línea y cantidad. */
export interface IStockReceiptLineWithDocumentInput {
	/** Presente sólo al reemplazar una línea existente en `PATCH`. */
	id?: number;
	purchase_document_line_id: number;
	quantity: number;
}

/**
 * Línea de entrada del alta **sin documento**. `unit_cost`/`unit_cost_basis`
 * son obligatorios cuando la recepción tiene proveedor conocido; ausentes
 * cuando no — «monto presente exige base y viceversa» se valida en el
 * servicio, no en el tipo.
 */
export interface IStockReceiptLineManualInput {
	id?: number;
	product_id: number;
	quantity: number;
	unit_cost?: TDecimalString | null;
	unit_cost_basis?: TCostEntryBasis | null;
}

/** Alta con documento confirmado: producto/proveedor/costo se derivan de él. */
export interface IStockReceiptCreateWithDocumentPayload {
	purchase_document_id: number;
	warehouse_id: number;
	received_on: TBusinessDate;
	notes: string | null;
	items: IStockReceiptLineWithDocumentInput[];
}

/** Alta sin documento: `reason` obligatorio. */
export interface IStockReceiptCreateWithoutDocumentPayload {
	purchase_document_id: null;
	supplier_id: number | null;
	warehouse_id: number;
	received_on: TBusinessDate;
	reason: string;
	notes: string | null;
	items: IStockReceiptLineManualInput[];
}

export type IStockReceiptCreatePayload =
	| IStockReceiptCreateWithDocumentPayload
	| IStockReceiptCreateWithoutDocumentPayload;

/**
 * `PATCH`: sólo `draft`, y también corrige `failed` (vuelve a `draft` y
 * limpia el error visible). Campos ausentes se conservan; `items` presente
 * reemplaza la colección completa, mismo patrón que documentos de compra.
 */
export interface IStockReceiptUpdatePayload {
	warehouse_id?: number;
	received_on?: TBusinessDate;
	notes?: string | null;
	reason?: string | null;
	supplier_id?: number | null;
	items?: (IStockReceiptLineWithDocumentInput | IStockReceiptLineManualInput)[];
}

/** Motivo obligatorio de `cancel` (desde `draft`/`failed`). */
export interface IStockReceiptCancelPayload {
	reason: string;
}

/** Motivo obligatorio de `reverse` (desde `posted`). */
export interface IStockReceiptReversePayload {
	reason: string;
}

export interface IStockReceiptListFilters {
	search?: string;
	status?: TStockReceiptStatus;
	supplier_id?: number;
	purchase_document_id?: number;
	branch_id?: number;
	warehouse_id?: number;
	received_from?: TBusinessDate;
	received_to?: TBusinessDate;
}

export type IStockReceiptListParams = IStockReceiptListFilters & Partial<IProcurementPageParams>;

/* =================================================
   Adjuntos privados del documento de compra — sección 6 del contrato
   ================================================= */

/**
 * Tipos MIME aceptados para un adjunto (sección 6: «PDF/JPG/PNG»). El backend
 * los valida por contenido, no por extensión; el cliente los usa para el
 * `accept` del input y para rechazar antes de subir.
 */
export const PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/png',
] as const;

export type TPurchaseDocumentAttachmentMimeType =
	(typeof PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES)[number];

/** Máximo por archivo (sección 6: «máximo 10 MB por archivo»). */
export const PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Cupo por documento (sección 6: «10 archivos por documento»). */
export const PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT = 10;

/**
 * Adjunto tal como viaja en la lista y en la respuesta de subida (sección 6).
 * **Sin URL pública a propósito**: ni acá ni en ningún otro tipo del módulo
 * hay un campo de URL para este recurso — la vista previa y la descarga se
 * resuelven con una petición autenticada, nunca con `<img src>` ni un enlace
 * directo.
 */
export interface IPurchaseDocumentAttachment {
	id: number;
	file_name: string;
	mime_type: TPurchaseDocumentAttachmentMimeType;
	size: number;
	created_at: TIsoTimestamp;
}

export type IPurchaseDocumentAttachmentListParams = Partial<IProcurementPageParams>;

/* =================================================
   Paginación de las peticiones
   ================================================= */

/** Defecto del contrato para `per_page`. */
export const PROCUREMENT_PER_PAGE_DEFAULT = 15;

/** Máximo del contrato para `per_page`. */
export const PROCUREMENT_PER_PAGE_MAX = 100;

export interface IProcurementPageParams {
	page: number;
	per_page: number;
}
