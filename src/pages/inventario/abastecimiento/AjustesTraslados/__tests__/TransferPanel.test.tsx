import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
			<MemoryRouter initialEntries={['/?tab=traslado']}>
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
 * Paso 1 → 2: «Sin ubicación» como origen, la bodega principal como destino, y
 * espera a que cargue el catálogo del origen.
 */
const chooseRoute = async () => {
	fireEvent.change(screen.getByLabelText('Origen'), { target: { value: 'unlocated' } });
	fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'warehouse:8' } });
	await clickNext();
	const product = await screen.findByLabelText('Producto de la línea 1');
	await waitFor(() =>
		expect(within(product).getByRole('option', { name: /Mouse/ })).toBeInTheDocument(),
	);
};

/** Completa la primera línea con producto y cantidad. */
const fillLine = (productId: string, quantity: string) => {
	fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
		target: { value: productId },
	});
	fireEvent.change(screen.getByLabelText('Cantidad de la línea 1'), {
		target: { value: quantity },
	});
};

/** Paso 2 → 3: avanza a «Motivo y confirmación» y, si se indica, escribe el motivo. */
const goToReason = async (reason?: string) => {
	await clickNext();
	const field = await screen.findByLabelText('Motivo');
	if (reason) fireEvent.change(field, { target: { value: reason } });
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

		await chooseRoute();
		fillLine('31', '5');

		// La vista previa cuenta las unidades una vez, no una por efecto.
		expect(screen.getByTestId('traslado-preview')).toHaveTextContent(
			'Total a mover: 5 unidades',
		);

		await goToReason('Ubicar productos del conteo inicial');
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

		// El resultado reemplaza al asistente; «Nuevo traslado» vuelve al primer paso.
		expect(screen.queryByLabelText('Producto de la línea 1')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Nuevo traslado' }));
		expect(await screen.findByLabelText('Origen')).toHaveValue('unlocated');
		expect(screen.getByLabelText('Destino')).toHaveValue('warehouse:8');
	});

	it('no marca en rojo las líneas en blanco al elegir el origen', async () => {
		renderPage();
		fireEvent.change(screen.getByLabelText('Origen'), { target: { value: 'unlocated' } });
		// El origen recién elegido no se valida como vacío.
		await waitFor(() => expect(screen.getByLabelText('Origen')).toHaveValue('unlocated'));
		expect(screen.queryByText('Selecciona una ubicación de origen.')).not.toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'warehouse:8' } });
		await clickNext();
		await screen.findByLabelText('Producto de la línea 1');
		expect(screen.queryByText('Selecciona un producto.')).not.toBeInTheDocument();
		expect(screen.queryByText('Indica la cantidad.')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Cantidad de la línea 1')).not.toHaveClass('!border-red-500');
	});

	it('no avanza sin destino', async () => {
		renderPage();
		fireEvent.change(screen.getByLabelText('Origen'), { target: { value: 'unlocated' } });
		await clickNext();
		expect(await screen.findByText('Selecciona una ubicación de destino.')).toBeInTheDocument();
		expect(screen.queryByLabelText('Producto de la línea 1')).not.toBeInTheDocument();
	});

	it('no ofrece cambiar la condición dentro del traslado', async () => {
		renderPage();
		await chooseRoute();

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
		await chooseRoute();
		fillLine('31', '999');
		await goToReason('Mover de más');
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
		await chooseRoute();
		fillLine('31', '1');
		await goToReason();
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
				<MemoryRouter initialEntries={['/?tab=traslado']}>
					<AjustesTrasladosView />
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
		expect(screen.getByText('Ajustes y traslados no habilitados')).toBeInTheDocument();
	});
});
