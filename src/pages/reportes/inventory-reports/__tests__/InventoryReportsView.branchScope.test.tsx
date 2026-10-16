import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IInventoryReportContext } from '@/pages/reportes/inventory-reports/types';
import type { TInventoryReportFiltersApi } from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import InventoryReportsView from '../InventoryReportsView';

/**
 * Integración de `?sucursal=` con el store real: el usuario llega con la forma
 * de `/perfil` (`access`/`visible.branches` con su filial) y la vista debe
 * validar contra esas sucursales, sin listas prefijadas. Sólo se reemplazan la
 * autorización, la consulta de tipos de reporte y el contenido de cada pestaña.
 */

// Permisos que el usuario NO tiene; por defecto, todos los tiene.
const denied = vi.hoisted(() => ({ perms: new Set<string>() }));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: ({ permission }: { permission?: string }) =>
			!permission || !denied.perms.has(permission),
		isLoading: false,
	}),
}));
vi.mock('@/pages/reportes/inventory-reports/hooks/useInventoryReportSources', () => ({
	default: () => ({ ready: true, sourceOf: () => 'api' }),
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/authorization/PermissionGuard', () => ({ default: () => null }));
vi.mock('@/pages/reportes/inventory-reports/components/views/DatosReport', () => ({
	default: ({
		context,
		filtersApi,
	}: {
		context: IInventoryReportContext;
		filtersApi: TInventoryReportFiltersApi;
	}) => (
		<section aria-label='Reporte'>
			<output data-testid='sucursal'>{String(filtersApi.filters.sucursal)}</output>
			<output data-testid='alcance'>{context.scopeLabel}</output>
			<output data-testid='sucursales'>
				{context.branches.map((branch) => branch.id).join(',')}
			</output>
		</section>
	),
}));

const branchRef = (id: number, name: string, subsidiaryId: number) => ({
	id,
	name,
	subsidiary: { id: subsidiaryId, name: `Filial ${subsidiaryId}` },
});

// Usuario como lo entrega `/perfil`: filial activa 2, sucursal principal 4.
const profileUser = {
	id: 1,
	branch: { id: 4, branch_name: 'Casa matriz', subsidiary_id: 2 },
	access: {
		subsidiaries: [],
		branches: [branchRef(4, 'Casa matriz', 2), branchRef(5, 'Norte', 2)],
	},
	visible: {
		subsidiaries: [],
		branches: [branchRef(9, 'Otra empresa', 3)],
	},
};

const renderReports = (entry: string) => {
	const store = configureStore({
		reducer: {
			auth: (state: object = { user: profileUser }) => state,
			personalizacion: (
				state: object = {
					personalizacionUsuario: { sucursal_principal: 4, subsidiary_id: 2 },
				},
			) => state,
		},
	});
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[entry]}>
				<InventoryReportsView />
			</MemoryRouter>
		</Provider>,
	);
};

beforeEach(() => {
	denied.perms = new Set();
});

describe('InventoryReportsView — ?sucursal= contra las sucursales del perfil', () => {
	it('ofrece las sucursales de la filial activa que trae el perfil', () => {
		renderReports('/reportes/inventario');

		expect(screen.getByTestId('sucursales')).toHaveTextContent('4,5');
	});

	it('una sucursal de otra filial se lee como «todas»', () => {
		renderReports('/reportes/inventario?sucursal=9');

		expect(screen.getByTestId('sucursal')).toHaveTextContent('null');
		expect(screen.getByTestId('alcance')).toHaveTextContent('Todas las sucursales');
	});

	it('una sucursal de la filial activa se respeta con su nombre', () => {
		renderReports('/reportes/inventario?sucursal=5');

		expect(screen.getByTestId('sucursal')).toHaveTextContent('5');
		expect(screen.getByTestId('alcance')).toHaveTextContent('Norte');
	});
});

describe('InventoryReportsView — pestaña Acciones', () => {
	it('se ofrece con view-product, que exige la reposición', () => {
		renderReports('/reportes/inventario');

		expect(screen.getByRole('tab', { name: /Acciones/ })).toBeInTheDocument();
	});

	it('sin view-product no se ofrece: la reposición respondería 403', () => {
		denied.perms = new Set(['view-product']);
		renderReports('/reportes/inventario');

		expect(screen.getByRole('tab', { name: /Umbrales/ })).toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: /Acciones/ })).toBeNull();
	});
});
