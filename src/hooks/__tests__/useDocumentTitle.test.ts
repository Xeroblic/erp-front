import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useDocumentTitle from '../useDocumentTitle';

describe('useDocumentTitle', () => {
	it('compone el título inicial como "title | name"', () => {
		const { result } = renderHook(() =>
			useDocumentTitle({ title: 'Zentria', name: 'Clientes' }),
		);
		expect((result.current as [string, unknown])[0]).toBe('Zentria | Clientes');
	});

	it('escribe el título en document.title', () => {
		renderHook(() => useDocumentTitle({ title: 'Zentria', name: 'Ventas' }));
		expect(document.title).toBe('Zentria | Ventas');
	});

	it('sincroniza el título cuando cambian sus props', () => {
		const { rerender } = renderHook(
			({ title, name }: { title: string; name: string }) => useDocumentTitle({ title, name }),
			{ initialProps: { title: 'Error', name: 'ERP' } },
		);

		expect(document.title).toBe('Error | ERP');
		rerender({ title: 'Cliente de prueba', name: 'ERP' });

		expect(document.title).toBe('Cliente de prueba | ERP');
	});

	it('actualiza document.title al llamar al setter', () => {
		const { result } = renderHook(() => useDocumentTitle({ title: 'Zentria', name: 'Inicio' }));

		act(() => {
			const [, setDocumentTitle] = result.current as [string, (v: string) => void];
			setDocumentTitle('Nuevo Título');
		});

		expect(document.title).toBe('Nuevo Título');
	});

	it('usa los valores por defecto del theme config cuando no se pasan props', () => {
		const { result } = renderHook(() => useDocumentTitle({}));
		expect((result.current as [string, unknown])[0]).toContain(' | ');
	});

	it('el setter reemplaza el estado retornado', () => {
		const { result } = renderHook(() => useDocumentTitle({ title: 'A', name: 'B' }));

		act(() => {
			(result.current as [string, (v: string) => void])[1]('C');
		});

		expect((result.current as [string, unknown])[0]).toBe('C');
	});
});
