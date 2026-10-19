/**
 * Interfaces para el módulo de Transferencias
 * Actualizado al contrato definido en `transfers-implementation-guide.md`
 */

export type TransferDirection = 'all' | 'sent' | 'received';

export type TransferStatus = 'pending' | 'sent' | 'received' | 'completed' | 'cancelled' | 'draft';

export type TransferPriority = 'alta' | 'media' | 'baja';

export interface ITransferBranchSummary {
	id: number;
	name: string;
}

/**
 * Bodega de un traslado. En la etapa 2 (`multi_location_enabled`) el backend
 * responde `{id: null, name: null}` para «Sin ubicación»: es una ubicación real,
 * no un dato faltante.
 */
export interface ITransferWarehouseSummary {
	id: number | null;
	name: string | null;
}

export interface ITransferResponsible {
	id: number;
	name: string;
	email?: string | null;
}

export interface ITransferTotals {
	items: number;
	quantity: number;
}

export interface ITransferItem {
	id: number;
	transfer_id?: number;
	product_id: number;
	product_name: string;
	product_sku: string;
	quantity: number;
	received_quantity?: number;
	traceability_ids?: number[];
	from_location_id?: number;
	to_location_id?: number;
	pending_quantity?: number;
	completion_percentage?: number;
	origin_product?: ITransferItemProductSummary;
	destination_product?: ITransferItemProductSummary;
	product?: ITransferItemProductSummary;
}

export interface ITransferItemProductSummary {
	id: number;
	sku?: string;
	name?: string;
}

export interface ITransfer {
	id: number;
	status: TransferStatus;
	transfer_number?: string | null;
	company_id?: number;
	from_branch_id?: number;
	to_branch_id?: number;
	from_warehouse_id?: number | null;
	to_warehouse_id?: number | null;
	responsible_id?: number | null;
	notes?: string | null;
	created_at: string;
	updated_at: string;
	direction?: TransferDirection;

	from_branch?: ITransferBranchSummary;
	to_branch?: ITransferBranchSummary;
	from_warehouse?: ITransferWarehouseSummary | null;
	to_warehouse?: ITransferWarehouseSummary | null;
	responsible?: ITransferResponsible | null;
	totals?: ITransferTotals;
	items?: ITransferItem[];
}

export interface ICreateTransferItemRequest {
	product_id: number;
	quantity: number;
}

export interface ICreateTransferRequest {
	to_branch_id: number;
	items: ICreateTransferItemRequest[];
	/**
	 * Etapa 1: opcional, sólo rotula el documento. Etapa 2: obligatoria, con
	 * `null` para «Sin ubicación»; omitirla es un 422.
	 */
	from_warehouse_id?: number | null;
	/** Igual que `from_warehouse_id`; en la etapa 2 no admite una bodega inactiva. */
	to_warehouse_id?: number | null;
	auto_create_destination_product?: boolean;
	expected_date?: string;
	priority?: TransferPriority;
	notes?: string | null;
}

export interface IReceiveTransferRequest {
	items: Array<{
		transfer_item_id: number;
		received_quantity: number;
		to_location_id?: number;
	}>;
	notes?: string;
}
