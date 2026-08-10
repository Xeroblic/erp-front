import type { ICustomerSale } from '@/interface/customerSales.interface';

type CustomerAddress = Pick<
	ICustomerSale,
	| 'billing_address_1'
	| 'billing_address_2'
	| 'billing_city'
	| 'commune_id'
	| 'billing_state_code'
	| 'billing_postcode'
	| 'billing_country_code'
>;

const normalizedText = (value: string | null | undefined): string => value?.trim() ?? '';

export const hasMatchingShippingAddress = (customer: ICustomerSale): boolean => {
	const billingAddress: CustomerAddress = customer;

	return (
		Boolean(normalizedText(billingAddress.billing_address_1)) &&
		normalizedText(billingAddress.billing_address_1) ===
			normalizedText(customer.shipping_address_1) &&
		normalizedText(billingAddress.billing_address_2) ===
			normalizedText(customer.shipping_address_2) &&
		normalizedText(billingAddress.billing_city) === normalizedText(customer.shipping_city) &&
		billingAddress.commune_id === customer.shipping_commune_id &&
		normalizedText(billingAddress.billing_state_code) ===
			normalizedText(customer.shipping_state_code) &&
		normalizedText(billingAddress.billing_postcode) ===
			normalizedText(customer.shipping_postcode) &&
		normalizedText(billingAddress.billing_country_code) ===
			normalizedText(customer.shipping_country_code)
	);
};
