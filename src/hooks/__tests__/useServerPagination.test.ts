import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useServerPagination } from '../useServerPagination';

interface Filters extends Record<string, unknown> {
	status: string;
	q: string;
}

const initialFilters: Filters = { status: '', q: '' };

describe('useServerPagination', () => {
	it('hace fetch automático al montar con page 1 (1-indexed) y per_page inicial', () => {
		const onFetchData = vi.fn();
		renderHook(() =>
			useServerPagination<Filters>({ initialPageSize: 10, initialFilters, onFetchData }),
		);

		expect(onFetchData).toHaveBeenCalledWith({
			page: 1,
			per_page: 10,
			filters: initialFilters,
		});
	});

	it('no hace fetch al montar cuando autoFetch=false', () => {
		const onFetchData = vi.fn();
		renderHook(() =>
			useServerPagination<Filters>({
				initialFilters,
				onFetchData,
				autoFetch: false,
			}),
		);
		expect(onFetchData).not.toHaveBeenCalled();
	});

	it('setFilter actualiza el filtro y resetea a página 1 disparando fetch', () => {
		const onFetchData = vi.fn();
		const { result } = renderHook(() =>
			useServerPagination<Filters>({ initialPageSize: 5, initialFilters, onFetchData }),
		);
		onFetchData.mockClear();

		act(() => result.current.setFilter('q', 'lampara'));

		expect(result.current.filters.q).toBe('lampara');
		expect(result.current.pagination.pageIndex).toBe(0);
		expect(onFetchData).toHaveBeenLastCalledWith({
			page: 1,
			per_page: 5,
			filters: { status: '', q: 'lampara' },
		});
	});

	it('onPaginationChange navega de página y refleja el page 1-indexed en el fetch', () => {
		const onFetchData = vi.fn();
		const { result } = renderHook(() =>
			useServerPagination<Filters>({ initialPageSize: 5, initialFilters, onFetchData }),
		);
		onFetchData.mockClear();

		act(() => result.current.onPaginationChange({ pageIndex: 2, pageSize: 5 }));

		expect(result.current.pagination.pageIndex).toBe(2);
		expect(onFetchData).toHaveBeenLastCalledWith({
			page: 3,
			per_page: 5,
			filters: initialFilters,
		});
	});

	it('clearFilters restaura los filtros iniciales y vuelve a página 1', () => {
		const onFetchData = vi.fn();
		const { result } = renderHook(() =>
			useServerPagination<Filters>({ initialPageSize: 5, initialFilters, onFetchData }),
		);

		act(() => result.current.setFilters({ status: 'completed', q: 'x' }));
		expect(result.current.filters).toEqual({ status: 'completed', q: 'x' });

		act(() => result.current.clearFilters());
		expect(result.current.filters).toEqual(initialFilters);
		expect(result.current.pagination.pageIndex).toBe(0);
	});
});
