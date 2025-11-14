import type {
	IProduct,
	ProductStatus,
	ProductType,
} from '@/interface/product.interface';
import type { AttributesJson } from './attributes.types';

export type ProductOption = {
	value: string;
	label: string;
};

export interface ProductDetailForm {
	sku: string;
	name: string;
	brand_id: number | '';
	product_type: ProductType;
	serial_tracking: boolean;
	is_active: boolean;
	category_ids: number[];
	price: number | '';
	offer_price: number | '';
	cost: number | '';
	warranty_months: number | '';
	stock: number | '';
	snippet_description: string;
	short_description: string;
	long_description: string;
	product_status: ProductStatus;
	attributes_json: AttributesJson;
}

export type ProductAttributesForm = AttributesJson;

export type ProductValidationErrorMap = Record<string, string[]>;

export interface ProductPublishingContext {
	hasValidatedAttributes: boolean;
	attributesErrors?: string[];
}

export interface ProductDetailValidationResult {
	errors: ProductValidationErrorMap;
	isValid: boolean;
}

export interface BuildUpdatePayloadOptions {
	includeDescriptions?: boolean;
	includeAttributes?: boolean;
}

// Legacy forms (compatibility with current UI while refactor progresses)

export interface LegacyProductFormValues {
	sku: string;
	name: string;
	brand_id: string;
	branch_id?: number | null; // ID de la branch seleccionada (solo en crear)
	price: string;
	cost: string;
	offer_price: string;
	product_type: string;
	device_type?: string;
	condition_policy: string;
	uom: string;
	warranty_months: string;
	serial_tracking: boolean;
	is_active: boolean;
	categories: ProductOption[];
	attributes_json?: AttributesJson | null;
	// Campos adicionales opcionales
	commercial_sku?: string;
	barcode?: string;
}

export interface LegacyProductFormSubmitPayload {
	data: Partial<IProduct>;
	categoryIds: number[];
}

export type ProductFormValues = LegacyProductFormValues;
export type ProductFormSubmitPayload = LegacyProductFormSubmitPayload;
