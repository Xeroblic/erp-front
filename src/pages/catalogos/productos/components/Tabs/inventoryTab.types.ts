import type {
	IProduct,
	IProductSoftHolds,
	ProductInventoryCriticalProduct,
	ProductInventorySummary,
	ProductListMeta,
} from '@/interface/product.interface';

export interface InventoryTabProps {
	products: IProduct[];
	meta: ProductListMeta;
	entityParam?: 'branches' | 'subsidiaries';
	entityId?: number | null;
	summary?: ProductInventorySummary;
	criticalProducts?: ProductInventoryCriticalProduct[];
	loading?: boolean;
	branchName?: string;
	lowStockThreshold?: number;
	onShowLowStock?: () => void;
	onViewProduct?: (product: IProduct) => void;
	subsidiaryId?: number | null;
	selectedBranchId?: number | null;
	onRefresh?: () => void | Promise<void>;
}

export type CriticalItemRow = {
	product?: IProduct | null;
	id: number;
	name: string;
	sku: string;
	brand: string;
	stock: number;
	status: 'low' | 'out';
	updatedAt?: string | null;
};

export type VisibleInventoryRow = {
	id: number;
	name: string;
	sku: string;
	brand: string;
	grade: string;
	stock: number;
	available: number;
	reserved: number;
	onHold: number;
	inQuotation: number;
	sold: number;
	softHolds: IProductSoftHolds | null;
	/** Disponible real neto de apartadas (para no-serie = stock físico − holds). */
	effectiveAvailable: number;
	isParent: boolean;
	childrenCount: number;
	updatedAt?: string | null;
	product?: IProduct | null;
};

export interface SerialSegment {
	key: string;
	label: string;
	value: number;
	color: string;
	bgClass: string;
	textClass: string;
	iconBgClass: string;
	icon: string;
}
