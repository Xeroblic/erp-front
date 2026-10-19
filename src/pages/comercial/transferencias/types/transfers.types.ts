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
	/** `''`: sin elegir. `null`: «Sin ubicación», que sólo se ofrece en la etapa 2. */
	from_warehouse_id?: number | '' | null;
	to_warehouse_id?: number | '' | null;
	auto_create_destination_product: boolean;
	expected_date?: string;
	priority?: TransferPriority;
	notes?: string;
	items: ITransferItemForm[];
}

/**
 * Etapa 2: las dos ubicaciones son obligatorias. «Sin ubicación» cuenta como
 * respuesta; dejar el selector vacío, no (el backend lo rechaza con 422).
 */
export const FROM_LOCATION_REQUIRED_MESSAGE =
	'Indica la ubicación de origen; elige «Sin ubicación» si corresponde.';
export const TO_LOCATION_REQUIRED_MESSAGE =
	'Indica la ubicación de destino; elige «Sin ubicación» si corresponde.';
