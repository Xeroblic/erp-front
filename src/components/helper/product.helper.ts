import type {
	CreateProductPayload,
	IProduct,
	IProductCategorySummary,
	IProductChild,
	ProductFilters,
	ProductsStateStats,
	UpdateProductPayload,
} from '@/interface/product.interface';
import { PRODUCT_EMPTY_STATS } from '@/constants/product.constant';
import { extractMediaUrl } from '@/utils/apiHelpers';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';

const toNullableNumber = (value: unknown): number | null => {
	if (value === null || value === undefined || value === '') return null;
	const num = Number(value);
	return Number.isFinite(num) ? num : null;
};

const toNullableString = (value: unknown): string | null => {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return null;
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
				const id = Number(source.id ?? source.category_id ?? 0);
				if (!Number.isFinite(id)) return null;
				return {
					id,
					name: String(source.name ?? source.category_name ?? ''),
					slug: (source.slug ?? source.category_slug ?? null) as string | null,
				};
			}
			if (typeof item === 'number') {
				return { id: item, name: `Categoria ${item}`, slug: undefined };
			}
			return null;
		})
		.filter((category): category is IProductCategorySummary => category !== null);
};

const normalizeChildren = (raw: unknown): IProductChild[] => {
	const toChildArray = (source: unknown): unknown[] => {
		if (Array.isArray(source)) return source;
		if (source && typeof source === 'object') {
			const { data } = source as any;
			if (Array.isArray(data)) return data;
		}
		return [];
	};

	const rawAny = raw as any;
	const sources: unknown[] = [raw, rawAny?.data, rawAny?.children, rawAny?.attributes];

	for (const source of sources) {
		if (!source) continue;
		const arr = toChildArray(source);
		if (arr.length) {
			return arr
				.map((item): IProductChild | null => {
					if (!item || typeof item !== 'object') return null;
					const entry = item as Record<string, unknown>;
					const id = Number(entry.id ?? 0);
					if (!Number.isFinite(id) || id <= 0) return null;

					return {
						id,
						grade: toNullableString(entry.grade),
						sku: String(entry.sku ?? ''),
						name: String(entry.name ?? ''),
						price: toNullableNumber(entry.price),
						offer_price: toNullableNumber(entry.offer_price),
						stock: toNullableNumber(entry.stock),
						stock_by_status:
							entry.stock_by_status && typeof entry.stock_by_status === 'object'
								? (entry.stock_by_status as Record<string, number>)
								: null,
						marketplace_external_ids:
							entry.marketplace_external_ids &&
								typeof entry.marketplace_external_ids === 'object'
								? (entry.marketplace_external_ids as Record<
									string,
									string | number
								>)
								: null,
					};
				})
				.filter((child): child is IProductChild => child !== null);
		}
	}

	return [];
};

export const normalizeProduct = (raw: any): IProduct => {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Invalid product payload');
	}

	const safe = raw as Record<string, unknown>;
	const price = toNullableNumber(safe.price) ?? 0;

	return {
		id: Number(safe.id ?? 0),
		parent_product_id: toNullableNumber(safe.parent_product_id),
		product_status: (safe.product_status ?? 'pending') as any,
		branch_id: Number(safe.branch_id ?? (safe.branch as any)?.id ?? 0),
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
		stock: toNullableNumber(safe.stock),
		attributes_json:
			typeof safe.attributes_json === 'object' && safe.attributes_json !== null
				? (safe.attributes_json as Record<string, unknown>)
				: null,
		is_active: toBoolean(safe.is_active, true),
		snippet_description: toNullableString(
			safe.snippet_description ?? (safe as any).snippet ?? null,
		),
		short_description: toNullableString(safe.short_description ?? null),
		long_description: toNullableString(
			safe.long_description ?? (safe as any).description ?? null,
		),
		categories: normalizeCategories(
			safe.categories ?? safe.category_ids ?? safe.product_categories ?? [],
		),
		children: normalizeChildren(
			safe.children ?? safe.children_data ?? safe.variants ?? safe.variations ?? null,
		),
		created_at: String(safe.created_at ?? ''),
		updated_at: String(safe.updated_at ?? ''),
		// image/gallery normalization: try common keys used by backend
		image: (() => {
			const candidate = (safe.image ?? safe.media ?? safe.media_first ?? null) as any;
			if (!candidate) return undefined;
			const pickedUrl = extractMediaUrl(candidate);
			if (!pickedUrl) return undefined;
			const abs = ensureAbsoluteUrl(pickedUrl);
			if (!abs) return undefined;
			const thumbRaw = candidate.thumb ?? candidate.thumbnail_url ?? pickedUrl;
			const thumbAbs = ensureAbsoluteUrl(thumbRaw) ?? abs;
			return { id: candidate.id, url: abs, thumb: thumbAbs, alt: candidate.alt ?? null };
		})(),
		gallery: (() => {
			const g = (safe.gallery ?? safe.media ?? safe.images ?? null) as any;
			if (!g) return undefined;
			const arr = Array.isArray(g)
				? g
				: Array.isArray(g.data)
					? g.data
					: Array.isArray(g.media)
						? g.media
						: [];
			return arr
				.map((item: any) => {
					const url = extractMediaUrl(item) ?? extractMediaUrl(g);
					if (!url) return null;
					const abs = ensureAbsoluteUrl(url);
					if (!abs) return null;
					const thumbRaw = item.thumb ?? item.thumbnail_url ?? url;
					const thumb = ensureAbsoluteUrl(thumbRaw) ?? abs;
					return {
						id: item.id,
						url: abs,
						thumb,
						alt: item.alt ?? null,
						sort: item.sort ?? null,
					};
				})
				.filter((x: any) => x !== null) as unknown as any[];
		})(),
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
	// Validación de campos obligatorios según backend (StoreProductRequest)
	if (!data.sku?.trim()) {
		throw new Error('El SKU del producto es obligatorio');
	}
	if (!data.name?.trim()) {
		throw new Error('El nombre del producto es obligatorio');
	}
	if (!data.brand_id) {
		throw new Error('La marca del producto es obligatoria');
	}
	if (data.price === undefined || data.price === null) {
		throw new Error('El precio del producto es obligatorio');
	}
	if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
		throw new Error('Debe seleccionar al menos una categoría');
	}

	const payload: CreateProductPayload = {
		// Campos obligatorios
		sku: data.sku.trim(),
		name: data.name.trim(),
		brand_id: Number(data.brand_id),
		price: Number(data.price),
		serial_tracking: Boolean(data.serial_tracking ?? false),
		is_active: Boolean(data.is_active ?? true),
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
	if (data.offer_price !== undefined) payload.offer_price = toNullableNumber(data.offer_price);
	// Stock: enviar como número válido, no como null
	if (data.stock !== undefined && typeof data.stock === 'number') {
		payload.stock = data.stock;
	}
	if (data.attributes_json !== undefined) payload.attributes_json = data.attributes_json;
	if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);
	if (data.product_status !== undefined) payload.product_status = data.product_status;
	if (data.snippet_description !== undefined)
		payload.snippet_description = data.snippet_description;
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
	// if (filters.is_active) params.is_active = filters.is_active;
	if (filters.product_type) params.product_type = filters.product_type;
	if (typeof filters.serial_tracking === 'boolean')
		params.serial_tracking = filters.serial_tracking;
	if (filters.min_price) params.min_price = filters.min_price;
	if (filters.max_price) params.max_price = filters.max_price;
	if (filters.order_by) params.order_by = filters.order_by;
	if (filters.order_dir) params.order_dir = filters.order_dir;

	if (filters.attributes && typeof filters.attributes === 'object') {
		Object.entries(filters.attributes).forEach(([key, value]) => {
			params[`attr[${key}]`] = value;
		});
	}
	if (filters.attributes_like && typeof filters.attributes_like === 'object') {
		Object.entries(filters.attributes_like).forEach(([key, value]) => {
			params[`attr_like[${key}]`] = value;
		});
	}
	if (filters.attributes_any_like) {
		params.attr_any_like = filters.attributes_any_like;
	}
	return params;
};
