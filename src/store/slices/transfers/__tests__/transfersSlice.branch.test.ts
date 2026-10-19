import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '@/store/rootReducer';
import transfersReducer, {
	createTransfer,
	fetchTransferById,
	fetchTransfers,
} from '@/store/slices/transfers/transfersSlice';

const { fetchData } = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

/** Sucursal 5 de la filial 9: los ids difieren a propósito. */
const user = { id: 1, branch: { id: 5, subsidiary: { id: 9 } }, subsidiary: { id: 9 } };

const createStore = (sucursalPrincipal?: number) =>
	configureStore({
		reducer: {
			transferencias: transfersReducer,
			auth: () => ({ loading: false, user }),
			personalizacion: () => ({
				personalizacionUsuario:
					sucursalPrincipal === undefined
						? undefined
						: { sucursal_principal: sucursalPrincipal, subsidiary_id: 9 },
			}),
		},
	});

// Los thunks tipan `getState` como `RootState`; el store sólo monta lo que leen.
type TDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
const dispatchOf = (store: ReturnType<typeof createStore>) => store.dispatch as TDispatch;

const requestedUrl = () => (fetchData.mock.calls[0]?.[0] as { url: string }).url;

afterEach(() => {
	vi.clearAllMocks();
});

describe('transfersSlice — sucursal de `/branches/{branch}/transfers`', () => {
	it('crea el traslado desde la sucursal activa, no desde su filial', async () => {
		fetchData.mockResolvedValueOnce({ data: { data: null } });

		await dispatchOf(createStore(5))(
			createTransfer({ to_branch_id: 6, items: [{ product_id: 31, quantity: 1 }] }),
		);

		expect(requestedUrl()).toBe('/branches/5/transfers');
	});

	it('lista y abre el detalle desde la sucursal activa', async () => {
		fetchData.mockResolvedValue({ data: { data: [], meta: {} } });
		const dispatch = dispatchOf(createStore(5));

		await dispatch(fetchTransfers(undefined));
		await dispatch(fetchTransferById(7));

		const urls = fetchData.mock.calls.map(([request]) => (request as { url: string }).url);
		expect(urls).toEqual(['/branches/5/transfers', '/branches/5/transfers/7']);
	});

	it('sin sucursal principal usa la sucursal del usuario', async () => {
		fetchData.mockResolvedValueOnce({ data: { data: [], meta: {} } });

		await dispatchOf(createStore())(fetchTransfers(undefined));

		expect(requestedUrl()).toBe('/branches/5/transfers');
	});
});
