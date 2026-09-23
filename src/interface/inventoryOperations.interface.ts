import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IProcurementActorCompact,
	IProcurementProduct,
	IPurchaseDocumentCompact,
	ISupplierCompact,
	TBusinessDate,
	TIsoTimestamp,
	TStockCondition,
} from '@/interface/procurement.interface';

/**
 * Trazabilidad agrupada — §14 del contrato de abastecimiento
 * (`GET S/inventory-operations` y `GET S/inventory-operations/{operation}`).
 *
 * Una operación es un acto completo (una recepción, un traslado, un ajuste),
 * no una fila cruda de movimiento: una recepción de 15 productos es una sola
 * operación con 15 ítems. Es la historia de los productos **sin serie**; los
 * serializados se siguen por su número de serie.
 */

/** Tipos públicos nuevos del §14. */
export type TInventoryOperationType =
	| 'stock_receipt'
	| 'stock_receipt_reversal'
	| 'sale_fulfillment'
	| 'sale_return'
	| 'warehouse_stock_placement'
	| 'inventory_adjustment'
	| 'purchase_document_link'
	| 'initial_stock_document_allocation';

/**
 * Entidad que originó la operación. `type` es un alias público (`sale`,
 * `stock_receipt`, `transfer`, `inventory_adjustment`, `document_allocation`),
 * nunca un nombre de clase.
 */
export interface IInventoryOperationSource {
	type: string;
	id: number;
}

/** Fila del listado. */
export interface IInventoryOperationRow {
	/** UUID de la operación. */
	id: string;
	/**
	 * Uno de `TInventoryOperationType` o un tipo legado, que el backend conserva
	 * con su nombre («no reinterpretarlos por nombre»): por eso es `string`.
	 */
	operation_type: string;
	/** Título en español que arma el backend. */
	title: string;
	occurred_at: TIsoTimestamp;
	branch: { id: number; name: string } | null;
	actor: IProcurementActorCompact | null;
	reason: string | null;
	source: IInventoryOperationSource | null;
	reverses_operation_id: string | null;
	summary: {
		/** Productos distintos. */
		products_count: number;
		/** Unidades contadas una vez: un traslado de 5 son 5, no 10. Documentales: 0. */
		units_affected: number;
	};
}

/** Saldo de una ubicación antes y después de la operación (histórico, no el de hoy). */
export interface IInventoryOperationEffect {
	branch_id: number;
	/** `null` es «Sin ubicación». */
	warehouse_id: number | null;
	physical_quantity_delta: number;
	fit_quantity_delta: number;
	unfit_quantity_delta: number;
	physical_quantity_before: number;
	physical_quantity_after: number;
	fit_quantity_before: number;
	fit_quantity_after: number;
	unfit_quantity_before: number;
	unfit_quantity_after: number;
}

/** Procedencia contable que tocó el ítem. */
export interface IInventoryOperationItemOrigin {
	origin_id: number;
	quantity: number;
	supplier: ISupplierCompact | null;
	purchase_document: IPurchaseDocumentCompact | null;
}

export interface IInventoryOperationItem {
	product: IProcurementProduct;
	product_id: number;
	quantity: number;
	/** `null` si la operación no tiene efecto físico (documental). */
	condition: TStockCondition | null;
	/** El ítem cumple los filtros de la consulta; la operación se muestra completa igual. */
	matches_filter: boolean;
	effects: IInventoryOperationEffect[];
	origins: IInventoryOperationItemOrigin[];
}

export interface IInventoryOperationDetail extends IInventoryOperationRow {
	items: IInventoryOperationItem[];
}

/** Filtros del listado. Seleccionan operaciones que contienen algo que coincide. */
export interface IInventoryOperationMatchParams {
	operation_type?: string;
	product_id?: number;
	supplier_id?: number;
	purchase_document_id?: number;
	branch_id?: number;
	warehouse_id?: number;
	unlocated?: 1;
	occurred_from?: TBusinessDate;
	occurred_to?: TBusinessDate;
	/** Folio, RUT, proveedor, SKU o nombre del producto. */
	search?: string;
}

export interface IInventoryOperationsParams extends IInventoryOperationMatchParams {
	page?: number;
	per_page?: number;
}

export type IInventoryOperationsResponse = IApiCollectionEnvelope<IInventoryOperationRow>;
export type IInventoryOperationDetailResponse = IApiResourceEnvelope<IInventoryOperationDetail>;
