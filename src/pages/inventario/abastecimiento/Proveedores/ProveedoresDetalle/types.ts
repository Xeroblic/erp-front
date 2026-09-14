import type {
	IProcurementCost,
	IProcurementProduct,
	IPurchaseDocumentCompact,
	TBusinessDate,
} from '@/interface/procurement.interface';

/**
 * «Productos suministrados» de la ficha de proveedor.
 *
 * **No es un recurso del contrato.** La sección 5 del `frontend-guide.md` sólo
 * entrega `purchase_summary.products_supplied_count`, sin la lista. Estas
 * filas se derivan en el cliente de las recepciones `posted` del proveedor
 * (sección 7), con el mismo criterio que la sección 12 aplica en sentido
 * inverso (`GET P/products/{product}/suppliers`): cuentan recepciones
 * contabilizadas, las revertidas no participan y la última compra se elige por
 * `received_on` DESC, ID DESC. El día que el backend exponga la lista, este
 * tipo se reemplaza por el del contrato.
 */

export interface ISupplierSuppliedProductLastPurchase {
	stock_receipt_id: number;
	/** Sucursal de la recepción: el enlace a su ficha se autoriza con este contexto. */
	branch_id: number;
	received_on: TBusinessDate;
	/** Unidades del producto en esa recepción, sumando todas sus líneas. */
	quantity: number;
	/**
	 * Costo de la única línea del producto en esa recepción. `null` cuando la
	 * recepción trae varias líneas del mismo producto: el ponderado es del
	 * servidor (sección 12) y no se inventa en el cliente.
	 */
	cost: IProcurementCost | null;
	purchase_document: IPurchaseDocumentCompact | null;
}

export interface ISupplierSuppliedProductRow {
	/** Ficha del producto tal como vino en la recepción más reciente. */
	product: IProcurementProduct;
	receipt_count: number;
	total_units_received: number;
	last_purchase: ISupplierSuppliedProductLastPurchase;
}
