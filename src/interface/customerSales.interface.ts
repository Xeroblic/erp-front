export interface ICustomerSale {
    id: number;
    customer_code?: string | null;
    document_type: string;
    rut: string;
    billing_company?: string | null;
    contact_name?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    commune_id?: number | null;
    primary_contact_name?: string | null;
    primary_contact_email?: string | null;
    primary_contact_phone?: string | null;
    is_active: boolean;
}

export interface ICustomerSaleOverview {
    id: number;
    name: string;
    rut: string;
    contact: {
        name?: string;
        email?: string;
        phone?: string;
    } | null;
    loyalty: number;
    total_sales: number;
    is_active: boolean;
}

export interface ICustomerSalePayload extends Partial<ICustomerSale> {}
