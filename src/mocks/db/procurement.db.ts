import type {
	IApiCollectionEnvelope,
	IInventoryLocationContext,
	IProcurementCost,
	IProcurementProduct,
	IPurchaseDocumentCompact,
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

export const procurementProducts: IProcurementProduct[] = [
	mouseProduct,
	notebookProduct,
	cableProduct,
];

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

/** Proveedor desactivado: se excluye de nuevas selecciones, no del historial. */
export const inactiveSupplier: ISupplierCompact = {
	id: 12,
	display_name: 'Importadora Sur',
	rut: '77888999-K',
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

export const procurementWarehouses: IWarehouseCompact[] = [mainWarehouse, shelfWarehouse];

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
