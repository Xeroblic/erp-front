import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import salesReducer from '@/store/slices/salesSlice';
import type { ISaleFulfillmentOptionItem } from '@/interface/sales.interface';
import SaleDetailPage from '../SaleDetailPage';

const { fetchData, stage } = vi.hoisted(() => ({
	fetchData: vi.fn<(cfg: IRequestCfg) => Promise<unknown>>(),
	stage: { isMultiLocation: true },
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({
	toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
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
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: stage.isMultiLocation,
		isMultiLocation: stage.isMultiLocation,
		isLoading: false,
	}),
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

const CABLE = 'CAB-1 — Cable HDMI';
const PREVIEW_URL = '/subsidiaries/1/sales/90/fulfillment-options';

const detail = {
	id: 90,
	sale_number: 'V-90',
	status: 'processing',
	is_closed: false,
	can_close: true,
};
const items = [
	{ id: 201, product_id: 31, quantity: 5, sku: 'CAB-1', name: 'Cable HDMI', total: '5000' },
];

const BODEGA_CENTRAL = { warehouse_id: 8, name: 'Bodega Central', fit_quantity: 3 };
const UNLOCATED = { warehouse_id: null, name: 'Sin ubicación', fit_quantity: 4 };

const option = (
	overrides: Partial<ISaleFulfillmentOptionItem> = {},
): ISaleFulfillmentOptionItem => ({
	sale_item_id: 201,
	branch_id: 4,
	product: { id: 31, sku: 'CAB-1', name: 'Cable HDMI' },
	quantity_required: 5,
	own_hold_quantity: 5,
	stock_sufficient: true,
	allocation_mode: 'manual',
	suggested_allocations: [
		{ warehouse_id: 8, quantity: 3 },
		{ warehouse_id: null, quantity: 2 },
	],
	locations: [UNLOCATED, BODEGA_CENTRAL],
	...overrides,
});

const AUTOMATIC = option({
	allocation_mode: 'automatic',
	suggested_allocations: [{ warehouse_id: 8, quantity: 5 }],
	locations: [{ ...BODEGA_CENTRAL, fit_quantity: 9 }],
});

const preview = (...optionItems: ISaleFulfillmentOptionItem[]) =>
	Promise.resolve({
		data: { data: { sale_id: 90, branch_id: 4, is_closed: false, items: optionItems } },
	});

const rejectWith = (status: number, data: unknown) =>
	Promise.reject(
		Object.assign(new Error(`Request failed with status code ${status}`), {
			isAxiosError: true,
			response: { status, data },
		}),
	);

type IRequestCfg = { url: string; method?: string; data?: unknown };

/**
 * Las vistas previas y los cierres se responden en orden: cada llamada consume la
 * siguiente respuesta de su cola.
 */
const routeApi = (
	previews: Array<() => Promise<unknown>>,
	closes: Array<() => Promise<unknown>>,
) => {
	fetchData.mockImplementation((cfg: IRequestCfg) => {
		if (cfg.method === 'post' && cfg.url.endsWith('/close')) {
			return (closes.shift() ?? (() => Promise.reject(new Error('cierre inesperado'))))();
		}
		if (cfg.url === PREVIEW_URL) {
			return (
				previews.shift() ?? (() => Promise.reject(new Error('vista previa inesperada')))
			)();
		}
		if (cfg.url.endsWith('/pending-serial-assignment'))
			return Promise.resolve({ data: { data: [] } });
		if (cfg.url.endsWith('/items')) return Promise.resolve({ data: { data: items } });
		return Promise.resolve({ data: { data: detail } });
	});
};

const callsTo = (matches: (cfg: IRequestCfg) => boolean) =>
	fetchData.mock.calls.map(([cfg]) => cfg).filter(matches);
const closeCalls = () => callsTo((cfg) => cfg.method === 'post' && cfg.url.endsWith('/close'));
const previewCalls = () => callsTo((cfg) => cfg.url === PREVIEW_URL);

const openClose = async () => {
	const store = configureStore({
		reducer: { salesModule: salesReducer, auth: () => ({ loading: false, user: null }) },
	});
	render(
		<Provider store={store}>
			<SaleDetailPage subsidiaryId={1} saleId={90} isOpen onClose={vi.fn()} />
		</Provider>,
	);
	fireEvent.click(await screen.findByRole('button', { name: 'Cerrar venta' }));
};

const selectedLocations = (group: HTMLElement): string[] =>
	within(group)
		.getAllByRole<HTMLSelectElement>('combobox')
		.map((select) => select.value);

const confirmButton = () => screen.getByRole('button', { name: /Confirmar cierre/ });

const confirmWhenReady = async () => {
	await waitFor(() => expect(confirmButton().hasAttribute('disabled')).toBe(false));
	await act(async () => {
		fireEvent.click(confirmButton());
		await Promise.resolve();
	});
};

const ok200 = (fulfilled: unknown[]) => () =>
	Promise.resolve({
		data: {
			message: 'Venta cerrada correctamente',
			sale_id: 90,
			data: { id: 90, is_closed: true, fulfilled_items: fulfilled },
		},
	});

beforeEach(() => {
	stage.isMultiLocation = true;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('SaleDetailPage — cierre con ubicación (etapa 2)', () => {
	it('en la etapa 1 no pide la vista previa ni muestra el selector', async () => {
		stage.isMultiLocation = false;
		routeApi([], []);
		await openClose();

		expect(await screen.findByText('Confirmar cierre de venta')).toBeTruthy();
		expect(screen.queryByText('Ubicación de salida')).toBeNull();
		expect(screen.queryByRole('combobox', { name: /^Ubicación 1 de / })).toBeNull();
		expect(previewCalls()).toHaveLength(0);
	});

	it('automático: sin selector y el cierre omite allocations', async () => {
		routeApi([() => preview(AUTOMATIC)], [ok200([])]);
		await openClose();

		const group = await screen.findByRole('group', { name: CABLE });
		expect(
			within(group).getByText('Sale de «Bodega Central», la única ubicación con stock.'),
		).toBeTruthy();
		expect(within(group).queryByRole('combobox')).toBeNull();

		await confirmWhenReady();
		await waitFor(() => expect(closeCalls()).toHaveLength(1));
		expect(closeCalls()[0].data).toEqual({ items: [] });
	});

	it('manual: precarga la sugerencia y la envía como allocations', async () => {
		routeApi([() => preview(option())], [ok200([])]);
		await openClose();

		const group = await screen.findByRole('group', { name: CABLE });
		expect(selectedLocations(group)).toEqual(['8', 'none']);
		expect(within(group).getByText('Asignado 5 de 5')).toBeTruthy();

		await confirmWhenReady();
		await waitFor(() => expect(closeCalls()).toHaveLength(1));
		expect(closeCalls()[0].data).toEqual({
			items: [
				{
					sale_item_id: 201,
					allocations: [
						{ warehouse_id: 8, quantity: 3 },
						{ warehouse_id: null, quantity: 2 },
					],
				},
			],
		});
	});

	it('manual: no cierra si las ubicaciones no suman la cantidad del ítem', async () => {
		routeApi([() => preview(option())], []);
		await openClose();

		const group = await screen.findByRole('group', { name: CABLE });
		fireEvent.change(
			within(group).getByRole('spinbutton', {
				name: `Cantidad de la ubicación 2 de ${CABLE}`,
			}),
			{ target: { value: '1' } },
		);
		await confirmWhenReady();

		expect(
			await within(group).findByText('Las ubicaciones suman 4 y el ítem pide 5.'),
		).toBeTruthy();
		expect(closeCalls()).toHaveLength(0);
	});

	it('bloqueado: explica el faltante y no deja confirmar', async () => {
		routeApi(
			[
				() =>
					preview(
						option({
							allocation_mode: 'blocked',
							stock_sufficient: false,
							suggested_allocations: [],
							locations: [{ ...UNLOCATED, fit_quantity: 2 }],
						}),
					),
			],
			[],
		);
		await openClose();

		const group = await screen.findByRole('group', { name: CABLE });
		expect(
			within(group).getByText(
				'La sucursal no tiene stock suficiente: el ítem pide 5 y hay 2 entre todas sus ubicaciones.',
			),
		).toBeTruthy();
		expect(within(group).getByText(/Traslada stock desde otra sucursal/)).toBeTruthy();
		expect(confirmButton().hasAttribute('disabled')).toBe(true);
	});

	it('LOCATION_SELECTION_REQUIRED recarga la vista previa, marca el ítem y no reintenta', async () => {
		routeApi(
			[() => preview(AUTOMATIC), () => preview(option())],
			[
				() =>
					rejectWith(422, {
						message:
							'Elige de qué ubicaciones sale 1 ítem: su producto tiene stock en más de una.',
						code: 'LOCATION_SELECTION_REQUIRED',
						errors: { '201': ['Indica las ubicaciones y cantidades de este ítem.'] },
					}),
			],
		);
		await openClose();
		await screen.findByRole('group', { name: CABLE });
		await confirmWhenReady();

		const group = await screen.findByRole('group', { name: CABLE });
		const notes = await within(group).findByRole('list', {
			name: 'Ubicaciones a elegir de nuevo',
		});
		expect(within(notes).getByText(/El stock cambió/)).toBeTruthy();
		expect(previewCalls()).toHaveLength(2);
		expect(closeCalls()).toHaveLength(1);
		await waitFor(() => expect(selectedLocations(group)).toEqual(['8', 'none']));
	});

	it('ALLOCATION_STOCK_INSUFFICIENT recarga, marca la ubicación y vuelve a la sugerencia nueva', async () => {
		routeApi(
			[
				() => preview(option()),
				() =>
					preview(
						option({
							suggested_allocations: [
								{ warehouse_id: null, quantity: 4 },
								{ warehouse_id: 8, quantity: 1 },
							],
							locations: [UNLOCATED, { ...BODEGA_CENTRAL, fit_quantity: 1 }],
						}),
					),
			],
			[
				() =>
					rejectWith(409, {
						message: 'Una de las ubicaciones elegidas ya no tiene stock suficiente.',
						code: 'ALLOCATION_STOCK_INSUFFICIENT',
						context: {
							allocations: [
								{
									sale_item_id: 201,
									product_id: 31,
									branch_id: 4,
									warehouse_id: 8,
									requested: 3,
									available: 1,
								},
							],
						},
					}),
			],
		);
		await openClose();
		await screen.findByRole('group', { name: CABLE });
		await confirmWhenReady();

		const group = await screen.findByRole('group', { name: CABLE });
		expect(
			await within(group).findByText(
				'«Bodega Central» ya no alcanza: la venta pide 3 y quedan 1.',
			),
		).toBeTruthy();
		await waitFor(() => expect(selectedLocations(group)).toEqual(['none', '8']));
		expect(previewCalls()).toHaveLength(2);
		expect(closeCalls()).toHaveLength(1);
	});

	it('muestra de qué ubicaciones salió cada ítem tras cerrar', async () => {
		routeApi(
			[() => preview(option())],
			[
				ok200([
					{
						sale_item_id: 201,
						allocations: [
							{ warehouse_id: 8, quantity: 3 },
							{ warehouse_id: null, quantity: 2 },
						],
					},
				]),
			],
		);
		await openClose();
		await screen.findByRole('group', { name: CABLE });
		await confirmWhenReady();

		const result = await screen.findByRole('list', {
			name: 'Ubicaciones de salida del cierre',
		});
		expect(within(result).getByText(CABLE)).toBeTruthy();
		expect(
			within(result).getByText('3 de «Bodega Central» · 2 de «Sin ubicación»'),
		).toBeTruthy();
	});

	it.each(['omitida', 'fallida'] as const)(
		'recupera las series de una venta mixta con la consulta de pendientes %s',
		async (pendingState) => {
			routeApi(
				[() => preview(option())],
				[
					() =>
						rejectWith(422, {
							message: 'Errores de validación en seriales.',
							errors: { '202': ['Faltan seriales para este item.'] },
						}),
					ok200([]),
				],
			);
			const originalApi = fetchData.getMockImplementation()!;
			fetchData.mockImplementation((cfg: IRequestCfg) => {
				if (cfg.url.endsWith('/items'))
					return Promise.resolve({
						data: {
							data: [
								...items,
								{
									id: 202,
									product_id: 32,
									product: { id: 32, sku: 'SER-1', name: 'Notebook' },
									quantity: 1,
								},
							],
						},
					});
				if (pendingState === 'fallida' && cfg.url.endsWith('/pending-serial-assignment')) {
					return rejectWith(500, { message: 'No disponible' });
				}
				return originalApi(cfg);
			});
			await openClose();
			await screen.findByRole('group', { name: CABLE });
			await confirmWhenReady();
			const serial = await screen.findByPlaceholderText('Escanear serie #1...');
			expect(closeCalls()).toHaveLength(1);
			fireEvent.change(serial, { target: { value: 'SN-202' } });
			await confirmWhenReady();
			await waitFor(() => expect(closeCalls()).toHaveLength(2));
			expect(closeCalls()[1].data).toEqual({
				items: [
					expect.objectContaining({ sale_item_id: 202, serial_numbers: ['SN-202'] }),
					{
						sale_item_id: 201,
						allocations: [
							{ warehouse_id: 8, quantity: 3 },
							{ warehouse_id: null, quantity: 2 },
						],
					},
				],
			});
		},
	);

	it('conserva la serie escaneada cuando un 422 agrega otra fila', async () => {
		routeApi(
			[() => preview(option())],
			[
				() =>
					rejectWith(422, {
						message: 'Errores de validación en seriales.',
						errors: { '203': ['Faltan seriales para este item.'] },
					}),
				ok200([]),
			],
		);
		const originalApi = fetchData.getMockImplementation()!;
		fetchData.mockImplementation((cfg: IRequestCfg) => {
			if (cfg.url.endsWith('/items'))
				return Promise.resolve({
					data: {
						data: [
							...items,
							...[202, 203].map((id) => ({
								id,
								product_id: id,
								product: { id, sku: `SER-${id}`, name: 'Notebook' },
								quantity: 1,
							})),
						],
					},
				});
			if (cfg.url.endsWith('/pending-serial-assignment'))
				return Promise.resolve({
					data: { data: [{ id: 90, serialized_items: [{ sale_item_id: 202 }] }] },
				});
			return originalApi(cfg);
		});
		await openClose();
		await screen.findByRole('group', { name: CABLE });
		fireEvent.change(document.getElementById('serial-input-202-0')!, {
			target: { value: 'SN-202' },
		});
		await confirmWhenReady();
		await waitFor(() => expect(document.getElementById('serial-input-203-0')).toBeTruthy());
		expect((document.getElementById('serial-input-202-0') as HTMLInputElement).value).toBe(
			'SN-202',
		);
		fireEvent.change(document.getElementById('serial-input-203-0')!, {
			target: { value: 'SN-203' },
		});
		await confirmWhenReady();
		await waitFor(() => expect(closeCalls()).toHaveLength(2));
		expect(closeCalls()[1].data).toEqual({
			items: [
				expect.objectContaining({ sale_item_id: 202, serial_numbers: ['SN-202'] }),
				expect.objectContaining({ sale_item_id: 203, serial_numbers: ['SN-203'] }),
				expect.objectContaining({ sale_item_id: 201, allocations: expect.any(Array) }),
			],
		});
	});

	it('recupera ubicaciones desde el cierre directo cuando no se conoce la etapa', async () => {
		stage.isMultiLocation = false;
		routeApi(
			[() => preview(option())],
			[
				() =>
					rejectWith(422, {
						message: 'Elige las ubicaciones.',
						code: 'LOCATION_SELECTION_REQUIRED',
						errors: { '201': ['Indica las ubicaciones y cantidades de este ítem.'] },
					}),
				ok200([]),
			],
		);
		await openClose();
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
			await Promise.resolve();
		});
		await screen.findByRole('group', { name: CABLE });
		expect(previewCalls()).toHaveLength(1);
		expect(closeCalls()).toHaveLength(1);
		await confirmWhenReady();
		await waitFor(() => expect(closeCalls()).toHaveLength(2));
		expect(closeCalls()[1].data).toEqual({
			items: [expect.objectContaining({ sale_item_id: 201, allocations: expect.any(Array) })],
		});
	});

	it('habilita ubicaciones desde el modal de series si la etapa no se pudo leer', async () => {
		stage.isMultiLocation = false;
		routeApi(
			[() => preview(option({ sale_item_id: 203 }))],
			[
				() =>
					rejectWith(422, {
						message: 'Elige las ubicaciones.',
						code: 'LOCATION_SELECTION_REQUIRED',
						errors: { '203': ['Indica las ubicaciones.'] },
					}),
				ok200([]),
			],
		);
		const originalApi = fetchData.getMockImplementation()!;
		fetchData.mockImplementation((cfg: IRequestCfg) => {
			if (cfg.url.endsWith('/pending-serial-assignment'))
				return Promise.resolve({
					data: { data: [{ id: 90, serialized_items: [{ sale_item_id: 201 }] }] },
				});
			return originalApi(cfg);
		});
		await openClose();
		const serials = await screen.findAllByPlaceholderText(/Escanear serie/);
		serials.forEach((serial, index) =>
			fireEvent.change(serial, { target: { value: `SN-${index}` } }),
		);
		await confirmWhenReady();
		await screen.findByText('Ubicación de salida');
		expect(previewCalls()).toHaveLength(1);
		expect(closeCalls()).toHaveLength(1);
		expect((document.getElementById('serial-input-201-0') as HTMLInputElement).value).toBe(
			'SN-0',
		);
		await confirmWhenReady();
		await waitFor(() => expect(closeCalls()).toHaveLength(2));
		expect(closeCalls()[1].data).toEqual({
			items: [
				expect.objectContaining({
					sale_item_id: 201,
					serial_numbers: ['SN-0', 'SN-1', 'SN-2', 'SN-3', 'SN-4'],
				}),
				expect.objectContaining({ sale_item_id: 203, allocations: expect.any(Array) }),
			],
		});
	});
});
