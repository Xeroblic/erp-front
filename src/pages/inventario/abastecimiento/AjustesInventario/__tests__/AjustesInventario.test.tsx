import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjusteInventarioView from '@/pages/inventario/abastecimiento/AjustesInventario/AjusteInventarioView';
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
			<MemoryRouter>
				<AjusteInventarioView />
			</MemoryRouter>
		</Provider>,
	);
	return { ...view, store };
};

/** Elige una ubicación y espera a que su saldo deje de estar cargando. */
const chooseLocation = async (token: string) => {
	fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: token } });
	// El catálogo no depende del saldo, pero el saldo por línea sí: esperar a
	// que cargue evita leer «…» en vez de un número.
	await waitFor(() =>
		expect(
			within(screen.getByLabelText('Producto de la línea 1')).getByRole('option', {
				name: /Cable/,
			}),
		).toBeInTheDocument(),
	);
	await waitFor(() => expect(screen.queryByText('…')).not.toBeInTheDocument());
};

/** La bodega principal es la del fixture canónico del cable: 100 aptos. */
const chooseMainWarehouse = () => chooseLocation('warehouse:8');

/** Completa una línea del ajuste con producto y delta firmado. */
const fillLine = (productId: string, delta: string) => {
	fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
		target: { value: productId },
	});
	fireEvent.change(screen.getByLabelText('Diferencia de la línea 1'), {
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
		fireEvent.change(screen.getByLabelText('Motivo'), {
			target: { value: 'Conteo físico: faltan dos unidades' },
		});
		fillLine('58', '-2');
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
	});

	it('registra un ingreso positivo sin procedencia y lo confirma', async () => {
		renderPage();
		await chooseMainWarehouse();
		fireEvent.change(screen.getByLabelText('Motivo'), {
			target: { value: 'Conteo: aparecen tres unidades' },
		});
		fillLine('58', '3');
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
		fireEvent.change(screen.getByLabelText('Motivo'), {
			target: { value: 'Conteo: aparecen tres sin ubicar' },
		});
		fillLine('58', '3');
		expect(screen.getByLabelText('Diferencia de la línea 1')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));

		const table = await screen.findByRole('table', {
			name: 'Saldos antes y después del ajuste',
		});
		const cells = within(within(table).getAllByRole('row')[2]).getAllByRole('cell');
		// De cero a tres: el saldo en cero no saca al producto del selector.
		expect(cells[3]).toHaveTextContent('0');
		expect(cells[3]).toHaveTextContent('3');
	});

	it('muestra el faltante frente a reservas sin truncarlo en cero', async () => {
		renderPage();
		await chooseLocation('unlocated');
		fireEvent.change(screen.getByLabelText('Motivo'), {
			target: { value: 'Conteo físico: faltan tres mouse' },
		});
		fillLine('31', '-3');
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

	it('no envía un egreso enlazado a una recepción sin indicar su origen', async () => {
		renderPage();
		await chooseLocation('unlocated');
		fillLine('31', '-1');
		// La recepción enlazable aparece cuando cargan las procedencias del mouse.
		const receipt = screen.getByLabelText('Recepción enlazada (opcional)');
		await waitFor(() =>
			expect(within(receipt).getByRole('option', { name: 'Recepción #80' })).toBeEnabled(),
		);
		fireEvent.change(receipt, { target: { value: '80' } });
		fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Conteo' } });

		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));

		expect(
			await screen.findByText('Con una recepción enlazada el egreso debe indicar un origen.'),
		).toBeInTheDocument();
		// El esquema lo detiene antes de escribir: no es un rechazo del servicio.
		expect(screen.queryByText('No se pudo registrar el ajuste')).not.toBeInTheDocument();
		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('deriva a Recepciones en vez de ofrecer ingresar una compra', () => {
		renderPage();
		expect(screen.getByText('¿Es una compra?')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Ir a Recepciones' })).toHaveAttribute(
			'href',
			'/inventario/abastecimiento/recepciones',
		);
		// La pantalla no ofrece ninguna vía de ingreso de compra.
		expect(screen.queryByText(/Ingresar (una )?compra/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Proveedor/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Documento de compra/i)).not.toBeInTheDocument();
	});

	it('no envía sin motivo ni con una diferencia de cero', async () => {
		renderPage();
		await chooseMainWarehouse();
		fillLine('58', '-1');
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));
		expect(await screen.findByText('Indica el motivo del ajuste.')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Conteo' } });
		fireEvent.change(screen.getByLabelText('Diferencia de la línea 1'), {
			target: { value: '0' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));
		expect(
			await screen.findByText('La diferencia debe ser distinta de cero.'),
		).toBeInTheDocument();

		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('explica el rechazo cuando el egreso dejaría el saldo bajo cero', async () => {
		renderPage();
		await chooseMainWarehouse();
		fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Conteo' } });
		fillLine('58', '-9999');

		// Aviso en la línea antes de intentar escribir.
		expect(
			await screen.findByText('El egreso dejaría el saldo bajo cero (hay 100).'),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Aplicar ajuste' }));
		const alert = await screen.findByRole('alert');
		expect(alert).not.toHaveTextContent('No se pudo registrar el ajuste.');
		expect(
			screen.queryByRole('table', { name: 'Saldos antes y después del ajuste' }),
		).not.toBeInTheDocument();
	});

	it('no ofrece elegir una procedencia para un ingreso positivo', async () => {
		renderPage();
		await chooseMainWarehouse();
		fillLine('58', '-1');
		expect(screen.getByLabelText('Procedencia de la línea 1')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Diferencia de la línea 1'), {
			target: { value: '3' },
		});
		await waitFor(() =>
			expect(screen.queryByLabelText('Procedencia de la línea 1')).not.toBeInTheDocument(),
		);
		expect(
			screen.getByText(/Un ingreso crea un origen de ajuste: no se atribuye/),
		).toBeInTheDocument();
	});

	it('bloquea la pantalla sin `edit-product` y con los mocks apagados', () => {
		const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
		store.dispatch(auth.actions.deny());
		render(
			<Provider store={store}>
				<MemoryRouter>
					<AjusteInventarioView />
				</MemoryRouter>
			</Provider>,
		);
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();

		context.enabled = false;
		renderPage();
		expect(screen.getByText('Ajustes no habilitados')).toBeInTheDocument();
	});
});
