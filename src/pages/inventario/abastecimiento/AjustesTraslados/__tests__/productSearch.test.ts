import { describe, expect, it } from 'vitest';
import {
	filterProductOption,
	productNoOptionsMessage,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/productSearch';

const option = {
	label: 'CBL-HDMI-2 · Cable HDMI 2 m',
	value: '58',
	data: { label: 'CBL-HDMI-2 · Cable HDMI 2 m', value: '58' },
};

describe('buscador de productos', () => {
	it('no lista productos sin texto de búsqueda', () => {
		expect(filterProductOption(option, '')).toBe(false);
		expect(filterProductOption(option, '   ')).toBe(false);
		expect(productNoOptionsMessage({ inputValue: '' })).toBe(
			'Escribe el SKU o el nombre para buscar',
		);
	});

	it('filtra por SKU o nombre al escribir', () => {
		expect(filterProductOption(option, 'cbl')).toBe(true);
		expect(filterProductOption(option, 'cable')).toBe(true);
		expect(filterProductOption(option, 'mouse')).toBe(false);
		expect(productNoOptionsMessage({ inputValue: 'mouse' })).toBe(
			'Sin productos que coincidan',
		);
	});
});
