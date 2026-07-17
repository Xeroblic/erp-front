import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useColorIntensity from '../useColorIntensity';

describe('useColorIntensity', () => {
	it('usa el shade 500 (índice 5) por defecto cuando es undefined', () => {
		const { result } = renderHook(() => useColorIntensity(undefined));

		expect(result.current.textColor).toBe('text-white');
		expect(result.current.tintColorIntensity).toBe('400');
		expect(result.current.shadeColorIntensity).toBe('600');
	});

	it('devuelve text-black para shades claros (índice <= 4)', () => {
		const { result } = renderHook(() => useColorIntensity('300'));
		expect(result.current.textColor).toBe('text-black');
	});

	it('devuelve text-white para shades oscuros (índice > 4)', () => {
		const { result } = renderHook(() => useColorIntensity('700'));
		expect(result.current.textColor).toBe('text-white');
	});

	it('calcula el tint (un paso más claro) y el shade (un paso más oscuro)', () => {
		const { result } = renderHook(() => useColorIntensity('500'));
		expect(result.current.tintColorIntensity).toBe('400');
		expect(result.current.shadeColorIntensity).toBe('600');
	});

	it('devuelve undefined en el borde inferior (no hay tint más claro que 50)', () => {
		const { result } = renderHook(() => useColorIntensity('50'));
		expect(result.current.tintColorIntensity).toBeUndefined();
		expect(result.current.shadeColorIntensity).toBe('100');
	});
});
