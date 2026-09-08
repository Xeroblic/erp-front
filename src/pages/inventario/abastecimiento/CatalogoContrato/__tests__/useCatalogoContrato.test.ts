import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderHookWithStore } from '@/test-utils/renderWithStore';
import useCatalogoContrato from '../hooks/useCatalogoContrato';

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 4,
		subsidiaryId: 2,
		hasValidBranch: true,
		visibleBranches: [],
	}),
}));

describe('useCatalogoContrato', () => {
	const renderCatalog = () => renderHookWithStore(() => useCatalogoContrato());

	it('cubre los estados de costo que la card exige mostrar', () => {
		const { result } = renderCatalog();
		const ids = result.current.costSamples.map((sample) => sample.id);

		// Criterios de aceptación de ZF-106: costo neto, costo bruto, costo
		// desconocido y agregado mixto tienen que estar representados.
		expect(ids).toEqual(
			expect.arrayContaining([
				'net-entered',
				'gross-entered',
				'unknown',
				'mixed',
				'weighted-net',
			]),
		);
	});

	it('muestra producto serializado y no serializado', () => {
		const { result } = renderCatalog();
		const products = result.current.productSamples.map((sample) => sample.product);

		expect(products.some((product) => product.serial_tracking)).toBe(true);
		expect(products.some((product) => !product.serial_tracking)).toBe(true);
	});

	it('incluye la ubicación nula además de la bodega con nombre', () => {
		const { result } = renderCatalog();
		const warehouses = result.current.warehouseSamples.map((sample) => sample.warehouse);

		expect(warehouses).toContainEqual(null);
		expect(warehouses.some((warehouse) => warehouse !== null)).toBe(true);
	});

	it('representa allowed_actions vacío y con acciones, en distintos recursos', () => {
		const { result } = renderCatalog();
		const samples = result.current.actionSamples;

		expect(samples.some((sample) => sample.allowedActions.length === 0)).toBe(true);
		expect(new Set(samples.map((sample) => sample.resource)).size).toBeGreaterThan(1);
	});

	it('toma el contexto de sucursal del hook de branch, sin hardcodear ids', () => {
		const { result } = renderCatalog();

		expect(result.current.branchId).toBe(4);
		expect(result.current.subsidiaryId).toBe(2);
	});

	it('registra la última acción solicitada', () => {
		const { result } = renderCatalog();

		expect(result.current.lastAction).toBeNull();

		act(() => {
			result.current.handleAction('confirm');
		});

		expect(result.current.lastAction).toBe('confirm');
	});
});
