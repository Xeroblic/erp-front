import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useRolesPermisosPagination from '../useRolesPermisosPagination';

describe('useRolesPermisosPagination', () => {
	it('consulta la página seleccionada y el tamaño solicitado al servidor', () => {
		const onFetch = vi.fn();
		const { result } = renderHook(() => useRolesPermisosPagination({ onFetch }));

		expect(onFetch).toHaveBeenLastCalledWith({ page: 1, per_page: 10 });

		act(() => result.current.pagination.onChange({ pageIndex: 1, pageSize: 10 }));
		expect(onFetch).toHaveBeenLastCalledWith({ page: 2, per_page: 10 });

		act(() => result.current.pagination.onChange({ pageIndex: 0, pageSize: 50 }));
		expect(onFetch).toHaveBeenLastCalledWith({ page: 1, per_page: 50 });
	});

	it('aplica la búsqueda server-side con debounce y vuelve a la primera página', async () => {
		vi.useFakeTimers();
		const onFetch = vi.fn();
		const { result } = renderHook(() => useRolesPermisosPagination({ onFetch }));

		act(() => result.current.pagination.onChange({ pageIndex: 2, pageSize: 10 }));
		act(() => result.current.search.onChange('  usuario 16  '));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(400);
		});

		expect(result.current.pagination.state.pageIndex).toBe(0);
		expect(onFetch).toHaveBeenLastCalledWith({
			page: 1,
			per_page: 10,
			search: 'usuario 16',
		});
		vi.useRealTimers();
	});

	it('refresca la consulta ya aplicada aunque el usuario tenga una búsqueda pendiente', async () => {
		vi.useFakeTimers();
		const onFetch = vi.fn();
		const { result } = renderHook(() => useRolesPermisosPagination({ onFetch }));

		act(() => result.current.search.onChange('usuario actual'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(400);
		});
		act(() => result.current.search.onChange('usuario pendiente'));
		act(() => result.current.refresh());

		expect(onFetch).toHaveBeenLastCalledWith({
			page: 1,
			per_page: 10,
			search: 'usuario actual',
		});
		vi.useRealTimers();
	});
});
