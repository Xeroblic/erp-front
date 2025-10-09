import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import type {
	CreateProductPayload,
	IProduct,
	ProductStatus,
	ProductType,
	UpdateProductPayload,
} from '@/interface/product.interface';
import type {
	ProductFormValues,
	ProductFormSubmitPayload,
	ProductOption,
	ProductCreateForm,
	ProductDetailForm,
	ProductAttributesForm,
	BuildCreatePayloadOptions,
	BuildUpdatePayloadOptions,
} from '../types/products.types';
import { PRODUCT_DRAFT_CATEGORY_SLUG, PRODUCT_TYPE_LABELS } from '../constants/products.constant';

const toOption = (value: number | string, label: string): ProductOption => ({
	value: String(value),
	label,
});

export const createBrandOptions = (brands: IBrand[]): ProductOption[] =>
	brands.map((brand) => toOption(brand.id, brand.name));

export const createCategoryOptions = (categories: ICategory[]): ProductOption[] =>
	categories.map((category) => toOption(category.id, category.name));

export const buildInitialValues = (product?: IProduct | null): ProductFormValues => ({
	sku: product?.sku ?? '',
	name: product?.name ?? '',
	brand_id: product?.brand_id ? String(product.brand_id) : '',
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
});

export const buildSubmitPayload = (values: ProductFormValues): ProductFormSubmitPayload => {
	const categoryIds = values.categories.map((category) => Number(category.value));

	const data: Partial<IProduct> = {
		sku: values.sku.trim(),
		name: values.name.trim(),
		brand_id: Number(values.brand_id),
		price: Number(values.price),
		cost: values.cost ? Number(values.cost) : undefined,
		offer_price: values.offer_price ? Number(values.offer_price) : undefined,
		product_type: values.product_type || undefined,
		condition_policy: values.condition_policy || undefined,
		uom: values.uom || undefined,
		warranty_months: values.warranty_months ? Number(values.warranty_months) : undefined,
		serial_tracking: values.serial_tracking,
		is_active: values.is_active,
	};

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

export const mapProductToCreateForm = (product?: IProduct | null): ProductCreateForm => ({
	sku: product?.sku ?? '',
	name: product?.name ?? '',
	brand_id: product?.brand_id ?? '',
	price: typeof product?.price === 'number' ? product.price : '',
	category_ids: extractCategoryIds(product),
});

export const buildCreateProductPayload = (
	form: ProductCreateForm,
	options: BuildCreatePayloadOptions = {},
): CreateProductPayload => {
	const {
		defaultCategoryId = null,
		productStatus = 'pending',
		productType = 'general',
		isActive = false,
	} = options;

	const categoryIds = form.category_ids.length
		? form.category_ids
		: defaultCategoryId !== null
			? [defaultCategoryId]
			: [];

	return {
		sku: normaliseString(form.sku),
		name: normaliseString(form.name),
		brand_id: Number(form.brand_id),
		price: Number(form.price),
		product_status: productStatus as ProductStatus,
		product_type: productType as ProductType,
		serial_tracking: false,
		is_active: isActive,
		category_ids: categoryIds,
	};
};

export const mapProductToDetailForm = (product: IProduct): ProductDetailForm => ({
	sku: product.sku ?? '',
	name: product.name ?? '',
	brand_id: product.brand_id ?? '',
	product_type: (product.product_type as ProductType) ?? 'general',
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
});

const hasDifferentValue = <T>(current: T, previous: T) => {
	if (typeof current === 'object' && current !== null && previous !== null) {
		return JSON.stringify(current) !== JSON.stringify(previous);
	}
	return current !== previous;
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
	if ((form.brand_id ?? '') !== (product.brand_id ?? '')) payload.brand_id = Number(form.brand_id);
	if ((form.product_type ?? 'general') !== (product.product_type ?? 'general')) payload.product_type = form.product_type;
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

	if (includeAttributes && hasDifferentValue(form.attributes_json, product.attributes_json)) {
		payload.attributes_json = form.attributes_json ?? null;
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
