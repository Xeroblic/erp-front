import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import usePurchasableProductOptions from '../usePurchasableProductOptions';

/**
 * Selector de productos con búsqueda en el servidor. Se verifica lo que el
 * formulario necesita del hook: que un 403 no se disfrace de «sin
 * resultados», que las opciones de una filial no se vean en otra y que las
 * líneas ya guardadas tengan etiqueta antes de buscar.
 */

const serviceSpies = vi.hoisted(() => ({ searchPurchasableProducts: vi.fn() }));

vi.mock('@/services/procurement/purchasableProducts.service', async (importOriginal) => ({
	...(await importOriginal<
		typeof import('@/services/procurement/purchasableProducts.service')
	>()),
	searchPurchasableProducts: serviceSpies.searchPurchasableProducts,
}));

const page = (rows: { id: number; sku: string | null; name: string }[]) => ({
	data: rows.map((row) => ({ ...row, brand_name: null })),
	has_more: false,
});

beforeEach(() => {
	serviceSpies.searchPurchasableProducts.mockReset();
});

describe('usePurchasableProductOptions', () => {
	it('arma las opciones con SKU y nombre', async () => {
		serviceSpies.searchPurchasableProducts.mockResolvedValue(
			page([{ id: 11, sku: 'CAB-1', name: 'Cable HDMI' }]),
		);

		const { result } = renderHook(() =>
			usePurchasableProductOptions({ subsidiaryId: 4, isEnabled: true }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.options).toEqual([{ value: '11', label: 'CAB-1 · Cable HDMI' }]);
		expect(result.current.getOption(11)).toEqual({ value: '11', label: 'CAB-1 · Cable HDMI' });
		expect(serviceSpies.searchPurchasableProducts).toHaveBeenCalledWith(4, '');
	});

	it('un 403 se informa como falta de permiso, no como lista vacía', async () => {
		serviceSpies.searchPurchasableProducts.mockRejectedValue({
			isAxiosError: true,
			response: { status: 403, data: { message: 'This action is unauthorized.' } },
		});

		const { result } = renderHook(() =>
			usePurchasableProductOptions({ subsidiaryId: 4, isEnabled: true }),
		);

		await waitFor(() => expect(result.current.unavailableReason).toBe('forbidden'));
		expect(result.current.options).toEqual([]);
	});

	it('las opciones de otra filial desaparecen desde el primer render', async () => {
		serviceSpies.searchPurchasableProducts.mockImplementation((subsidiaryId: number) =>
			subsidiaryId === 4
				? Promise.resolve(page([{ id: 11, sku: 'CAB-1', name: 'Cable HDMI' }]))
				: new Promise(() => {
						// Queda pendiente: la filial 5 todavía no respondió.
					}),
		);

		const { result, rerender } = renderHook(
			({ subsidiaryId }: { subsidiaryId: number }) =>
				usePurchasableProductOptions({ subsidiaryId, isEnabled: true }),
			{ initialProps: { subsidiaryId: 4 } },
		);
		await waitFor(() => expect(result.current.options).toHaveLength(1));

		rerender({ subsidiaryId: 5 });

		expect(result.current.options).toEqual([]);
		expect(result.current.loading).toBe(true);
		expect(result.current.getOption(11)).toBeNull();
	});

	it('las líneas guardadas tienen etiqueta aunque no salgan en la búsqueda', async () => {
		serviceSpies.searchPurchasableProducts.mockResolvedValue(page([]));

		const { result } = renderHook(() =>
			usePurchasableProductOptions({
				subsidiaryId: 4,
				isEnabled: true,
				initialProducts: [{ id: 77, sku: 'SSD-1', name: 'SSD 1 TB' }],
			}),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.getOption(77)).toEqual({ value: '77', label: 'SSD-1 · SSD 1 TB' });
		expect(result.current.getOption('')).toBeNull();
	});

	it('cerrado no consulta el catálogo', () => {
		renderHook(() => usePurchasableProductOptions({ subsidiaryId: 4, isEnabled: false }));

		expect(serviceSpies.searchPurchasableProducts).not.toHaveBeenCalled();
	});

	it('un producto recién creado tiene etiqueta y la búsqueda se repite para traerlo', async () => {
		serviceSpies.searchPurchasableProducts.mockResolvedValue(page([]));

		const { result } = renderHook(() =>
			usePurchasableProductOptions({ subsidiaryId: 4, isEnabled: true }),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.addProduct({ id: 250, sku: 'LOGN-MOUS-A1B', name: 'Mouse' }));

		expect(result.current.getOption(250)).toEqual({
			value: '250',
			label: 'LOGN-MOUS-A1B · Mouse',
		});
		await waitFor(() =>
			expect(serviceSpies.searchPurchasableProducts).toHaveBeenCalledTimes(2),
		);
	});

	it('limpiar el término vuelve al catálogo sin filtrar, sin esperar el debounce', async () => {
		serviceSpies.searchPurchasableProducts.mockImplementation((_id: number, query: string) =>
			Promise.resolve(
				page(
					query === 'cable'
						? [{ id: 11, sku: 'CAB-1', name: 'Cable HDMI' }]
						: [
								{ id: 11, sku: 'CAB-1', name: 'Cable HDMI' },
								{ id: 12, sku: 'MOU-1', name: 'Mouse' },
							],
				),
			),
		);
		const { result } = renderHook(() =>
			usePurchasableProductOptions({ subsidiaryId: 4, isEnabled: true }),
		);
		await waitFor(() => expect(result.current.options).toHaveLength(2));

		act(() => result.current.onSearchChange('cable'));
		await waitFor(() => expect(result.current.options).toHaveLength(1));

		act(() => result.current.clearSearch());

		// Sin debounce: los cables dejan de ofrecerse en el mismo render, así que
		// el menú de la línea siguiente no se abre filtrado por «cable».
		expect(result.current.search).toBe('');
		expect(result.current.options).toEqual([]);
		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.options).toHaveLength(2));
		expect(serviceSpies.searchPurchasableProducts).toHaveBeenLastCalledWith(4, '');
	});
});
