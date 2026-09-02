import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAutoSave from '../useAutoSave';

const { dispatch, updateItemDetails, toastError, toastWarning } = vi.hoisted(() => ({
	dispatch: vi.fn(),
	updateItemDetails: vi.fn(),
	toastError: vi.fn(),
	toastWarning: vi.fn(),
}));

vi.mock('@/store', () => ({ useAppDispatch: () => dispatch }));
vi.mock('@/store/slices/technicalReviews', () => ({ updateItemDetails }));
vi.mock('react-toastify', () => ({ toast: { error: toastError, warning: toastWarning } }));

describe('useAutoSave', () => {
	beforeEach(() => {
		dispatch.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({}) });
		updateItemDetails.mockReset().mockImplementation((payload: unknown) => payload);
		toastError.mockReset();
		toastWarning.mockReset();
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

	/**
	 * El primer PATCH falla, el reintento saneado quita el valor que el backend no acepta
	 * y ese sí guarda: el badge queda en «Guardado» sobre una revisión a la que le falta
	 * lo que el técnico eligió. Sin este aviso, la pérdida no deja ninguna traza.
	 */
	it('avisa qué campos quedaron sin registrar cuando el reintento los descarta', async () => {
		dispatch
			.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('422')) })
			.mockReturnValue({ unwrap: () => Promise.resolve({}) });

		let currentData: Record<string, unknown> = { brand: 'Inicial' };
		const { result } = renderHook(() =>
			useAutoSave({
				branchId: 7,
				itemId: 99,
				equipmentType: 'notebook',
				getFormData: () => currentData,
				idleTimeoutMs: 60_000,
				transformData: ({ hinge_condition: _dropped, ...rest }) => rest,
			}),
		);

		currentData = { brand: 'Actualizada', hinge_condition: 'missing_pieces' };
		let saved: boolean | undefined;
		await act(async () => {
			saved = await result.current.saveNow(true);
		});

		expect(saved).toBe(true);
		expect(toastWarning).toHaveBeenCalledTimes(1);
		// El rótulo del campo, no su nombre crudo.
		expect(toastWarning.mock.calls[0][0]).toContain('Bisagras');
		expect(toastError).not.toHaveBeenCalled();
	});

	it('no avisa nada cuando el reintento envía los mismos campos', async () => {
		dispatch
			.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('500')) })
			.mockReturnValue({ unwrap: () => Promise.resolve({}) });

		let currentData: Record<string, unknown> = { brand: 'Inicial' };
		const { result } = renderHook(() =>
			useAutoSave({
				branchId: 7,
				itemId: 99,
				equipmentType: 'notebook',
				getFormData: () => currentData,
				idleTimeoutMs: 60_000,
				transformData: (data) => data,
			}),
		);

		currentData = { brand: 'Actualizada', hinge_condition: 'cracked' };
		await act(async () => {
			await result.current.saveNow(true);
		});

		expect(toastWarning).not.toHaveBeenCalled();
	});
});
