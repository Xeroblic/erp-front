import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useDocumentTitle from '../useDocumentTitle';

describe('useDocumentTitle', () => {
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
});
