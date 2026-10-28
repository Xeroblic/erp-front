import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecepcionesView from '../RecepcionesView';

/**
 * `?purchase_document_id=` abre el alta con documento sólo si se puede
 * registrar recepciones; sin permiso, avisa y limpia el parámetro en vez de
 * no hacer nada. Todo lo ajeno a esa decisión (listado, filtros, formulario)
 * se sustituye por dobles mínimos.
 */

const authDouble = vi.hoisted(() => ({ canWrite: true }));
const contextDouble = vi.hoisted((): { subsidiaryId: number | null } => ({ subsidiaryId: 2 }));

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => authDouble.canWrite }),
}));
vi.mock('../hooks/useRecepciones', () => ({
	default: () => ({
		branchId: 4,
		subsidiaryId: contextDouble.subsidiaryId,
		authorizedBranchIds: [4],
		items: [],
		meta: null,
		loading: false,
		error: null,
		search: '',
		status: '',
		warehouseId: '',
		warehouseOptions: [],
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
	beforeEach(() => {
		contextDouble.subsidiaryId = 2;
	});

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

	it('si el permiso llega con el aviso abierto, abre el alta con ese documento', async () => {
		authDouble.canWrite = false;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''));

		authDouble.canWrite = true;
		rerender(page(entry));

		expect(await screen.findByRole('dialog', { name: 'Alta de recepción' })).toHaveTextContent(
			'documento 9',
		);
		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
	});

	it('cerrado el aviso, un permiso posterior ya no abre el alta', async () => {
		authDouble.canWrite = false;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		fireEvent.click(await screen.findByRole('button', { name: 'Cerrar aviso' }));

		authDouble.canWrite = true;
		rerender(page(entry));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('si cambia la filial con el aviso abierto, descarta el alta pedida aunque la nueva tenga permiso', async () => {
		authDouble.canWrite = false;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''));

		contextDouble.subsidiaryId = 3;
		authDouble.canWrite = true;
		rerender(page(entry));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

		// Volver a la filial de origen tampoco revive la intención descartada.
		contextDouble.subsidiaryId = 2;
		rerender(page(entry));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
	});

	it('el alta abierta desde el aviso se cierra si después cambia la filial', async () => {
		authDouble.canWrite = false;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''));
		authDouble.canWrite = true;
		rerender(page(entry));
		expect(await screen.findByRole('dialog')).toHaveTextContent('documento 9');

		contextDouble.subsidiaryId = 3;
		rerender(page(entry));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('si cambia la filial sin permiso en ninguna, el aviso de la anterior desaparece', async () => {
		authDouble.canWrite = false;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();

		contextDouble.subsidiaryId = 3;
		rerender(page(entry));

		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
	});

	it('si la filial aún no cargó al llegar sin permiso, el alta se abre cuando el perfil termina de cargar', async () => {
		authDouble.canWrite = false;
		contextDouble.subsidiaryId = null;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByText(DENIED_MESSAGE)).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''));

		contextDouble.subsidiaryId = 2;
		authDouble.canWrite = true;
		rerender(page(entry));

		expect(await screen.findByRole('dialog', { name: 'Alta de recepción' })).toHaveTextContent(
			'documento 9',
		);
	});

	it('el alta abierta con permiso desde la URL se cierra y limpia el parámetro si cambia la filial', async () => {
		authDouble.canWrite = true;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9&status=draft';
		const { rerender } = renderPage(entry);
		expect(await screen.findByRole('dialog')).toHaveTextContent('documento 9');

		contextDouble.subsidiaryId = 3;
		rerender(page(entry));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await waitFor(() =>
			expect(screen.getByTestId('location')).toHaveTextContent('?status=draft'),
		);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
	});

	it('si cambia a una filial sin permiso con el alta de la URL abierta, no deja pendiente el documento de la anterior', async () => {
		authDouble.canWrite = true;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByRole('dialog')).toHaveTextContent('documento 9');

		contextDouble.subsidiaryId = 3;
		authDouble.canWrite = false;
		rerender(page(entry));

		await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();

		authDouble.canWrite = true;
		rerender(page(entry));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('el alta abierta desde la URL con la filial aún sin resolver sigue abierta cuando el perfil termina de cargar', async () => {
		authDouble.canWrite = true;
		contextDouble.subsidiaryId = null;
		const entry = '/inventario/abastecimiento/recepciones?purchase_document_id=9';
		const { rerender } = renderPage(entry);
		expect(await screen.findByRole('dialog')).toHaveTextContent('documento 9');

		contextDouble.subsidiaryId = 2;
		rerender(page(entry));

		expect(screen.getByRole('dialog')).toHaveTextContent('documento 9');
		expect(screen.getByTestId('location')).toHaveTextContent('?purchase_document_id=9');
	});

	it('sin parámetro y sin permiso no muestra el aviso', () => {
		authDouble.canWrite = false;
		renderPage('/inventario/abastecimiento/recepciones');

		expect(screen.queryByText(DENIED_MESSAGE)).not.toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
