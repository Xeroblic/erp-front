import * as Yup from 'yup';
import type { IDeferredPaymentCreditProfileListItem } from '@/interface/deferredPayments.interface';

export type CreditProfileStatusFilter = 'all' | 'active' | 'suspended';

export interface CreditProfileFormValues {
	is_active: boolean;
	payment_term_days: string;
	credit_limit: string;
	notes: string;
}

export const CreditProfileSchema = Yup.object({
	is_active: Yup.boolean().required(),
	payment_term_days: Yup.string()
		.trim()
		.required('Ingresa el plazo de pago')
		.test(
			'payment-term-days',
			'El plazo debe ser un número entero entre 1 y 32767 días',
			(value) => {
				if (!value) return false;
				const days = Number(value);
				return /^\d+$/.test(value) && Number.isInteger(days) && days >= 1 && days <= 32767;
			},
		),
	credit_limit: Yup.string()
		.trim()
		.test(
			'credit-limit',
			'El cupo de crédito debe contener solo números enteros de hasta 13 dígitos',
			(value) => !value || /^\d{1,13}$/.test(value),
		),
	notes: Yup.string().trim(),
});

export const toCreditProfileFormValues = (
	profile: IDeferredPaymentCreditProfileListItem,
): CreditProfileFormValues => ({
	is_active: profile.is_active,
	payment_term_days: String(profile.payment_term_days),
	credit_limit: profile.credit_limit ?? '',
	notes: profile.notes ?? '',
});
