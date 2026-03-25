/**
 * stock.interface.ts
 * Dominio de Stock, Asignaciones y Series en el Zentria Standard
 */

// 1. Asignar Producto
export interface IAssignProductPayload {
	branch_ids: number[];
	is_active: boolean;
	initial_stock?: number;
}

// 2. Transferir Stock
export interface ITransferStockPayload {
	product_id: number;
	from_branch_id: number;
	to_branch_id: number;
	quantity: number;
	notes?: string;
}

// 3. Ajuste Individual
export interface IAdjustStockPayload {
	branch_id: number;
	quantity_change: number; // Positivo (Ingreso) o Negativo (Egreso)
	reason: string;
	notes?: string;
}

// 4. Ajuste Masivo (Batch)
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

// 5. Asignaciones (Branch Allocations) return type
export interface IBranchAllocation {
	branch_id: number;
	branch_name: string;
	stock: number;
	is_active: boolean;
}

// 6. Series (Fetch) return type
export interface IProductSerie {
	id: number;
	product_id: number;
	branch_id: number;
	serial_number: string;
	status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'DEFECTIVE' | string;
	created_at: string;
}

// 7. Series (Añadir)
export interface ICreateSeriePayload {
	branch_id: number;
	serial_numbers: string[];
}

// 8. Series (Actualizar Estado)
export interface IUpdateSerieStatusPayload {
	status: string;
	notes?: string;
}

// 9. Movimientos (Historial)
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

// 10. Movimientos (Filtros de Búsqueda)
export interface IFetchStockMovementsParams {
	branch_id?: number;
	start_date?: string;
	end_date?: string;
	type?: string;
	page?: number;
	per_page?: number;
}

// 11. Unassign Product
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
