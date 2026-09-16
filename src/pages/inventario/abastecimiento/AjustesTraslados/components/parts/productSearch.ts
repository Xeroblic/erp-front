import { createFilter } from 'react-select';
import type { TSelectOption } from '@/components/form/SelectReact';

const defaultFilter = createFilter<TSelectOption>();

/**
 * El buscador de productos no lista el catálogo completo al abrirse: exige al
 * menos un carácter y luego filtra por la etiqueta (SKU y nombre).
 */
export const filterProductOption: typeof defaultFilter = (option, inputValue) =>
	inputValue.trim() !== '' && defaultFilter(option, inputValue);

export const productNoOptionsMessage = ({ inputValue }: { inputValue: string }): string =>
	inputValue.trim() === ''
		? 'Escribe el SKU o el nombre para buscar'
		: 'Sin productos que coincidan';
