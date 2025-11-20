import type { ICustomer, QuoteCustomerSummary } from '@/interface';

type QuoteCustomer = QuoteCustomerSummary | ICustomer;

const isFullCustomer = (customer: QuoteCustomer): customer is ICustomer =>
	'company_id' in customer && 'customer_type' in customer;

const isSummaryCustomer = (customer: QuoteCustomer): customer is QuoteCustomerSummary =>
	'name' in customer;

export const getCustomerDisplayName = (customer: QuoteCustomer | null | undefined): string => {
	if (!customer) {
		return 'Cliente no disponible';
	}

	if (isFullCustomer(customer)) {
		if (customer.company_name && customer.company_name.trim().length) {
			return customer.company_name;
		}

		const personName = [customer.first_name, customer.last_name]
			.filter((value): value is string => Boolean(value && value.trim().length))
			.join(' ')
			.trim();

		if (personName.length) {
			return personName;
		}

		if (customer.display_name && customer.display_name.trim().length) {
			return customer.display_name;
		}
	}

	if (isSummaryCustomer(customer)) {
		if (customer.name && customer.name.trim().length) {
			return customer.name;
		}
		if (customer.billing_company && customer.billing_company.trim().length) {
			return customer.billing_company;
		}
		if (customer.contact_name && customer.contact_name.trim().length) {
			return customer.contact_name;
		}
	}

	return 'Cliente no disponible';
};
