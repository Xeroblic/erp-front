import type { CustomerSaleType } from '@/interface/customerSales.interface';

export const CUSTOMER_SALE_TYPE_OPTIONS: Array<{
	value: CustomerSaleType;
	label: string;
}> = [
	{ value: 'company', label: 'Empresa' },
	{ value: 'natural', label: 'Persona Natural' },
];

export const isCustomerSaleType = (value: unknown): value is CustomerSaleType =>
	value === 'company' || value === 'natural';

export const getCustomerSaleTypeLabel = (value: unknown): string =>
	CUSTOMER_SALE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? 'Sin información';
