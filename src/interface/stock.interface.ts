/**
 * stock.interface.ts
 * Dominio de Stock, Asignaciones y Series en el Zentria Standard
 */

 export interface IStockAssignmentItemPayload {
	child_product_id: number;
	assign_all?: boolean;
	quantity?: number;
	price_override?: number;
	serial_numbers?: string[];
 }

// 1. Asignar Producto
export interface IAssignProductPayload {
	branch_ids: number[];
	is_active: boolean;
	price_override?: number;
	offer_price_override?: number;
	initial_stock?: number;
}

// 2. Asignar Stock
export interface IAssignStockPayload {
	branch_id: number;
	notes?: string;
	assignments: IStockAssignmentItemPayload[];
}

// 3. Desasignar Stock
export interface IUnassignStockPayload {
	branch_id: number;
	confirm?: boolean;
	notes?: string;
	assignments?: Array<{
		child_product_id: number;
		quantity: number;
	}>;
	serial_numbers?: string[];
}

// 4. Transferir Stock
export interface ITransferStockPayload {
	from_branch_id: number;
	to_branch_id: number;
	serial_numbers?: string[];
	assignments?: Array<{
		child_product_id: number;
		quantity: number;
	}>;
	notes?: string;
}

// 5. Ajuste Individual
export interface IAdjustStockPayload {
	branch_id: number;
	quantity_change: number; // Positivo (Ingreso) o Negativo (Egreso)
	reason: string;
	notes?: string;
}

// 6. Ajuste Masivo (Batch)
export interface IBatchAdjustItem {
	product_id: number;
	quantity_change: number;
}
export interface IBatchAdjustStockPayload {
	branch_id: number;
	reason: string;
	notes?: string;
	items: IBatchAdjustItem[];
}

// 7. Asignaciones (Branch Allocations) return type
export interface IBranchAllocation {
	branch_id: number;
	branch_name: string;
	stock: number;
	is_active: boolean;
}

// 8. Series (Fetch) return type
export interface IProductSerie {
	id: number;
	product_id: number;
	branch_id: number;
	serial_number: string;
	status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'DEFECTIVE' | string;
	created_at: string;
}

// 9. Series (Añadir)
export interface ICreateSeriePayload {
	branch_id: number;
	serial_numbers: string[];
}

// 10. Series (Actualizar Estado)
export interface IUpdateSerieStatusPayload {
	status: string;
	notes?: string;
}

// 11. Movimientos (Historial)
export interface IStockMovement {
	id: number;
	product_id: number;
	branch_id: number;
	type: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA';
	quantity: number;
	previous_stock: number;
	new_stock: number;
	reason: string;
	created_by: number;
	created_at: string;
}

// 12. Movimientos (Filtros de Búsqueda)
export interface IFetchStockMovementsParams {
	branch_id?: number;
	start_date?: string;
	end_date?: string;
	type?: string;
	page?: number;
	per_page?: number;
}

// 13. Unassign Product
export interface IUnassignProductPayload {
	branch_ids: number[];
}

// Respuestas Genéricas API
export interface IStockStateResponse<T> {
	data: T;
	message?: string;
}
export interface IStockListResponse<T> {
	data: T[];
	meta?: Record<string, unknown>;
}
