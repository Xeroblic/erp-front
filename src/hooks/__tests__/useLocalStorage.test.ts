import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useLocalStorage from '../useLocalStorage';

describe('useLocalStorage', () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.restoreAllMocks();
	});

	it('devuelve el valor por defecto y lo persiste cuando la clave no existe', () => {
		const { result } = renderHook(() => useLocalStorage('k1', 'default'));
		const [value] = result.current as [string, unknown];

		expect(value).toBe('default');
		expect(window.localStorage.getItem('k1')).toBe(JSON.stringify('default'));
	});

	it('lee y parsea un valor ya existente en localStorage', () => {
		window.localStorage.setItem('k2', JSON.stringify('persisted'));
		const { result } = renderHook(() => useLocalStorage('k2', 'default'));

		expect((result.current as [string, unknown])[0]).toBe('persisted');
	});

	it('actualiza el estado y persiste con setValue', async () => {
		const { result } = renderHook(() => useLocalStorage('k3', 'default'));

		await act(async () => {
			const [, setValue] = result.current as [
				string,
				(v: string | null) => Promise<unknown>,
			];
			await setValue('nuevo');
		});

		expect((result.current as [string, unknown])[0]).toBe('nuevo');
		expect(window.localStorage.getItem('k3')).toBe(JSON.stringify('nuevo'));
	});

	it('setValue resuelve la promesa a true al guardar', async () => {
		const { result } = renderHook(() => useLocalStorage('k4', 'default'));
		const [, setValue] = result.current as [
			string,
			(v: string | null) => Promise<unknown>,
		];

		await act(async () => {
			await expect(setValue('x')).resolves.toBe(true);
		});
	});

	it('cae al valor por defecto si getItem lanza una excepción', () => {
		vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
			throw new Error('boom');
		});

		const { result } = renderHook(() => useLocalStorage('k5', 'fallback'));
		expect((result.current as [string, unknown])[0]).toBe('fallback');
	});
});
