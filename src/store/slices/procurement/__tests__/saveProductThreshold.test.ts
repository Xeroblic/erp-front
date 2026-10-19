import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import inventoryOverview, {
	saveProductThresholdThunk,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import products from '@/store/slices/products/productsSlice';

/**
 * Umbral §13 contra la API real: la ficha reutiliza `updateProduct`
 * (`PATCH B/products/{product}`), en la sucursal dueña del producto.
 */

interface IRequestConfig {
	url: string;
	method?: string;
	data?: Record<string, unknown>;
}

const fetchData = vi.hoisted(() => vi.fn<(config: IRequestConfig) => Promise<unknown>>());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const SERIAL_MESSAGE =
	'Un producto con seguimiento por serie no lleva umbral crítico: su disponibilidad se cuenta por equipos.';

const makeStore = () => configureStore({ reducer: { inventoryOverview, products } });

const productResource = (threshold: number | null) => ({
	data: {
		data: {
			id: 31,
			origin_branch_id: 6,
			branch_id: 6,
			sku: 'MOU-1',
			name: 'Mouse',
			price: '7990.00',
			serial_tracking: false,
			is_active: true,
			critical_stock_threshold: threshold,
		},
	},
});

afterEach(() => {
	fetchData.mockReset();
});

describe('saveProductThresholdThunk', () => {
	it('manda `critical_stock_threshold` en el PATCH de la sucursal dueña; `null` lo desactiva', async () => {
		fetchData.mockResolvedValue(productResource(null));
		const store = makeStore();

		await store
			.dispatch(saveProductThresholdThunk({ branchId: 6, productId: 31, threshold: null }))
			.unwrap();

		expect(fetchData).toHaveBeenCalledTimes(1);
		const [config] = fetchData.mock.calls[0];
		expect(config).toMatchObject({ url: '/branches/6/products/31', method: 'patch' });
		expect(config.data).toHaveProperty('critical_stock_threshold', null);

		fetchData.mockResolvedValue(productResource(0));
		await store
			.dispatch(saveProductThresholdThunk({ branchId: 6, productId: 31, threshold: 0 }))
			.unwrap();
		expect(fetchData.mock.calls[1][0].data).toHaveProperty('critical_stock_threshold', 0);
		expect(store.getState().inventoryOverview.updatingThreshold).toBe(false);
	});

	it('el 422 de `errors.critical_stock_threshold` vuelve como error del campo', async () => {
		fetchData.mockRejectedValue(
			Object.assign(new Error('HTTP 422'), {
				isAxiosError: true,
				response: {
					status: 422,
					data: {
						message: SERIAL_MESSAGE,
						errors: { critical_stock_threshold: [SERIAL_MESSAGE] },
					},
				},
			}),
		);
		const store = makeStore();

		const result = await store.dispatch(
			saveProductThresholdThunk({ branchId: 6, productId: 31, threshold: 5 }),
		);

		expect(saveProductThresholdThunk.rejected.match(result)).toBe(true);
		expect(result.payload).toEqual({ message: SERIAL_MESSAGE, field: SERIAL_MESSAGE });
		expect(store.getState().inventoryOverview.updatingThreshold).toBe(false);
	});

	it('otro rechazo trae sólo el mensaje, sin campo', async () => {
		fetchData.mockRejectedValue(
			Object.assign(new Error('HTTP 403'), {
				isAxiosError: true,
				response: { status: 403, data: { message: 'No tienes acceso a esta sucursal.' } },
			}),
		);
		const store = makeStore();

		const result = await store.dispatch(
			saveProductThresholdThunk({ branchId: 6, productId: 31, threshold: 5 }),
		);

		expect(result.payload).toEqual({
			message: 'No tienes acceso a esta sucursal.',
			field: null,
		});
	});
});
