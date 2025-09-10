import { IQuote, QuoteStatus } from '../../../../interface';

// Mock de cotizaciones con estructura correcta y campos CU025
export const mockQuotations: IQuote[] = [
    {
        id: 1,
        company_id: 1,
        quote_number: 'COT-2024-001',
        customer_id: 1,
        quote_date: '2024-01-15',
        valid_until: '2024-02-15',
        status: 'DRAFT' as QuoteStatus,
        subtotal: 2620000,
        discount_amount: 131000,
        discount_percentage: 5,
        tax_percentage: 19,
        total_amount: 2985200,
        notes: 'Cotización inicial para equipos de oficina',
        // Campos CU025
        payment_method: 'efectivo',
        purchase_order: 'OC-2024-001',
        payment_terms: 0,
        fixed_discount: 50000,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        created_by: 1,
        items_count: 2,
        days_until_expiry: 15,
        is_expired: false,
        can_convert: true,
    },
    {
        id: 2,
        company_id: 1,
        quote_number: 'COT-2024-002',
        customer_id: 2,
        quote_date: '2024-01-18',
        valid_until: '2024-02-18',
        status: 'ACCEPTED' as QuoteStatus, // Estado CU025
        subtotal: 5130000,
        discount_amount: 256500,
        discount_percentage: 5,
        tax_percentage: 19,
        total_amount: 5843130,
        notes: 'Cotización para proyecto de implementación de software',
        // Campos CU025
        payment_method: 'transferencia',
        purchase_order: 'OC-2024-002',
        payment_terms: 30,
        fixed_discount: 0,
        created_at: '2024-01-18T14:20:00Z',
        updated_at: '2024-01-19T09:15:00Z',
        created_by: 2,
        items_count: 1,
        days_until_expiry: 12,
        is_expired: false,
        can_convert: true,
    },
    {
        id: 3,
        company_id: 1,
        quote_number: 'COT-2024-003',
        customer_id: 3,
        quote_date: '2024-01-20',
        valid_until: '2024-03-20',
        status: 'APPROVED' as QuoteStatus,
        subtotal: 14820000,
        discount_amount: 741000,
        discount_percentage: 5,
        tax_percentage: 19,
        total_amount: 16834380,
        notes: 'Cotización para licitación pública de equipos',
        created_at: '2024-01-20T11:45:00Z',
        updated_at: '2024-01-22T16:30:00Z',
        created_by: 1,
        approved_by: 1,
        items_count: 1,
        days_until_expiry: 45,
        is_expired: false,
        can_convert: true,
    },
    {
        id: 4,
        company_id: 1,
        quote_number: 'COT-2024-004',
        customer_id: 4,
        quote_date: '2024-01-25',
        valid_until: '2024-02-25',
        status: 'EXPIRED' as QuoteStatus,
        subtotal: 800000,
        discount_amount: 0,
        discount_percentage: 0,
        tax_percentage: 19,
        total_amount: 952000,
        notes: 'Cotización para equipos de punto de venta',
        created_at: '2024-01-25T08:15:00Z',
        updated_at: '2024-01-25T08:15:00Z',
        created_by: 3,
        items_count: 1,
        days_until_expiry: -5,
        is_expired: true,
        can_convert: false,
    },
    {
        id: 5,
        company_id: 1,
        quote_number: 'COT-2024-005',
        customer_id: 5,
        quote_date: '2024-01-28',
        valid_until: '2024-04-28',
        status: 'REJECTED' as QuoteStatus,
        subtotal: 3040000,
        discount_amount: 152000,
        discount_percentage: 5,
        tax_percentage: 19,
        total_amount: 3453520,
        notes: 'Cotización para aulas digitales - Rechazada por presupuesto',
        created_at: '2024-01-28T13:00:00Z',
        updated_at: '2024-02-01T10:30:00Z',
        created_by: 2,
        items_count: 1,
        days_until_expiry: 60,
        is_expired: false,
        can_convert: false,
    },
    {
        id: 6,
        company_id: 1,
        quote_number: 'COT-2024-006',
        customer_id: 3,
        quote_date: '2024-02-01',
        valid_until: '2024-03-01',
        status: 'CONVERTED' as QuoteStatus,
        subtotal: 2400000,
        discount_amount: 120000,
        discount_percentage: 5,
        tax_percentage: 19,
        total_amount: 2717200,
        notes: 'Cotización para equipos adicionales - Convertida a venta',
        created_at: '2024-02-01T09:00:00Z',
        updated_at: '2024-02-03T14:30:00Z',
        created_by: 1,
        approved_by: 1,
        items_count: 2,
        days_until_expiry: 25,
        is_expired: false,
        can_convert: false,
    },
];

// Funciones de utilidad para el mock
export const getQuotationsByStatus = (status: QuoteStatus) => {
    return mockQuotations.filter(q => q.status === status);
};

export const getQuotationById = (id: number) => {
    return mockQuotations.find(q => q.id === id);
};

export const getQuotationStats = () => {
    const total = mockQuotations.length;
    const byStatus = mockQuotations.reduce((acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
    }, {} as Record<QuoteStatus, number>);

    const totalAmount = mockQuotations.reduce((sum, q) => sum + q.total_amount, 0);
    const avgAmount = totalAmount / total;

    return {
        total,
        byStatus,
        totalAmount,
        avgAmount,
    };
};

export default mockQuotations;
