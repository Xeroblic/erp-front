import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import salesReducer from '@/store/slices/salesSlice';
import type { ISale, ISaleReturn } from '@/interface/sales.interface';
import { useSaleReturnWrites } from '../../../hooks/useSaleReturnWrites';
import SaleDetailPage from '../SaleDetailPage';

type IRequestCfg = {
	url: string;
	method?: string;
	data?: unknown;
	headers?: Record<string, string>;
};

const { fetchData, stage, toastMock } = vi.hoisted(() => ({
	fetchData: vi.fn<(cfg: IRequestCfg) => Promise<unknown>>(),
	stage: { isMultiLocation: true },
	toastMock: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: toastMock }));
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
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: stage.isMultiLocation,
		isMultiLocation: stage.isMultiLocation,
		isLoading: false,
	}),
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ visibleBranches: [{ id: 4, name: 'Casa Matriz' }] }),
}));
// El permiso lo cubre ProtectedButton por su cuenta: aquí sólo importa cuándo se ofrece.
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children, onClick }: PropsWithChildren<{ onClick?: () => void }>) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
// El modal real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

const BASE = '/subsidiaries/1/sales/90';
const PENDING = { id: 12, sale_cycle: 0, status: 'pending_receipt', source: 'channel' } as const;

const saleReturn: ISaleReturn = {
	id: 12,
	sale_id: 90,
	sale_cycle: 0,
	status: 'pending_receipt',
	source: 'channel',
	reason: 'Pedido cancelado en Woo',
	items: [
		{
			sale_item_id: 201,
			branch_id: 4,
			product: { id: 31, sku: 'MOU-01', name: 'Mouse' },
			serial_tracking: false,
			quantity_expected: 5,
			serial_numbers: [],
			received_allocations: [],
		},
		{
			sale_item_id: 202,
			branch_id: 4,
			product: { id: 40, sku: 'NB-1', name: 'Notebook' },
			serial_tracking: true,
			quantity_expected: 1,
			serial_numbers: ['SN-100'],
			received_allocations: [],
		},
	],
	created_at: null,
	received_at: null,
	received_by: null,
	inventory_operation_id: null,
};

const RECEIPT_OK = {
	data: {
		message: 'Recepción confirmada correctamente',
		sale_id: 90,
		data: {
			id: 12,
			status: 'received',
			items: [
				{ sale_item_id: 201, received_quantity: 5, fit_quantity: 3, unfit_quantity: 2 },
				{ sale_item_id: 202, received_quantity: 1, fit_quantity: 1, unfit_quantity: 0 },
			],
		},
	},
};

const rejectWith = (status: number, data: unknown) =>
	Promise.reject(
		Object.assign(new Error(`Request failed with status code ${status}`), {
			isAxiosError: true,
			response: { status, data },
		}),
	);

/** Timeout: Axios no trae `response`, sólo `request`. */
const rejectWithTimeout = () =>
	Promise.reject(
		Object.assign(new Error('timeout of 30000ms exceeded'), {
			isAxiosError: true,
			code: 'ECONNABORTED',
			request: {},
		}),
	);

let detail: Partial<ISale>;
/** Otras ventas que la prueba abre, por id. */
let otherDetails: Record<number, Partial<ISale>>;
let writes: Array<() => Promise<unknown>>;

const isWrite = (cfg: IRequestCfg) =>
	cfg.method === 'post' && (cfg.url.endsWith('/confirm-return') || cfg.url.endsWith('/returns'));

const routeApi = () => {
	fetchData.mockImplementation((cfg: IRequestCfg) => {
		if (isWrite(cfg)) {
			return (writes.shift() ?? (() => Promise.reject(new Error('escritura inesperada'))))();
		}
		if (cfg.url.endsWith('/returns/12')) return Promise.resolve({ data: { data: saleReturn } });
		if (cfg.url === '/branches/4/warehouses') {
			return Promise.resolve({
				data: {
					data: [
						{ id: 8, name: 'Bodega Central', is_active: true },
						{ id: 9, name: 'Bodega Cerrada', is_active: false },
					],
					meta: { last_page: 1 },
				},
			});
		}
		if (cfg.url.endsWith('/pending-serial-assignment'))
			return Promise.resolve({ data: { data: [] } });
		if (cfg.url.endsWith('/items')) return Promise.resolve({ data: { data: [] } });
		const saleId = Number(/\/sales\/(\d+)$/.exec(cfg.url)?.[1]);
		return Promise.resolve({ data: { data: otherDetails[saleId] ?? detail } });
	});
};

const callsTo = (matches: (cfg: IRequestCfg) => boolean) =>
	fetchData.mock.calls.map(([cfg]) => cfg).filter(matches);
const confirmReturnCalls = () =>
	callsTo((cfg) => cfg.method === 'post' && cfg.url === `${BASE}/confirm-return`);
const detailReads = () => callsTo((cfg) => cfg.url === BASE && cfg.method === 'get');

const createStore = () =>
	configureStore({
		reducer: { salesModule: salesReducer, auth: () => ({ loading: false, user: null }) },
	});

const renderDetail = (saleId = 90, store = createStore()) => {
	const view = render(
		<Provider store={store}>
			<SaleDetailPage subsidiaryId={1} saleId={saleId} isOpen onClose={vi.fn()} />
		</Provider>,
	);
	return { store, unmount: view.unmount };
};

const openReceipt = async () => {
	renderDetail();
	fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));
	return screen.findByRole('group', { name: 'MOU-01 — Mouse' });
};

const change = (label: string, value: string) =>
	fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** Mouse: 3 aptas en Bodega Central y 2 no aptas sin ubicación; la serie queda apta. */
const fillValidReceipt = (mouse: HTMLElement) => {
	change('Ubicación de la parte 1 de MOU-01 — Mouse', '8');
	change('Cantidad de la parte 1 de MOU-01 — Mouse', '3');
	fireEvent.click(within(mouse).getByRole('button', { name: 'Agregar parte' }));
	change('Ubicación de la parte 2 de MOU-01 — Mouse', 'none');
	change('Cantidad de la parte 2 de MOU-01 — Mouse', '2');
	change('Condición de la parte 2 de MOU-01 — Mouse', 'unfit');
	change('Motivo de la parte 2 de MOU-01 — Mouse', 'No enciende');
};

const submitReceipt = () =>
	fireEvent.click(screen.getByRole('button', { name: /Confirmar recepción|Reintentar/ }));

beforeEach(() => {
	fetchData.mockReset();
	Object.values(toastMock).forEach((mock) => mock.mockClear());
	stage.isMultiLocation = true;
	writes = [];
	otherDetails = {};
	detail = {
		id: 90,
		sale_number: 'V-90',
		status: 'processing',
		is_closed: false,
		can_close: true,
		pending_return: PENDING,
	};
	routeApi();
});

describe('acciones de la venta según pending_return', () => {
	it('con devolución pendiente ofrece «Recibir devolución» en vez de «Cerrar venta»', async () => {
		renderDetail();
		expect(
			await screen.findByRole('button', { name: 'Recibir devolución' }),
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Cerrar venta' })).not.toBeInTheDocument();
		expect(screen.getByText(/Devolución pendiente/)).toBeInTheDocument();
	});

	it('sin devolución pendiente, una venta cerrada ofrece «Iniciar devolución»', async () => {
		detail = { ...detail, is_closed: true, can_close: false, pending_return: null };
		renderDetail();
		expect(
			await screen.findByRole('button', { name: 'Iniciar devolución' }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Recibir devolución' }),
		).not.toBeInTheDocument();
	});

	it('oculta la confirmación sin cuerpo de la etapa 1 si la venta tiene pending_return', async () => {
		detail = { ...detail, status: 'refunded', can_close: false };
		renderDetail();
		await screen.findByRole('button', { name: 'Recibir devolución' });
		expect(
			screen.queryByRole('button', { name: /Confirmar recepción de devolución/ }),
		).not.toBeInTheDocument();
	});
});

describe('etapa 1: el flujo actual no cambia', () => {
	beforeEach(() => {
		stage.isMultiLocation = false;
	});

	it('no ofrece iniciar ni recibir una devolución física', async () => {
		detail = { ...detail, is_closed: true, can_close: false, pending_return: null };
		renderDetail();
		await waitFor(() => expect(detailReads().length).toBeGreaterThan(0));
		expect(
			screen.queryByRole('button', { name: 'Iniciar devolución' }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Recibir devolución' }),
		).not.toBeInTheDocument();
	});

	it('confirm-return sigue sin cuerpo ni Idempotency-Key', async () => {
		detail = { ...detail, status: 'refunded', can_close: false, pending_return: null };
		writes = [
			() =>
				Promise.resolve({
					data: {
						message: 'Recepción confirmada correctamente',
						sale_id: 90,
						confirmed_serials: [],
						restocked_items: [],
					},
				}),
		];
		renderDetail();
		fireEvent.click(
			await screen.findByRole('button', { name: /Confirmar recepción de devolución/ }),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Confirmar recepción' }));

		await waitFor(() => expect(confirmReturnCalls()).toHaveLength(1));
		const [call] = confirmReturnCalls();
		expect(call.data).toBeUndefined();
		expect(call.headers).toBeUndefined();
	});
});

describe('iniciar una devolución', () => {
	beforeEach(() => {
		detail = { ...detail, is_closed: true, can_close: false, pending_return: null };
	});

	it('exige motivo y lo manda con Idempotency-Key', async () => {
		writes = [() => Promise.resolve({ status: 201, data: { data: saleReturn } })];
		renderDetail();
		fireEvent.click(await screen.findByRole('button', { name: 'Iniciar devolución' }));
		const form = screen.getByLabelText('Motivo de la devolución').closest('form');
		if (!form) throw new Error('El motivo debe estar dentro del formulario.');
		const startButton = () => within(form).getByRole('button', { name: 'Iniciar devolución' });

		fireEvent.click(startButton());
		expect(await screen.findByText('Indica el motivo de la devolución.')).toBeInTheDocument();
		expect(callsTo(isWrite)).toHaveLength(0);

		fireEvent.change(screen.getByLabelText('Motivo de la devolución'), {
			target: { value: '  El cliente devuelve la compra ' },
		});
		fireEvent.click(startButton());

		await waitFor(() => expect(callsTo(isWrite)).toHaveLength(1));
		const [call] = callsTo(isWrite);
		expect(call.url).toBe(`${BASE}/returns`);
		expect(call.data).toEqual({ reason: 'El cliente devuelve la compra' });
		expect(call.headers?.['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe('recibir la devolución (etapa 2)', () => {
	it('manda return_id e items con allocations y serials, y relee la venta', async () => {
		writes = [() => Promise.resolve(RECEIPT_OK)];
		const mouse = await openReceipt();
		// La bodega inactiva no se ofrece.
		expect(screen.queryByRole('option', { name: 'Bodega Cerrada' })).not.toBeInTheDocument();
		fillValidReceipt(mouse);
		const readsBefore = detailReads().length;
		submitReceipt();

		await waitFor(() => expect(confirmReturnCalls()).toHaveLength(1));
		const [call] = confirmReturnCalls();
		expect(call.data).toEqual({
			return_id: 12,
			items: [
				{
					sale_item_id: 201,
					allocations: [
						{ warehouse_id: 8, quantity: 3, condition: 'fit', reason: null },
						{
							warehouse_id: null,
							quantity: 2,
							condition: 'unfit',
							reason: 'No enciende',
						},
					],
				},
				{
					sale_item_id: 202,
					serials: [
						{
							serial_number: 'SN-100',
							warehouse_id: null,
							condition: 'fit',
							reason: null,
						},
					],
				},
			],
		});
		expect(call.headers?.['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
		await waitFor(() =>
			expect(toastMock.success).toHaveBeenCalledWith(
				'Recepción confirmada correctamente: 4 aptas, 2 no aptas.',
			),
		);
		expect(detailReads().length).toBeGreaterThan(readsBefore);
	});

	it('no envía si las partes no suman lo que vuelve', async () => {
		await openReceipt();
		change('Ubicación de la parte 1 de MOU-01 — Mouse', '8');
		change('Cantidad de la parte 1 de MOU-01 — Mouse', '4');
		submitReceipt();

		expect(
			await screen.findByText('Las partes suman 4 y vuelven 5 unidades.'),
		).toBeInTheDocument();
		expect(confirmReturnCalls()).toHaveLength(0);
	});

	it('no envía una serie no apta sin motivo', async () => {
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		change('Condición de la serie SN-100', 'unfit');
		submitReceipt();

		expect(await screen.findAllByText('Indica por qué no es apta.')).not.toHaveLength(0);
		expect(confirmReturnCalls()).toHaveLength(0);
	});

	it('tras un timeout reintenta con la misma Idempotency-Key y el mismo cuerpo', async () => {
		writes = [rejectWithTimeout, () => Promise.resolve(RECEIPT_OK)];
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		submitReceipt();

		fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

		await waitFor(() => expect(confirmReturnCalls()).toHaveLength(2));
		const [first, second] = confirmReturnCalls();
		expect(second.headers?.['Idempotency-Key']).toBe(first.headers?.['Idempotency-Key']);
		expect(second.data).toEqual(first.data);
	});

	it('marca en su ítem el error con ruta items.N', async () => {
		writes = [
			() =>
				rejectWith(422, {
					message: 'Lo recibido no cuadra con lo esperado.',
					code: 'RETURN_QUANTITY_MISMATCH',
					errors: { 'items.1.serials.0.serial_number': ['La serie no es de la venta.'] },
				}),
		];
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		submitReceipt();

		const notebook = screen.getByRole('group', { name: 'NB-1 — Notebook' });
		expect(
			await within(notebook).findByText('Serie SN-100: La serie no es de la venta.'),
		).toBeInTheDocument();
		expect(within(mouse).queryByRole('alert')).not.toBeInTheDocument();
	});

	it('RETURN_ALREADY_RECEIVED relee la venta y cierra la recepción', async () => {
		writes = [
			() =>
				rejectWith(409, {
					message: 'La devolución ya se recibió.',
					code: 'RETURN_ALREADY_RECEIVED',
				}),
		];
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		const readsBefore = detailReads().length;
		submitReceipt();

		await waitFor(() =>
			expect(toastMock.info).toHaveBeenCalledWith('La devolución ya se recibió.'),
		);
		expect(detailReads().length).toBeGreaterThan(readsBefore);
		await waitFor(() =>
			expect(screen.queryByRole('group', { name: 'MOU-01 — Mouse' })).not.toBeInTheDocument(),
		);
	});

	it('explica el 403 sin ofrecer reintento', async () => {
		writes = [() => rejectWith(403, { message: 'This action is unauthorized.' })];
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		submitReceipt();

		expect(
			await screen.findByText(
				/No tienes acceso a una de las sucursales que toca esta recepción/,
			),
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
	});
});

/** Respuesta que la prueba resuelve cuando quiere. */
const deferred = () => {
	let resolve: (value: unknown) => void = () => undefined;
	const promise = new Promise<unknown>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};

const startButtonIn = () => {
	const form = screen.getByLabelText('Motivo de la devolución').closest('form');
	if (!form) throw new Error('El motivo debe estar dentro del formulario.');
	return within(form).getByRole('button', { name: /Iniciar devolución|Reintentar/ });
};

const startReturnCalls = () =>
	callsTo((cfg) => cfg.method === 'post' && cfg.url.endsWith('/returns'));

describe('respuesta tardía de una devolución', () => {
	it('no recarga la venta del intento sobre la venta que se abrió después', async () => {
		const late = deferred();
		otherDetails[91] = {
			id: 91,
			sale_number: 'V-91',
			status: 'completed',
			is_closed: true,
			can_close: false,
			pending_return: null,
		};
		detail = { ...detail, pending_return: null };
		writes = [() => late.promise];
		const first = renderDetail(91);
		fireEvent.click(await screen.findByRole('button', { name: 'Iniciar devolución' }));
		fireEvent.change(screen.getByLabelText('Motivo de la devolución'), {
			target: { value: 'El cliente devuelve la compra' },
		});
		fireEvent.click(startButtonIn());
		await waitFor(() => expect(startReturnCalls()).toHaveLength(1));

		// Se cierra el detalle de la 91 y se abre el de la 90 antes de la respuesta.
		first.unmount();
		renderDetail(90, first.store);
		expect(await screen.findByText('V-90')).toBeInTheDocument();
		const readsOf91 = () =>
			callsTo((cfg) => cfg.method === 'get' && cfg.url === '/subsidiaries/1/sales/91');
		const readsBefore = readsOf91().length;

		late.resolve({ status: 201, data: { data: { ...saleReturn, sale_id: 91 } } });
		await waitFor(() => expect(toastMock.success).toHaveBeenCalled());

		expect(readsOf91()).toHaveLength(readsBefore);
		expect(screen.getByText('V-90')).toBeInTheDocument();
		expect(screen.queryByText('V-91')).not.toBeInTheDocument();
	});
});

describe('intento incierto tras un timeout', () => {
	it('cerrar la recepción no lo pierde: al reabrir reintenta con la misma clave y el mismo cuerpo', async () => {
		writes = [rejectWithTimeout, () => Promise.resolve(RECEIPT_OK)];
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		submitReceipt();
		await screen.findByRole('button', { name: 'Reintentar' });

		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		await waitFor(() =>
			expect(screen.queryByRole('group', { name: 'MOU-01 — Mouse' })).not.toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Recibir devolución' }));

		// El formulario vuelve bloqueado y tal como se envió.
		await screen.findByRole('group', { name: 'MOU-01 — Mouse' });
		expect(
			screen.getByLabelText<HTMLSelectElement>('Ubicación de la parte 1 de MOU-01 — Mouse')
				.value,
		).toBe('8');
		expect(
			screen.getByLabelText<HTMLSelectElement>('Condición de la parte 2 de MOU-01 — Mouse')
				.value,
		).toBe('unfit');
		fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
		await waitFor(() => expect(confirmReturnCalls()).toHaveLength(2));
		const [first, second] = confirmReturnCalls();
		expect(second.headers?.['Idempotency-Key']).toBe(first.headers?.['Idempotency-Key']);
		expect(second.data).toEqual(first.data);
	});

	it('descartar el intento de forma explícita libera el formulario con una clave nueva', async () => {
		writes = [rejectWithTimeout, () => Promise.resolve(RECEIPT_OK)];
		const mouse = await openReceipt();
		fillValidReceipt(mouse);
		submitReceipt();

		fireEvent.click(await screen.findByRole('button', { name: 'Descartar intento' }));
		// El formulario se libera con lo que el usuario ya había llenado.
		fireEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));

		await waitFor(() => expect(confirmReturnCalls()).toHaveLength(2));
		const [first, second] = confirmReturnCalls();
		expect(second.headers?.['Idempotency-Key']).not.toBe(first.headers?.['Idempotency-Key']);
	});

	it('cerrar el inicio no lo pierde: al reabrir reintenta con la misma clave y el mismo motivo', async () => {
		detail = { ...detail, is_closed: true, can_close: false, pending_return: null };
		writes = [
			rejectWithTimeout,
			() => Promise.resolve({ status: 201, data: { data: saleReturn } }),
		];
		renderDetail();
		fireEvent.click(await screen.findByRole('button', { name: 'Iniciar devolución' }));
		fireEvent.change(screen.getByLabelText('Motivo de la devolución'), {
			target: { value: 'El cliente devuelve la compra' },
		});
		fireEvent.click(startButtonIn());
		await screen.findByRole('button', { name: 'Reintentar' });

		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		await waitFor(() =>
			expect(screen.queryByLabelText('Motivo de la devolución')).not.toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Iniciar devolución' }));

		expect(screen.getByLabelText<HTMLTextAreaElement>('Motivo de la devolución').value).toBe(
			'El cliente devuelve la compra',
		);
		fireEvent.click(startButtonIn());
		await waitFor(() => expect(startReturnCalls()).toHaveLength(2));
		const [first, second] = startReturnCalls();
		expect(second.headers?.['Idempotency-Key']).toBe(first.headers?.['Idempotency-Key']);
		expect(second.data).toEqual({ reason: 'El cliente devuelve la compra' });
	});
});

/** La página que abre el detalle: monta las escrituras y monta o desmonta el detalle. */
const PageHarness = ({ saleId, open }: { saleId: number; open: boolean }) => {
	const returnWrites = useSaleReturnWrites();
	return open ? (
		<SaleDetailPage
			subsidiaryId={1}
			saleId={saleId}
			isOpen
			onClose={vi.fn()}
			returnWrites={returnWrites}
		/>
	) : null;
};

const renderPage = (saleId = 90) => {
	const store = createStore();
	const view = render(
		<Provider store={store}>
			<PageHarness saleId={saleId} open />
		</Provider>,
	);
	const show = (nextSaleId: number, open: boolean) =>
		view.rerender(
			<Provider store={store}>
				<PageHarness saleId={nextSaleId} open={open} />
			</Provider>,
		);
	return { show };
};

describe('intento incierto a nivel de página', () => {
	it('cerrar el detalle no pierde la recepción: al reabrir la venta reintenta con la misma clave', async () => {
		writes = [rejectWithTimeout, () => Promise.resolve(RECEIPT_OK)];
		const page = renderPage();
		fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));
		fillValidReceipt(await screen.findByRole('group', { name: 'MOU-01 — Mouse' }));
		submitReceipt();
		await screen.findByRole('button', { name: 'Reintentar' });

		page.show(90, false);
		page.show(90, true);
		fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

		await waitFor(() => expect(confirmReturnCalls()).toHaveLength(2));
		const [first, second] = confirmReturnCalls();
		expect(second.headers?.['Idempotency-Key']).toBe(first.headers?.['Idempotency-Key']);
		expect(second.data).toEqual(first.data);
	});

	it('la recepción incierta que sí llegó se resuelve al releer la venta', async () => {
		otherDetails[91] = { ...detail, id: 91, sale_number: 'V-91' };
		writes = [rejectWithTimeout, () => Promise.resolve(RECEIPT_OK)];
		const page = renderPage();
		fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));
		fillValidReceipt(await screen.findByRole('group', { name: 'MOU-01 — Mouse' }));
		submitReceipt();
		await screen.findByRole('button', { name: 'Reintentar' });

		// El backend sí la recibió: al releer, la venta ya no espera devolución.
		detail = { ...detail, pending_return: null };
		page.show(90, false);
		page.show(90, true);
		await waitFor(() =>
			expect(
				screen.queryByRole('button', { name: 'Recibir devolución' }),
			).not.toBeInTheDocument(),
		);

		// Otra venta ya no queda bloqueada por ese intento.
		page.show(90, false);
		page.show(91, true);
		expect(await screen.findByText('V-91')).toBeInTheDocument();
		fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));
		expect(
			await screen.findByRole('button', { name: 'Confirmar recepción' }),
		).toBeInTheDocument();
		expect(screen.queryByText(/sin confirmar/)).not.toBeInTheDocument();
	});

	it('otra venta no reintenta ni envía el intento ajeno: sólo lo descarta', async () => {
		otherDetails[91] = { ...detail, id: 91, sale_number: 'V-91' };
		writes = [rejectWithTimeout];
		const page = renderPage();
		fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));
		fillValidReceipt(await screen.findByRole('group', { name: 'MOU-01 — Mouse' }));
		submitReceipt();
		await screen.findByRole('button', { name: 'Reintentar' });

		page.show(90, false);
		page.show(91, true);
		expect(await screen.findByText('V-91')).toBeInTheDocument();
		fireEvent.click(await screen.findByRole('button', { name: 'Recibir devolución' }));

		expect(
			await screen.findByText(
				/La venta #90 tiene la recepción de la devolución sin confirmar/,
			),
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Confirmar recepción' }),
		).not.toBeInTheDocument();
		expect(confirmReturnCalls()).toHaveLength(1);

		fireEvent.click(screen.getByRole('button', { name: 'Descartar intento' }));
		expect(
			await screen.findByRole('button', { name: 'Confirmar recepción' }),
		).toBeInTheDocument();
	});
});
