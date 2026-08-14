import * as Yup from 'yup';
import type { IDeferredPaymentCreditProfile } from '@/interface/deferredPayments.interface';

export type CreditProfileStatusFilter = 'all' | 'active' | 'suspended';

export interface CreditProfileFormValues {
	payment_term_days: string;
	credit_limit: string;
	collection_email: string;
	notes: string;
}

export const CreditProfileSchema = Yup.object({
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
			'El cupo de crédito debe tener hasta 13 dígitos enteros y 2 decimales',
			(value) => !value || /^\d{1,13}(?:\.\d{1,2})?$/.test(value),
		),
	collection_email: Yup.string()
		.trim()
		.email('Ingresa un correo de cobranza válido')
		.max(255, 'El correo de cobranza debe tener como máximo 255 caracteres'),
	notes: Yup.string().trim(),
});

export const toCreditProfileFormValues = (
	profile: IDeferredPaymentCreditProfile,
): CreditProfileFormValues => ({
	payment_term_days: String(profile.payment_term_days),
	credit_limit: profile.credit_limit?.trim() ?? '',
	collection_email: profile.collection_email ?? '',
	notes: profile.notes ?? '',
});
