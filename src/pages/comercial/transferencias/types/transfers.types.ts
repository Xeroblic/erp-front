/**
 * Tipos específicos para el módulo de Transferencias
 * Alineados al contrato del backend (branches/{branch}/transfers)
 */

import type {
	TransferDirection,
	TransferPriority,
	ICreateTransferItemRequest,
} from '@/interface/transfers.interface';

export interface ITransferFilters {
	direction: TransferDirection;
	q: string;
	per_page: number;
}

export interface ITransferStats {
	total: number;
	sent: number;
	received: number;
	completed: number;
}

export interface ITransferItemForm extends ICreateTransferItemRequest {
    product_name?: string;
    product_sku?: string;
}

export interface ICreateTransferForm {
	to_branch_id: number | '';
	from_warehouse_id?: number | '';
	to_warehouse_id?: number | '';
	auto_create_destination_product: boolean;
	expected_date?: string;
	priority?: TransferPriority;
	notes?: string;
	items: ITransferItemForm[];
}
