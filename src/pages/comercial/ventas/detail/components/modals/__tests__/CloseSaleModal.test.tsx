import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider, useSelector } from 'react-redux';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import salesReducer from '@/store/slices/salesSlice';
import type { ISaleItem } from '@/interface/sales.interface';
import CloseSaleModal from '../CloseSaleModal';

const { fetchData } = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
// El modal real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
}));

const item = (id: number, productId: number, name: string): ISaleItem =>
	({ id, product_id: productId, quantity: 1, sku: `SKU-${id}`, name }) as ISaleItem;

// Dos líneas del mismo producto (31) con serie, y una sin serie (40) que no tiene fila.
const serialItems = [item(201, 31, 'Notebook A'), item(202, 31, 'Notebook A')];
const saleItems = [...serialItems, item(203, 40, 'Cargador')];

const store = () =>
	configureStore({
		reducer: { salesModule: salesReducer, auth: () => ({ loading: false, user: null }) },
	});

type TStore = ReturnType<typeof store>;

/**
 * Como los llamadores reales (`items.filter(...)`), entrega un arreglo nuevo en cada
 * render y se vuelve a pintar cuando el slice cambia `loading` durante el cierre.
 */
const Host = ({ onSuccess }: { onSuccess: () => void }) => {
	useSelector((state: ReturnType<TStore['getState']>) => state.salesModule.loading);
	return (
		<CloseSaleModal
			open
			onClose={vi.fn()}
			subsidiaryId={1}
			saleId={90}
			items={serialItems.map((saleItem) => ({ ...saleItem }))}
			saleItems={saleItems}
			onSuccess={onSuccess}
		/>
	);
};

const renderModal = (onSuccess = vi.fn()) => {
	render(
		<Provider store={store()}>
			<Host onSuccess={onSuccess} />
		</Provider>,
	);
	fireEvent.change(document.getElementById('serial-input-201-0') as HTMLElement, {
		target: { value: 'SN-1' },
	});
	fireEvent.change(document.getElementById('serial-input-202-0') as HTMLElement, {
		target: { value: 'SN-2' },
	});
	fireEvent.click(screen.getByRole('button', { name: /Confirmar cierre/ }));
	return { onSuccess };
};

const rowOf = (itemId: number): HTMLElement =>
	screen.getByRole('group', { name: new RegExp(`^SKU-${itemId} — `) });

afterEach(() => {
	vi.clearAllMocks();
});

describe('CloseSaleModal — cierre con faltante', () => {
	it('cancela el foco pendiente al desmontar el modal', async () => {
		vi.useFakeTimers();
		try {
			const { unmount } = render(
				<Provider store={store()}>
					<Host onSuccess={vi.fn()} />
				</Provider>,
			);
			const lookup = vi.spyOn(document, 'getElementById');
			try {
				unmount();
				await act(() => vi.advanceTimersByTime(100));
				expect(lookup).not.toHaveBeenCalled();
			} finally {
				lookup.mockRestore();
			}
		} finally {
			vi.useRealTimers();
		}
	});

	it('marca las dos líneas del mismo producto con la demanda sumada y lista la línea sin fila', async () => {
		fetchData.mockRejectedValueOnce({
			isAxiosError: true,
			response: {
				status: 409,
				data: {
					message:
						'No hay stock suficiente para cerrar la venta: falta stock en 3 ítems.',
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
							{
								sale_item_id: 202,
								product_id: 31,
								branch_id: 4,
								requested: 2,
								available: 1,
							},
							{
								sale_item_id: 203,
								product_id: 40,
								branch_id: 4,
								requested: 3,
								available: 0,
							},
						],
					},
				},
			},
		});
		const { onSuccess } = renderModal();

		const alert = await screen.findByRole('alert');
		expect(
			within(alert).getByText(
				'No hay stock suficiente para cerrar la venta: falta stock en 3 ítems.',
			),
		).toBeTruthy();
		// La línea sin serie no tiene fila: se nombra en el aviso con su cantidad.
		expect(within(alert).getByText('SKU-203 — Cargador')).toBeTruthy();
		expect(within(alert).getByText('Pedido 3 · Disponible 0')).toBeTruthy();
		expect(within(alert).getAllByText(/Se suma la demanda de las 2 líneas/)).toHaveLength(2);
		expect(within(alert).getByText(/Traslada stock desde otra sucursal/)).toBeTruthy();

		expect(within(rowOf(201)).getByText('Pedido 2 · Disponible 1')).toBeTruthy();
		expect(within(rowOf(202)).getByText('Pedido 2 · Disponible 1')).toBeTruthy();
		// Las series escaneadas sobreviven a la respuesta para reintentar sin volver a escanear.
		expect((document.getElementById('serial-input-201-0') as HTMLInputElement).value).toBe(
			'SN-1',
		);
		expect(onSuccess).not.toHaveBeenCalled();
		expect(fetchData).toHaveBeenCalledTimes(1);
	});

	it('muestra el 422 legado por su message, sin marcar filas', async () => {
		const message =
			'Stock insuficiente para el producto Notebook A (SKU: SKU-201). Disponible: 0, Solicitado: 1';
		fetchData.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 422, data: { message } },
		});
		renderModal();

		expect(await screen.findByText(message)).toBeTruthy();
		expect(screen.queryByText(/Pedido \d+ · Disponible/)).toBeNull();
	});

	it('ubica en su fila los errores de series que el backend agrupa por ítem', async () => {
		fetchData.mockRejectedValueOnce({
			isAxiosError: true,
			response: {
				status: 422,
				data: {
					message: 'Errores de validación en seriales.',
					errors: { 202: ['Serie duplicada en la solicitud: SN-2.'] },
				},
			},
		});
		renderModal();

		await waitFor(() =>
			expect(
				within(rowOf(202)).getByText('Serie duplicada en la solicitud: SN-2.'),
			).toBeTruthy(),
		);
	});

	it('cierra con el 200 nuevo y avisa al llamador', async () => {
		fetchData.mockResolvedValueOnce({
			data: {
				message: 'Venta cerrada correctamente',
				sale_id: 90,
				data: {
					id: 90,
					is_closed: true,
					fulfilled_items: [
						{ sale_item_id: 201, serial_numbers: ['SN-1'] },
						{ sale_item_id: 202, serial_numbers: ['SN-2'] },
					],
				},
			},
		});
		const { onSuccess } = renderModal();

		await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/subsidiaries/1/sales/90/close',
				data: {
					items: [
						expect.objectContaining({ sale_item_id: 201, serial_numbers: ['SN-1'] }),
						expect.objectContaining({ sale_item_id: 202, serial_numbers: ['SN-2'] }),
					],
				},
			}),
		);
	});

	it('recupera ubicaciones sin callback del padre como la lista y los pendientes de serie', async () => {
		let closes = 0;
		fetchData.mockImplementation((cfg: { method?: string; url: string }) => {
			if (cfg.url.endsWith('/fulfillment-options'))
				return Promise.resolve({
					data: {
						data: {
							sale_id: 90,
							branch_id: 4,
							is_closed: false,
							items: [
								{
									sale_item_id: 203,
									product: { id: 40, sku: 'SKU-203', name: 'Cargador' },
									quantity_required: 1,
									branch_id: 4,
									own_hold_quantity: 0,
									stock_sufficient: true,
									allocation_mode: 'manual',
									suggested_allocations: [{ warehouse_id: 8, quantity: 1 }],
									locations: [
										{ warehouse_id: 8, name: 'Central', fit_quantity: 2 },
										{
											warehouse_id: null,
											name: 'Sin ubicación',
											fit_quantity: 2,
										},
									],
								},
							],
						},
					},
				});
			closes += 1;
			if (closes === 1)
				return Promise.reject(
					Object.assign(new Error('Elige las ubicaciones.'), {
						isAxiosError: true,
						response: {
							status: 422,
							data: {
								message: 'Elige las ubicaciones.',
								code: 'LOCATION_SELECTION_REQUIRED',
								errors: { '203': ['Indica las ubicaciones.'] },
							},
						},
					}),
				);
			return Promise.resolve({
				data: {
					message: 'Venta cerrada',
					data: { id: 90, is_closed: true, fulfilled_items: [] },
				},
			});
		});
		const { onSuccess } = renderModal();
		await screen.findByText('Ubicación de salida');
		expect(closes).toBe(1);
		expect((document.getElementById('serial-input-201-0') as HTMLInputElement).value).toBe(
			'SN-1',
		);
		expect((document.getElementById('serial-input-202-0') as HTMLInputElement).value).toBe(
			'SN-2',
		);
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: /Confirmar cierre/ }).hasAttribute('disabled'),
			).toBe(false),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: /Confirmar cierre/ }));
			await Promise.resolve();
		});
		await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
		expect(fetchData).toHaveBeenLastCalledWith(
			expect.objectContaining({
				method: 'post',
				data: {
					items: [
						expect.objectContaining({ sale_item_id: 201, serial_numbers: ['SN-1'] }),
						expect.objectContaining({ sale_item_id: 202, serial_numbers: ['SN-2'] }),
						{ sale_item_id: 203, allocations: [{ warehouse_id: 8, quantity: 1 }] },
					],
				},
			}),
		);
	});
});
