import { act, renderHook } from '@testing-library/react';
import { toast } from 'react-toastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useStepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useStepWizard';

const KEYS = ['uno', 'dos', 'tres'] as const;
type TKey = (typeof KEYS)[number];

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useStepWizard', () => {
	it('avanza de a un paso sólo con el paso actual válido', async () => {
		const toastError = vi.spyOn(toast, 'error').mockReturnValue('id');
		const invalid = new Set<TKey>(['uno']);
		const { result } = renderHook(() =>
			useStepWizard(KEYS, (key) =>
				Promise.resolve(invalid.has(key) ? 'Falta algo.' : undefined),
			),
		);

		await act(() => result.current.next());
		expect(result.current.step).toBe(0);
		expect(toastError).toHaveBeenCalledWith('Falta algo.');

		invalid.clear();
		await act(() => result.current.next());
		expect(result.current.stepKey).toBe('dos');

		// Saltar dos pasos hacia adelante no está permitido; volver sí.
		await act(() => result.current.stepClick(2));
		expect(result.current.step).toBe(2);
		await act(() => result.current.stepClick(0));
		expect(result.current.step).toBe(0);
		await act(() => result.current.stepClick(2));
		expect(result.current.step).toBe(0);
	});

	it('al confirmar vuelve al primer paso inválido sin enviar', async () => {
		vi.spyOn(toast, 'error').mockReturnValue('id');
		const invalid = new Set<TKey>();
		const submit = vi.fn(() => Promise.resolve());
		const { result } = renderHook(() =>
			useStepWizard(KEYS, (key) =>
				Promise.resolve(invalid.has(key) ? 'Inválido.' : undefined),
			),
		);
		await act(() => result.current.next());
		await act(() => result.current.next());
		expect(result.current.isLastStep).toBe(true);

		invalid.add('dos');
		await act(() => result.current.finish(submit));
		expect(submit).not.toHaveBeenCalled();
		expect(result.current.stepKey).toBe('dos');

		invalid.clear();
		await act(() => result.current.finish(submit));
		expect(submit).toHaveBeenCalledTimes(1);
	});
});
