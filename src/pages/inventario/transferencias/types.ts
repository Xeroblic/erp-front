export interface TransferFormState {
	from_warehouse_id: string;
	to_warehouse_id: string;
	responsible_id: string;
	notes: string;
}

export interface TransferItem {
	product_id: number;
	product_name: string;
	product_sku: string;
	quantity: number;
	available_stock: number;
}

export interface TransferResult {
	id: string;
	total_items: number;
	created_at: string;
}
