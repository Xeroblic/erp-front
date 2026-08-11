import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	useContextScopedSelection,
	type OrganizationalContext,
} from '../useContextScopedSelection';

const subsidiary = (id: number): OrganizationalContext => ({ type: 'subsidiary', id });
const branch = (id: number): OrganizationalContext => ({ type: 'branch', id });

describe('useContextScopedSelection', () => {
	it('asocia la selección al contexto y la invalida sincrónicamente al cambiarlo', () => {
		const { result, rerender } = renderHook(
			({ context }) => useContextScopedSelection<number>(context),
			{ initialProps: { context: subsidiary(1) } },
		);

		act(() => result.current.select(2));
		expect(result.current).toMatchObject({
			selectedId: 2,
			context: subsidiary(1),
			isOpen: true,
		});

		rerender({ context: subsidiary(99) });
		expect(result.current).toMatchObject({ selectedId: null, context: null, isOpen: false });
	});

	it('no permite crear una selección sin contexto y permite una nueva selección explícita', () => {
		const { result, rerender } = renderHook(
			({ context }) => useContextScopedSelection<number>(context),
			{ initialProps: { context: null as OrganizationalContext | null } },
		);

		act(() => result.current.select(2));
		expect(result.current.selectedId).toBeNull();

		rerender({ context: subsidiary(99) });
		act(() => result.current.select(2));
		expect(result.current).toMatchObject({
			selectedId: 2,
			context: subsidiary(99),
			isOpen: true,
		});
	});

	it('distingue contextos de distinto tipo aunque sus IDs coincidan y notifica una vez', () => {
		const onInvalidate = vi.fn();
		const { result, rerender } = renderHook(
			({ context }) => useContextScopedSelection<number>(context, { onInvalidate }),
			{ initialProps: { context: subsidiary(2) } },
		);

		act(() => result.current.select(8));
		rerender({ context: branch(2) });

		expect(result.current.selectedId).toBeNull();
		expect(onInvalidate).toHaveBeenCalledOnce();
		expect(onInvalidate).toHaveBeenCalledWith({
			selectedId: 8,
			selectedContext: subsidiary(2),
			currentContext: branch(2),
		});
	});

	it('asocia un ID de ruta una sola vez y no lo reabre tras cambiar sólo el contexto', () => {
		const { result, rerender } = renderHook(
			({ context, sourceId }) => useContextScopedSelection<number>(context, { sourceId }),
			{ initialProps: { context: null as OrganizationalContext | null, sourceId: 4 } },
		);

		rerender({ context: subsidiary(1), sourceId: 4 });
		expect(result.current.selectedId).toBe(4);

		rerender({ context: subsidiary(99), sourceId: 4 });
		expect(result.current.selectedId).toBeNull();
	});
});
