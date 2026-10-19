import { describe, expect, it } from 'vitest';
import { allOptionLabel, singleSelectValue, withoutAllOption } from '../selectFilter.util';

describe('selectFilter.util', () => {
	it('se queda con la opción elegida, la primera de una lista o nada', () => {
		const option = { value: 'draft', label: 'Borrador' };

		expect(singleSelectValue(option)).toBe(option);
		expect(singleSelectValue([option, { value: 'x', label: 'X' }])).toBe(option);
		expect(singleSelectValue([])).toBeNull();
		expect(singleSelectValue(null)).toBeNull();
	});

	it('deja fuera «Todos» de las opciones y lo usa como placeholder', () => {
		const options = [
			{ value: 'all' as const, label: 'Todas' },
			{ value: 'open', label: 'Abierta' },
		];

		expect(withoutAllOption(options)).toEqual([{ value: 'open', label: 'Abierta' }]);
		expect(allOptionLabel(options, 'Todos')).toBe('Todas');
		expect(allOptionLabel([{ value: 'open', label: 'Abierta' }], 'Todos')).toBe('Todos');
	});
});
