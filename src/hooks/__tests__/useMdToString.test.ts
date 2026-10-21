import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useMdToString from '../useMdToString';

describe('useMdToString', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('carga el texto del archivo markdown', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve({ text: () => Promise.resolve('# Hola') })),
		);
		const { result } = renderHook(() => useMdToString('/file.md'));
		await waitFor(() => expect(result.current).toBe('# Hola'));
	});

	it('setea el error como contenido si el archivo viene vacío', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve({ text: () => Promise.resolve('') })),
		);
		const { result } = renderHook(() => useMdToString('/empty.md'));
		await waitFor(() => expect(String(result.current)).toContain('File not found'));
	});

	it('recarga cuando cambia la URL', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({ text: () => Promise.resolve('uno') })
			.mockResolvedValueOnce({ text: () => Promise.resolve('dos') });
		vi.stubGlobal('fetch', fetchMock);

		const { result, rerender } = renderHook(({ url }) => useMdToString(url), {
			initialProps: { url: '/a.md' },
		});
		await waitFor(() => expect(result.current).toBe('uno'));

		rerender({ url: '/b.md' });
		await waitFor(() => expect(result.current).toBe('dos'));
	});
});
