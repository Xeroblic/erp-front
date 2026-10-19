import { describe, expect, it } from 'vitest';
import { formatPermissionName, resolvePermissionLabel } from '../formatters';

describe('rótulo de receive-critical-stock-alerts', () => {
	it('se rotula «Recibir avisos de stock crítico» aunque falte display_name', () => {
		expect(formatPermissionName('receive-critical-stock-alerts')).toBe(
			'Recibir avisos de stock crítico',
		);
		expect(resolvePermissionLabel({ name: 'receive-critical-stock-alerts' })).toBe(
			'Recibir avisos de stock crítico',
		);
	});

	it('el display_name del backend sigue mandando', () => {
		expect(
			resolvePermissionLabel({
				name: 'receive-critical-stock-alerts',
				display_name: 'Recibir avisos de stock crítico (filial)',
			}),
		).toBe('Recibir avisos de stock crítico (filial)');
	});
});
