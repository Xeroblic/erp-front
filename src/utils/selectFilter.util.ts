import type { MultiValue, SingleValue } from 'react-select';
import type { TSelectOption } from '@/components/form/SelectReact';

/**
 * Helpers de los filtros con `SelectReact`, compartidos por los listados.
 *
 * Ningún filtro es `isMulti`, pero `SelectReact` tipa el `onChange` genérico:
 * `singleSelectValue` se queda con la única opción elegida o con `null`.
 */
const isMultiValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
): value is MultiValue<TSelectOption> => Array.isArray(value);

export const singleSelectValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
): TSelectOption | null => {
	if (value === null) return null;
	return isMultiValue(value) ? (value[0] ?? null) : value;
};

/**
 * «Todos»/«Todas» no es una opción más de la lista (se vería negra, como
 * cualquier selección real): es la ausencia de selección — `value=null`, texto
 * de `placeholder` (gris) e `isClearable` para volver a ese estado con la X.
 */
export const withoutAllOption = <TValue extends string>(
	options: { value: TValue | 'all'; label: string }[],
): TSelectOption[] =>
	options
		.filter((option): option is { value: TValue; label: string } => option.value !== 'all')
		.map((option) => ({ value: option.value, label: option.label }));

/** Texto del `placeholder`: la etiqueta de la opción `all`, o el respaldo. */
export const allOptionLabel = (
	options: { value: string; label: string }[],
	fallback: string,
): string => options.find((option) => option.value === 'all')?.label ?? fallback;
