import { IQuote, IQuoteItem } from '@/interface';
import type { IProductSoftHolds } from '@/interface/product.interface';

export type FormQuoteItem = IQuoteItem & {
    type: 'product' | 'custom';
    includes_tax?: boolean;
};

export type FormQuotationValues = Omit<IQuote, 'id' | 'created_at' | 'updated_at' | 'items'> & {
    items: FormQuoteItem[];
    tax_percentage: number;
    discount_percentage: number;
    payment_surcharge_percentage: number;
    payment_surcharge_amount: number;
    customer_rut: string;
    customer_giro: string;
    customer_shipping_address: string;
    customer_billing_address: string;
    customer_contact_name: string;
    customer_email: string;
};

export interface SaleableProduct {
    id: number;
    sku: string;
    name: string;
    stock?: number;
    assigned_branches?: Array<{
        id: number;
        name: string;
        assigned_stock: number;
        unit_price: number | string;
        unit_price_gross: number | string;
        unit_price_net: number | string;
    }>;
    unit_price_gross: number;
    unit_price_net: number;
    /**
     * Unidades apartadas temporalmente por ventas en proceso. Opcional: sólo
     * presente si el backend lo expone en `/products/saleables`. El `stock` ya
     * viene descontado por estas retenciones.
     */
    soft_holds?: IProductSoftHolds | null;
}
