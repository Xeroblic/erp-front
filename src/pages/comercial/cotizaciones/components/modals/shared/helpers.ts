import { IQuoteItem } from '@/interface';
import { FormQuoteItem } from './types';
import { EMPTY_CUSTOM_ITEM, EMPTY_PRODUCT_ITEM, IVA_RATE } from './constants';

/**
 * Precio unitario bruto de un ítem, con el mismo criterio y redondeo que Pagos Diferidos:
 * si el ítem calcula IVA, el precio ingresado es neto y el bruto lo agrega; si no, el
 * precio ingresado ya es el bruto.
 */
export const calculateQuotationGrossUnitPrice = (
	enteredAmount: number | string | null | undefined,
	calculatesVat: boolean,
): number | null => {
	if (enteredAmount === '' || enteredAmount === null || enteredAmount === undefined) return null;
	const normalizedAmount = Number(enteredAmount);
	if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) return null;
	if (!calculatesVat) return normalizedAmount;
	return Math.round(normalizedAmount * (1 + IVA_RATE / 100) * 100) / 100;
};

export const formatCurrency = (value?: number | null) => {
	const amount = Number(value ?? 0);
	return new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP',
		maximumFractionDigits: 0,
	}).format(Number.isFinite(amount) ? amount : 0);
};

export const mapItemToFormItem = (item?: IQuoteItem): FormQuoteItem => {
	const isProduct = Boolean(item?.product_id);
	return {
		...(isProduct ? EMPTY_PRODUCT_ITEM : EMPTY_CUSTOM_ITEM),
		...item,
		product_id: item?.product_id ?? (isProduct ? 0 : null),
		customer_name:
			item?.customer_name ?? item?.name ?? item?.product?.name ?? (isProduct ? '' : ''),
		customer_sku: item?.customer_sku ?? item?.product?.sku ?? '',
		unit_price: Number(
			item?.unit_price ?? (item as any)?.unit_price_net ?? (item as any)?.unitPrice ?? 0,
		),
		includes_tax: Boolean(item?.metadata?.includes_tax),
		discount_amount: item?.discount_amount ?? null,
		description: item?.description ?? item?.product_detail ?? '',
		type: isProduct ? 'product' : 'custom',
	};
};

export const ensureFormItems = (items?: IQuoteItem[] | null): FormQuoteItem[] => {
	if (Array.isArray(items) && items.length > 0) {
		return items.map(mapItemToFormItem);
	}
	return [{ ...EMPTY_PRODUCT_ITEM }];
};

export const sanitizeItemsForSubmit = (items: FormQuoteItem[]) =>
	(items || [])
		.map((item) => {
			const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
			const isCustom = item.type === 'custom' || !item.product_id;
			const metadata = {
				...(item.metadata || {}),
				includes_tax: Boolean(item.includes_tax),
			};

			if (isCustom) {
				const name = (
					item.customer_name ||
					(item as any).name ||
					item.product?.name ||
					''
				).trim();
				if (!name) {
					return null;
				}
				const rawUnitPrice = Number(item.unit_price);
				const unitPrice =
					Number.isFinite(rawUnitPrice) && rawUnitPrice >= 0 ? rawUnitPrice : 0;
				const discount = Number(item.discount_amount || 0);
				return {
					product_id: null,
					customer_name: name,
					customer_sku: (item.customer_sku || '').trim() || undefined,
					description: item.description?.trim() || undefined,
					quantity,
					unit_price: unitPrice,
					metadata,
					discount_amount: discount > 0 ? discount : undefined,
				};
			}

			if (!item.product_id) {
				return null;
			}

			return {
				product_id: Number(item.product_id),
				quantity,
				description: item.description?.trim() || undefined,
				metadata,
			};
		})
		.filter(Boolean);
