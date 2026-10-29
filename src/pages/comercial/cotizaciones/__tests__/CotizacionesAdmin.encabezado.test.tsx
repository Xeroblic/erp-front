import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import CotizacionesAdmin from '../CotizacionesAdmin';

type EstadoAuth = {
	isAuthenticated: boolean;
	access?: string;
	user?: undefined;
	loading: boolean;
	permisos: string[];
};

const estadoAuth: EstadoAuth = {
	isAuthenticated: true,
	access: 'token-de-prueba',
	user: undefined,
	loading: false,
	permisos: [],
};

// PageWrapper y useAuthorization (vía Button) leen el store por `@/store`. El resto
// del árbol usa `@/store/hook`, que se sirve del Provider real de más abajo.
vi.mock('@/store', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/store')>();
	return {
		...actual,
		useAppDispatch: () => vi.fn(),
		useAppSelector: (selector: (estado: { auth: EstadoAuth; core: unknown }) => unknown) =>
			selector({
				auth: estadoAuth,
				core: { listaComunas: [], listaProvincias: [], listaRegiones: [] },
			}),
	};
});

vi.mock('react-router-dom', () => ({
	useNavigate: () => vi.fn(),
	useParams: () => ({}),
	Navigate: () => null,
}));

vi.mock('../hooks/useQuotationsManager', () => ({
	default: () => ({
		quotations: [],
		filteredQuotations: [],
		loading: false,
		error: null,
		totalItems: 0,
		filters: {},
		setFilters: vi.fn(),
		currentPage: 1,
		setCurrentPage: vi.fn(),
		itemsPerPage: 10,
		setItemsPerPage: vi.fn(),
		stats: {},
		createQuotation: vi.fn(),
		updateQuotation: vi.fn(),
		deleteQuotation: vi.fn(),
		duplicateQuotation: vi.fn(),
		changeStatus: vi.fn(),
		convertToSale: vi.fn(),
		refreshData: vi.fn(),
		exportQuotations: vi.fn(),
		getQuotationById: vi.fn(),
		resetFilters: vi.fn(),
		loadQuotationDetails: vi.fn(),
	}),
}));

vi.mock('../components/tables/QuotationsTable', () => ({ default: () => null }));
vi.mock('../components/StatsCards', () => ({ StatsCards: () => null }));
vi.mock('../components/FiltersSection', () => ({ FiltersSection: () => null }));
vi.mock('../components/modals/ModalCreacion/CreateQuotationModal', () => ({
	default: () => null,
}));
vi.mock('../components/modals/ModalEditar/EditQuotationModal', () => ({ default: () => null }));
vi.mock('../components/modals/QuotationDetailsModal', () => ({
	QuotationDetailsModal: () => null,
}));
vi.mock('../components/modals/DuplicateQuotationModal', () => ({ default: () => null }));
vi.mock('../components/modals/DeleteQuotationModal', () => ({ default: () => null }));
vi.mock('../components/modals/ConfirmSale', () => ({ ConfirmSaleModal: () => null }));

const renderizar = () =>
	render(
		<Provider store={store}>
			<CotizacionesAdmin />
		</Provider>,
	);

describe('CotizacionesAdmin', () => {
	beforeEach(() => {
		document.title = '';
	});

	it('publica un document.title legible en vez del slug interno del componente', () => {
		renderizar();

		expect(document.title).toBe('Cotizaciones | ERP');
		expect(document.title).not.toContain('cotizaciones-admin');
		expect(document.title.startsWith(' | ')).toBe(false);
	});

	it('expone el encabezado de la página como h1 accesible', () => {
		renderizar();

		expect(screen.getByRole('heading', { level: 1, name: 'Cotizaciones' })).toBeInTheDocument();
		expect(
			screen.getByText('Gestión completa de cotizaciones comerciales'),
		).toBeInTheDocument();
	});
});
