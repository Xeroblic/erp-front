import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RecepcionesView from '../RecepcionesView';

/**
 * `?purchase_document_id=` abre el alta con documento sólo si se puede
 * registrar recepciones; sin permiso, avisa y limpia el parámetro en vez de
 * no hacer nada. Todo lo ajeno a esa decisión (listado, filtros, formulario)
 * se sustituye por dobles mínimos.
 */

const authDouble = vi.hoisted(() => ({ canWrite: true }));

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => authDouble.canWrite }),
}));
vi.mock('../hooks/useRecepciones', () => ({
	default: () => ({
		branchId: 4,
		subsidiaryId: 2,
		visibleBranches: [{ id: 4, name: 'Central' }],
		items: [],
		meta: null,
		loading: false,
		error: null,
		search: '',
		status: '',
		warehouseId: '',
		receivedFrom: '',
		receivedTo: '',
		statusOptions: [],
		hasActiveFilters: false,
		setSearchValue: vi.fn(),
		clearFilters: vi.fn(),
		setStatusValue: vi.fn(),
		setWarehouseIdValue: vi.fn(),
		setReceivedFromValue: vi.fn(),
		setReceivedToValue: vi.fn(),
		onPaginationChange: vi.fn(),
		refresh: vi.fn(),
	}),
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/procurement', () => ({ ProcurementMockNotice: () => null }));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children }: { children: ReactNode }) => <button type='button'>{children}</button>,
}));
vi.mock('../components/filters/RecepcionesFilters', () => ({ default: () => null }));
vi.mock('../components/tables/RecepcionesTable', () => ({ default: () => null }));
vi.mock('../components/modals/StockReceiptFormModal', () => ({
	default: ({ isOpen, initialDocumentId }: { isOpen: boolean; initialDocumentId?: number }) =>
		isOpen ? (
			<div role='dialog' aria-label='Alta de recepción'>
				documento {initialDocumentId}
			</div>
		) : null,
}));

const DENIED_MESSAGE = 'No tienes permiso para registrar recepciones en esta sucursal.';

const LocationProbe = () => {
	const location = useLocation();
	return <output data-testid='location'>{location.search}</output>;
};

// Repite la llegada desde la ficha del documento sin desmontar la vista.
const RetryProbe = () => {
	const navigate = useNavigate();
	return (
		<button
			type='button'
			onClick={() =>
				navigate('/inventario/abastecimiento/recepciones?purchase_document_id=9')
			}>
			Volver a intentar
		</button>
	);
};

// Sólo para los componentes del Design System que leen el tema del store.
const store = configureStore({ reducer: { auth: (state: object = {}) => state } });
const page = (entry: string) => (
	<Provider store={store}>
		<MemoryRouter initialEntries={[entry]}>
			<RecepcionesView />
			<LocationProbe />
			<RetryProbe />
		</MemoryRouter>
	</Provider>
);
const renderPage = (entry: string) => render(page(entry));

describe('RecepcionesView — alta desde ?purchase_document_id=', () => {
	it('sin permiso avisa, limpia sólo el parámetro y no abre el alta', async () => {
		authDouble.canWrite = false;
		renderPage('/inventario/abastecimiento/recepciones?purchase_document_id=9&status=draft');

		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByTestId('location')).toHaveTextContent('?status=draft'),
		);
		expect(screen.getByTestId('location')).not.toHaveTextContent('purchase_document_id');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('el aviso se cierra con un botón etiquetado y reaparece en cada intento', async () => {
		authDouble.canWrite = false;
		renderPage('/inventario/abastecimiento/recepciones?purchase_document_id=9');
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Volver a intentar' }));
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('con permiso abre el alta con el documento y no avisa', async () => {
		authDouble.canWrite = true;
		renderPage('/inventario/abastecimiento/recepciones?purchase_document_id=9');

		expect(await screen.findByRole('dialog', { name: 'Alta de recepción' })).toHaveTextContent(
			'documento 9',
		);
		expect(screen.getByTestId('location')).toHaveTextContent('?purchase_document_id=9');
		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
	});

	it('perder el permiso con el alta abierta la cierra y limpia el parámetro', async () => {
		authDouble.canWrite = true;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByRole('dialog')).toBeInTheDocument();

		authDouble.canWrite = false;
		rerender(page(entry));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(screen.getByTestId('location')).toHaveTextContent('');
	});

	it('sin parámetro y sin permiso no muestra el aviso', () => {
		authDouble.canWrite = false;
		renderPage('/inventario/abastecimiento/recepciones');

		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
