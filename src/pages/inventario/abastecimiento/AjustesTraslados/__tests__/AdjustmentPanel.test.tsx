import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjustesTrasladosView from '@/pages/inventario/abastecimiento/AjustesTraslados/AjustesTrasladosView';
import {
	FAKE_ALFA,
	FAKE_BETA,
	resetAdjustmentFake,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/__tests__/adjustmentFakeBackend';
import * as service from '@/services/procurement/inventoryStock.service';
import type { IInventoryStockRow } from '@/interface/procurement.interface';

const context = vi.hoisted(() => ({
	branchId: 4 as number | null,
	subsidiaryId: 2,
	enabled: true,
}));
// Etapa del despliegue: encendida salvo en los casos de una sola ubicación.
const multiLocation = vi.hoisted(() => ({ enabled: true }));
vi.mock('@/config/inventoryMultiLocation.config', () => ({
	get default() {
		return multiLocation.enabled;
	},
}));
vi.mock('@/config/inventoryStock.config', () => ({
	get default() {
		return context.enabled;
	},
}));
vi.mock('@/config/inventoryAdjustments.config', () => ({
	get default() {
		return context.enabled;
	},
}));
/** El ajuste lee y escribe en un backend falso con datos propios de la prueba. */
vi.mock('@/services/procurement/inventoryStock.service', async (importOriginal) => {
	const actual = await importOriginal<object>();
	const { adjustmentFakeService } = await import(
		'@/pages/inventario/abastecimiento/AjustesTraslados/__tests__/adjustmentFakeBackend'
	);
	return { ...actual, ...adjustmentFakeService };
});
vi.mock('@/hooks/useCurrentBranch', () => ({ useCurrentBranch: () => context }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
/**
 * La transición entre pasos del asistente no aporta a estas pruebas y en jsdom
 * demora el cambio de paso: `framer-motion` se sustituye por elementos planos.
 */
vi.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => children,
	motion: {
		section: ({
			children,
			className,
			'aria-labelledby': labelledBy,
		}: {
			children: ReactNode;
			className?: string;
			'aria-labelledby'?: string;
		}) => (
			<section className={className} aria-labelledby={labelledBy}>
				{children}
			</section>
		),
	},
}));
/**
 * `react-select` no expone sus opciones como controles nativos en jsdom; como
 * en `InventarioBodega.test.tsx`, `SelectReact` se sustituye por un `<select>`
 * nativo cableado a las mismas props. Cuando el llamador busca en el servidor
 * (`onInputChange`), el doble agrega la caja de búsqueda «Buscar <etiqueta>», y
 * el valor elegido se lista aunque no esté entre las opciones de la búsqueda.
 */
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		'aria-label': ariaLabel,
		isDisabled,
		options,
		value,
		onChange,
		onInputChange,
		placeholder,
	}: {
		'aria-label'?: string;
		isDisabled?: boolean;
		options?: { value: string; label: string }[];
		value?: { value: string; label: string } | null;
		onChange?: (option: { value: string; label: string } | null) => void;
		onInputChange?: (input: string, meta: { action: string }) => void;
		placeholder?: string;
	}) => {
		const listed =
			value && !options?.some((option) => option.value === value.value)
				? [value, ...(options ?? [])]
				: (options ?? []);
		return (
			<>
				{onInputChange && (
					<input
						aria-label={`Buscar ${ariaLabel}`}
						disabled={isDisabled}
						onChange={(event) =>
							onInputChange(event.target.value, { action: 'input-change' })
						}
					/>
				)}
				<select
					aria-label={ariaLabel}
					disabled={isDisabled}
					value={value?.value ?? ''}
					onChange={(event) => {
						const selected =
							listed.find((option) => option.value === event.target.value) ?? null;
						onChange?.(selected);
					}}>
					<option value=''>{placeholder}</option>
					{listed.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</>
		);
	},
}));

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product', 'edit-product'] as string[],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }, { id: 6 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {
		deny(state) {
			state.user.permisos = ['view-product'];
		},
	},
});

const renderPage = () => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	const view = render(
		<Provider store={store}>
			<MemoryRouter initialEntries={['/?tab=ajuste']}>
				<AjustesTrasladosView />
			</MemoryRouter>
		</Provider>,
	);
	return { ...view, store };
};

/**
 * `Button` descarta un segundo clic mientras dura su guarda anti doble clic: se
 * espera a que «Siguiente» vuelva a estar habilitado antes de pulsarlo.
 */
const clickNext = async () => {
	const button = screen.getByRole('button', { name: 'Siguiente' });
	await waitFor(() => expect(button).toBeEnabled());
	fireEvent.click(button);
};

/**
 * Paso 1 → 2: elige la ubicación, avanza a «Productos» y espera a que el saldo
 * deje de estar cargando.
 */
const chooseLocation = async (token: string) => {
	fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: token } });
	await clickNext();
	await screen.findByLabelText('Producto de la línea 1');
	// El saldo por línea depende de la ubicación: esperar a que cargue evita
	// leer «…» en vez de un número.
	await waitFor(() => expect(screen.queryByText('…')).not.toBeInTheDocument());
};

/** Paso 2 → 3: avanza a «Motivo y confirmación» y, si se indica, escribe el motivo. */
const goToReason = async (reason?: string) => {
	await clickNext();
	const field = await screen.findByLabelText('Motivo');
	if (reason) fireEvent.change(field, { target: { value: reason } });
};

/** Bodega principal del backend falso: 100 aptos de «Producto alfa». */
const chooseMainWarehouse = () => chooseLocation('warehouse:8');

const ALFA = String(FAKE_ALFA.id);
const BETA = String(FAKE_BETA.id);

/** Término que encuentra cada producto del backend falso en el buscador. */
const SEARCH_TERMS: Record<string, string> = { [ALFA]: FAKE_ALFA.sku, [BETA]: FAKE_BETA.sku };

/**
 * Completa una línea del ajuste con producto y delta firmado. El selector
 * busca en el servidor: se escribe el término y se espera la opción.
 */
const fillLine = async (productId: string, delta: string) => {
	const term = SEARCH_TERMS[productId];
	fireEvent.change(screen.getByLabelText('Buscar Producto de la línea 1'), {
		target: { value: term },
	});
	const product = screen.getByLabelText('Producto de la línea 1');
	await waitFor(() =>
		expect(within(product).getByRole('option', { name: new RegExp(term) })).toBeInTheDocument(),
	);
	fireEvent.change(product, { target: { value: productId } });
	fireEvent.change(screen.getByLabelText('Cantidad de ajuste de la línea 1'), {
		target: { value: delta },
	});
};

beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
	multiLocation.enabled = true;
});
afterEach(() => {
	resetAdjustmentFake();
	vi.restoreAllMocks();
});

describe('Ajuste de inventario — integración de vista, hook, slice y servicio', () => {
	it('aplica un egreso y muestra la tabla antes/después de físico, apto y no apto', async () => {
		renderPage();
		await chooseMainWarehouse();
		await fillLine(ALFA, '-2');
		await goToReason('Conteo físico: faltan dos unidades');
		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		expect(screen.getByText(/Egreso de/)).toHaveTextContent(
			'Egreso de 2 unidades aptas de Producto alfa.',
		);

		const row = within(table).getAllByRole('row')[1];
		const cells = within(row).getAllByRole('cell');
		expect(cells[2]).toHaveTextContent('-2');
		// Alfa tiene 100 físicos aptos en la bodega principal:
		// «Stock anterior» y «Stock final» son de la condición ajustada (apto).
		expect(cells[3]).toHaveTextContent('100');
		expect(cells[4]).toHaveTextContent('98');
		// El total de la ubicación: el no apto no se movió, no hay reclasificación.
		expect(cells[5]).toHaveTextContent('100 → pasó a 98');

		// El resultado reemplaza al asistente: no vuelve a la selección de productos.
		expect(screen.queryByLabelText('Producto de la línea 1')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();

		// «Nuevo ajuste» empieza desde el primer paso, con la ubicación conservada.
		fireEvent.click(screen.getByRole('button', { name: 'Nuevo ajuste' }));
		expect(await screen.findByLabelText('Ubicación')).toHaveValue('warehouse:8');
		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('registra un ingreso positivo sin procedencia y lo confirma', async () => {
		renderPage();
		await chooseMainWarehouse();
		await fillLine(ALFA, '3');
		await goToReason('Conteo: aparecen tres unidades');
		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
		expect(cells[2]).toHaveTextContent('+3');
		expect(cells[4]).toHaveTextContent('103');
		expect(screen.getByText(/Ingreso de/)).toHaveTextContent(
			'Ingreso de 3 unidades aptas de Producto alfa.',
		);
	});

	it('no ofrece las coincidencias del término anterior mientras se escribe otro', async () => {
		// Datos propios de la prueba: cada término devuelve un único producto.
		const resultFor = (term: string): IInventoryStockRow[] => {
			const name = { alfa: 'Producto alfa', beta: 'Producto beta' }[term];
			if (!name) return [];
			return [
				{
					product: {
						id: term === 'alfa' ? 9001 : 9002,
						sku: term.toUpperCase(),
						commercial_sku: null,
						name,
						short_description: null,
						serial_tracking: false,
						grade: null,
						currency_code: 'CLP',
						price: null,
						offer_price: null,
						cost: null,
						cost_basis: 'unknown',
						brand: null,
						categories: [],
						image: null,
						is_active: true,
					},
					physical_quantity: 0,
					fit_quantity: 0,
					unfit_quantity: 0,
					documented_quantity: 0,
					undocumented_quantity: 0,
				},
			];
		};
		vi.spyOn(service, 'searchInventoryAdjustableProducts').mockImplementation(
			(_branchId, _subsidiaryId, _location, term) =>
				Promise.resolve({ data: resultFor(term), has_more: false }),
		);
		renderPage();
		await chooseMainWarehouse();
		const search = screen.getByLabelText('Buscar Producto de la línea 1');
		const product = screen.getByLabelText('Producto de la línea 1');
		fireEvent.change(search, { target: { value: 'alfa' } });
		await waitFor(() =>
			expect(
				within(product).getByRole('option', { name: /Producto alfa/ }),
			).toBeInTheDocument(),
		);

		// Sin esperar el debounce: «alfa» ya no responde a lo escrito.
		fireEvent.change(search, { target: { value: 'beta' } });
		expect(
			within(product).queryByRole('option', { name: /Producto alfa/ }),
		).not.toBeInTheDocument();
		await waitFor(() =>
			expect(
				within(product).getByRole('option', { name: /Producto beta/ }),
			).toBeInTheDocument(),
		);
	});

	it('ofrece el catálogo aunque el producto no tenga saldo en esa ubicación', async () => {
		renderPage();
		// «Sin ubicación» no tiene ni una unidad de alfa: el conteo que las
		// encuentra tiene que poder nombrarlo igual.
		await chooseLocation('unlocated');
		await fillLine(ALFA, '3');
		await goToReason('Conteo: aparecen tres sin ubicar');

		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
		// De cero a tres: el saldo en cero no saca al producto del selector.
		expect(cells[3]).toHaveTextContent('0');
		expect(cells[4]).toHaveTextContent('3');
	});

	it('no marca en rojo las líneas en blanco al cambiar de ubicación', async () => {
		renderPage();
		await chooseMainWarehouse();
		fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
		await screen.findByLabelText('Ubicación');
		await chooseLocation('unlocated');

		expect(screen.queryByText('Selecciona un producto.')).not.toBeInTheDocument();
		expect(screen.queryByText('Indica la cantidad de ajuste.')).not.toBeInTheDocument();
		// La ubicación recién elegida tampoco se valida como vacía.
		expect(screen.queryByText('Indica la ubicación del ajuste.')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Cantidad de ajuste de la línea 1')).not.toHaveClass(
			'!border-red-500',
		);
	});

	it('muestra el faltante frente a reservas sin truncarlo en cero', async () => {
		renderPage();
		await chooseLocation('unlocated');
		await fillLine(BETA, '-3');
		await goToReason('Conteo físico: faltan tres unidades');
		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

		// El backend falso reserva 16 de los 17 aptos de beta: restar 3 deja el
		// disponible en −2, y eso se muestra.
		const available = await screen.findByTestId(`ajuste-disponible-${BETA}`);
		expect(available).toHaveTextContent('-2');
		expect(screen.getByRole('alert')).toHaveTextContent(
			'2 unidades reservadas no tienen stock que las respalde.',
		);
		const table = screen.getByRole('table', {
			name: 'Disponible en la sucursal frente a reservas',
		});
		const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
		expect(cells[2]).toHaveTextContent('16');
	});

	it('deriva a Recepciones en vez de ofrecer ingresar una compra', () => {
		renderPage();
		expect(screen.getByText('Otros movimientos de stock')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Recepciones' })).toHaveAttribute(
			'href',
			'/inventario/abastecimiento/recepciones',
		);
	});

	it('lleva el foco al título del paso nuevo al navegar con el teclado', async () => {
		renderPage();
		fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'warehouse:8' } });

		/** Activa un botón ya enfocado, como Enter o Espacio. */
		const activate = async (name: string) => {
			const button = screen.getByRole('button', { name });
			await waitFor(() => expect(button).toBeEnabled());
			button.focus();
			fireEvent.click(button);
		};
		/** `to` aparece después de `from` en el orden del documento (y de tabulación). */
		const follows = (from: Element, to: Element) => {
			const order = [...document.querySelectorAll('*')];
			return order.indexOf(to) > order.indexOf(from);
		};

		await activate('Siguiente');
		const products = await screen.findByRole('heading', { name: /Paso 2 de 3: Productos/ });
		await waitFor(() => expect(products).toHaveFocus());
		// El siguiente Tab llega al primer campo del paso, no al pie del asistente.
		const product = screen.getByLabelText('Producto de la línea 1');
		expect(follows(products, product)).toBe(true);
		expect(follows(product, screen.getByRole('button', { name: 'Siguiente' }))).toBe(true);

		await fillLine(ALFA, '-1');
		await activate('Siguiente');
		// «Siguiente» desaparece en el último paso: el foco no puede caer en <body>.
		const confirmation = await screen.findByRole('heading', {
			name: /Paso 3 de 3: Motivo y confirmación/,
		});
		await waitFor(() => expect(confirmation).toHaveFocus());
		expect(follows(confirmation, screen.getByLabelText('Motivo'))).toBe(true);

		await activate('Anterior');
		await waitFor(() =>
			expect(screen.getByRole('heading', { name: /Paso 2 de 3: Productos/ })).toHaveFocus(),
		);
	});

	it('no avanza sin ubicación', async () => {
		renderPage();
		await clickNext();
		expect(await screen.findByText('Indica la ubicación del ajuste.')).toBeInTheDocument();
		expect(screen.queryByLabelText('Producto de la línea 1')).not.toBeInTheDocument();
	});

	it('no avanza con una cantidad de cero ni envía sin motivo', async () => {
		renderPage();
		await chooseMainWarehouse();
		await fillLine(ALFA, '0');
		await clickNext();
		expect(
			await screen.findByText('La cantidad de ajuste no puede ser cero.'),
		).toBeInTheDocument();
		expect(screen.queryByLabelText('Motivo')).not.toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Cantidad de ajuste de la línea 1'), {
			target: { value: '-1' },
		});
		await goToReason();
		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));
		expect(await screen.findByText('Indica el motivo del ajuste.')).toBeInTheDocument();

		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('explica el rechazo cuando el egreso dejaría el saldo bajo cero', async () => {
		renderPage();
		await chooseMainWarehouse();
		await fillLine(ALFA, '-9999');

		// Aviso en la línea antes de intentar escribir.
		expect(
			await screen.findByText('El egreso supera el stock en sistema (100).'),
		).toBeInTheDocument();

		await goToReason('Conteo');
		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));
		const alert = await screen.findByRole('alert');
		expect(alert).not.toHaveTextContent('No se pudo registrar el ajuste.');
		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('explica los rechazos del servidor: unidades sin procedencia y errores por línea', async () => {
		const write = vi
			.spyOn(service, 'createInventoryAdjustment')
			.mockRejectedValueOnce({
				isAxiosError: true,
				response: {
					status: 409,
					data: {
						message: 'La ubicación no tiene stock suficiente.',
						code: 'INSUFFICIENT_LOCATION_STOCK',
						context: { requested: 2, available: 0, unattributed_quantity: 3 },
					},
				},
			})
			.mockRejectedValueOnce({
				isAxiosError: true,
				response: {
					status: 422,
					data: {
						message: 'Los datos no son válidos.',
						errors: { 'items.0.product_id': ['El producto no es de la filial.'] },
					},
				},
			});
		renderPage();
		await chooseMainWarehouse();
		await fillLine(ALFA, '-2');
		await goToReason('Conteo');

		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));
		expect(
			await screen.findByText(/Hay 3 unidades sin procedencia registrada/),
		).toBeInTheDocument();

		const submit = screen.getByRole('button', { name: 'Registrar ajuste' });
		await waitFor(() => expect(submit).toBeEnabled());
		fireEvent.click(submit);
		// El 422 de `items.0.product_id` no se lista en el aviso general: se marca
		// en el campo de la línea, en el paso «Productos».
		expect(
			await screen.findByText('Una línea tiene errores: está marcada en «Productos».'),
		).toBeInTheDocument();
		expect(screen.queryByText('El producto no es de la filial.')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Revisar productos' }));
		expect(await screen.findByText('El producto no es de la filial.')).toBeInTheDocument();

		// Un rechazo definitivo no aplicó nada: el siguiente envío lleva clave nueva.
		const keys = write.mock.calls.map(([, , headers]) => headers?.idempotencyKey);
		expect(keys).toHaveLength(2);
		expect(keys[0]).not.toBe(keys[1]);

		// Al corregir las líneas, el rechazo deja de describir el lote: se retira.
		fireEvent.change(screen.getByLabelText('Cantidad de ajuste de la línea 1'), {
			target: { value: '-1' },
		});
		await waitFor(() =>
			expect(screen.queryByText('El producto no es de la filial.')).not.toBeInTheDocument(),
		);
	});

	it('muestra el stock resultante de la ubicación según la cantidad de ajuste', async () => {
		renderPage();
		await chooseMainWarehouse();
		const finalBalance = screen.getByTestId('ajuste-stock-resultante-0');
		expect(finalBalance).toHaveTextContent('—');

		await fillLine(ALFA, '-2');
		await waitFor(() => expect(finalBalance).toHaveTextContent('98'));

		fireEvent.change(screen.getByLabelText('Cantidad de ajuste de la línea 1'), {
			target: { value: '-101' },
		});
		await waitFor(() => expect(finalBalance).toHaveTextContent('-1'));
		expect(finalBalance.parentElement).toHaveClass('text-red-600');
	});

	it('bloquea la pantalla sin `edit-product`; con los mocks apagados sólo deja de avisar la simulación', () => {
		const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
		store.dispatch(auth.actions.deny());
		const denied = render(
			<Provider store={store}>
				<MemoryRouter initialEntries={['/?tab=ajuste']}>
					<AjustesTrasladosView />
				</MemoryRouter>
			</Provider>,
		);
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		denied.unmount();

		context.enabled = false;
		renderPage();
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
	});

	it('explica el 409 de una sola ubicación y no ofrece reenviar el mismo ajuste', async () => {
		vi.spyOn(service, 'createInventoryAdjustment').mockRejectedValueOnce({
			isAxiosError: true,
			response: {
				status: 409,
				data: {
					message: 'Esta filial todavía opera con una sola ubicación.',
					code: 'MULTI_LOCATION_NOT_ENABLED',
				},
			},
		});
		renderPage();
		await chooseMainWarehouse();
		await fillLine(ALFA, '-2');
		await goToReason('Conteo');
		fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Esta filial todavía opera con una sola ubicación.');
		expect(alert).toHaveTextContent(
			'el stock vive en «Sin ubicación», que es de donde salen las ventas. Registra el ajuste en «Sin ubicación».',
		);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Registrar ajuste' })).toBeDisabled(),
		);
		expect(screen.queryByRole('button', { name: 'Reintentar ajuste' })).not.toBeInTheDocument();
	});

	describe('con una sola ubicación (etapa 1)', () => {
		beforeEach(() => {
			multiLocation.enabled = false;
		});

		it('fija el ajuste en «Sin ubicación» y envía `warehouse_id: null`', async () => {
			const write = vi.spyOn(service, 'createInventoryAdjustment');
			renderPage();

			// Sin selector: el asistente abre en «Productos» con la ubicación fija.
			expect(
				await screen.findByRole('heading', { name: /Paso 2 de 3: Productos/ }),
			).toBeInTheDocument();
			expect(screen.getByText('Sin ubicación')).toBeInTheDocument();
			expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
			expect(
				screen.getByText('La sucursal opera con una sola ubicación'),
			).toBeInTheDocument();
			expect(
				screen.queryByRole('tab', { name: 'Traslados internos' }),
			).not.toBeInTheDocument();

			await fillLine(BETA, '1');
			await goToReason('Conteo: aparece una unidad');
			fireEvent.click(screen.getByRole('button', { name: 'Registrar ajuste' }));

			await screen.findByRole('table', { name: 'Saldos antes y después del ajuste' });
			expect(write).toHaveBeenCalledTimes(1);
			expect(write.mock.calls[0][1]).toMatchObject({ warehouse_id: null });
		});

		it('el paso «Ubicación» muestra la ubicación fija, sin bodegas que elegir', async () => {
			renderPage();
			await screen.findByRole('heading', { name: /Paso 2 de 3: Productos/ });
			fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

			expect(
				await screen.findByText(/todo el ajuste se registra en «Sin ubicación»/),
			).toBeInTheDocument();
			expect(screen.queryByRole('combobox', { name: 'Ubicación' })).not.toBeInTheDocument();
			expect(screen.queryByText('Bodega principal')).not.toBeInTheDocument();
		});
	});
});
