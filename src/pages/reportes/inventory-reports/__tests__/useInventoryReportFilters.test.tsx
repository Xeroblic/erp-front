import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import useInventoryReportFilters from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';

const SUBSIDIARY_BRANCHES: readonly number[] = [4, 5];

const renderFilters = (url: string) => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
	);
	return renderHook(
		() => ({
			api: useInventoryReportFilters(SUBSIDIARY_BRANCHES),
			search: useLocation().search,
		}),
		{ wrapper },
	);
};

describe('useInventoryReportFilters', () => {
	it('ignora la sucursal de otra empresa que quedó en la URL y la quita de inmediato', () => {
		const { result } = renderFilters('/reportes/inventario?sucursal=9&q=mouse');

		expect(result.current.api.filters.sucursal).toBeNull();
		expect(result.current.search).toBe('?q=mouse');

		act(() => result.current.api.setBusqueda('teclado'));

		expect(result.current.search).toBe('?q=teclado');
	});

	it('conserva una sucursal de la filial', () => {
		const { result } = renderFilters('/reportes/inventario?sucursal=5');

		expect(result.current.api.filters.sucursal).toBe(5);

		act(() => result.current.api.setBusqueda('mouse'));

		expect(result.current.search).toBe('?q=mouse&sucursal=5');
	});
});
