import colors from 'tailwindcss/colors';
import { describe, expect, it } from 'vitest';
import oklchToHex from '@/utils/oklchToHex.util';

describe('conversión de oklch a hexadecimal', () => {
	it('reproduce los hex que publica Tailwind 4 para su paleta', () => {
		expect(oklchToHex(colors.blue['500'])).toBe('#2b7fff');
		expect(oklchToHex(colors.red['500'])).toBe('#fb2c36');
		expect(oklchToHex(colors.zinc['500'])).toBe('#71717b');
	});

	it('acepta el tono `none` de los grises acromáticos', () => {
		expect(oklchToHex('oklch(100% 0 none)')).toBe('#ffffff');
		expect(oklchToHex('oklch(0% 0 none)')).toBe('#000000');
	});

	it('devuelve sin cambios los colores que no vienen en oklch', () => {
		expect(oklchToHex('#fff')).toBe('#fff');
		expect(oklchToHex('rgb(0, 0, 0)')).toBe('rgb(0, 0, 0)');
		expect(oklchToHex('currentColor')).toBe('currentColor');
	});
});
