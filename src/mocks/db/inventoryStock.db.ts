import type {
	IInventoryStockOriginRow,
	IInventoryStockRow,
	IPurchaseDocumentCompact,
	ISupplierCompact,
	IWarehouseCompact,
	IProcurementProduct,
} from '@/interface/procurement.interface';
import {
	cableProduct,
	ecopcWarehouse,
	invoiceDocument,
	keyboardProduct,
	mainWarehouse,
	mouseProduct,
	notebookProduct,
	pcExpressSupplier,
	shelfWarehouse,
	southBranchWarehouse,
} from '@/mocks/db/procurement.db';

export interface IInventorySeedOrigin extends IInventoryStockOriginRow {
	product_id: number;
	branch_id: number;
	warehouse_id: number | null;
	fifo_at: number;
}

export interface IInventorySeedRow extends IInventoryStockRow {
	branch_id: number;
	warehouse_id: number | null;
}

const unknownOrigin: IInventorySeedOrigin = {
	origin_id: 52,
	origin_type: 'initial_stock',
	stock_receipt_id: null,
	received_on: null,
	supplier: null,
	purchase_document: null,
	physical_quantity: 5,
	fit_quantity: 5,
	unfit_quantity: 0,
	branch_id: 4,
	product_id: 31,
	warehouse_id: null,
	fifo_at: 1,
};

/** Origin #51 literal del contrato; fifo_at nunca viaja a la UI. */
export const inventoryOrigin51: IInventorySeedOrigin = {
	origin_id: 51,
	origin_type: 'stock_receipt',
	stock_receipt_id: 80,
	received_on: '2026-09-04',
	supplier: pcExpressSupplier,
	purchase_document: invoiceDocument,
	physical_quantity: 10,
	fit_quantity: 8,
	unfit_quantity: 2,
	branch_id: 4,
	product_id: 31,
	warehouse_id: null,
	fifo_at: 2,
};

const paginatedProducts: IProcurementProduct[] = Array.from({ length: 16 }, (_, index) => ({
	...keyboardProduct,
	id: 1000 + index,
	sku: `TEST-${String(index + 1).padStart(2, '0')}`,
	name: `Accesorio de demostración ${String(index + 1).padStart(2, '0')}`,
}));
const products = [
	mouseProduct,
	keyboardProduct,
	notebookProduct,
	cableProduct,
	...paginatedProducts,
];

/**
 * Resuelve un producto por id contra el mismo catálogo que arma
 * `inventoryStockRows` (card 07, ZF-112): `inventoryStock.service` lo
 * necesita para reconstruir filas agregadas dinámicamente desde el store
 * mutable de procedencias (`origins`), que sólo guarda `product_id` — nunca
 * el producto completo — igual criterio que el resto del mock: el fixture es
 * la única fuente del catálogo, ningún servicio lo duplica.
 */
export const resolveInventoryProduct = (productId: number): IProcurementProduct | undefined =>
	products.find((product) => product.id === productId);

/**
 * Catálogo ajustable de la sucursal: **todos** los productos no serializados,
 * tengan o no saldo hoy en la ubicación que se está corrigiendo.
 *
 * Un ajuste por conteo existe justamente para registrar lo que el saldo no
 * dice: un producto que llegó a cero —o que nunca estuvo en esa bodega— sigue
 * siendo corregible al alza. Alimentar el selector con el stock vigente lo
 * dejaría fuera para siempre. Los serializados quedan afuera por la misma
 * razón que en `listInventoryStock`: se corrigen por serie, no por cantidad.
 */
export const inventoryAdjustableProducts: IProcurementProduct[] = products
	.filter((product) => !product.serial_tracking)
	.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);

/**
 * Reservas (holds) vigentes de la sucursal: unidades ya comprometidas con
 * ventas o pedidos que todavía no salieron físicamente.
 *
 * Son **globales de la sucursal**, no de una bodega: un compromiso de venta no
 * elige de qué estante saldrá la unidad, y repartirlo entre bodegas inventaría
 * un dato que el negocio no tiene. Existen para poder mostrar lo que la card
 * exige: un conteo real puede dejar el disponible por debajo de lo reservado,
 * y ese faltante se muestra en vez de truncarse en cero. Ningún ajuste las
 * toca — corrige el físico, no cancela compromisos.
 */
export interface IInventoryStockHold {
	branch_id: number;
	product_id: number;
	reserved_quantity: number;
}

/**
 * El mouse de la sucursal 4 tiene 17 aptos repartidos (13 sin ubicación + 4 en
 * el estante) y 16 comprometidos: queda 1 disponible. Un conteo que reste 3
 * deja el disponible en −2, que es exactamente el caso que la card pide poder
 * mostrar. Ningún otro fixture depende de este número.
 */
export const inventoryStockHolds: IInventoryStockHold[] = [
	{ branch_id: 4, product_id: mouseProduct.id, reserved_quantity: 16 },
];

export const inventoryOrigins: IInventorySeedOrigin[] = [
	unknownOrigin,
	inventoryOrigin51,
	{
		...inventoryOrigin51,
		origin_id: 53,
		warehouse_id: shelfWarehouse.id,
		physical_quantity: 4,
		fit_quantity: 4,
		unfit_quantity: 0,
		fifo_at: 3,
	},
	{
		...unknownOrigin,
		origin_id: 54,
		branch_id: 6,
		warehouse_id: southBranchWarehouse.id,
		product_id: keyboardProduct.id,
		physical_quantity: 6,
		fit_quantity: 5,
		unfit_quantity: 1,
	},
	{
		...inventoryOrigin51,
		origin_id: 55,
		warehouse_id: mainWarehouse.id,
		product_id: notebookProduct.id,
		physical_quantity: 1,
		fit_quantity: 1,
		unfit_quantity: 0,
	},
	...Array.from(
		{ length: 16 },
		(_, index): IInventorySeedOrigin => ({
			origin_id: 100 + index,
			origin_type: 'inventory_adjustment',
			stock_receipt_id: null,
			received_on: ['2026-09-08', '2026-09-01'][index] ?? null,
			supplier: index === 15 ? pcExpressSupplier : null,
			purchase_document: index === 15 ? invoiceDocument : null,
			physical_quantity: 1,
			fit_quantity: 1,
			unfit_quantity: 0,
			branch_id: 4,
			product_id: 67,
			warehouse_id: mainWarehouse.id,
			// Last two deliberately share priority: origin_id breaks the tie.
			fifo_at: 10 + Math.min(index, 14),
		}),
	),
	...paginatedProducts.map(
		(product, index): IInventorySeedOrigin => ({
			...unknownOrigin,
			origin_id: 200 + index,
			product_id: product.id,
			warehouse_id: mainWarehouse.id,
			physical_quantity: 1,
			fit_quantity: 1,
			unfit_quantity: 0,
			fifo_at: 30 + index,
		}),
	),
	/**
	 * Caso canónico de la card 07 (ZF-112, sección 8): 100 físicos sin
	 * documento, en una ubicación/producto que ningún otro fixture toca
	 * (`cableProduct` no aparece en ningún otro origin) para no perturbar los
	 * agregados ya cerrados de mouse/teclado que ejercen otras pruebas.
	 * Respaldar documentalmente una porción parcial (10) tiene que dejar
	 * «100 físicos = 10 documentados + 90 sin documento», demostrable
	 * navegando `StockPorUbicacion` sin tocar más fixtures.
	 */
	{
		origin_id: 220,
		origin_type: 'initial_stock',
		stock_receipt_id: null,
		received_on: null,
		supplier: null,
		purchase_document: null,
		physical_quantity: 100,
		fit_quantity: 100,
		unfit_quantity: 0,
		branch_id: 4,
		product_id: cableProduct.id,
		warehouse_id: mainWarehouse.id,
		fifo_at: 600,
	},
	/**
	 * Ejemplos de la sucursal Ecopc (`branch_id: 1`, ver `ecopcWarehouse` en
	 * `procurement.db.ts`): mouse con las dos procedencias — 8 documentadas
	 * (recepción con proveedor) y 4 sin documento — y teclado sin documento,
	 * para que `StockPorUbicacion` no aparezca vacío con la sesión real del
	 * equipo.
	 */
	{
		origin_id: 300,
		origin_type: 'stock_receipt',
		stock_receipt_id: 90,
		received_on: '2026-09-05',
		supplier: pcExpressSupplier,
		purchase_document: invoiceDocument,
		physical_quantity: 8,
		fit_quantity: 7,
		unfit_quantity: 1,
		branch_id: 1,
		product_id: mouseProduct.id,
		warehouse_id: ecopcWarehouse.id,
		fifo_at: 1,
	},
	{
		origin_id: 301,
		origin_type: 'initial_stock',
		stock_receipt_id: null,
		received_on: null,
		supplier: null,
		purchase_document: null,
		physical_quantity: 4,
		fit_quantity: 3,
		unfit_quantity: 1,
		branch_id: 1,
		product_id: mouseProduct.id,
		warehouse_id: ecopcWarehouse.id,
		fifo_at: 2,
	},
	{
		origin_id: 302,
		origin_type: 'initial_stock',
		stock_receipt_id: null,
		received_on: null,
		supplier: null,
		purchase_document: null,
		physical_quantity: 6,
		fit_quantity: 6,
		unfit_quantity: 0,
		branch_id: 1,
		product_id: keyboardProduct.id,
		warehouse_id: ecopcWarehouse.id,
		fifo_at: 1,
	},
];

/** One source of truth for current balances; the canonical unlocated mouse stays 15/13/2/10/5. */
export const inventoryStockRows: IInventorySeedRow[] = [
	...inventoryOrigins
		.reduce((rows, origin) => {
			const product = products.find((candidate) => candidate.id === origin.product_id);
			if (!product) throw new Error(`Producto de fixture inexistente: ${origin.product_id}`);
			const key = `${origin.branch_id}:${origin.warehouse_id}:${origin.product_id}`;
			const row = rows.get(key) ?? {
				product,
				branch_id: origin.branch_id,
				warehouse_id: origin.warehouse_id,
				physical_quantity: 0,
				fit_quantity: 0,
				unfit_quantity: 0,
				documented_quantity: 0,
				undocumented_quantity: 0,
			};
			row.physical_quantity += origin.physical_quantity;
			row.fit_quantity += origin.fit_quantity;
			row.unfit_quantity += origin.unfit_quantity;
			if (origin.purchase_document) row.documented_quantity += origin.physical_quantity;
			else row.undocumented_quantity += origin.physical_quantity;
			rows.set(key, row);
			return rows;
		}, new Map<string, IInventorySeedRow>())
		.values(),
];

export const inventoryWarehousesByBranch: Record<number, IWarehouseCompact[]> = {
	1: [ecopcWarehouse],
	4: [mainWarehouse, shelfWarehouse],
	6: [southBranchWarehouse],
};

export const inventoryOriginFilterOptions = (
	origins: readonly IInventorySeedOrigin[],
): { suppliers: ISupplierCompact[]; documents: IPurchaseDocumentCompact[] } => {
	const suppliers = new Map<number, ISupplierCompact>();
	const documents = new Map<number, IPurchaseDocumentCompact>();
	origins.forEach((origin) => {
		if (origin.supplier) suppliers.set(origin.supplier.id, origin.supplier);
		if (origin.purchase_document)
			documents.set(origin.purchase_document.id, origin.purchase_document);
	});
	return { suppliers: [...suppliers.values()], documents: [...documents.values()] };
};
