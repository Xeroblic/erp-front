import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import TrasladosInternosView from '@/pages/inventario/abastecimiento/TrasladosInternos/TrasladosInternosView';
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
			// Sección 15: traslados y ajustes exigen `edit-product`.
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
				<TrasladosInternosView />
			</MemoryRouter>
		</Provider>,
	);
	return { ...view, store };
};

/** Elige «Sin ubicación» como origen y espera a que cargue su catálogo. */
const chooseUnlocatedOrigin = async () => {
	fireEvent.change(screen.getByLabelText('Origen'), { target: { value: 'unlocated' } });
	await waitFor(() =>
		expect(
			within(screen.getByLabelText('Producto de la línea 1')).getByRole('option', {
				name: /Mouse/,
			}),
		).toBeInTheDocument(),
	);
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

describe('Traslados internos — integración de vista, hook, slice y servicio', () => {
	it('registra un traslado y lo confirma como 5 unidades movidas con neto cero', async () => {
		renderPage();
		expect(screen.getByText('Datos simulados')).toBeInTheDocument();

		await chooseUnlocatedOrigin();
		fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'warehouse:8' } });
		fireEvent.change(screen.getByLabelText('Motivo'), {
			target: { value: 'Ubicar productos del conteo inicial' },
		});
		fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
			target: { value: '31' },
		});
		fireEvent.change(screen.getByLabelText('Cantidad de la línea 1'), {
			target: { value: '5' },
		});

		// La vista previa cuenta las unidades una vez, no una por efecto.
		expect(screen.getByTestId('traslado-preview')).toHaveTextContent(
			'5 unidades · Efecto neto en la sucursal: 0',
		);

		fireEvent.click(screen.getByRole('button', { name: 'Registrar traslado' }));

		const table = await screen.findByRole('table', { name: 'Saldos después del traslado' });
		expect(screen.getByText('5 unidades movidas')).toBeInTheDocument();
		expect(screen.getByTestId('traslado-neto')).toHaveTextContent(
			'Efecto neto en la sucursal: 0 unidades',
		);
		// Nunca 10: el criterio de aceptación explícito de la card.
		expect(screen.queryByText(/10 unidades movidas/)).not.toBeInTheDocument();

		const row = within(table).getAllByRole('row')[1];
		expect(within(row).getByText('Apto')).toBeInTheDocument();
		// Saldos de la MISMA condición: el mouse sin ubicar tiene 13 aptos
		// (origins 52 y 51 del fixture), así que quedan 8 acá y 5 allá.
		expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('8');
		expect(within(row).getAllByRole('cell')[4]).toHaveTextContent('5');
	});

	it('no ofrece cambiar la condición dentro del traslado', async () => {
		renderPage();
		await chooseUnlocatedOrigin();

		// Una sola condición por línea: no existe «condición de destino».
		expect(screen.getByLabelText('Condición de la línea 1')).toBeInTheDocument();
		expect(screen.queryByLabelText(/Condición de destino/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Condición de origen/i)).not.toBeInTheDocument();
		expect(screen.getByText(/La condición no cambia en un traslado/)).toBeInTheDocument();
	});

	it('no ofrece una ubicación de otra sucursal como destino, y excluye el origen elegido', async () => {
		renderPage();
		const destination = screen.getByLabelText('Destino');
		const optionNames = () =>
			within(destination)
				.getAllByRole('option')
				.map((option) => option.textContent);

		// La bodega 15 es de la sucursal 6: no puede aparecer nunca.
		expect(optionNames()).not.toContain('Bodega Sur');
		expect(optionNames()).toContain('Sin ubicación');

		fireEvent.change(screen.getByLabelText('Origen'), { target: { value: 'unlocated' } });
		await waitFor(() => expect(optionNames()).not.toContain('Sin ubicación'));
	});

	it('explica el 409 de saldo insuficiente sin dejar el mensaje en genérico', async () => {
		renderPage();
		await chooseUnlocatedOrigin();
		fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'warehouse:8' } });
		fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Mover de más' } });
		fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
			target: { value: '31' },
		});
		fireEvent.change(screen.getByLabelText('Cantidad de la línea 1'), {
			target: { value: '999' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar traslado' }));

		const alert = await screen.findByRole('alert');
		expect(alert.textContent).toBeTruthy();
		expect(alert).not.toHaveTextContent('No se pudo registrar el traslado.');
		expect(
			screen.queryByRole('table', { name: 'Saldos después del traslado' }),
		).not.toBeInTheDocument();
	});

	it('no envía sin motivo', async () => {
		renderPage();
		await chooseUnlocatedOrigin();
		fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'warehouse:8' } });
		fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
			target: { value: '31' },
		});
		fireEvent.change(screen.getByLabelText('Cantidad de la línea 1'), {
			target: { value: '1' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar traslado' }));

		expect(await screen.findByText('Indica el motivo del traslado.')).toBeInTheDocument();
		expect(
			screen.queryByRole('table', { name: 'Saldos después del traslado' }),
		).not.toBeInTheDocument();
	});

	it('bloquea la pantalla sin `edit-product`, sin sucursal y con los mocks apagados', () => {
		const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
		store.dispatch(auth.actions.deny());
		render(
			<Provider store={store}>
				<MemoryRouter>
					<TrasladosInternosView />
				</MemoryRouter>
			</Provider>,
		);
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(screen.queryByLabelText('Origen')).not.toBeInTheDocument();

		context.branchId = null;
		renderPage();
		expect(screen.getByText('Selecciona una sucursal')).toBeInTheDocument();

		context.branchId = 4;
		context.enabled = false;
		renderPage();
		expect(screen.getByText('Traslados no habilitados')).toBeInTheDocument();
	});
});
