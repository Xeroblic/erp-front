import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useMdToString from '../useMdToString';

describe('useMdToString', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('inicia con contenido vacío', () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise(() => {})),
		);
		const { result } = renderHook(() => useMdToString('/file.md'));
		expect(result.current).toBe('');
	});

	it('carga el texto del archivo markdown', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve({ text: () => Promise.resolve('# Hola') })),
		);
		const { result } = renderHook(() => useMdToString('/file.md'));
		await waitFor(() => expect(result.current).toBe('# Hola'));
	});

	it('llama a fetch con la URL indicada', async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve({ text: () => Promise.resolve('contenido') }),
		);
		vi.stubGlobal('fetch', fetchMock);
		renderHook(() => useMdToString('/docs/readme.md'));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/docs/readme.md'));
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
