import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAutoSave from '../useAutoSave';

const { dispatch, updateItemDetails } = vi.hoisted(() => ({
	dispatch: vi.fn(),
	updateItemDetails: vi.fn(),
}));

vi.mock('@/store', () => ({ useAppDispatch: () => dispatch }));
vi.mock('@/store/slices/technicalReviews', () => ({ updateItemDetails }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

describe('useAutoSave', () => {
	beforeEach(() => {
		dispatch.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({}) });
		updateItemDetails.mockReset().mockImplementation((payload: unknown) => payload);
	});

	it('guarda con el contexto de subsidiaria cuando no existe sucursal activa', async () => {
		let currentData: Record<string, unknown> = { brand: 'Inicial' };
		const { result } = renderHook(() =>
			useAutoSave({
				branchId: null,
				subsidiaryId: 42,
				itemId: 99,
				getFormData: () => currentData,
				idleTimeoutMs: 60_000,
			}),
		);

		currentData = { brand: 'Actualizada' };
		let saved: boolean | undefined;
		await act(async () => {
			saved = await result.current.saveNow(true);
		});

		expect(saved).toBe(true);
		expect(updateItemDetails).toHaveBeenCalledWith({
			branchId: null,
			subsidiaryId: 42,
			itemId: 99,
			data: { brand: 'Actualizada', extra_attributes: {} },
			equipmentType: undefined,
		});
	});
});
