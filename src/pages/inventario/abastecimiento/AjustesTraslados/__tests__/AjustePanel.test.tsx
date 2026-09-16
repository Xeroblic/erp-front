import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'react-toastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjustesTrasladosView from '@/pages/inventario/abastecimiento/AjustesTraslados/AjustesTrasladosView';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';

const context = vi.hoisted(() => ({
	branchId: 4 as number | null,
	subsidiaryId: 2,
	enabled: true,
}));
vi.mock('@/config/inventoryStock.config', () => ({
	get default() {
		return context.enabled;
	},
}));
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
 * en `StockPorUbicacion.test.tsx`, `SelectReact` se sustituye por un `<select>`
 * nativo cableado a las mismas props.
 */
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		'aria-label': ariaLabel,
		isDisabled,
		options,
		value,
		onChange,
		placeholder,
	}: {
		'aria-label'?: string;
		isDisabled?: boolean;
		options?: { value: string; label: string }[];
		value?: { value: string; label: string } | null;
		onChange?: (option: { value: string; label: string } | null) => void;
		placeholder?: string;
	}) => (
		<select
			aria-label={ariaLabel}
			disabled={isDisabled}
			value={value?.value ?? ''}
			onChange={(event) => {
				const selected =
					options?.find((option) => option.value === event.target.value) ?? null;
				onChange?.(selected);
			}}>
			<option value=''>{placeholder}</option>
			{options?.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	),
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
	const product = await screen.findByLabelText('Producto de la línea 1');
	// El catálogo no depende del saldo, pero el saldo por línea sí: esperar a
	// que cargue evita leer «…» en vez de un número.
	await waitFor(() =>
		expect(within(product).getByRole('option', { name: /Cable/ })).toBeInTheDocument(),
	);
	await waitFor(() => expect(screen.queryByText('…')).not.toBeInTheDocument());
};

/** Paso 2 → 3: avanza a «Motivo y confirmación» y, si se indica, escribe el motivo. */
const goToReason = async (reason?: string) => {
	await clickNext();
	const field = await screen.findByLabelText('Motivo');
	if (reason) fireEvent.change(field, { target: { value: reason } });
};

/** La bodega principal es la del fixture canónico del cable: 100 aptos. */
const chooseMainWarehouse = () => chooseLocation('warehouse:8');

/** Completa una línea del ajuste con producto y delta firmado. */
const fillLine = (productId: string, delta: string) => {
	fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
		target: { value: productId },
	});
	fireEvent.change(screen.getByLabelText('Sumar o restar en la línea 1'), {
		target: { value: delta },
	});
};

beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
});
afterEach(() => {
	resetInventoryStockStoreForTests();
	vi.restoreAllMocks();
});

describe('Ajuste de inventario — integración de vista, hook, slice y servicio', () => {
	it('aplica un egreso y muestra la tabla antes/después de físico, apto y no apto', async () => {
		renderPage();
		await chooseMainWarehouse();
		fillLine('58', '-2');
		await goToReason('Conteo físico: faltan dos unidades');
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		expect(
			within(table).getByRole('columnheader', { name: 'Antes → después' }),
		).toHaveAttribute('colspan', '3');

		const row = within(table).getAllByRole('row')[2];
		const cells = within(row).getAllByRole('cell');
		expect(cells[2]).toHaveTextContent('-2');
		// El fixture canónico del cable son 100 físicos aptos en la bodega principal.
		expect(cells[3]).toHaveTextContent('100');
		expect(cells[3]).toHaveTextContent('98');
		expect(cells[4]).toHaveTextContent('98');
		// El no apto no se movió: el ajuste no reclasifica entre condiciones.
		expect(cells[5]).toHaveTextContent('0');

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
		fillLine('58', '3');
		await goToReason('Conteo: aparecen tres unidades');
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		const cells = within(within(table).getAllByRole('row')[2]).getAllByRole('cell');
		expect(cells[2]).toHaveTextContent('+3');
		expect(cells[3]).toHaveTextContent('103');
	});

	it('ofrece el catálogo aunque el producto no tenga saldo en esa ubicación', async () => {
		renderPage();
		// «Sin ubicación» no tiene ni una unidad de cable: el conteo que las
		// encuentra tiene que poder nombrarlo igual.
		await chooseLocation('unlocated');
		fillLine('58', '3');
		await goToReason('Conteo: aparecen tres sin ubicar');

		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		const cells = within(within(table).getAllByRole('row')[2]).getAllByRole('cell');
		// De cero a tres: el saldo en cero no saca al producto del selector.
		expect(cells[3]).toHaveTextContent('0');
		expect(cells[3]).toHaveTextContent('3');
	});

	it('no marca en rojo las líneas en blanco al cambiar de ubicación', async () => {
		renderPage();
		await chooseMainWarehouse();
		fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
		await screen.findByLabelText('Ubicación');
		await chooseLocation('unlocated');

		expect(screen.queryByText('Selecciona un producto.')).not.toBeInTheDocument();
		expect(screen.queryByText('Indica cuánto sumar o restar.')).not.toBeInTheDocument();
		// La ubicación recién elegida tampoco se valida como vacía.
		expect(screen.queryByText('Indica la ubicación del ajuste.')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Sumar o restar en la línea 1')).not.toHaveClass(
			'!border-red-500',
		);
	});

	it('muestra el faltante frente a reservas sin truncarlo en cero', async () => {
		renderPage();
		await chooseLocation('unlocated');
		fillLine('31', '-3');
		await goToReason('Conteo físico: faltan tres mouse');
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));

		// El fixture reserva 16 de los 17 aptos de la sucursal: restar 3 deja el
		// disponible en −2, y eso se muestra.
		const available = await screen.findByTestId('ajuste-disponible-31');
		expect(available).toHaveTextContent('-2');
		expect(
			screen.getByText(/Faltante: 2 unidades comprometidas que no existen/),
		).toBeInTheDocument();
		const table = screen.getByRole('table', {
			name: 'Disponible en la sucursal frente a reservas',
		});
		const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
		expect(cells[3]).toHaveTextContent('16');
	});

	it('no avanza con un egreso enlazado a una recepción sin indicar su origen', async () => {
		const toastError = vi.spyOn(toast, 'error');
		renderPage();
		await chooseLocation('unlocated');
		fillLine('31', '-1');
		// La recepción enlazable aparece cuando cargan las procedencias del mouse.
		const receipt = screen.getByLabelText('Recepción enlazada (opcional)');
		await waitFor(() =>
			expect(within(receipt).getByRole('option', { name: 'Recepción #80' })).toBeEnabled(),
		);
		fireEvent.change(receipt, { target: { value: '80' } });

		await clickNext();

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(
				'Revisa las líneas marcadas antes de continuar.',
			),
		);
		expect(
			screen.getByText('Con una recepción enlazada, elige de qué compra descontar.'),
		).toBeInTheDocument();
		// El esquema lo detiene antes de escribir: el paso no avanza.
		expect(screen.queryByLabelText('Motivo')).not.toBeInTheDocument();
	});

	it('deriva a Recepciones en vez de ofrecer ingresar una compra', () => {
		renderPage();
		expect(screen.getByText('Otros movimientos de stock')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Recepciones' })).toHaveAttribute(
			'href',
			'/inventario/abastecimiento/recepciones',
		);
		// La pantalla no ofrece ninguna vía de ingreso de compra.
		expect(screen.queryByText(/Ingresar (una )?compra/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Proveedor/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Documento de compra/i)).not.toBeInTheDocument();
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
		fillLine('58', '0');
		await clickNext();
		expect(
			await screen.findByText('La cantidad a sumar o restar no puede ser cero.'),
		).toBeInTheDocument();
		expect(screen.queryByLabelText('Motivo')).not.toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Sumar o restar en la línea 1'), {
			target: { value: '-1' },
		});
		await goToReason();
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));
		expect(await screen.findByText('Indica el motivo del ajuste.')).toBeInTheDocument();

		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('explica el rechazo cuando el egreso dejaría el saldo bajo cero', async () => {
		renderPage();
		await chooseMainWarehouse();
		fillLine('58', '-9999');

		// Aviso en la línea antes de intentar escribir.
		expect(
			await screen.findByText('No puedes restar más de lo que hay (100).'),
		).toBeInTheDocument();

		await goToReason('Conteo');
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));
		const alert = await screen.findByRole('alert');
		expect(alert).not.toHaveTextContent('No se pudo registrar el ajuste.');
		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('muestra cuánto quedará en la ubicación al sumar o restar', async () => {
		renderPage();
		await chooseMainWarehouse();
		const finalBalance = screen.getByTestId('ajuste-quedara-0');
		expect(finalBalance).toHaveTextContent('—');

		fillLine('58', '-2');
		await waitFor(() => expect(finalBalance).toHaveTextContent('98'));

		fireEvent.change(screen.getByLabelText('Sumar o restar en la línea 1'), {
			target: { value: '-101' },
		});
		await waitFor(() => expect(finalBalance).toHaveTextContent('-1'));
		expect(finalBalance.parentElement).toHaveClass('text-red-600');
	});

	it('no ofrece elegir una procedencia para un ingreso positivo', async () => {
		renderPage();
		await chooseMainWarehouse();
		fillLine('58', '-1');
		expect(screen.getByLabelText('Origen a descontar en la línea 1')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Sumar o restar en la línea 1'), {
			target: { value: '3' },
		});
		await waitFor(() =>
			expect(
				screen.queryByLabelText('Origen a descontar en la línea 1'),
			).not.toBeInTheDocument(),
		);
		expect(
			screen.getByText(/No aplica al sumar: entra como ingreso por ajuste/),
		).toBeInTheDocument();
	});

	it('bloquea la pantalla sin `edit-product` y con los mocks apagados', () => {
		const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
		store.dispatch(auth.actions.deny());
		render(
			<Provider store={store}>
				<MemoryRouter initialEntries={['/?tab=ajuste']}>
					<AjustesTrasladosView />
				</MemoryRouter>
			</Provider>,
		);
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();

		context.enabled = false;
		renderPage();
		expect(screen.getByText('Ajustes y traslados no habilitados')).toBeInTheDocument();
	});
});
