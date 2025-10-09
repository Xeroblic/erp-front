import type {
	CreateProductPayload,
	IProduct,
	IProductCategorySummary,
	ProductFilters,
	ProductsStateStats,
	UpdateProductPayload,
} from '@/interface/product.interface';
import { PRODUCT_EMPTY_STATS } from '@/constants/product.constant';

const toNullableNumber = (value: unknown): number | null => {
	if (value === null || value === undefined || value === '') return null;
	const num = Number(value);
	return Number.isFinite(num) ? num : null;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
	}
	return fallback;
};

const normalizeCategories = (raw: unknown): IProductCategorySummary[] => {
	if (!Array.isArray(raw)) return [];

	return raw
		.map((item) => {
			if (item && typeof item === 'object') {
				const source = item as Record<string, unknown>;
				const id = Number((source.id ?? source.category_id) ?? 0);
				if (!Number.isFinite(id)) return null;
				return {
					id,
					name: String(source.name ?? source.category_name ?? ''),
					slug: (source.slug ?? source.category_slug ?? null) as string | null | undefined,
				};
			}
			if (typeof item === 'number') {
				return { id: item, name: `Categoria ${item}`, slug: undefined };
			}
			return null;
		})
		.filter((category): category is IProductCategorySummary => Boolean(category));
};

export const normalizeProduct = (raw: any): IProduct => {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Invalid product payload');
	}

	const safe = raw as Record<string, unknown>;
	const price = toNullableNumber(safe.price) ?? 0;

	return {
		id: Number(safe.id ?? 0),
		branch_id: Number(safe.branch_id ?? safe.branch?.id ?? 0),
		sku: String(safe.sku ?? ''),
		commercial_sku: (safe.commercial_sku ?? null) as string | null,
		barcode: (safe.barcode ?? null) as string | null,
		name: String(safe.name ?? ''),
		brand_id: toNullableNumber(safe.brand_id),
		brand: safe.brand
			? {
					id: Number((safe.brand as any).id ?? 0),
					name: String((safe.brand as any).name ?? ''),
					slug: ((safe.brand as any).slug ?? null) as string | null | undefined,
			  }
			: null,
		product_type: (safe.product_type ?? safe.type ?? null) as string | null,
		condition_policy: (safe.condition_policy ?? safe.condition ?? null) as string | null,
		serial_tracking: toBoolean(safe.serial_tracking),
		uom: (safe.uom ?? safe.unit_of_measure ?? null) as string | null,
		warranty_months: toNullableNumber(safe.warranty_months),
		cost: toNullableNumber(safe.cost),
		price,
		offer_price: toNullableNumber(safe.offer_price),
		attributes_json:
			typeof safe.attributes_json === 'object' && safe.attributes_json !== null
				? (safe.attributes_json as Record<string, unknown>)
				: null,
		is_active: toBoolean(safe.is_active, true),
		categories: normalizeCategories(
			safe.categories ?? safe.category_ids ?? safe.product_categories ?? [],
		),
		created_at: String(safe.created_at ?? ''),
		updated_at: String(safe.updated_at ?? ''),
	};
};

export const computeProductStats = (items: IProduct[]): ProductsStateStats => {
	if (!items.length) return { ...PRODUCT_EMPTY_STATS };

	return items.reduce<ProductsStateStats>(
		(acc, product) => {
			acc.total += 1;
			if (product.is_active) acc.actives += 1;
			else acc.inactives += 1;
			if (product.offer_price && product.offer_price > 0) acc.with_offer += 1;
			if (product.serial_tracking) acc.serial_tracked += 1;
			return acc;
		},
		{ ...PRODUCT_EMPTY_STATS },
	);
};

export const buildProductPayload = (
	data: Partial<IProduct>,
	categoryIds: number[],
): CreateProductPayload => {
	if (!data.sku) {
		throw new Error('El SKU del producto es obligatorio');
	}
	if (!data.name) {
		throw new Error('El nombre del producto es obligatorio');
	}
	if (!data.price && data.price !== 0) {
		throw new Error('El precio del producto es obligatorio');
	}
	const brandId = Number(data.brand_id);
	if (!Number.isFinite(brandId) || brandId <= 0) {
		throw new Error('La marca del producto es obligatoria');
	}
	if (!categoryIds.length) {
		throw new Error('Debe seleccionar al menos una categoria');
	}

	const payload: CreateProductPayload = {
		sku: data.sku,
		name: data.name,
		price: Number(data.price),
		serial_tracking: Boolean(data.serial_tracking),
		is_active: Boolean(data.is_active ?? true),
		brand_id: brandId,
		category_ids: categoryIds,
	};

	if (data.commercial_sku !== undefined) payload.commercial_sku = data.commercial_sku;
	if (data.barcode !== undefined) payload.barcode = data.barcode;
	if (data.product_type !== undefined) payload.product_type = data.product_type;
	if (data.condition_policy !== undefined) payload.condition_policy = data.condition_policy;
	if (data.uom !== undefined) payload.uom = data.uom;
	if (data.warranty_months !== undefined)
		payload.warranty_months = toNullableNumber(data.warranty_months) ?? undefined;
	if (data.cost !== undefined) payload.cost = toNullableNumber(data.cost) ?? undefined;
	if (data.offer_price !== undefined)
		payload.offer_price = toNullableNumber(data.offer_price) ?? undefined;
	if (data.attributes_json !== undefined && data.attributes_json !== null)
		payload.attributes_json = data.attributes_json;

	return payload;
};

export const buildUpdatePayload = (
	productId: number,
	data: Partial<IProduct>,
	categoryIds?: number[],
): UpdateProductPayload => {
	const payload: UpdateProductPayload = { id: productId };

	if (data.sku !== undefined) payload.sku = data.sku;
	if (data.commercial_sku !== undefined) payload.commercial_sku = data.commercial_sku;
	if (data.barcode !== undefined) payload.barcode = data.barcode;
	if (data.name !== undefined) payload.name = data.name;
	if (data.brand_id !== undefined) payload.brand_id = Number(data.brand_id);
	if (data.product_type !== undefined) payload.product_type = data.product_type;
	if (data.condition_policy !== undefined) payload.condition_policy = data.condition_policy;
	if (data.serial_tracking !== undefined) payload.serial_tracking = Boolean(data.serial_tracking);
	if (data.uom !== undefined) payload.uom = data.uom;
	if (data.warranty_months !== undefined)
		payload.warranty_months = toNullableNumber(data.warranty_months);
	if (data.cost !== undefined) payload.cost = toNullableNumber(data.cost);
	if (data.price !== undefined) payload.price = Number(data.price);
	if (data.offer_price !== undefined)
		payload.offer_price = toNullableNumber(data.offer_price);
	if (data.stock !== undefined) payload.stock = toNullableNumber(data.stock);
	if (data.attributes_json !== undefined) payload.attributes_json = data.attributes_json;
	if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);
	if (data.product_status !== undefined) payload.product_status = data.product_status;
	if (data.snippet_description !== undefined) payload.snippet_description = data.snippet_description;
	if (data.short_description !== undefined) payload.short_description = data.short_description;
	if (data.long_description !== undefined) payload.long_description = data.long_description;
	if (categoryIds) payload.category_ids = categoryIds;

	return payload;
};

export const serializeFilters = (filters: ProductFilters): Record<string, unknown> => {
	const params: Record<string, unknown> = {};
	if (filters.search) params.q = filters.search;
	if (filters.brand_id) params.brand_id = filters.brand_id;
	if (filters.category_id) params.category_id = filters.category_id;
	if (typeof filters.is_active === 'boolean') params.is_active = filters.is_active;
	if (filters.product_type) params.product_type = filters.product_type;
	if (typeof filters.serial_tracking === 'boolean') params.serial_tracking = filters.serial_tracking;
	if (typeof filters.min_price === 'number') params.min_price = filters.min_price;
	if (typeof filters.max_price === 'number') params.max_price = filters.max_price;
	if (filters.order_by) params.order_by = filters.order_by;
	if (filters.order_dir) params.order_dir = filters.order_dir;
	return params;
};
