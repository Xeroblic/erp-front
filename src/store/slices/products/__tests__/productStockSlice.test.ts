/**
 * Rechazo tipado de los thunks que mueven stock: el status distingue el 403 por
 * sucursal (QA etapa 2 del backend, F1–F3) y el estado conserva el mensaje.
 */
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import productStock, {
	transferProductStock,
	unassignStockFromProduct,
} from '@/store/slices/products/productStockSlice';

const { fetchData } = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const axiosRejection = (status: number, data: Record<string, unknown>) =>
	Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status, data },
	});

const makeStore = () => configureStore({ reducer: { productStock } });

const transferArgs = {
	subsidiaryId: 2,
	productId: 7,
	payload: { from_branch_id: 5, to_branch_id: 6, serial_numbers: ['SN-1'] },
};

afterEach(() => {
	fetchData.mockReset();
});

describe('productStockSlice — rechazo tipado', () => {
	it('transferir rechaza con status y mensaje, y el estado guarda el mensaje', async () => {
		fetchData.mockRejectedValue(
			axiosRejection(403, { message: 'No tienes permiso para realizar esta acción.' }),
		);
		const store = makeStore();

		const action = await store.dispatch(transferProductStock(transferArgs));

		expect(action.payload).toEqual({
			status: 403,
			message: 'No tienes permiso para realizar esta acción.',
		});
		expect(store.getState().productStock.error).toBe(
			'No tienes permiso para realizar esta acción.',
		);
		expect(store.getState().productStock.isTransferring).toBe(false);
		expect(fetchData).toHaveBeenCalledTimes(1);
	});

	it('un 422 de una sucursal de otra filial conserva el mensaje de su campo', async () => {
		fetchData.mockRejectedValue(
			axiosRejection(422, {
				message: 'The given data was invalid.',
				errors: {
					to_branch_id: [
						'La sucursal destino no existe o no pertenece a esta subsidiaria.',
					],
				},
			}),
		);

		const action = await makeStore().dispatch(transferProductStock(transferArgs));

		expect(action.payload).toEqual({
			status: 422,
			message: 'La sucursal destino no existe o no pertenece a esta subsidiaria.',
		});
	});

	it('sin respuesta del servidor rechaza con status null y el respaldo', async () => {
		fetchData.mockRejectedValue('timeout');

		const action = await makeStore().dispatch(
			unassignStockFromProduct({
				subsidiaryId: 2,
				productId: 7,
				payload: { branch_id: 5, confirm: true, serial_numbers: ['SN-1'] },
			}),
		);

		expect(action.payload).toEqual({
			status: null,
			message: 'No se pudo devolver el stock a la subsidiaria',
		});
	});
});
