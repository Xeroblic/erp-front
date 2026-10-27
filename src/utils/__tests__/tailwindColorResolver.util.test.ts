import colors from 'tailwindcss/colors';
import { describe, expect, it } from 'vitest';
import { resolveTailwindColorAlpha } from '@/utils/tailwindColorResolver.util';

describe('resolveTailwindColorAlpha', () => {
	it('agrega el alfa a los colores oklch de la paleta de Tailwind 4', () => {
		expect(colors.blue['500']).toMatch(/^oklch\(/);
		expect(resolveTailwindColorAlpha('blue', '500', 0.1)).toBe(
			`${colors.blue['500'].slice(0, -1)} / 0.1)`,
		);
	});

	it('convierte los hex a rgba', () => {
		expect(resolveTailwindColorAlpha('white', undefined, 0.5)).toBe('rgba(255, 255, 255, 0.5)');
	});
});
