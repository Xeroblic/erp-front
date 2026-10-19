import * as Yup from 'yup';
import type { TCostEntryBasis, TDecimalString } from '@/interface/procurement.interface';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';

/** `unit_cost` viaja como string decimal, no como number. */
export interface ICostEntryFormValues {
	unit_cost: string;
	unit_cost_basis: TCostEntryBasis | '';
}

const DECIMAL_TWO_PLACES = /^\d+([.,]\d{1,2})?$/;

export const normalizeCostInput = (value: string): string => value.trim().replace(',', '.');

/**
 * La ausencia llega de tres formas: `undefined` (Formik normaliza `''`), una
 * cadena de espacios (Formik no la considera vacía) y `''` (validación directa).
 */
const isAbsentValue = (value: unknown): boolean =>
	value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/** Yup 1.x salta `matches` y `oneOf` ante `undefined`, pero no ante `''` ni espacios. */
const absentToUndefined = (value: unknown): unknown => (isAbsentValue(value) ? undefined : value);

export const COST_ENTRY_BASIS_OPTIONS: { value: TCostEntryBasis; label: string }[] = [
	{ value: 'net', label: 'Neto' },
	{ value: 'gross', label: 'Bruto' },
];

const amountRules = Yup.string()
	.trim()
	.matches(DECIMAL_TWO_PLACES, 'Usa un monto con hasta dos decimales.')
	.test('positivo', 'El costo debe ser mayor que cero.', (value) => {
		if (value === undefined || value === '') return true;
		const cents = parseDecimalString(normalizeCostInput(value));

		return cents !== null && cents > 0n;
	});

const basisRules = Yup.string().oneOf(['net', 'gross'], 'Indica si el monto es neto o bruto.');

/** Costo obligatorio: documento de compra, y recepción con proveedor conocido. */
export const costEntrySchema = Yup.object({
	unit_cost: amountRules.required('Indica el costo unitario.'),
	unit_cost_basis: basisRules.required('Indica si el monto es neto o bruto.'),
});

/**
 * Recepción sin documento y sin proveedor: el costo puede quedar desconocido,
 * pero monto y base viajan juntos o no viajan.
 */
export const optionalCostEntrySchema = Yup.object({
	unit_cost: amountRules
		.transform(absentToUndefined)
		.test(
			'monto-exige-base',
			'Indica el costo unitario o deja ambos campos vacíos.',
			function validate(value) {
				const { unit_cost_basis: basis } = this.parent as ICostEntryFormValues;

				return isAbsentValue(basis) || !isAbsentValue(value);
			},
		),
	unit_cost_basis: basisRules
		.transform(absentToUndefined)
		.test('base-exige-monto', 'Indica si el monto es neto o bruto.', function validate(value) {
			const { unit_cost: amount } = this.parent as ICostEntryFormValues;

			return isAbsentValue(amount) || !isAbsentValue(value);
		}),
});

/** `null` con el costo vacío: el contrato espera ausencia, no un `"0.00"` inventado. */
export const toCostEntryPayload = (
	values: ICostEntryFormValues,
): { unit_cost: TDecimalString; unit_cost_basis: TCostEntryBasis } | null => {
	const amount = normalizeCostInput(values.unit_cost);
	if (amount === '' || values.unit_cost_basis === '') return null;

	const cents = parseDecimalString(amount);
	if (cents === null) return null;

	return { unit_cost: formatDecimalCents(cents), unit_cost_basis: values.unit_cost_basis };
};
