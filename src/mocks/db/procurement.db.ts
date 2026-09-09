import type {
	IApiCollectionEnvelope,
	IInventoryLocationContext,
	IProcurementActorCompact,
	IProcurementCost,
	IProcurementProduct,
	IProcurementSupplier,
	IPurchaseDocument,
	IPurchaseDocumentAttachment,
	IPurchaseDocumentCompact,
	IStockReceipt,
	ISupplierCompact,
	IWarehouseCompact,
	TProcurementAllowedAction,
} from '@/interface/procurement.interface';

/**
 * Fixtures del módulo de abastecimiento e inventario ubicado (PR #67 del
 * backend, rama `docs/procurement-stock-receipts`).
 *
 * **Ningún endpoint de este módulo existe todavía.** Estos datos se copian
 * literalmente de los ejemplos de `frontend-guide.md`: mismos nombres de campo,
 * mismos tipos, mismo envoltorio, mismos valores. La regla no es cosmética —
 * reemplazar el fixture por la llamada real no debe obligar a tocar un
 * componente, y un mock que se inventa un campo o aplana un objeto no valida
 * nada.
 *
 * Al agregar un fixture nuevo: copiar del contrato, no inventar. Si el contrato
 * no trae ejemplo de un estado, derivarlo de las reglas escritas y decirlo en un
 * comentario, como se hace acá con el costo desconocido y el agregado mixto.
 */

/* =================================================
   Productos — sección 2 del contrato
   ================================================= */

/** Ejemplo literal de «Producto para construir vistas». */
export const mouseProduct: IProcurementProduct = {
	id: 31,
	sku: 'MOUSE-001',
	commercial_sku: null,
	name: 'Mouse USB',
	short_description: 'Mouse óptico',
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: '7990.00',
	offer_price: null,
	cost: '4800.00',
	cost_basis: 'unknown',
	brand: { id: 3, name: 'Logitech', slug: 'logitech' },
	categories: [{ id: 5, name: 'Mouse', slug: 'mouse' }],
	image: null,
	is_active: true,
};

/**
 * Producto serializado, con imagen y varias categorías. El contrato no trae un
 * ejemplo con `image` poblada: la forma sale de la regla «`image` cuando existe:
 * `{id, url, thumb, alt, source_url}`; URLs/alt ausentes son null».
 */
export const notebookProduct: IProcurementProduct = {
	id: 44,
	sku: 'NB-X1-14',
	commercial_sku: 'NOTEBOOK-X1',
	name: 'Notebook X1 14"',
	short_description: 'Notebook corporativo 14 pulgadas',
	serial_tracking: true,
	grade: 'A',
	currency_code: 'CLP',
	price: '899990.00',
	offer_price: '849990.00',
	cost: '620000.00',
	cost_basis: 'net',
	brand: { id: 9, name: 'Lenovo', slug: 'lenovo' },
	categories: [
		{ id: 2, name: 'Computación', slug: 'computacion' },
		{ id: 11, name: 'Notebooks', slug: 'notebooks' },
	],
	image: {
		id: 77,
		url: 'https://cdn.example.test/products/nb-x1-14.jpg',
		thumb: 'https://cdn.example.test/products/nb-x1-14-thumb.jpg',
		alt: 'Notebook X1 de 14 pulgadas',
		source_url: null,
	},
	is_active: true,
};

/**
 * Producto inactivo y sin costo de catálogo demostrable: `cost: null` con
 * `cost_basis: "unknown"`, como exige «Sin base histórica demostrable». Se
 * muestra como desconocido, nunca como $0.
 */
export const cableProduct: IProcurementProduct = {
	id: 58,
	sku: 'CBL-HDMI-2',
	commercial_sku: null,
	name: 'Cable HDMI 2 m',
	short_description: null,
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: '5990.00',
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: false,
};

/**
 * Segundo producto no serializado y activo (`cableProduct` ya está inactivo).
 * La card 03 necesita al menos dos productos elegibles para ejercer «varias
 * líneas del mismo producto son válidas» junto con líneas de productos
 * distintos en un mismo documento.
 */
export const keyboardProduct: IProcurementProduct = {
	id: 67,
	sku: 'KB-001',
	commercial_sku: null,
	name: 'Teclado mecánico compacto',
	short_description: 'Teclado mecánico 60%',
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: '39990.00',
	offer_price: null,
	cost: '24000.00',
	cost_basis: 'net',
	brand: { id: 14, name: 'Redragon', slug: 'redragon' },
	categories: [{ id: 9, name: 'Teclados', slug: 'teclados' }],
	image: null,
	is_active: true,
};

export const procurementProducts: IProcurementProduct[] = [
	mouseProduct,
	notebookProduct,
	cableProduct,
	keyboardProduct,
];

/**
 * Productos elegibles para líneas de documento de compra: no serializados de
 * la filial (sección 6). `notebookProduct` queda fuera por serializado.
 */
export const purchasableProcurementProducts: IProcurementProduct[] = procurementProducts.filter(
	(product) => !product.serial_tracking,
);

/* =================================================
   Compactos — sección 2 del contrato
   ================================================= */

/** Ejemplo literal del compacto de proveedor. */
export const pcExpressSupplier: ISupplierCompact = {
	id: 7,
	display_name: 'PCExpress',
	rut: '76123456-0',
	is_active: true,
};

/**
 * Proveedor desactivado: se excluye de nuevas selecciones, no del historial.
 * DV recalculado a `-4`: el ejemplo original del contrato traía `-K`, que no
 * es el dígito verificador real de `77888999` — la card 02 valida RUT contra
 * el algoritmo, así que el fixture necesita uno que pase.
 */
export const inactiveSupplier: ISupplierCompact = {
	id: 12,
	display_name: 'Importadora Sur',
	rut: '77888999-4',
	is_active: false,
};

/** Ejemplo literal del compacto de documento de compra (factura). */
export const invoiceDocument: IPurchaseDocumentCompact = {
	id: 24,
	document_type: 'invoice',
	document_number: '1234',
	issue_date: '2026-09-04',
};

/** Boleta: el contrato la trata con base efectiva bruta. */
export const receiptDocument: IPurchaseDocumentCompact = {
	id: 31,
	document_type: 'receipt',
	document_number: '55012',
	issue_date: '2026-09-06',
};

/** Bodega compacta. El `null` de bodega es «Sin ubicación», no un dato faltante. */
export const mainWarehouse: IWarehouseCompact = { id: 8, name: 'Bodega Central' };

export const shelfWarehouse: IWarehouseCompact = { id: 12, name: 'Estante A3' };

/**
 * Bodega de una **segunda sucursal** (hallazgo 5, revisión ZF-110): existe
 * para poder dar de alta una recepción cuya bodega no pertenece a la
 * sucursal activa de la sesión, y comprobar que `branch_id` se deriva de la
 * bodega elegida, no del argumento de sucursal activa. También es la bodega
 * «sin acceso» cuando se restringe por `authorizedBranchIds` sin incluir su
 * sucursal.
 */
export const southBranchWarehouse: IWarehouseCompact = { id: 15, name: 'Bodega Sucursal Sur' };

/**
 * Catálogo completo de bodegas conocidas por el mock, sin filtrar por
 * contexto. **No** es lo que se ofrece en un selector de la UI —
 * `getProcurementWarehousesForBranchContext` filtra por sucursal autorizada;
 * este array es la fuente de la que ese filtro parte, y
 * `findWarehouse`/`PROCUREMENT_WAREHOUSE_BRANCH_BY_ID` la usan para resolver
 * la relación organizacional.
 */
export const procurementWarehouses: IWarehouseCompact[] = [
	mainWarehouse,
	shelfWarehouse,
	southBranchWarehouse,
];

/* =================================================
   Proveedores — sección 5 del contrato
   ================================================= */

/**
 * Ficha completa literal del ejemplo de entrada de la sección 5, con el mismo
 * id/rut/display_name que `pcExpressSupplier` para que el compacto y la ficha
 * completa sean el mismo proveedor. Activo, giro y ambas direcciones
 * completos, y con historial de compras.
 */
export const pcExpressSupplierFull: IProcurementSupplier = {
	id: 7,
	rut: '76123456-0',
	company_name: 'PCExpress',
	contact_name: 'Ana Soto',
	business_activity: 'Venta de insumos informáticos',
	billing_address: 'Av. Central 1200',
	billing_commune_id: 13101,
	shipping_address: 'Camino Industrial 80',
	shipping_commune_id: 13124,
	phone: '+56912345678',
	email: 'ventas@example.test',
	display_name: 'PCExpress',
	is_active: true,
	created_at: '2026-01-15T13:20:00-03:00',
	updated_at: '2026-08-30T10:05:00-03:00',
	allowed_actions: ['update', 'deactivate'],
	purchase_summary: {
		last_purchase_on: '2026-09-04',
		received_units: 128,
		products_supplied_count: 6,
		receipt_count: 14,
	},
};

/**
 * Proveedor desactivado (soft delete), mismo id/rut que el compacto
 * `inactiveSupplier`. Sin compras: `receipt_count: 0` y `last_purchase_on:
 * null`, legible como «sin compras» y no como un hueco vacío. Sólo
 * `allowed_actions: ["restore"]` — desactivado no admite editar.
 */
export const inactiveSupplierFull: IProcurementSupplier = {
	id: 12,
	rut: '77888999-4',
	company_name: 'Importadora Sur',
	contact_name: null,
	business_activity: null,
	billing_address: null,
	billing_commune_id: null,
	shipping_address: null,
	shipping_commune_id: null,
	phone: null,
	email: null,
	display_name: 'Importadora Sur',
	is_active: false,
	created_at: '2025-11-02T09:00:00-03:00',
	updated_at: '2026-06-10T16:40:00-03:00',
	allowed_actions: ['restore'],
	purchase_summary: {
		last_purchase_on: null,
		received_units: 0,
		products_supplied_count: 0,
		receipt_count: 0,
	},
};

/**
 * Proveedor activo dado de alta sólo con `contact_name` (persona natural sin
 * razón social): cubre «al menos uno de company_name o contact_name». Sin
 * giro ni direcciones, así que el formulario lo advierte para confirmar
 * factura sin bloquear el guardado.
 */
export const contrerasSupplierFull: IProcurementSupplier = {
	id: 15,
	rut: '15987321-8',
	company_name: null,
	contact_name: 'Marcelo Contreras',
	business_activity: null,
	billing_address: null,
	billing_commune_id: null,
	shipping_address: null,
	shipping_commune_id: null,
	phone: '+56987654321',
	email: 'mcontreras@example.test',
	display_name: 'Marcelo Contreras',
	is_active: true,
	created_at: '2026-04-20T11:10:00-03:00',
	updated_at: '2026-07-02T08:30:00-03:00',
	allowed_actions: ['update', 'deactivate'],
	purchase_summary: {
		last_purchase_on: '2026-07-01',
		received_units: 30,
		products_supplied_count: 2,
		receipt_count: 3,
	},
};

/**
 * Proveedor activo recién dado de alta: completo pero sin compras todavía —
 * distingue «sin compras porque es nuevo» de «sin compras porque está
 * desactivado» (`inactiveSupplierFull`).
 */
export const nuevaCorpSupplierFull: IProcurementSupplier = {
	id: 21,
	rut: '76543210-3',
	company_name: 'Nueva Corp SpA',
	contact_name: 'Valentina Rojas',
	business_activity: 'Distribución de accesorios',
	billing_address: 'Los Aromos 450',
	billing_commune_id: 13110,
	shipping_address: 'Los Aromos 450',
	shipping_commune_id: 13110,
	phone: '+56911223344',
	email: 'contacto@nuevacorp.test',
	display_name: 'Nueva Corp SpA',
	is_active: true,
	created_at: '2026-08-25T15:45:00-03:00',
	updated_at: '2026-08-25T15:45:00-03:00',
	allowed_actions: ['update', 'deactivate'],
	purchase_summary: {
		last_purchase_on: null,
		received_units: 0,
		products_supplied_count: 0,
		receipt_count: 0,
	},
};

/** Semilla del listado. El servicio mock la clona a su propio store mutable. */
export const procurementSuppliers: IProcurementSupplier[] = [
	pcExpressSupplierFull,
	inactiveSupplierFull,
	contrerasSupplierFull,
	nuevaCorpSupplierFull,
];

/* =================================================
   Bloques de costo — sección 2 del contrato
   ================================================= */

/** Ejemplo literal del bloque `cost`: entrada bruta sobre factura. */
export const grossEnteredCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: '5712.00',
	entered_basis: 'gross',
	vat_rate_percent: '19.00',
	net_unit_amount: '4800.00',
	vat_unit_amount: '912.00',
	gross_unit_amount: '5712.00',
	effective_unit_amount: '4800.00',
	effective_basis: 'net',
	source: 'document',
	calculation: 'single_price',
};

/**
 * Entrada neta sobre boleta: `effective_basis: "gross"` por la premisa de IVA no
 * recuperable. El contrato admite ambas bases de entrada en factura y en boleta.
 */
export const netEnteredCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: '4800.00',
	entered_basis: 'net',
	vat_rate_percent: '19.00',
	net_unit_amount: '4800.00',
	vat_unit_amount: '912.00',
	gross_unit_amount: '5712.00',
	effective_unit_amount: '5712.00',
	effective_basis: 'gross',
	source: 'document',
	calculation: 'single_price',
};

/** Costo declarado sin documento: base provisional, respaldo pendiente. */
export const declaredCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: '6100.00',
	entered_basis: 'gross',
	vat_rate_percent: '19.00',
	net_unit_amount: '5126.05',
	vat_unit_amount: '973.95',
	gross_unit_amount: '6100.00',
	effective_unit_amount: '6100.00',
	effective_basis: 'gross',
	source: 'declared',
	calculation: 'single_price',
};

/**
 * Costo desconocido, según «mismos campos, importes y tasa null, bases unknown».
 * Se muestra como desconocido y nunca como $0.
 */
export const unknownCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: null,
	entered_basis: 'unknown',
	vat_rate_percent: null,
	net_unit_amount: null,
	vat_unit_amount: null,
	gross_unit_amount: null,
	effective_unit_amount: null,
	effective_basis: 'unknown',
	source: 'unknown',
	calculation: 'unknown',
};

/**
 * Agregado ponderado dentro de una recepción, con bases efectivas distintas:
 * `entered_unit_amount` y `entered_basis` en null, `effective_basis: "mixed"`.
 */
export const mixedBasisCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: null,
	entered_basis: null,
	vat_rate_percent: '19.00',
	net_unit_amount: '4950.00',
	vat_unit_amount: '940.50',
	gross_unit_amount: '5890.50',
	effective_unit_amount: '5210.00',
	effective_basis: 'mixed',
	source: 'document',
	calculation: 'weighted_within_receipt',
};

/** Ponderado dentro de una recepción con base efectiva única. */
export const weightedNetCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: null,
	entered_basis: null,
	vat_rate_percent: '19.00',
	net_unit_amount: '4875.00',
	vat_unit_amount: '926.25',
	gross_unit_amount: '5801.25',
	effective_unit_amount: '4875.00',
	effective_basis: 'net',
	source: 'document',
	calculation: 'weighted_within_receipt',
};

export const procurementCosts: Record<string, IProcurementCost> = {
	grossEnteredCost,
	netEnteredCost,
	declaredCost,
	unknownCost,
	mixedBasisCost,
	weightedNetCost,
};

/* =================================================
   Acciones disponibles
   ================================================= */

/**
 * `allowed_actions` de ejemplo por estado. Siempre array: un recurso sin
 * acciones disponibles trae `[]`, no `null`.
 */
export const allowedActionsByState: Record<string, TProcurementAllowedAction[]> = {
	/** Documento en `draft`. */
	documentDraft: ['update', 'confirm', 'cancel', 'add_attachment'],
	/** Documento `confirmed` con cobertura pendiente. */
	documentConfirmed: ['cancel', 'create_receipt', 'add_attachment'],
	/** Documento `cancelled`: sin acciones. */
	documentCancelled: [],
	/** Recepción en `draft`. */
	receiptDraft: ['update', 'post', 'cancel'],
	/** Recepción `failed`: se corrige o se reintenta. */
	receiptFailed: ['update', 'retry', 'cancel'],
	/** Recepción `posted`. */
	receiptPosted: ['reverse', 'link_purchase_document'],
	/** Proveedor activo. */
	supplierActive: ['update', 'deactivate'],
	/** Proveedor desactivado. */
	supplierInactive: ['restore'],
};

/* =================================================
   Documentos de compra — sección 6 del contrato
   ================================================= */

/**
 * Factura confirmada y **parcialmente recibida**, con los mismos IDs y
 * cantidades del ejemplo de `GET B/inventory-stock/{product}/origins` del
 * contrato: línea `101`, folio `1234`, «10 documentados por factura #1234»
 * de los 15 físicos. Ya tiene una recepción posted (`related_counts.
 * stock_receipts: 1`), así que el mock la deja **sin `cancel`** en
 * `allowed_actions`: el contrato prohíbe anular con recepciones posted.
 *
 * `create_receipt` se omite a propósito: la card 05 (recepciones físicas)
 * todavía no existe — un botón que no lleva a ninguna parte es peor que no
 * ofrecerlo. `add_attachment` sí corresponde: el documento está `confirmed`,
 * no `cancelled`, y la card 04 ya permite adjuntar en ese estado.
 */
export const pcExpressInvoiceDocument: IPurchaseDocument = {
	id: 24,
	document_type: 'invoice',
	document_number: '1234',
	issue_date: '2026-09-04',
	currency_code: 'CLP',
	total_amount: '57120.00',
	status: 'confirmed',
	reception_status: 'partially_received',
	supplier: pcExpressSupplier,
	items_count: 1,
	created_at: '2026-09-03T09:15:00-03:00',
	// `create_receipt` (sección 6): la card 05 ya existe, así que un documento
	// `confirmed` la ofrece aunque su única línea ya esté cubierta — el mock no
	// la oculta por capacidad restante, igual que el 409 de reversión no se
	// anticipa desde `allowed_actions`: la escritura valida y responde
	// `RECEIPT_EXCEEDS_DOCUMENT` si corresponde.
	allowed_actions: ['create_receipt', 'add_attachment'],
	// Ficha histórica al momento de confirmar: si PCExpress cambiara de
	// nombre o se desactivara después, este snapshot no se mueve.
	supplier_snapshot: pcExpressSupplierFull,
	notes: null,
	items: [
		{
			id: 101,
			product: mouseProduct,
			sku_snapshot: mouseProduct.sku,
			name_snapshot: mouseProduct.name,
			quantity: 10,
			cost: grossEnteredCost,
			notes: null,
			received_quantity: 10,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 10,
			remaining_quantity: 0,
			received_distribution: [{ branch_id: 4, warehouse: mainWarehouse, quantity: 10 }],
		},
	],
	// `attachments: 1` — coincide con `pcExpressInvoiceAttachment`, la única
	// entrada de `purchaseDocumentAttachmentsSeed` para este documento.
	related_counts: { stock_receipts: 1, initial_stock_allocations: 0, attachments: 1 },
	confirmed_at: '2026-09-04T11:30:00-03:00',
	cancelled_at: null,
	cancellation_reason: null,
	updated_at: '2026-09-04T11:30:00-03:00',
};

/**
 * Boleta en `draft`, **sin proveedor** («la boleta lo permite null») y sin
 * ninguna cobertura todavía: `reception_status: null`, líneas con
 * `remaining_quantity` igual a la cantidad completa. Mismo id/folio/fecha
 * que el compacto `receiptDocument`.
 */
export const draftReceiptDocument: IPurchaseDocument = {
	id: 31,
	document_type: 'receipt',
	document_number: '55012',
	issue_date: '2026-09-06',
	currency_code: 'CLP',
	total_amount: '28560.00',
	status: 'draft',
	reception_status: null,
	supplier: null,
	items_count: 1,
	created_at: '2026-09-06T10:00:00-03:00',
	allowed_actions: ['update', 'confirm', 'cancel', 'add_attachment'],
	supplier_snapshot: null,
	notes: null,
	items: [
		{
			id: 201,
			product: keyboardProduct,
			sku_snapshot: keyboardProduct.sku,
			name_snapshot: keyboardProduct.name,
			quantity: 5,
			cost: netEnteredCost,
			notes: null,
			received_quantity: 0,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 0,
			remaining_quantity: 5,
			received_distribution: [],
		},
	],
	related_counts: { stock_receipts: 0, initial_stock_allocations: 0, attachments: 0 },
	confirmed_at: null,
	cancelled_at: null,
	cancellation_reason: null,
	updated_at: '2026-09-06T10:00:00-03:00',
};

/**
 * Factura en `draft` con proveedor y dos líneas del **mismo producto**
 * (sección 6: «varias líneas del mismo producto válidas»), cada una con su
 * propio costo — el contrato conserva costos originales por línea, no
 * pondera dentro de un documento sin recepción.
 */
export const draftInvoiceDocument: IPurchaseDocument = {
	id: 42,
	document_type: 'invoice',
	document_number: '4410',
	issue_date: '2026-09-07',
	currency_code: 'CLP',
	total_amount: null,
	status: 'draft',
	reception_status: null,
	supplier: pcExpressSupplier,
	items_count: 2,
	created_at: '2026-09-07T15:20:00-03:00',
	allowed_actions: ['update', 'confirm', 'cancel', 'add_attachment'],
	supplier_snapshot: null,
	notes: 'Reposición de mouse para sucursal centro.',
	items: [
		{
			id: 301,
			product: mouseProduct,
			sku_snapshot: mouseProduct.sku,
			name_snapshot: mouseProduct.name,
			quantity: 6,
			cost: grossEnteredCost,
			notes: null,
			received_quantity: 0,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 0,
			remaining_quantity: 6,
			received_distribution: [],
		},
		{
			id: 302,
			product: mouseProduct,
			sku_snapshot: mouseProduct.sku,
			name_snapshot: mouseProduct.name,
			quantity: 4,
			cost: netEnteredCost,
			notes: 'Lote de reemplazo, costo distinto al anterior.',
			received_quantity: 0,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 0,
			remaining_quantity: 4,
			received_distribution: [],
		},
	],
	related_counts: { stock_receipts: 0, initial_stock_allocations: 0, attachments: 0 },
	confirmed_at: null,
	cancelled_at: null,
	cancellation_reason: null,
	updated_at: '2026-09-07T15:20:00-03:00',
};

/**
 * Factura anulada: motivo obligatorio, sin acciones (no se reabre desde acá).
 * Folio liberado — un alta nueva puede reutilizar `9981` sin conflicto.
 */
export const cancelledInvoiceDocument: IPurchaseDocument = {
	id: 50,
	document_type: 'invoice',
	document_number: '9981',
	issue_date: '2026-08-20',
	currency_code: 'CLP',
	total_amount: '19200.00',
	status: 'cancelled',
	reception_status: null,
	supplier: pcExpressSupplier,
	items_count: 1,
	created_at: '2026-08-19T08:40:00-03:00',
	allowed_actions: [],
	supplier_snapshot: null,
	notes: null,
	items: [
		{
			id: 401,
			product: keyboardProduct,
			sku_snapshot: keyboardProduct.sku,
			name_snapshot: keyboardProduct.name,
			quantity: 4,
			cost: grossEnteredCost,
			notes: null,
			received_quantity: 0,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 0,
			remaining_quantity: 4,
			received_distribution: [],
		},
	],
	related_counts: { stock_receipts: 0, initial_stock_allocations: 0, attachments: 0 },
	confirmed_at: null,
	cancelled_at: '2026-08-21T09:00:00-03:00',
	cancellation_reason: 'Folio ingresado por error, se re-emitió con el proveedor.',
	updated_at: '2026-08-21T09:00:00-03:00',
};

/**
 * Costo de la línea de teclados de `pcExpressKeyboardInvoiceDocument`:
 * entrada neta sobre factura, con el propio costo de catálogo de
 * `keyboardProduct` (`24000.00` neto) en vez de reutilizar `netEnteredCost`
 * (pensado para `mouseProduct`) — la card 05 necesita un documento con
 * capacidad **sin consumir** para las recepciones con documento, y
 * `pcExpressInvoiceDocument` (línea 101) ya está cubierta al 100%.
 */
export const keyboardInvoiceLineCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: '24000.00',
	entered_basis: 'net',
	vat_rate_percent: '19.00',
	net_unit_amount: '24000.00',
	vat_unit_amount: '4560.00',
	gross_unit_amount: '28560.00',
	effective_unit_amount: '24000.00',
	effective_basis: 'net',
	source: 'document',
	calculation: 'single_price',
};

/**
 * Factura confirmada con capacidad **parcialmente** cubierta: de 20
 * teclados, 8 ya llegaron por `postedKeyboardStockReceipt` (recepción 80,
 * `procurement.db.ts` recepciones) y quedan 12 por recibir
 * (`remaining_quantity`). Existe para que la card 05 tenga un documento real
 * contra el que dar de alta recepciones «con documento» sin agotar su
 * capacidad de inmediato, y para ejercer `RECEIPT_EXCEEDS_DOCUMENT` pidiendo
 * más de 12.
 */
export const pcExpressKeyboardInvoiceDocument: IPurchaseDocument = {
	id: 61,
	document_type: 'invoice',
	document_number: '1500',
	issue_date: '2026-08-28',
	currency_code: 'CLP',
	total_amount: '571200.00',
	status: 'confirmed',
	reception_status: 'partially_received',
	supplier: pcExpressSupplier,
	items_count: 1,
	created_at: '2026-08-27T10:00:00-03:00',
	allowed_actions: ['create_receipt', 'add_attachment'],
	supplier_snapshot: pcExpressSupplierFull,
	notes: null,
	items: [
		{
			id: 601,
			product: keyboardProduct,
			sku_snapshot: keyboardProduct.sku,
			name_snapshot: keyboardProduct.name,
			quantity: 20,
			cost: keyboardInvoiceLineCost,
			notes: null,
			received_quantity: 8,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 8,
			remaining_quantity: 12,
			received_distribution: [{ branch_id: 4, warehouse: mainWarehouse, quantity: 8 }],
		},
	],
	related_counts: { stock_receipts: 1, initial_stock_allocations: 0, attachments: 0 },
	confirmed_at: '2026-08-28T09:30:00-03:00',
	cancelled_at: null,
	cancellation_reason: null,
	updated_at: '2026-08-29T10:20:00-03:00',
};

/** Semilla del listado. El servicio mock la clona a su propio store mutable. */
export const purchaseDocuments: IPurchaseDocument[] = [
	pcExpressInvoiceDocument,
	pcExpressKeyboardInvoiceDocument,
	draftReceiptDocument,
	draftInvoiceDocument,
	cancelledInvoiceDocument,
];

/* =================================================
   Adjuntos privados de documentos de compra — sección 6 del contrato
   ================================================= */

/**
 * Adjunto de ejemplo del documento confirmado `pcExpressInvoiceDocument`
 * (id 24): la factura escaneada que respalda la compra. Campos literales de
 * la subsección «Adjuntos privados» — `{id, file_name, mime_type, size,
 * created_at}`, **sin URL pública**, tal como exige el contrato.
 */
export const pcExpressInvoiceAttachment: IPurchaseDocumentAttachment = {
	id: 1,
	file_name: 'factura-1234.pdf',
	mime_type: 'application/pdf',
	size: 184_320,
	created_at: '2026-09-04T11:32:00-03:00',
};

/**
 * Semilla de adjuntos por documento, indexada por id de documento de compra.
 * Un documento sin entrada acá nace **sin adjuntos**: la lista vacía es un
 * estado válido del mock (sección 6: «los adjuntos no son requisito para
 * confirmar»), no un hueco. El servicio mock
 * (`purchaseDocumentAttachments.service`) clona esta semilla a su propio
 * store en memoria, particionado por filial, igual que el resto del módulo.
 *
 * El contenido binario no viaja acá: el contrato no da un ejemplo de bytes,
 * y el mock sintetiza uno al servir la descarga — ver el comentario de
 * `buildMockAttachmentContent` en el servicio.
 */
export const purchaseDocumentAttachmentsSeed: Record<number, IPurchaseDocumentAttachment[]> = {
	[pcExpressInvoiceDocument.id]: [pcExpressInvoiceAttachment],
};

/* =================================================
   Recepciones físicas — sección 7 del contrato
   ================================================= */

/**
 * Filial/sucursal de todas las recepciones del mock: `subsidiary_id: 2`
 * (sección 12 del contrato) y `branch_id: 4` (secciones 3 y 6, la misma
 * sucursal que ya usan `inventoryStockEnvelope` y `received_distribution`
 * de `pcExpressInvoiceDocument`).
 */
export const STOCK_RECEIPT_SUBSIDIARY_ID = 2;
export const STOCK_RECEIPT_BRANCH_ID = 4;

/**
 * Segunda sucursal, dueña de `southBranchWarehouse` — modela un usuario
 * multi-sucursal que puede recibir mercadería en una bodega que no es la de
 * su sucursal activa.
 *
 * Nota de alcance: el catálogo de bodegas de este mock, igual que el de
 * productos y proveedores, **no está particionado por filial** — cada
 * partición por `subsidiaryId` clona el mismo catálogo global (así lo
 * ejercen las pruebas existentes con IDs de filial arbitrarios). La relación
 * organizacional que modela el hallazgo 5 es bodega → **sucursal**; no se le
 * agrega una dimensión de filial que el resto del módulo no tiene, para no
 * romper esa convención ni inventar un aislamiento que no existe en ningún
 * otro catálogo de este archivo.
 */
export const STOCK_RECEIPT_SOUTH_BRANCH_ID = 6;

/**
 * Relación bodega → sucursal (hallazgo 5, revisión ZF-110). El compacto
 * `IWarehouseCompact` de respuesta se mantiene `{id, name}` — esta relación
 * es un dato **interno** del mock, nunca se serializa tal cual en una
 * respuesta; `stockReceipts.service` la usa para derivar `branch_id` de la
 * bodega elegida en vez de asignarlo desde la sucursal activa de quien
 * opera, y para rechazar una bodega fuera de las sucursales autorizadas.
 */
export const PROCUREMENT_WAREHOUSE_BRANCH_BY_ID: Record<number, number> = {
	[mainWarehouse.id]: STOCK_RECEIPT_BRANCH_ID,
	[shelfWarehouse.id]: STOCK_RECEIPT_BRANCH_ID,
	[southBranchWarehouse.id]: STOCK_RECEIPT_SOUTH_BRANCH_ID,
};

/**
 * Bodegas que corresponde ofrecer en un selector: cuando se conocen las
 * sucursales autorizadas del usuario (`visibleBranches`/`access.branches` de
 * `useCurrentBranch`), excluye las de una sucursal fuera de esa lista. Lista
 * vacía/`null` no filtra (mismo criterio que `canAccessBranch` de
 * `useAuthorization`: sin sucursales listadas, no bloquea).
 */
export const getProcurementWarehousesForBranchContext = (
	authorizedBranchIds?: readonly number[] | null,
): IWarehouseCompact[] => {
	const hasBranchRestriction = Boolean(authorizedBranchIds && authorizedBranchIds.length > 0);
	if (!hasBranchRestriction) return procurementWarehouses;

	return procurementWarehouses.filter((warehouse) => {
		const branchId = PROCUREMENT_WAREHOUSE_BRANCH_BY_ID[warehouse.id];
		return branchId !== undefined && authorizedBranchIds!.includes(branchId);
	});
};

/** Vacío de `processing` fuera de `queued`/`failed`: nunca se intentó. */
export const emptyStockReceiptProcessing = {
	attempt_count: 0,
	last_attempt_at: null,
	next_retry_at: null,
};

/** Compacto de Marcelo Contreras (`contrerasSupplierFull`, id 15). */
export const contrerasSupplier: ISupplierCompact = {
	id: 15,
	display_name: 'Marcelo Contreras',
	rut: '15987321-8',
	is_active: true,
};

/** Quien solicitó contabilizar `postedKeyboardStockReceipt`. Nunca un worker anónimo. */
export const bodegaActor: IProcurementActorCompact = { id: 40, name: 'Camila Vidal' };

/**
 * Alta sin documento, literal del ejemplo «Sin documento» de la sección 7:
 * mismo `warehouse_id: 8`, `supplier_id: 7`, folio `2026-09-04`, motivo,
 * producto 31 (mouse), cantidad 10 y costo `5712.00`/`gross`. `draft`:
 * editable, sin stock comprometido.
 */
export const draftManualStockReceipt: IStockReceipt = {
	id: 70,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'draft',
	warehouse: mainWarehouse,
	supplier: pcExpressSupplier,
	purchase_document: null,
	received_on: '2026-09-04',
	items_count: 1,
	total_quantity: 10,
	created_at: '2026-09-04T08:30:00-03:00',
	posted_at: null,
	allowed_actions: allowedActionsByState.receiptDraft,
	reason: 'Ingreso pendiente de factura',
	notes: null,
	items: [
		{
			id: 900,
			product: mouseProduct,
			sku_snapshot: mouseProduct.sku,
			name_snapshot: mouseProduct.name,
			purchase_document_line_id: null,
			quantity: 10,
			cost: grossEnteredCost,
		},
	],
	inventory_operation_id: null,
	reversal_operation_id: null,
	queued_at: null,
	failed_at: null,
	reversed_at: null,
	cancellation_reason: null,
	reversal_reason: null,
	failure_code: null,
	failure_message: null,
	processing: emptyStockReceiptProcessing,
	posted_by: null,
	updated_at: '2026-09-04T08:30:00-03:00',
};

/**
 * Alta sin documento y **sin proveedor conocido**: costo desconocido válido
 * (sección 7: «sin proveedor puede ser desconocido, con ambos campos de
 * costo null/ausentes»). `cableProduct` está inactivo en catálogo, pero
 * sigue siendo elegible para una recepción manual — inactivo no es lo mismo
 * que serializado.
 */
export const draftUnknownCostStockReceipt: IStockReceipt = {
	id: 71,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'draft',
	warehouse: shelfWarehouse,
	supplier: null,
	purchase_document: null,
	received_on: '2026-09-05',
	items_count: 1,
	total_quantity: 6,
	created_at: '2026-09-05T14:10:00-03:00',
	posted_at: null,
	allowed_actions: allowedActionsByState.receiptDraft,
	reason: 'Conteo físico sin proveedor identificado',
	notes: null,
	items: [
		{
			id: 901,
			product: cableProduct,
			sku_snapshot: cableProduct.sku,
			name_snapshot: cableProduct.name,
			purchase_document_line_id: null,
			quantity: 6,
			cost: unknownCost,
		},
	],
	inventory_operation_id: null,
	reversal_operation_id: null,
	queued_at: null,
	failed_at: null,
	reversed_at: null,
	cancellation_reason: null,
	reversal_reason: null,
	failure_code: null,
	failure_message: null,
	processing: emptyStockReceiptProcessing,
	posted_by: null,
	updated_at: '2026-09-05T14:10:00-03:00',
};

/**
 * `queued`: publicada y sin stock todavía. Nace en este estado en el seed a
 * propósito — simula que el worker ya estaba procesándola antes de esta
 * carga de página — para ejercer «el estado sobrevive a recargar». El
 * servicio mock (`stockReceipts.service`) le programa su propia resolución
 * la primera vez que se siembra el store de una filial, igual que si
 * `post` acabara de encolarla.
 */
export const queuedStockReceipt: IStockReceipt = {
	id: 72,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'queued',
	warehouse: mainWarehouse,
	supplier: pcExpressSupplier,
	purchase_document: null,
	received_on: '2026-09-08',
	items_count: 1,
	total_quantity: 3,
	created_at: '2026-09-08T09:00:00-03:00',
	posted_at: null,
	// «Una recepción en queued no se puede editar ni reencolar a mano» — sin
	// acciones mientras el worker la procesa.
	allowed_actions: [],
	reason: 'Ingreso pendiente de factura',
	notes: null,
	items: [
		{
			id: 902,
			product: mouseProduct,
			sku_snapshot: mouseProduct.sku,
			name_snapshot: mouseProduct.name,
			purchase_document_line_id: null,
			quantity: 3,
			cost: netEnteredCost,
		},
	],
	inventory_operation_id: null,
	reversal_operation_id: null,
	queued_at: '2026-09-08T09:05:00-03:00',
	failed_at: null,
	reversed_at: null,
	cancellation_reason: null,
	reversal_reason: null,
	failure_code: null,
	failure_message: null,
	processing: {
		attempt_count: 1,
		last_attempt_at: '2026-09-08T09:05:00-03:00',
		next_retry_at: null,
	},
	posted_by: null,
	updated_at: '2026-09-08T09:05:00-03:00',
};

/**
 * `failed`: `failure_message` en español, nunca una traza técnica. Segundo
 * intento (`attempt_count: 2`) — la historia de intentos se conserva aunque
 * `update` (corregir) la vuelva a `draft` y limpie el error visible.
 */
export const failedStockReceipt: IStockReceipt = {
	id: 73,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'failed',
	warehouse: shelfWarehouse,
	supplier: contrerasSupplier,
	purchase_document: null,
	received_on: '2026-09-07',
	items_count: 1,
	total_quantity: 4,
	created_at: '2026-09-07T11:00:00-03:00',
	posted_at: null,
	allowed_actions: allowedActionsByState.receiptFailed,
	reason: 'Ingreso sin factura por retraso del proveedor',
	notes: null,
	items: [
		{
			id: 903,
			product: keyboardProduct,
			sku_snapshot: keyboardProduct.sku,
			name_snapshot: keyboardProduct.name,
			purchase_document_line_id: null,
			quantity: 4,
			cost: netEnteredCost,
		},
	],
	inventory_operation_id: null,
	reversal_operation_id: null,
	queued_at: '2026-09-07T11:05:00-03:00',
	failed_at: '2026-09-07T11:06:00-03:00',
	reversed_at: null,
	cancellation_reason: null,
	reversal_reason: null,
	// Código propio del mock (card 05), sin código estable en la sección 16:
	// misma licencia que `PURCHASE_DOCUMENT_ITEMS_EMPTY` en documentos.
	failure_code: 'MOCK_STOCK_RECEIPT_WORKER_ERROR',
	failure_message:
		'No pudimos completar el ingreso de stock. Corrige los datos e inténtalo de nuevo.',
	processing: {
		attempt_count: 2,
		last_attempt_at: '2026-09-07T11:06:00-03:00',
		next_retry_at: null,
	},
	posted_by: null,
	updated_at: '2026-09-07T11:06:00-03:00',
};

/** `cancelled` desde `draft`: sin efecto físico, sin acciones. */
export const cancelledStockReceipt: IStockReceipt = {
	id: 74,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'cancelled',
	warehouse: mainWarehouse,
	supplier: null,
	purchase_document: null,
	received_on: '2026-09-03',
	items_count: 1,
	total_quantity: 2,
	created_at: '2026-09-03T08:00:00-03:00',
	posted_at: null,
	allowed_actions: [],
	reason: 'Ingreso duplicado por error de digitación',
	notes: null,
	items: [
		{
			id: 904,
			product: cableProduct,
			sku_snapshot: cableProduct.sku,
			name_snapshot: cableProduct.name,
			purchase_document_line_id: null,
			quantity: 2,
			cost: unknownCost,
		},
	],
	inventory_operation_id: null,
	reversal_operation_id: null,
	queued_at: null,
	failed_at: null,
	reversed_at: null,
	cancellation_reason: 'Ingreso duplicado por error de digitación.',
	reversal_reason: null,
	failure_code: null,
	failure_message: null,
	processing: emptyStockReceiptProcessing,
	posted_by: null,
	updated_at: '2026-09-03T08:20:00-03:00',
};

/**
 * `reversed`: compensada, con historia conservada. Sin documento — vincular
 * uno después (sección 8, card 07) queda fuera del alcance de esta card.
 */
export const reversedStockReceipt: IStockReceipt = {
	id: 75,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'reversed',
	warehouse: mainWarehouse,
	supplier: pcExpressSupplier,
	purchase_document: null,
	received_on: '2026-08-30',
	items_count: 1,
	total_quantity: 4,
	created_at: '2026-08-30T09:00:00-03:00',
	posted_at: '2026-08-30T09:04:00-03:00',
	allowed_actions: [],
	reason: 'Ingreso pendiente de factura',
	notes: null,
	items: [
		{
			id: 905,
			product: mouseProduct,
			sku_snapshot: mouseProduct.sku,
			name_snapshot: mouseProduct.name,
			purchase_document_line_id: null,
			quantity: 4,
			cost: grossEnteredCost,
		},
	],
	inventory_operation_id: 'a1c1c9c2-6e1b-4b1a-9c3a-2f6b1e7d9a01',
	reversal_operation_id: 'b2d2dad3-7f2c-4c2b-8d4b-3a7c2f8eab12',
	queued_at: '2026-08-30T09:01:00-03:00',
	failed_at: null,
	reversed_at: '2026-08-31T10:00:00-03:00',
	cancellation_reason: null,
	reversal_reason:
		'Producto dañado detectado tras el ingreso: se revierte para un ajuste explícito.',
	failure_code: null,
	failure_message: null,
	processing: {
		attempt_count: 1,
		last_attempt_at: '2026-08-30T09:04:00-03:00',
		next_retry_at: null,
	},
	posted_by: bodegaActor,
	updated_at: '2026-08-31T10:00:00-03:00',
};

/**
 * `posted` **con documento** (`pcExpressKeyboardInvoiceDocument`, línea 601):
 * mismo id `80` del ejemplo canónico de la sección 3/12 del contrato. Cubre 8
 * de los 20 teclados — coincide con `received_quantity`/`received_distribution`
 * de esa línea — y queda **marcada como consumida** en el store del servicio
 * mock (`stockReceipts.service`) para poder ejercer `409
 * RECEIPT_ALREADY_CONSUMED` al revertir, tal como pide la card: el contrato no
 * modela consumo real (eso vive en ventas, fuera de este módulo), así que el
 * mock lo simula marcando este id a propósito.
 */
export const postedKeyboardStockReceipt: IStockReceipt = {
	id: 80,
	subsidiary_id: STOCK_RECEIPT_SUBSIDIARY_ID,
	branch_id: STOCK_RECEIPT_BRANCH_ID,
	status: 'posted',
	warehouse: mainWarehouse,
	supplier: pcExpressSupplier,
	purchase_document: {
		id: pcExpressKeyboardInvoiceDocument.id,
		document_type: pcExpressKeyboardInvoiceDocument.document_type,
		document_number: pcExpressKeyboardInvoiceDocument.document_number,
		issue_date: pcExpressKeyboardInvoiceDocument.issue_date,
	},
	received_on: '2026-08-29',
	items_count: 1,
	total_quantity: 8,
	created_at: '2026-08-29T09:50:00-03:00',
	posted_at: '2026-08-29T10:15:00-03:00',
	// No `allowedActionsByState.receiptPosted`: ese ejemplo incluye
	// `link_purchase_document`, pero la card 05 lo omite a propósito — la
	// card 07 (documentar después, sección 8) todavía no existe para ofrecer
	// un botón que no lleva a ninguna parte. Mismo criterio que
	// `create_receipt` en documentos antes de que esta card existiera.
	allowed_actions: ['reverse'],
	reason: null,
	notes: null,
	items: [
		{
			id: 906,
			product: keyboardProduct,
			sku_snapshot: keyboardProduct.sku,
			name_snapshot: keyboardProduct.name,
			purchase_document_line_id: 601,
			quantity: 8,
			cost: keyboardInvoiceLineCost,
		},
	],
	inventory_operation_id: 'c3e3ebe4-8a3d-4d3c-9e5c-4b8d3a9fbc23',
	reversal_operation_id: null,
	queued_at: '2026-08-29T09:51:00-03:00',
	failed_at: null,
	reversed_at: null,
	cancellation_reason: null,
	reversal_reason: null,
	failure_code: null,
	failure_message: null,
	processing: {
		attempt_count: 1,
		last_attempt_at: '2026-08-29T10:15:00-03:00',
		next_retry_at: null,
	},
	posted_by: bodegaActor,
	updated_at: '2026-08-29T10:15:00-03:00',
};

/** Semilla del listado. El servicio mock la clona a su propio store mutable. */
export const stockReceipts: IStockReceipt[] = [
	draftManualStockReceipt,
	draftUnknownCostStockReceipt,
	queuedStockReceipt,
	failedStockReceipt,
	cancelledStockReceipt,
	reversedStockReceipt,
	postedKeyboardStockReceipt,
];

/**
 * IDs de recepción que el mock trata como «ya consumidas» al intentar
 * `reverse` (409 `RECEIPT_ALREADY_CONSUMED`, sección 7). El contrato no
 * modela consumo real dentro de este módulo — nace en ventas, fuera de
 * alcance — así que el servicio lo simula con este set fijo en vez de
 * inventar una regla de negocio que no está escrita.
 */
export const STOCK_RECEIPT_CONSUMED_IDS: ReadonlySet<number> = new Set([
	postedKeyboardStockReceipt.id,
]);

/* =================================================
   Envoltorio y paginación — sección 3 del contrato
   ================================================= */

export interface IInventoryStockRow {
	product: IProcurementProduct;
	physical_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
	documented_quantity: number;
	undocumented_quantity: number;
}

/**
 * Respuesta literal de `GET B/inventory-stock` del contrato. Se incluye acá
 * porque es el ejemplo canónico del envoltorio `{data, context, links, meta}`
 * que consumirá el resto del módulo; el detalle de la pantalla de stock es de la
 * card 06.
 */
export const inventoryStockEnvelope: IApiCollectionEnvelope<
	IInventoryStockRow,
	IInventoryLocationContext
> = {
	data: [
		{
			product: mouseProduct,
			physical_quantity: 15,
			fit_quantity: 13,
			unfit_quantity: 2,
			documented_quantity: 10,
			undocumented_quantity: 5,
		},
	],
	context: {
		scope: 'unlocated',
		branch_id: 4,
		warehouse: null,
	},
	links: { first: '?page=1', last: '?page=1', prev: null, next: null },
	meta: {
		current_page: 1,
		from: 1,
		last_page: 1,
		links: [],
		path: '/api/branches/4/inventory-stock',
		per_page: 15,
		to: 1,
		total: 1,
	},
};
