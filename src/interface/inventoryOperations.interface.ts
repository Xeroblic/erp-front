import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IProcurementActorCompact,
	IProcurementProduct,
	IPurchaseDocumentCompact,
	ISupplierCompact,
	IWarehouseCompact,
	TBusinessDate,
	TIsoTimestamp,
	TStockCondition,
} from '@/interface/procurement.interface';

/**
 * Trazabilidad agrupada — §14 del contrato de abastecimiento
 * (`GET S/inventory-operations` y `GET S/inventory-operations/{operation}`).
 * Verificado contra `InventoryOperationResource`,
 * `InventoryOperationDetailResource` y `ListInventoryOperationsRequest`.
 *
 * Una operación es un acto completo (una recepción, un traslado, un ajuste),
 * no una fila cruda de movimiento: una recepción de 15 productos es una sola
 * operación con 15 ítems.
 */

/**
 * Valores del enum `InventoryOperationType` del backend: el filtro
 * `operation_type` valida contra él y cualquier otro valor es 422. Los tres
 * del respaldo histórico (`initial_stock`, `branch_transfer`,
 * `legacy_movement`) los documenta la tarea 17; `serial_correction` y
 * `stock_reconciliation` existen en el enum aunque el contrato no los nombre.
 */
export type TInventoryOperationType =
	| 'stock_receipt'
	| 'stock_receipt_reversal'
	| 'sale_fulfillment'
	| 'sale_return'
	| 'warehouse_stock_placement'
	| 'inventory_adjustment'
	| 'purchase_document_link'
	| 'initial_stock_document_allocation'
	| 'initial_stock'
	| 'branch_transfer'
	| 'legacy_movement'
	| 'serial_correction'
	| 'stock_reconciliation';

/** Alias público del origen (`InventoryOperationSource`), nunca un nombre de clase. */
export type TInventoryOperationSourceType =
	| 'sale'
	| 'stock_receipt'
	| 'transfer'
	| 'inventory_adjustment'
	| 'document_allocation'
	| 'product';

/** Entidad que originó la operación. */
export interface IInventoryOperationSource {
	type: TInventoryOperationSourceType;
	id: number;
}

/** Fila del listado. */
export interface IInventoryOperationRow {
	/** UUID de la operación. */
	id: string;
	/**
	 * Uno de `TInventoryOperationType`. Queda `string` porque el contrato pide
	 * mostrar un tipo desconocido con su `title`, sin reinterpretarlo.
	 */
	operation_type: string;
	/** Título en español, fijo por tipo. No se arma en el cliente. */
	title: string;
	occurred_at: TIsoTimestamp;
	branch: { id: number; name: string } | null;
	actor: IProcurementActorCompact | null;
	reason: string | null;
	/** `null` cuando no hay un origen citable (por ejemplo, un ajuste manual). */
	source: IInventoryOperationSource | null;
	reverses_operation_id: string | null;
	/** Describe la operación completa, no sólo los ítems que coinciden con el filtro. */
	summary: {
		/** Productos distintos. */
		products_count: number;
		/**
		 * Unidades contadas una vez: un traslado de 5 son 5, no 10. Una operación
		 * documental cuenta las unidades que documenta, sin moverlas.
		 */
		units_affected: number;
		/** El acto cambió existencias físicas. Se calcula de lo escrito, no del tipo. */
		physical_effect: boolean;
	};
}

/**
 * Saldo de una ubicación antes y después de la operación (histórico, no el de
 * hoy). Los deltas siempre traen número; los saldos son `null` en movimientos
 * anteriores a la migración que empezó a guardar el saldo previo, y se
 * muestran «—», nunca `0`.
 */
export interface IInventoryOperationEffect {
	branch_id: number;
	/** `null` es «Sin ubicación». */
	warehouse_id: number | null;
	/** La bodega tal como existe hoy, también desactivada o eliminada; `null` es «Sin ubicación». */
	warehouse: IWarehouseCompact | null;
	physical_quantity_delta: number;
	fit_quantity_delta: number;
	unfit_quantity_delta: number;
	physical_quantity_before: number | null;
	physical_quantity_after: number | null;
	fit_quantity_before: number | null;
	fit_quantity_after: number | null;
	unfit_quantity_before: number | null;
	unfit_quantity_after: number | null;
}

/** Procedencia contable que tocó el ítem. */
export interface IInventoryOperationItemOrigin {
	origin_id: number;
	quantity: number;
	supplier: ISupplierCompact | null;
	purchase_document: IPurchaseDocumentCompact | null;
}

/** Un ítem es (producto, condición): 2 aptas y 1 no apta del mismo producto son dos ítems. */
export interface IInventoryOperationItem {
	product: IProcurementProduct;
	product_id: number;
	quantity: number;
	/** `null` si la operación no tiene efecto físico (documental). */
	condition: TStockCondition | null;
	/** El ítem cumple los filtros de la consulta; la operación se muestra completa igual. */
	matches_filter: boolean;
	/** Un efecto por movimiento, en orden de escritura. `[]` en una operación documental. */
	effects: IInventoryOperationEffect[];
	/**
	 * Procedencias consumidas o devueltas. También `[]` en entradas (recepción,
	 * stock inicial, ajuste positivo) y traslados, aunque tengan `effects`.
	 */
	origins: IInventoryOperationItemOrigin[];
}

export interface IInventoryOperationDetail extends IInventoryOperationRow {
	items: IInventoryOperationItem[];
}

/**
 * Filtros del listado. Seleccionan operaciones que contienen algo que
 * coincide; el detalle los acepta sólo para marcar `matches_filter`.
 */
export interface IInventoryOperationMatchParams {
	operation_type?: TInventoryOperationType;
	product_id?: number;
	/** Sólo alcanza salidas y devoluciones: no encuentra recepciones ni traslados. */
	supplier_id?: number;
	/** Igual que `supplier_id`: sólo salidas y devoluciones. */
	purchase_document_id?: number;
	/** Fuera del alcance del usuario es 422, nunca una lista vacía. */
	branch_id?: number;
	warehouse_id?: number;
	/**
	 * «Sin ubicación». Excluyente con `warehouse_id` (422 aunque vaya en `0`):
	 * sólo existe encendido; sin ese filtro se omite.
	 */
	unlocated?: 1;
	/** Operaciones con al menos un ítem sin (`0`) o con (`1`) seguimiento por serie. */
	serial_tracking?: 0 | 1;
	occurred_from?: TBusinessDate;
	/** Inclusiva por día; no puede ser anterior a `occurred_from`. */
	occurred_to?: TBusinessDate;
	/** SKU o nombre del producto, nombre o RUT del proveedor, o folio del documento. */
	search?: string;
}

export interface IInventoryOperationsParams extends IInventoryOperationMatchParams {
	page?: number;
	/** 15 por defecto, máximo 100. */
	per_page?: number;
}

/** `context` de la lista, al nivel de `data`. No depende de los filtros. */
export interface IInventoryOperationsContext {
	/** Movimientos del alcance que el motor todavía no agrupó en una operación. */
	pending_movements_count: number;
}

export type IInventoryOperationsResponse = IApiCollectionEnvelope<
	IInventoryOperationRow,
	IInventoryOperationsContext
> & { context: IInventoryOperationsContext };
export type IInventoryOperationDetailResponse = IApiResourceEnvelope<IInventoryOperationDetail>;
