import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IPurchaseDocumentLine } from '@/interface/procurement.interface';
import InitialStockAllocationsCard from '../InitialStockAllocationsCard';

/**
 * La lista sólo trae las sucursales del usuario: su total no es el del
 * documento (`related_counts` cuenta toda la filial).
 */

vi.mock('@/hooks/useDir', () => ({
	default: () => ({ dir: 'ltr', isLTR: true, isRTL: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ visibleBranches: [{ id: 3, name: 'Casa Matriz' }] }),
}));
vi.mock('@/pages/inventario/Inventario/components/parts/InventarioPagination', () => ({
	default: () => null,
}));

const listAllocations = vi.hoisted(() => vi.fn());
vi.mock('@/services/procurement/inventoryStock.service', () => ({
	listInitialStockAllocationsForPurchaseDocument: listAllocations,
}));

const LINES = [
	{ product: { id: 31 }, name_snapshot: 'Mouse inalámbrico' },
] as unknown as IPurchaseDocumentLine[];

afterEach(() => {
	listAllocations.mockReset();
});

describe('InitialStockAllocationsCard', () => {
	it('lista los respaldos de las sucursales del usuario sin presentarlos como el total del documento', async () => {
		listAllocations.mockResolvedValue({
			data: [
				{
					id: 77,
					product_id: 31,
					branch_id: 3,
					warehouse_id: null,
					quantity: 10,
					reason: 'Respaldo parcial del conteo inicial',
					created_at: '2026-10-13T15:20:00-03:00',
				},
			],
			links: { first: null, last: null, prev: null, next: null },
			meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
		});

		render(<InitialStockAllocationsCard subsidiaryId={2} documentId={24} lines={LINES} />);

		expect(await screen.findByText('Mouse inalámbrico')).toBeInTheDocument();
		expect(screen.getByText('Casa Matriz')).toBeInTheDocument();
		expect(screen.getByText('Sin ubicación')).toBeInTheDocument();
		expect(screen.getByText('1 asignación en tus sucursales')).toBeInTheDocument();
		expect(
			screen.getByText(/el conteo de Relacionados incluye las de toda la filial/),
		).toBeInTheDocument();
		expect(listAllocations).toHaveBeenCalledWith(2, 24, { page: 1, per_page: 10 });
	});

	it('sin respaldos en sus sucursales lo dice sin afirmar que el documento no tiene', async () => {
		listAllocations.mockResolvedValue({
			data: [],
			links: { first: null, last: null, prev: null, next: null },
			meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
		});

		render(<InitialStockAllocationsCard subsidiaryId={2} documentId={24} lines={LINES} />);

		expect(
			await screen.findByText('Este documento no respalda stock inicial en tus sucursales.'),
		).toBeInTheDocument();
	});
});
