import * as Yup from 'yup';
import type { TCostEntryBasis, TDecimalString } from '@/interface/procurement.interface';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';

/**
 * Validación de la **entrada** de costo del contrato de abastecimiento.
 *
 * El contrato acepta exactamente dos campos: `unit_cost` y `unit_cost_basis`.
 * El IVA, el neto derivado, el bruto derivado y el costo efectivo no se digitan
 * ni se envían, así que tampoco se validan acá — no existen en el formulario.
 */

/** Valores del formulario. `unit_cost` viaja como string decimal, no como number. */
export interface ICostEntryFormValues {
	unit_cost: string;
	unit_cost_basis: TCostEntryBasis | '';
}

/** Hasta dos decimales, la escala en la que el contrato transporta importes. */
const DECIMAL_TWO_PLACES = /^\d+([.,]\d{1,2})?$/;

/** Normaliza la coma decimal que se escribe en es-CL antes de validar/enviar. */
export const normalizeCostInput = (value: string): string => value.trim().replace(',', '.');

/**
 * Ausencia tal como llega al schema, que **no** es una sola forma:
 *
 * - Formik normaliza `''` a `undefined` antes de validar
 *   (`prepareDataForValidation`), así que un campo vacío llega como `undefined`.
 * - Un campo con sólo espacios llega tal cual, porque Formik no lo considera vacío.
 * - Quien valide el schema directamente (`validate`, `validateAt`, una prueba)
 *   sí manda `''`.
 *
 * Comparar contra una sola de esas formas es lo que hacía que el costo opcional
 * rechazara el estado que existe precisamente para permitirlo.
 */
const isAbsentValue = (value: unknown): boolean =>
	value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Convierte la ausencia en `undefined` para que `matches` y `oneOf` la omitan:
 * Yup 1.x salta esas validaciones ante `undefined`, pero no ante `''` ni ante
 * una cadena de espacios. Cubre el campo con espacios que Formik deja pasar y el
 * `''` de quien valide el schema sin Formik.
 */
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
 * Costo opcional, para la recepción sin documento y sin proveedor: puede quedar
 * desconocido, pero el contrato exige que monto y base viajen juntos —
 * «monto presente exige base y viceversa».
 */
export const optionalCostEntrySchema = Yup.object({
	unit_cost: amountRules
		.transform(absentToUndefined)
		.test(
			'monto-exige-base',
			'Indica el costo unitario o deja ambos campos vacíos.',
			function validate(value) {
				const { unit_cost_basis: basis } = this.parent as ICostEntryFormValues;

				// Ambos ausentes es válido: el costo desconocido es un estado del
				// contrato. Con base elegida, el monto pasa a ser obligatorio.
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

/**
 * Payload de escritura a partir de los valores del formulario. Devuelve `null`
 * cuando el costo quedó vacío (recepción sin proveedor conocido): el contrato
 * espera ausencia, no un `"0.00"` inventado.
 */
export const toCostEntryPayload = (
	values: ICostEntryFormValues,
): { unit_cost: TDecimalString; unit_cost_basis: TCostEntryBasis } | null => {
	const amount = normalizeCostInput(values.unit_cost);
	if (amount === '' || values.unit_cost_basis === '') return null;

	const cents = parseDecimalString(amount);
	if (cents === null) return null;

	// El contrato transporta importes con dos decimales: "5712" se envía como
	// "5712.00", no como lo tipeó el usuario.
	return { unit_cost: formatDecimalCents(cents), unit_cost_basis: values.unit_cost_basis };
};
