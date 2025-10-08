import type {
	IProduct,
	IProductBrandSummary,
	IProductCategorySummary,
	ProductType,
	ProductConditionPolicy,
} from '@/interface/product.interface';

export type { IProduct, IProductBrandSummary, IProductCategorySummary, ProductType };
export type ProductCondition = ProductConditionPolicy;

export interface ProductOption {
	value: string;
	label: string;
}

export interface ProductFormValues {
	sku: string;
	name: string;
	brand_id: string;
	price: string;
	cost: string;
	offer_price: string;
	product_type: string;
	condition_policy: string;
	uom: string;
	warranty_months: string;
	serial_tracking: boolean;
	is_active: boolean;
	categories: ProductOption[];
}

export interface ProductFormSubmitPayload {
	data: Partial<IProduct>;
	categoryIds: number[];
}

