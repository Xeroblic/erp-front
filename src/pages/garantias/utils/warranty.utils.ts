import dayjs from 'dayjs';
import type { Warranty, WarrantyProduct, WarrantyStatus } from '@/interface/warranties.interface';
import type { WarrantyEntity, WarrantyFormValues } from '../types';
import type { TColorIntensity } from '@/types/colorIntensities.type';

const ATTRIBUTE_KEYS = ['warranty_months', 'warranty', 'garantia', 'garantía'];
const DEFAULT_MONTHS = 6;

const parseMonths = (value: unknown): number | null => {
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolveMonths = (
	product?: WarrantyProduct | null,
): { months: number; isFallback: boolean } => {
	if (!product) return { months: DEFAULT_MONTHS, isFallback: true };

	const direct = parseMonths(product.warranty_months);
	if (direct) return { months: direct, isFallback: false };

	if (product.attributes_json) {
		for (const key of ATTRIBUTE_KEYS) {
			const candidate = parseMonths(product.attributes_json[key]);
			if (candidate) {
				return { months: candidate, isFallback: false };
			}
		}
	}

	if (product.parent) {
		return resolveMonths(product.parent);
	}

	return { months: DEFAULT_MONTHS, isFallback: true };
};

export const getWarrantyTypeLabel = (product?: WarrantyProduct | null): string => {
	const { months, isFallback } = resolveMonths(product);
	return isFallback ? `${months} meses (por defecto)` : `${months} meses`;
};

export const getWarrantyPeriod = (start?: string | null, end?: string | null): string => {
	if (!start && !end) return 'Sin período';
	const startLabel = start ? dayjs(start).format('YYYY-MM-DD') : 'Sin inicio';
	const endLabel = end ? dayjs(end).format('YYYY-MM-DD') : 'Sin término';
	return `${startLabel} – ${endLabel}`;
};

export const getDaysRemainingLabel = (
	endDate?: string | null,
): { label: string; isExpired: boolean; days?: number } => {
	if (!endDate) {
		return { label: 'Sin fecha', isExpired: false };
	}
	const end = dayjs(endDate).endOf('day');
	if (!end.isValid()) {
		return { label: 'Fecha inválida', isExpired: false };
	}
	const today = dayjs().endOf('day');
	if (today.isAfter(end)) {
		return { label: 'Expirada', isExpired: true, days: 0 };
	}
	const diff = end.startOf('day').diff(dayjs().startOf('day'), 'day');
	return { label: `${diff} días`, isExpired: false, days: diff };
};

export const warrantyStatusColorMap: Record<
	WarrantyStatus,
	{ color: 'green' | 'red' | 'zinc'; intensity: TColorIntensity }
> = {
	Activa: { color: 'green', intensity: '600' },
	Expirada: { color: 'red', intensity: '600' },
	Usada: { color: 'zinc', intensity: '500' },
	Anulada: { color: 'zinc', intensity: '900' },
};

export const formatProductDisplay = (product?: WarrantyProduct | null): string => {
	if (!product) return 'Sin producto';
	if (product.sku) {
		return `${product.name ?? 'Producto'} (${product.sku})`;
	}
	return product.name ?? 'Producto';
};

export const toWarrantyFormValues = (warranty?: WarrantyEntity | null): WarrantyFormValues => ({
	product_id: warranty?.product_id ?? null,
	start_date: warranty?.start_date ?? '',
	end_date: warranty?.end_date ?? '',
	sale_id: warranty?.sale_id ?? null,
	customer_id: warranty?.customer_id ?? null,
	status: (warranty?.status as WarrantyStatus) ?? '',
	notes: warranty?.notes ?? '',
	serial_number: warranty?.serial_number ?? '',
});

export const mapListResponse = (warranties: Warranty[] = []) =>
	warranties.map((warranty) => ({
		...warranty,
		warrantyTypeLabel: getWarrantyTypeLabel(warranty.product),
		daysRemaining: getDaysRemainingLabel(warranty.end_date),
		periodLabel: getWarrantyPeriod(warranty.start_date, warranty.end_date),
	}));
