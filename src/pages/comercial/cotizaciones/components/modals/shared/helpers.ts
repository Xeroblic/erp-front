import { IQuoteItem } from '@/interface';
import { FormQuoteItem } from './types';
import { EMPTY_CUSTOM_ITEM, EMPTY_PRODUCT_ITEM } from './constants';

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

            if (isCustom) {
                const name = (
                    item.customer_name ||
                    (item as any).name ||
                    item.product?.name ||
                    ''
                ).trim();
                const unitPrice = Number(item.unit_price);
                if (!name || !Number.isFinite(unitPrice) || unitPrice <= 0) {
                    return null;
                }
                const discount = Number(item.discount_amount || 0);
                return {
                    product_id: null,
                    customer_name: name,
                    customer_sku: (item.customer_sku || '').trim() || undefined,
                    description: item.description?.trim() || undefined,
                    quantity,
                    unit_price: unitPrice,
                    discount_amount: discount > 0 ? discount : undefined,
                };
            }

            if (!item.product_id) {
                return null;
            }

            return {
                product_id: Number(item.product_id),
                quantity,
            };
        })
        .filter(Boolean);
