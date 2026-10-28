import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listWarehousesForStockReceipts } from '@/services/procurement/stockReceipts.service';
import useStockReceiptWarehouses from '../useStockReceiptWarehouses';

/**
 * Las bodegas de la recepción salen de las sucursales del usuario **en la
 * filial activa**: el backend rechaza una bodega ajena a la filial de la ruta.
 */

vi.mock('@/services/procurement/stockReceipts.service', () => ({
	listWarehousesForStockReceipts: vi.fn(() =>
		Promise.resolve([{ id: 8, name: 'Central', is_active: true, branch_id: 4 }]),
	),
}));

const context = vi.hoisted(() => ({
	branch: {
		branchId: 4,
		visibleBranches: [] as { id: number; name: string }[],
	},
	// Sucursal 4 y 6 en la filial 2; la 9 en la filial 3; la 11 sin filial conocida.
	user: {
		branches: [
			{ id: 4, subsidiary_id: 2 },
			{ id: 6, subsidiary_id: 2 },
			{ id: 9, subsidiary_id: 3 },
			{ id: 11 },
		],
	},
}));
vi.mock('@/hooks/useCurrentBranch', () => ({ useCurrentBranch: () => context.branch }));
// Sucursales con acceso efectivo; vacío = sin restricción, como `useAuthorization`.
const access = vi.hoisted(() => ({ branchIds: [] as number[] }));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		canAccessBranch: (id: number) =>
			access.branchIds.length === 0 || access.branchIds.includes(id),
	}),
}));
vi.mock('@/store', () => ({
	useAppSelector: (selector: (state: unknown) => unknown) =>
		selector({ auth: { user: context.user } }),
}));

const listMock = vi.mocked(listWarehousesForStockReceipts);

afterEach(() => {
	listMock.mockClear();
	context.branch = { branchId: 4, visibleBranches: [] };
	access.branchIds = [];
});

describe('useStockReceiptWarehouses', () => {
	it('descarta las sucursales de otra filial antes de pedir sus bodegas', async () => {
		context.branch.visibleBranches = [
			{ id: 4, name: 'Central' },
			{ id: 9, name: 'Otra filial' },
			{ id: 6, name: 'Sur' },
			{ id: 11, name: 'Sin filial conocida' },
		];

		const { result } = renderHook(() => useStockReceiptWarehouses(2));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(listMock).toHaveBeenCalledWith([4, 6, 11], expect.any(AbortSignal));
		expect(result.current.warehouses).toEqual([
			{ id: 8, name: 'Central', is_active: true, branch_id: 4 },
		]);
	});

	it('descarta una sucursal sólo visible: el listado exige acceso a ella', async () => {
		context.branch.visibleBranches = [
			{ id: 4, name: 'Central' },
			{ id: 6, name: 'Sur' },
		];
		access.branchIds = [4];

		const { result } = renderHook(() => useStockReceiptWarehouses(2));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(listMock).toHaveBeenCalledWith([4], expect.any(AbortSignal));
		expect(result.current.warehouses).toHaveLength(1);
	});

	it('sin sucursales visibles usa la activa', async () => {
		const { result } = renderHook(() => useStockReceiptWarehouses(2));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(listMock).toHaveBeenCalledWith([4], expect.any(AbortSignal));
	});

	it('cerrado o sin filial no pide nada', () => {
		renderHook(() => useStockReceiptWarehouses(2, false));
		renderHook(() => useStockReceiptWarehouses(null));

		expect(listMock).not.toHaveBeenCalled();
	});

	it('un fallo se informa con el mensaje del servidor y se puede reintentar', async () => {
		listMock.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 403, data: { message: 'No tienes permiso para ver bodegas.' } },
		});

		const { result } = renderHook(() => useStockReceiptWarehouses(2));

		await waitFor(() =>
			expect(result.current.error).toBe('No tienes permiso para ver bodegas.'),
		);
		expect(result.current.warehouses).toEqual([]);

		act(() => result.current.retry());

		await waitFor(() => expect(result.current.warehouses).toHaveLength(1));
		expect(result.current.error).toBeNull();
	});
});
