import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import salesReducer from '@/store/slices/salesSlice';
import { SALE_CLOSE_FORBIDDEN_MESSAGE } from '@/utils/saleCloseErrors.util';
import SaleDetailPage from '../SaleDetailPage';

const { fetchData, toastError, toastInfo, toastSuccess } = vi.hoisted(() => ({
	fetchData: vi.fn(),
	toastError: vi.fn(),
	toastInfo: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({
	toast: { error: toastError, info: toastInfo, success: toastSuccess },
}));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return {
		injectReducer: vi.fn(),
		useAppDispatch: redux.useDispatch,
		useAppSelector: redux.useSelector,
	};
});
vi.mock('@/store/slices/sales/salesSlice', () => ({
	downloadShippingLabel: () => ({ type: 'sales/download' }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
// El modal real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

const detail = {
	id: 90,
	sale_number: 'V-90',
	status: 'processing',
	is_closed: false,
	can_close: true,
};
const items = [
	{ id: 201, product_id: 31, quantity: 2, sku: 'CAB-1', name: 'Cable HDMI', total: '2000' },
	{ id: 301, product_id: 9, quantity: 1, sku: 'NB-1', name: 'Notebook', total: '90000' },
];

const SERIAL_MODAL_TITLE = 'Cerrar venta (Escanear Series)';

interface ISettle {
	resolve: (value: unknown) => void;
	reject: (reason: Error) => void;
}

const noPendingSerials = () => Promise.resolve({ data: { data: [] } });

/** Responde las lecturas del detalle y delega el cierre en `close` y los pendientes en `pending`. */
const routeApi = (
	close: () => Promise<unknown>,
	pending: () => Promise<unknown> = noPendingSerials,
) => {
	fetchData.mockImplementation((cfg: { url: string; method?: string }) => {
		if (cfg.method === 'post' && cfg.url.endsWith('/close')) return close();
		if (cfg.url.endsWith('/pending-serial-assignment')) return pending();
		if (cfg.url.endsWith('/items')) return Promise.resolve({ data: { data: items } });
		return Promise.resolve({ data: { data: detail } });
	});
};

const rejectWith = (status: number, data: unknown) => () =>
	Promise.reject(
		Object.assign(new Error(`Request failed with status code ${status}`), {
			isAxiosError: true,
			response: { status, data },
		}),
	);

const closeDirectly = async () => {
	const store = configureStore({
		reducer: { salesModule: salesReducer, auth: () => ({ loading: false, user: null }) },
	});
	render(
		<Provider store={store}>
			<SaleDetailPage subsidiaryId={1} saleId={90} isOpen onClose={vi.fn()} />
		</Provider>,
	);
	fireEvent.click(await screen.findByRole('button', { name: 'Cerrar venta' }));
	fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
};

type IRequestCfg = { url: string; method?: string };

const callsTo = (matches: (cfg: IRequestCfg) => boolean) =>
	fetchData.mock.calls.filter(([cfg]) => matches(cfg as IRequestCfg));

const closeCalls = () => callsTo((cfg) => cfg.url.endsWith('/close'));

afterEach(() => {
	vi.clearAllMocks();
});

describe('SaleDetailPage — cierre directo', () => {
	it('el 403 se muestra como falta de acceso y no abre el formulario de series', async () => {
		routeApi(rejectWith(403, { message: 'No tienes permiso para realizar esta acción.' }));
		await closeDirectly();

		await waitFor(() => expect(toastError).toHaveBeenCalledWith(SALE_CLOSE_FORBIDDEN_MESSAGE));
		expect(screen.queryByText(SERIAL_MODAL_TITLE)).toBeNull();
		expect(toastInfo).not.toHaveBeenCalled();
	});

	it('el 409 marca el ítem que falta junto a los ítems y no abre el formulario de series', async () => {
		routeApi(
			rejectWith(409, {
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
			}),
		);
		await closeDirectly();

		const alert = await screen.findByRole('alert');
		expect(within(alert).getByText('CAB-1 — Cable HDMI')).toBeTruthy();
		expect(within(alert).getByText('Pedido 2 · Disponible 1')).toBeTruthy();
		expect(screen.queryByText(SERIAL_MODAL_TITLE)).toBeNull();
		expect(closeCalls()).toHaveLength(1);
	});

	it('sólo el 422 que pide series abre el formulario, con los ítems que indica el backend', async () => {
		routeApi(
			rejectWith(422, {
				message: 'Debes indicar las series para los items con seguimiento por serie.',
				required: [{ sale_item_id: 301, product_id: 9, sku: 'NB-1', quantity: 1 }],
			}),
		);
		await closeDirectly();

		expect(await screen.findByText(SERIAL_MODAL_TITLE)).toBeTruthy();
		expect(screen.getByRole('group', { name: 'NB-1 — Notebook' })).toBeTruthy();
		expect(screen.queryByRole('group', { name: 'CAB-1 — Cable HDMI' })).toBeNull();
		expect(toastError).not.toHaveBeenCalled();
	});

	it.each([
		[
			'termina sin listar la venta',
			(settle: ISettle) => settle.resolve({ data: { data: [] } }),
		],
		['falla', (settle: ISettle) => settle.reject(new Error('Network Error'))],
	])(
		'conserva los ítems del 422 cuando la consulta de pendientes %s después',
		async (_case, finishPending) => {
			const settle = {} as ISettle;
			const latePending = new Promise((resolve, reject) => {
				settle.resolve = resolve;
				settle.reject = reject;
			});
			routeApi(
				rejectWith(422, {
					message: 'Debes indicar las series para los items con seguimiento por serie.',
					required: [{ sale_item_id: 301, product_id: 9, sku: 'NB-1', quantity: 1 }],
				}),
				() => latePending,
			);
			await closeDirectly();
			expect(await screen.findByRole('group', { name: 'NB-1 — Notebook' })).toBeTruthy();

			await act(async () => {
				finishPending(settle);
				await latePending.catch(() => undefined);
			});

			expect(screen.getByRole('group', { name: 'NB-1 — Notebook' })).toBeTruthy();
			expect(screen.queryByText('No hay ítems que requieran serie.')).toBeNull();
			const confirm = screen.getByRole('button', { name: /Confirmar cierre/ });
			expect(confirm.hasAttribute('disabled')).toBe(false);
		},
	);

	it('el 200 nuevo cierra, avisa una sola vez y recarga el detalle', async () => {
		routeApi(() =>
			Promise.resolve({
				data: {
					message: 'Venta cerrada correctamente',
					sale_id: 90,
					data: {
						id: 90,
						is_closed: true,
						fulfilled_items: [
							{
								sale_item_id: 201,
								allocations: [{ warehouse_id: null, quantity: 2 }],
							},
						],
					},
				},
			}),
		);
		await closeDirectly();

		await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));
		expect(toastSuccess).toHaveBeenCalledWith('Venta cerrada correctamente');
		await waitFor(() =>
			expect(callsTo((cfg) => cfg.url === '/subsidiaries/1/sales/90')).toHaveLength(2),
		);
		expect(screen.queryByText(SERIAL_MODAL_TITLE)).toBeNull();
	});
});
