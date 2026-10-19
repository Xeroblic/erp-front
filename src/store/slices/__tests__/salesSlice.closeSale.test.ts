import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ICloseSaleResponse } from '@/interface/sales.interface';
import { closeSale } from '@/services/salesService';
import salesReducer, { closeSaleThunk } from '../salesSlice';

const { fetchData, toastError, toastSuccess } = vi.hoisted(() => ({
	fetchData: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: toastError, success: toastSuccess } }));

const closed: ICloseSaleResponse = {
	message: 'Venta cerrada correctamente',
	sale_id: 90,
	data: {
		id: 90,
		is_closed: true,
		fulfilled_items: [
			{ sale_item_id: 201, allocations: [{ warehouse_id: null, quantity: 4 }] },
			{ sale_item_id: 202, serial_numbers: ['SN-0001', 'SN-0002'] },
		],
	},
};

const makeStore = () => configureStore({ reducer: { salesModule: salesReducer } });

afterEach(() => {
	vi.clearAllMocks();
});

describe('closeSale (servicio)', () => {
	it('devuelve la raíz del 200: message junto a data con lo aplicado', async () => {
		fetchData.mockResolvedValueOnce({ data: closed });

		const result = await closeSale(1, 90, { items: [] });

		expect(result.message).toBe('Venta cerrada correctamente');
		expect(result.data.fulfilled_items).toHaveLength(2);
		expect(fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/1/sales/90/close',
			method: 'post',
			data: { items: [] },
		});
	});
});

describe('closeSaleThunk', () => {
	it('avisa el éxito con el message del backend', async () => {
		fetchData.mockResolvedValueOnce({ data: closed });

		const action = await makeStore().dispatch(
			closeSaleThunk({ subsidiaryId: 1, saleId: 90, items: [] }),
		);

		expect(closeSaleThunk.fulfilled.match(action)).toBe(true);
		expect(toastSuccess).toHaveBeenCalledWith('Venta cerrada correctamente');
	});

	it('rechaza el 409 con status, code y los ítems que faltan', async () => {
		fetchData.mockRejectedValueOnce({
			isAxiosError: true,
			response: {
				status: 409,
				data: {
					message: 'No hay stock suficiente para cerrar la venta: falta stock en 1 ítem.',
					code: 'SALE_STOCK_INSUFFICIENT',
					context: {
						items: [
							{
								sale_item_id: 201,
								product_id: 31,
								branch_id: 4,
								requested: 2,
								available: 1,
							},
						],
					},
				},
			},
		});
		const store = makeStore();

		const action = await store.dispatch(
			closeSaleThunk({ subsidiaryId: 1, saleId: 90, items: [] }),
		);

		expect(closeSaleThunk.rejected.match(action)).toBe(true);
		if (!closeSaleThunk.rejected.match(action)) return;
		expect(action.payload).toMatchObject({
			status: 409,
			code: 'SALE_STOCK_INSUFFICIENT',
			shortages: [{ sale_item_id: 201, requested: 2, available: 1 }],
		});
		expect(store.getState().salesModule.error).toBe(
			'No hay stock suficiente para cerrar la venta: falta stock en 1 ítem.',
		);
		expect(toastError).toHaveBeenCalledTimes(1);
	});

	it('no muestra como error el 422 que sólo pide series', async () => {
		fetchData.mockRejectedValueOnce({
			isAxiosError: true,
			response: {
				status: 422,
				data: {
					message: 'Debes indicar las series para los items con seguimiento por serie.',
					required: [{ sale_item_id: 301 }],
				},
			},
		});

		const action = await makeStore().dispatch(
			closeSaleThunk({ subsidiaryId: 1, saleId: 90, items: [] }),
		);

		expect(closeSaleThunk.rejected.match(action)).toBe(true);
		expect(toastError).not.toHaveBeenCalled();
	});
});
