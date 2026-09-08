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
