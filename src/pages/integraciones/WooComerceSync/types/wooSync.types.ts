export type TWooJobType = 'pull' | 'push';
export type TWooJobStatus = 'pending' |  'running' | 'completed' | 'failed';
export type TSyncStatus = 'synced' | 'out_of_sync' | 'error';

export interface WooSyncJob {
	id: number;
	type: TWooJobType;
	status: TWooJobStatus;
	started_at: string;
	completed_at?: string;
	products_processed?: number;
	products_updated?: number;
	products_failed?: number;
	errors?: string[];
	log?: string[];
}

export interface ProductStock {
	id: number;
	sku: string;
	name: string;
	local_stock: number;
	woo_stock: number;
	sync_status: TSyncStatus;
	last_sync: string;
	woo_product_id?: number;
}

export interface WooConfig {
    site_url: string;
    consumer_key: string;
    consumer_secret: string;
    status: 'connected' | 'disconnected' | 'error';
}