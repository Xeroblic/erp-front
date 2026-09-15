import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjustesTrasladosView from '@/pages/inventario/abastecimiento/AjustesTraslados/AjustesTrasladosView';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';

vi.mock('@/config/inventoryStock.config', () => ({ default: true }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: 2 }),
}));
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
			visible: { branches: [{ id: 4 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {},
});

const LocationProbe = () => {
	const location = useLocation();
	return <output data-testid='location'>{location.search}</output>;
};

const renderPage = (entry: string) => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[entry]}>
				<AjustesTrasladosView />
				<LocationProbe />
			</MemoryRouter>
		</Provider>,
	);
};

afterEach(() => {
	resetInventoryStockStoreForTests();
	vi.restoreAllMocks();
});

describe('Ajustes y traslados — una página con dos pestañas', () => {
	it('abre la pestaña de ajuste por omisión y sin montar el traslado', () => {
		renderPage('/');
		expect(screen.getByRole('tab', { name: 'Ajuste de inventario' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
		// El traslado no carga su stock hasta que se abre su pestaña.
		expect(screen.queryByLabelText('Origen')).not.toBeInTheDocument();
	});

	it('respeta `?tab=traslado` y descarta un valor desconocido', () => {
		const { unmount } = renderPage('/?tab=traslado');
		expect(screen.getByRole('tab', { name: 'Traslados internos' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByLabelText('Origen')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		unmount();

		renderPage('/?tab=otra');
		expect(screen.getByRole('tab', { name: 'Ajuste de inventario' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
	});

	it('cambia de pestaña en la URL sin descartar el formulario de la otra', () => {
		renderPage('/?tab=ajuste');
		fireEvent.change(screen.getByLabelText('Motivo'), {
			target: { value: 'Conteo a medias' },
		});

		fireEvent.click(screen.getByRole('tab', { name: 'Traslados internos' }));
		expect(screen.getByTestId('location')).toHaveTextContent('?tab=traslado');
		expect(screen.getByLabelText('Origen')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: 'Ajuste de inventario' }));
		expect(screen.getByTestId('location')).toHaveTextContent('?tab=ajuste');
		expect(screen.getByDisplayValue('Conteo a medias')).toBeInTheDocument();
	});
});
