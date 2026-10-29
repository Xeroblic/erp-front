import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useRoundedSize from '../useRoundedSize';

describe('useRoundedSize', () => {
	it('devuelve el tamaño interior (un paso menos) y exterior (un paso más)', () => {
		const { result } = renderHook(() => useRoundedSize('rounded-lg'));
		expect(result.current.roundedInner).toBe('rounded-md');
		expect(result.current.roundedOuter).toBe('rounded-xl');
	});

	it('roundedCustom desplaza el índice por el valor indicado', () => {
		const { result } = renderHook(() => useRoundedSize('rounded-lg'));
		expect(result.current.roundedCustom(2)).toBe('rounded-2xl');
		expect(result.current.roundedCustom(-2)).toBe('rounded');
		expect(result.current.roundedCustom(0)).toBe('rounded-lg');
	});

	it('devuelve undefined en el borde inferior (rounded-none no tiene interior)', () => {
		const { result } = renderHook(() => useRoundedSize('rounded-none'));
		expect(result.current.roundedInner).toBeUndefined();
		expect(result.current.roundedOuter).toBe('rounded-sm');
	});

	it('devuelve undefined en el borde superior (rounded-full no tiene exterior)', () => {
		const { result } = renderHook(() => useRoundedSize('rounded-full'));
		expect(result.current.roundedOuter).toBeUndefined();
	});

	it('usa el valor del theme config cuando rounded es undefined', () => {
		const { result } = renderHook(() => useRoundedSize(undefined));
		// No debe reventar y expone las utilidades esperadas
		expect(typeof result.current.roundedCustom).toBe('function');
		expect(result.current).toHaveProperty('roundedInner');
		expect(result.current).toHaveProperty('roundedOuter');
	});
});
