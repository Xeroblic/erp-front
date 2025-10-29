import type { ProductInventorySummary, ProductsStateStats } from '@/interface/product.interface';

export const PRODUCT_EMPTY_STATS: ProductsStateStats = {
	total: 0,
	actives: 0,
	inactives: 0,
	with_offer: 0,
	serial_tracked: 0,
};

export const PRODUCT_EMPTY_INVENTORY_SUMMARY: ProductInventorySummary = {
	branchId: null,
	criticalThreshold: 5,
	stockTotal: 0,
	stockAverage: 0,
	lowStockCount: 0,
	outOfStock: 0,
	withStockAvailable: 0,
	syncedProducts: 0,
	serialTrackingCount: 0,
};
