import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import type {
	CreateProductPayload,
	IProduct,
	IProductBrandSummary,
	ProductStatus,
	ProductType,
	UpdateProductPayload,
} from '@/interface/product.interface';
import type {
	ProductFormValues,
	ProductFormSubmitPayload,
	ProductOption,
	ProductDetailForm,
	ProductAttributesForm,
	BuildUpdatePayloadOptions,
} from '../types/products.types';
import { PRODUCT_DRAFT_CATEGORY_SLUG, PRODUCT_TYPE_LABELS } from '../constants/products.constant';
import {
	areAttributeRecordsEqual,
	prepareAttributesForSubmit,
} from './dynamicAttributes.utils';

const toOption = (value: number | string, label: string): ProductOption => ({
	value: String(value),
	label,
});

type BrandOptionSource = Pick<IBrand, 'id' | 'name'> | IProductBrandSummary;

export const createBrandOptions = (brands: BrandOptionSource[]): ProductOption[] =>
	brands.map((brand) => toOption(brand.id, brand.name));

export const createCategoryOptions = (categories: ICategory[]): ProductOption[] =>
	categories.map((category) => toOption(category.id, category.name));

export const buildInitialValues = (product?: IProduct | null): ProductFormValues => ({
	sku: product?.sku ?? '',
	name: product?.name ?? '',
	brand_id: product?.brand_id ? String(product.brand_id) : '',
	branch_id: null, // Siempre null en valores iniciales, solo se usa en crear
	price: product?.price ? String(product.price) : '',
	cost: product?.cost ? String(product.cost) : '',
	offer_price: product?.offer_price ? String(product.offer_price) : '',
	product_type: product?.product_type ?? '',
	condition_policy: product?.condition_policy ?? '',
	uom: product?.uom ?? '',
	warranty_months: product?.warranty_months ? String(product.warranty_months) : '',
	serial_tracking: product?.serial_tracking ?? false,
	is_active: product?.is_active ?? true,
	categories: product?.categories?.map((category) => toOption(category.id, category.name)) ?? [],
	commercial_sku: product?.commercial_sku ?? '',
	barcode: product?.barcode ?? '',
});

export const buildSubmitPayload = (values: ProductFormValues): ProductFormSubmitPayload => {
	const categoryIds = values.categories.map((category) => Number(category.value));

	// Solo incluir campos que tienen valor (no enviar undefined/null para no sobrescribir)
	const data: Partial<IProduct> = {};

	// Campos siempre presentes
	if (values.sku?.trim()) data.sku = values.sku.trim();
	if (values.name?.trim()) data.name = values.name.trim();

	// Brand ID
	if (values.brand_id) data.brand_id = Number(values.brand_id);

	// Números: solo enviar si tienen valor
	if (values.price !== '' && values.price !== undefined && values.price !== null) {
		data.price = Number(values.price);
	}
	if (values.cost !== '' && values.cost !== undefined && values.cost !== null) {
		data.cost = Number(values.cost);
	}
	if (values.offer_price !== '' && values.offer_price !== undefined && values.offer_price !== null) {
		data.offer_price = Number(values.offer_price);
	}
	if (values.warranty_months !== '' && values.warranty_months !== undefined && values.warranty_months !== null) {
		data.warranty_months = Number(values.warranty_months);
	}

	// Strings opcionales
	if (values.product_type) data.product_type = values.product_type;
	if (values.condition_policy) data.condition_policy = values.condition_policy;
	if (values.uom) data.uom = values.uom;
	if (values.commercial_sku?.trim()) data.commercial_sku = values.commercial_sku.trim();
	if (values.barcode?.trim()) data.barcode = values.barcode.trim();

	// Booleanos: siempre enviar
	data.serial_tracking = Boolean(values.serial_tracking);
	data.is_active = Boolean(values.is_active);

	return { data, categoryIds };
};

const parseNumberOrNull = (value: number | string | '' | null | undefined): number | undefined => {
	if (value === '' || value === null || value === undefined) return undefined;
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const normaliseString = (value: string | null | undefined): string => (value ?? '').trim();

const extractCategoryIds = (product: IProduct | null | undefined): number[] =>
	product?.categories?.map((category) => category.id) ?? [];

const isEqualArray = (current: number[], previous: number[]): boolean => {
	if (current.length !== previous.length) return false;
	return current.every((value) => previous.includes(value));
};

export const mapProductToDetailForm = (product: IProduct): ProductDetailForm => {
	const brandId = product.brand?.id ?? product.brand_id ?? '';

	return {
		sku: product.sku ?? '',
		name: product.name ?? '',
		brand_id: brandId,
		product_type: (product.product_type as ProductType) ?? 'desktop_pc',
		serial_tracking: Boolean(product.serial_tracking),
		is_active: Boolean(product.is_active),
		category_ids: extractCategoryIds(product),
		price: typeof product.price === 'number' ? product.price : '',
		offer_price: parseNumberOrNull(product.offer_price) ?? '',
		cost: parseNumberOrNull(product.cost) ?? '',
		warranty_months: parseNumberOrNull(product.warranty_months) ?? '',
		stock: typeof product.stock === 'number' ? product.stock : '',
		snippet_description: product.snippet_description ?? '',
		short_description: product.short_description ?? '',
		long_description: product.long_description ?? '',
		product_status: (product.product_status as ProductStatus) ?? 'pending',
		attributes_json: (product.attributes_json as ProductAttributesForm) ?? null,
	};
};

export const buildDetailUpdatePayload = (
	product: IProduct,
	form: ProductDetailForm,
	options: BuildUpdatePayloadOptions = {},
): Partial<UpdateProductPayload> => {
	const payload: Partial<UpdateProductPayload> = {};
	const { includeDescriptions = true, includeAttributes = true } = options;

	if (normaliseString(form.sku) !== product.sku) payload.sku = normaliseString(form.sku);
	if (normaliseString(form.name) !== product.name) payload.name = normaliseString(form.name);

	const currentBrandId = product.brand?.id ?? product.brand_id ?? '';
	if (Number(form.brand_id || 0) !== Number(currentBrandId || 0)) {
		payload.brand_id = Number(form.brand_id);
	}

	if ((form.product_type ?? 'desktop_pc') !== (product.product_type ?? 'desktop_pc')) payload.product_type = form.product_type;
	if (form.serial_tracking !== product.serial_tracking) payload.serial_tracking = form.serial_tracking;
	if (form.is_active !== product.is_active) payload.is_active = form.is_active;

	const nextPrice = parseNumberOrNull(form.price);
	if (parseNumberOrNull(product.price) !== nextPrice && typeof nextPrice === 'number') {
		payload.price = nextPrice;
	}

	const nextOffer = parseNumberOrNull(form.offer_price);
	if (parseNumberOrNull(product.offer_price) !== nextOffer) {
		payload.offer_price = nextOffer ?? null;
	}
	const nextCost = parseNumberOrNull(form.cost);
	if (parseNumberOrNull(product.cost) !== nextCost) {
		payload.cost = nextCost ?? null;
	}
	const nextWarranty = parseNumberOrNull(form.warranty_months);
	if (parseNumberOrNull(product.warranty_months) !== nextWarranty) {
		payload.warranty_months = nextWarranty ?? null;
	}
	const nextStock = parseNumberOrNull(form.stock);
	if (parseNumberOrNull(product.stock) !== nextStock) {
		payload.stock = nextStock ?? null;
	}

	if (includeDescriptions) {
		if (normaliseString(form.snippet_description) !== normaliseString(product.snippet_description ?? '')) {
			payload.snippet_description = normaliseString(form.snippet_description);
		}
		if (normaliseString(form.short_description) !== normaliseString(product.short_description ?? '')) {
			payload.short_description = normaliseString(form.short_description);
		}
		if (normaliseString(form.long_description) !== normaliseString(product.long_description ?? '')) {
			payload.long_description = normaliseString(form.long_description);
		}
	}

	if (!isEqualArray(form.category_ids, extractCategoryIds(product))) {
		payload.category_ids = form.category_ids;
	}

	if (form.product_status !== product.product_status) {
		payload.product_status = form.product_status;
	}

	if (includeAttributes) {
		const nextAttributes = prepareAttributesForSubmit(form.attributes_json, true);
		const previousAttributes = prepareAttributesForSubmit(product.attributes_json, false);

		if (!areAttributeRecordsEqual(nextAttributes, previousAttributes)) {
			payload.attributes_json = nextAttributes;
		}
	}

	return payload;
};

export const deriveDefaultCategoryId = (categories: ICategory[], draftSlug = PRODUCT_DRAFT_CATEGORY_SLUG): number | null => {
	const draftCategory = categories.find((category) => category.slug === draftSlug || category.name.toLowerCase() === draftSlug);
	return draftCategory ? draftCategory.id : null;
};

export const collectValidationErrors = (error: unknown): string[] => {
	if (!error || typeof error !== 'object') return ['Ha ocurrido un error inesperado.'];
	if ('inner' in error && Array.isArray((error as any).inner)) {
		const inner = (error as any).inner as Array<{ errors: string[] }>;
		return inner.flatMap((item) => item.errors).filter(Boolean);
	}
	if ('errors' in error && Array.isArray((error as any).errors)) {
		return ((error as any).errors as string[]).filter(Boolean);
	}
	if ('message' in error && typeof (error as any).message === 'string') {
		return [(error as any).message as string];
	}
	return ['Ha ocurrido un error inesperado.'];
};
