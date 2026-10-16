import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	IReplenishmentCandidatesPage,
	IReplenishmentReportRow,
	TReplenishmentStatus,
} from '@/interface/inventoryReports.interface';
import listReplenishmentCandidates from '@/services/procurement/replenishment.service';
import useInventoryReportFilters from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import AccionesReport from '@/pages/reportes/inventory-reports/components/views/AccionesReport';
import type { IInventoryReportContext } from '@/pages/reportes/inventory-reports/types';

/**
 * Acciones contra `GET P/replenishment-candidates` (§13): lo que viaja en la
 * petición sale de la URL, las pestañas cuentan con `status_counts`, cada
 * estado tiene su rótulo y los enlaces respetan el `authority` del destino.
 * Sólo se reemplazan el servicio y los permisos.
 */

vi.mock('@/services/procurement/replenishment.service', () => ({ default: vi.fn() }));

const granted = vi.hoisted(() => ({ perms: new Set<string>() }));
vi.mock('@/hooks/useCan', () => ({
	default: () => ({ all: (perms: string[]) => perms.every((perm) => granted.perms.has(perm)) }),
}));

const listMock = vi.mocked(listReplenishmentCandidates);

const BRANCH_IDS = [4];
const CONTEXT: IInventoryReportContext = {
	subsidiaryId: 2,
	owner: '1:2',
	branches: [{ id: 4, name: 'Casa matriz' }],
	scopeLabel: 'Todas las sucursales',
	companyName: 'Filial 2',
	sourceOf: () => 'api',
};

const row = (
	id: number,
	status: TReplenishmentStatus,
	values: Partial<IReplenishmentReportRow['stock']> = {},
	recommendation: Partial<IReplenishmentReportRow['recommendation']> = {},
): IReplenishmentReportRow => ({
	product: { id, sku: `SKU-${id}`, name: `Producto ${id}` },
	stock: {
		physical_quantity: 5,
		available_quantity: 1,
		threshold: 10,
		status: 'critical',
		...values,
	},
	recommendation: {
		status,
		historical_supplier_count: 0,
		eligible_supplier_count: 0,
		supplier: null,
		last_purchase: null,
		...recommendation,
	},
});

const ROWS: IReplenishmentReportRow[] = [
	row(
		31,
		'suggested',
		{ available_quantity: -3 },
		{
			historical_supplier_count: 2,
			eligible_supplier_count: 1,
			supplier: { id: 7, display_name: 'PCExpress', rut: '76123456-0', is_active: true },
			last_purchase: {
				received_on: '2026-09-04',
				days_since_purchase: 1,
				quantity: 15,
				purchase_document: null,
			},
		},
	),
	row(32, 'without_supplier_history'),
	row(33, 'no_active_suppliers', {}, { historical_supplier_count: 2 }),
	row(34, 'no_comparable_cost', {}, { historical_supplier_count: 3, eligible_supplier_count: 0 }),
];

const page = (
	values: Partial<IReplenishmentCandidatesPage> = {},
): IReplenishmentCandidatesPage => ({
	rows: ROWS,
	page: 1,
	lastPage: 1,
	total: ROWS.length,
	statusCounts: {
		suggested: 3,
		without_supplier_history: 1,
		no_active_suppliers: 0,
		no_comparable_cost: 2,
	},
	...values,
});

const LocationProbe = () => {
	const { pathname, search, hash } = useLocation();
	return <output data-testid='location'>{`${pathname}${search}${hash}`}</output>;
};

const Harness = () => {
	const filtersApi = useInventoryReportFilters(BRANCH_IDS);
	return <AccionesReport context={CONTEXT} filtersApi={filtersApi} />;
};

const renderAcciones = (query = '') => {
	const store = configureStore({
		reducer: {
			auth: (state: object = { user: { id: 1 } }) => state,
			personalizacion: (state: object = { personalizacionUsuario: {} }) => state,
		},
	});
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[`/reportes/inventario?vista=acciones${query}`]}>
				<Harness />
				<LocationProbe />
			</MemoryRouter>
		</Provider>,
	);
};

const lastParams = () => listMock.mock.calls.at(-1)?.[1];
const tabs = () => within(screen.getByRole('group', { name: 'Estado de la recomendación' }));

beforeEach(() => {
	listMock.mockReset();
	listMock.mockResolvedValue(page());
	granted.perms = new Set(['view-product', 'view-procurement-supplier']);
});

describe('AccionesReport — reposición desde la API', () => {
	it('pide la filial con la búsqueda, el estado y la página de la URL', async () => {
		renderAcciones('&q=mouse&reposicion=no_comparable_cost&page=2&per_page=50');

		await waitFor(() => expect(listMock).toHaveBeenCalled());
		expect(listMock.mock.calls[0]?.[0]).toBe(2);
		expect(lastParams()).toEqual({
			search: 'mouse',
			recommendation_status: 'no_comparable_cost',
			page: 2,
			per_page: 50,
		});
	});

	it('sin filtros sólo viaja la paginación', async () => {
		renderAcciones();

		await waitFor(() => expect(listMock).toHaveBeenCalled());
		expect(lastParams()).toEqual({ page: 1, per_page: 20 });
	});

	it('las pestañas cuentan con status_counts y elegir una filtra la petición', async () => {
		renderAcciones('&page=3');

		await screen.findByText('Producto 31');
		expect(tabs().getByRole('button', { name: 'Todos · 6' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		expect(tabs().getByRole('button', { name: 'Sin proveedores activos · 0' })).toBeVisible();

		fireEvent.click(tabs().getByRole('button', { name: 'Sin costo comparable · 2' }));

		await waitFor(() =>
			expect(lastParams()).toEqual({
				recommendation_status: 'no_comparable_cost',
				page: 1,
				per_page: 20,
			}),
		);
		expect(screen.getByTestId('location')).toHaveTextContent('reposicion=no_comparable_cost');
		expect(tabs().getByRole('button', { name: 'Sin costo comparable · 2' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
	});

	it('rotula los cuatro estados en español', async () => {
		renderAcciones();

		const table = within(await screen.findByRole('table', { name: 'Reporte de reposición' }));
		[
			'Proveedor sugerido',
			'Sin compras anteriores',
			'Sin proveedores activos',
			'Sin costo comparable',
		].forEach((label) => expect(table.getAllByText(label).length).toBeGreaterThan(0));
		expect(table.queryByText(/without_supplier_history|no_active_suppliers/)).toBeNull();
	});

	it('muestra el disponible negativo como faltante', async () => {
		renderAcciones();

		const productRow = (await screen.findByText('Producto 31')).closest('tr');
		expect(productRow).not.toBeNull();
		const cells = within(productRow as HTMLElement);
		expect(cells.getByText('-3')).toHaveClass('text-red-700');
		expect(cells.getByText('Reservado sobre lo apto')).toBeVisible();
	});

	it('sin sugerido muestra cuántos proveedores le vendieron y cuántos son elegibles', async () => {
		renderAcciones();

		const productRow = within(
			(await screen.findByText('Producto 34')).closest('tr') as HTMLElement,
		);
		expect(productRow.getByText('3 proveedores con compras')).toBeVisible();
		expect(productRow.getByText('0 elegibles')).toBeVisible();
	});

	it('enlaza a la ficha, a sus compras y al proveedor sugerido', async () => {
		renderAcciones();

		fireEvent.click(await screen.findByRole('button', { name: 'Ver compras de Producto 31' }));
		expect(screen.getByTestId('location')).toHaveTextContent('/inventario/stock/31#compras');
	});

	it('oculta los enlaces que el usuario no puede abrir', async () => {
		granted.perms = new Set(['view-product']);
		renderAcciones();

		await screen.findByText('Producto 31');
		expect(screen.getByRole('button', { name: 'Ver ficha de Producto 31' })).toBeVisible();
		expect(screen.queryByRole('button', { name: 'Ver proveedor PCExpress' })).toBeNull();
	});

	it('vuelve a la última página si la de la URL ya no existe', async () => {
		listMock.mockResolvedValueOnce(page({ rows: [], page: 5, lastPage: 2, total: 30 }));
		renderAcciones('&page=5');

		await waitFor(() => expect(lastParams()).toEqual({ page: 2, per_page: 20 }));
	});
});
