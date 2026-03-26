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
	// Campos ampliados
	productsTotal: 0,
	totalChildrenProducts: 0,
	productsTotalAll: 0,
	withoutSerialTracking: 0,
	stockWithoutSerials: 0,
	serialsAvailable: 0,
	serialsOnHold: 0,
	serialsReserved: 0,
	serialsInQuotation: 0,
	serialsSold: 0,
	serialsTotalApproved: 0,
};
