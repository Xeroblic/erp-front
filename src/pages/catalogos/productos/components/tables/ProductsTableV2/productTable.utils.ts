import type { TColors } from '@/types/colors.type';
import type { IProduct, IProductChild } from '@/interface/product.interface';

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export const DEFAULT_TYPE_META = {
	label: 'Sin tipo',
	icon: 'HeroCube' as const,
	badgeColor: 'zinc' as const,
};

const GRADE_BADGE_COLORS: Record<string, TColors> = {
	A: 'emerald',
	B: 'blue',
	C: 'amber',
	M: 'purple',
};

export const formatPriceValue = (value?: number | string | null) => {
	if (value === null || value === undefined || value === '') return currencyFormatter.format(0);
	const parsed =
		typeof value === 'string'
			? Number.parseFloat(value) || 0
			: typeof value === 'number'
				? value
				: 0;
	return currencyFormatter.format(parsed);
};

export const getGradeBadgeColor = (grade?: string | null): TColors => {
	if (!grade) return 'zinc';
	const normalized = grade.toUpperCase();
	return GRADE_BADGE_COLORS[normalized] ?? 'zinc';
};

export const extractProductVariants = (product: IProduct): IProductChild[] => {
	if (!product) return [];
	const asRecord = (value: unknown): Record<string, unknown> | undefined => {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return undefined;
	};

	const productRecord = product as unknown as Record<string, unknown>;

	const tryResolve = (source?: unknown): IProductChild[] => {
		if (!source) return [];
		if (Array.isArray(source)) return source as IProductChild[];
		const record = asRecord(source);
		if (record && Array.isArray(record.data)) {
			return record.data as IProductChild[];
		}
		return [];
	};

	const direct = tryResolve(productRecord.children);
	if (direct.length) return direct;

	const fallbackSources = [
		productRecord.children_data,
		productRecord.variants,
		productRecord.variations,
	];

	for (const source of fallbackSources) {
		const resolved = tryResolve(source);
		if (resolved.length) return resolved;
	}

	return [];
};

const parseNumericValue = (value: number | string | null | undefined, fallback = 0) => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
};

export const composeVariantProduct = (parent: IProduct, variant: IProductChild): IProduct => ({
	...parent,
	...variant,
	id: variant.id,
	parent_product_id: parent.id,
	sku: variant.sku ?? parent.sku,
	name: variant.name ?? parent.name,
	price: parseNumericValue(variant.price, parent.price ?? 0),
	offer_price:
		variant.offer_price !== undefined && variant.offer_price !== null
			? parseNumericValue(variant.offer_price, parent.offer_price ?? parent.price ?? 0)
			: (parent.offer_price ?? null),
	stock: variant.stock ?? parent.stock ?? 0,
	children: [],
});
