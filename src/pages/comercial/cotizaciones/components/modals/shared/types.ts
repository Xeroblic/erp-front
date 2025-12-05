import { IQuote, IQuoteItem } from '@/interface';

export type FormQuoteItem = IQuoteItem & { type: 'product' | 'custom' };

export type FormQuotationValues = Omit<IQuote, 'id' | 'created_at' | 'updated_at' | 'items'> & {
    items: FormQuoteItem[];
    tax_percentage: number;
    discount_percentage: number;
};

export interface SaleableProduct {
    id: number;
    sku: string;
    name: string;
    stock: number;
    unit_price_gross: number;
    unit_price_net: number;
}
