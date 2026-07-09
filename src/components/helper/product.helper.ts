import type {
	CreateProductPayload,
	EquipmentGradeLiteral,
	IProduct,
	IProductCategorySummary,
	IProductChild,
	IProductGalleryImage,
	IProductImage,
	IProductParentSummary,
	IProductSoftHold,
	IProductSoftHolds,
	ProductFilters,
	ProductStatus,
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

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as UnknownRecord;
	}
	return undefined;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toNumber = (value: unknown, fallback = 0): number => {
	const num = toNullableNumber(value);
	return num ?? fallback;
};

const normalizeSoftHold = (value: unknown): IProductSoftHold | null => {
	const entry = asRecord(value);
	if (!entry) return null;
	return {
		sale_id: toNumber(entry.sale_id),
		sale_number: toNullableString(entry.sale_number),
		wc_order_number: toNullableString(entry.wc_order_number),
		channel: toNullableString(entry.channel),
		quantity: toNumber(entry.quantity),
		status: toNullableString(entry.status),
		sale_status: toNullableString(entry.sale_status),
	};
};

const normalizeSoftHolds = (value: unknown): IProductSoftHolds | null => {
	const record = asRecord(value);
	if (!record) return null;
	const holds = Array.isArray(record.holds)
		? record.holds
				.map(normalizeSoftHold)
				.filter((hold): hold is IProductSoftHold => hold !== null)
		: undefined;
	return {
		quantity: toNumber(record.quantity),
		pending_sales_count: toNumber(record.pending_sales_count),
		web: toNumber(record.web),
		manual: toNumber(record.manual),
		...(holds ? { holds } : {}),
	};
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
		const sourceRecord = asRecord(source);
		if (sourceRecord) {
			const data = sourceRecord.data;
			if (Array.isArray(data)) return data;
		}
		return [];
	};

	const rawRecord = asRecord(raw);
	const sources: unknown[] = [
		raw,
		rawRecord?.data,
		rawRecord?.children,
		rawRecord?.attributes,
	];

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
						grade: toNullableString(entry.grade) as EquipmentGradeLiteral | null,
						sku: String(entry.sku ?? ''),
						name: String(entry.name ?? ''),
						price: toNullableNumber(entry.price),
						offer_price: toNullableNumber(entry.offer_price),
						stock: toNullableNumber(entry.stock),
						stock_by_status:
							entry.stock_by_status && typeof entry.stock_by_status === 'object'
								? (entry.stock_by_status as Record<string, number>)
								: null,
						soft_holds: normalizeSoftHolds(entry.soft_holds),
						marketplace_external_ids:
							entry.marketplace_external_ids &&
								typeof entry.marketplace_external_ids === 'object'
								? (entry.marketplace_external_ids as Record<
									string,
									string | number
								>)
								: null,
						is_synced_with_woo: toBoolean(entry.is_synced_with_woo),
					};
				})
				.filter((child): child is IProductChild => child !== null);
		}
	}

	return [];
};

export const normalizeProduct = (raw: unknown): IProduct => {
	if (!raw || typeof raw !== 'object') {
		throw new Error('Invalid product payload');
	}

	const safe = raw as Record<string, unknown>;
	const price = toNullableNumber(safe.price) ?? 0;
	const branchRecord = asRecord(safe.branch);
	const brandRecord = asRecord(safe.brand);
	const parentRecord = asRecord(safe.parent);

	return {
		id: Number(safe.id ?? 0),
		parent_product_id: toNullableNumber(safe.parent_product_id),
		is_parent: toBoolean(safe.is_parent),
		is_child: toBoolean(safe.is_child),
		product_status: (safe.product_status ?? 'pending') as ProductStatus,
		branch_id: Number(safe.branch_id ?? branchRecord?.id ?? 0),
		origin_branch_id: toNullableNumber(safe.origin_branch_id),
		sku: String(safe.sku ?? ''),
		commercial_sku: (safe.commercial_sku ?? null) as string | null,
		barcode: (safe.barcode ?? null) as string | null,
		name: String(safe.name ?? ''),
		grade: toNullableString(safe.grade) as EquipmentGradeLiteral | null,
		brand_id: toNullableNumber(safe.brand_id),
		brand: brandRecord
			? {
				id: Number(brandRecord.id ?? 0),
				name: String(brandRecord.name ?? ''),
				slug: (brandRecord.slug ?? null) as string | null | undefined,
			}
			: null,
		product_type: (safe.product_type ?? safe.type ?? null) as string | null,
		condition_policy: (safe.condition_policy ?? safe.condition ?? null) as string | null,
		serial_tracking: toBoolean(safe.serial_tracking),
		uom: (safe.uom ?? safe.unit_of_measure ?? null) as string | null,
		warranty_months: toNullableNumber(safe.warranty_months),
		cost: toNullableNumber(safe.cost),
		price,
		price_override: toNullableNumber(safe.price_override),
		offer_price_override: toNullableNumber(safe.offer_price_override),
		global_price: toNullableNumber(safe.global_price),
		offer_price: toNullableNumber(safe.offer_price),
		stock: toNullableNumber(safe.stock),
		stock_by_status:
			safe.stock_by_status && typeof safe.stock_by_status === 'object'
				? (safe.stock_by_status as Record<string, number>)
				: null,
		soft_holds: normalizeSoftHolds(safe.soft_holds),
		attributes_json:
			typeof safe.attributes_json === 'object' && safe.attributes_json !== null
				? (safe.attributes_json as Record<string, unknown>)
				: null,
		marketplace_external_ids:
			typeof safe.marketplace_external_ids === 'object' &&
				safe.marketplace_external_ids !== null
				? (safe.marketplace_external_ids as Record<string, unknown>)
				: null,
		// Flags de sincronización Woo (autoritativos del backend). Se preservan para
		// el badge "publicado en Woo" y el filtro/búsqueda en el front.
		is_synced_with_woo: toBoolean(safe.is_synced_with_woo),
		woo_links_count: toNullableNumber(safe.woo_links_count) ?? undefined,
		synced_children_count: toNullableNumber(safe.synced_children_count) ?? undefined,
		is_active: toBoolean(safe.is_active, true),
		snippet_description: toNullableString(safe.snippet_description ?? safe.snippet ?? null),
		short_description: toNullableString(safe.short_description ?? null),
		long_description: toNullableString(safe.long_description ?? safe.description ?? null),
		categories: normalizeCategories(
			safe.categories ?? safe.category_ids ?? safe.product_categories ?? [],
		),
		children: normalizeChildren(
			safe.children ?? safe.children_data ?? safe.variants ?? safe.variations ?? null,
		),
		parent: parentRecord
			? ({
				id: Number(parentRecord.id ?? 0),
				sku: String(parentRecord.sku ?? ''),
				name: String(parentRecord.name ?? ''),
			} as IProductParentSummary)
			: undefined,
		available_serials: Array.isArray(safe.available_serials)
			? safe.available_serials.filter((v): v is string => typeof v === 'string')
			: null,
		created_at: String(safe.created_at ?? ''),
		updated_at: String(safe.updated_at ?? ''),
		// image/gallery normalization: try common keys used by backend
		image: (() => {
			const candidate = asRecord(safe.image ?? safe.media ?? safe.media_first ?? null);
			if (!candidate) return undefined;
			const pickedUrl = extractMediaUrl(candidate);
			if (!pickedUrl) return undefined;
			const abs = ensureAbsoluteUrl(pickedUrl);
			if (!abs) return undefined;
			const thumbRaw = (candidate.thumb ?? candidate.thumbnail_url ?? pickedUrl) as string;
			const thumbAbs = ensureAbsoluteUrl(thumbRaw) ?? abs;
			return {
				id: toNullableNumber(candidate.id),
				url: abs,
				thumb: thumbAbs,
				alt: toNullableString(candidate.alt),
			} as IProductImage;
		})(),
		gallery: (() => {
			const g = safe.gallery ?? safe.media ?? safe.images ?? null;
			if (!g) return undefined;
			const gRecord = asRecord(g);
			const arr = Array.isArray(g)
				? g
				: Array.isArray(gRecord?.data)
					? asArray(gRecord?.data)
					: Array.isArray(gRecord?.media)
						? asArray(gRecord?.media)
						: [];
			return arr
				.map((item): IProductGalleryImage | null => {
					const itemRecord = asRecord(item);
					const url = extractMediaUrl(item) ?? extractMediaUrl(g);
					if (!url) return null;
					const abs = ensureAbsoluteUrl(url);
					if (!abs) return null;
					const thumbRaw = (itemRecord?.thumb ?? itemRecord?.thumbnail_url ?? url) as string;
					const thumb = ensureAbsoluteUrl(thumbRaw) ?? abs;
					return {
						id: toNullableNumber(itemRecord?.id),
						url: abs,
						thumb,
						alt: toNullableString(itemRecord?.alt),
						sort: toNullableNumber(itemRecord?.sort),
					};
				})
				.filter((x): x is IProductGalleryImage => x !== null);
		})(),
	};
};

/**
 * Resumen de unidades apartadas (soft-holds) de un producto. Si el producto
 * tiene soft-holds propios (productos no serializados) los usa; si no, agrega
 * los de sus hijos (variantes por grado de un padre serializado). Devuelve
 * `null` cuando no hay nada apartado, para que la UI no muestre indicador.
 */
export const summarizeProductSoftHolds = (
	product: Pick<IProduct, 'soft_holds' | 'children'>,
): IProductSoftHolds | null => {
	const own = product.soft_holds;
	if (own && own.quantity > 0) return own;

	const children = product.children ?? [];
	const aggregated = children.reduce<IProductSoftHolds>(
		(acc, child) => {
			const holds = child.soft_holds;
			if (!holds) return acc;
			acc.quantity += holds.quantity;
			acc.pending_sales_count += holds.pending_sales_count;
			acc.web += holds.web;
			acc.manual += holds.manual;
			return acc;
		},
		{ quantity: 0, pending_sales_count: 0, web: 0, manual: 0 },
	);

	return aggregated.quantity > 0 ? aggregated : null;
};

/**
 * Disponible real neto de apartadas (soft-holds).
 *
 * - Serie: el `stock` que entrega el backend ya viene descontado de los holds
 *   (el accessor resta las reservas activas de los hijos por grado), así que se
 *   devuelve tal cual.
 * - Sin serie: el backend expone el `stock` físico (SSOT) sin descontar; el
 *   balance real solo baja al cerrar la venta. Por eso aquí restamos las
 *   unidades apartadas para obtener lo que realmente se puede ofrecer.
 */
export const getEffectiveAvailableStock = (
	serialTracking: boolean | undefined,
	stock: number | null | undefined,
	softHolds: IProductSoftHolds | null,
): number => {
	const base = stock ?? 0;
	if (serialTracking) return base;
	return Math.max(0, base - (softHolds?.quantity ?? 0));
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
