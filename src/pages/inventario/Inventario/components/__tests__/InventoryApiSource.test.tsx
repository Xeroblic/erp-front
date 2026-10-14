import React, { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import InventarioSummary from '@/pages/inventario/Inventario/components/parts/InventarioSummary';
import WarehouseCapacity from '@/pages/inventario/Inventario/components/parts/WarehouseCapacity';
import InventarioFilters from '@/pages/inventario/Inventario/components/filters/InventarioFilters';
import InventarioGeneralTable from '@/pages/inventario/Inventario/components/tables/InventarioGeneralTable';
import WarehouseStockTable from '@/pages/inventario/Inventario/components/tables/WarehouseStockTable';
import WarehouseSummary from '@/pages/inventario/Inventario/InventarioBodega/components/WarehouseSummary';
import { DEFAULT_INVENTARIO_FILTROS } from '@/pages/inventario/Inventario/types';
import type {
	IInventoryOverviewResponse,
	IInventoryWarehouseAggregate,
} from '@/interface/inventoryOverview.interface';
import type { IProcurementProduct } from '@/interface/procurement.interface';

/**
 * Inventario con la fuente real (bandera apagada): lo que el backend no publica
 * no se muestra, ni vacío ni en cero. La bandera se fija antes de cargar los
 * componentes, que leen `INVENTORY_OVERVIEW_FEATURES` al importarse.
 */
vi.mock('@/config/inventoryOverview.config', () => ({ default: false }));
vi.mock('@/config/inventoryStock.config', () => ({ default: true }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { dir: () => 'ltr' } }) }));

const product: IProcurementProduct = {
	id: 31,
	sku: 'MOU-1',
	commercial_sku: null,
	name: 'Mouse',
	short_description: null,
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: null,
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: true,
};

const realList: IInventoryOverviewResponse = {
	data: [
		{
			product,
			physical_quantity: 9,
			fit_quantity: 8,
			unfit_quantity: 1,
			documented_quantity: 0,
			undocumented_quantity: 9,
			warehouses: null,
			critical_stock: null,
		},
	],
	links: { first: null, last: null, prev: null, next: null },
	meta: {
		current_page: 1,
		from: 1,
		last_page: 1,
		links: [],
		path: '/api/branches/4/inventory-stock',
		per_page: 15,
		to: 1,
		total: 1,
	},
	context: { scope: 'branch', branch_id: 4, warehouse: null },
};

const aggregate = (
	patch: Partial<IInventoryWarehouseAggregate> = {},
): IInventoryWarehouseAggregate => ({
	warehouse: {
		id: 8,
		name: 'Central',
		code: 'BC',
		warehouse_type: null,
		is_active: true,
		description: null,
		manager_name: null,
		address: null,
		commune_name: null,
		schedule: null,
		requires_serial_tracking: false,
	},
	capacity: null,
	maximum_capacity: 500,
	product_count: 2,
	physical_quantity: null,
	unfit_quantity: null,
	undocumented_quantity: null,
	critical_count: null,
	...patch,
});

const renderUi = (ui: ReactElement) => {
	const { Wrapper } = withStore(buildAuthState({ permisos: ['view-product'] }));
	return render(<Wrapper>{ui}</Wrapper>);
};

describe('Inventario con la API real', () => {
	it('la franja sólo muestra los conteos de productos que se conocen', () => {
		renderUi(
			<InventarioSummary
				loading={false}
				summary={{
					products_count: 12,
					unlocated_products_count: 3,
					physical_quantity: null,
					unfit_quantity: null,
					undocumented_quantity: null,
					unlocated_quantity: null,
					critical_count: null,
					out_count: null,
					unconfigured_count: null,
				}}
			/>,
		);

		expect(screen.getByText('Productos con stock')).toBeInTheDocument();
		expect(screen.getByText('12')).toBeInTheDocument();
		expect(screen.getByText('Productos en Sin ubicación')).toBeInTheDocument();
		expect(screen.queryByText('Stock total')).not.toBeInTheDocument();
		expect(screen.queryByText('Stock crítico')).not.toBeInTheDocument();
		expect(screen.queryByText('Sin stock')).not.toBeInTheDocument();
	});

	it('los filtros no ofrecen «Estado», que depende del umbral y las reservas', () => {
		renderUi(
			<InventarioFilters
				filtros={DEFAULT_INVENTARIO_FILTROS}
				warehouses={[]}
				onBusqueda={() => {}}
				onUbicacion={() => {}}
				onEstado={() => {}}
				onLimpiar={() => {}}
			/>,
		);

		expect(screen.getByLabelText('Búsqueda')).toBeInTheDocument();
		expect(screen.queryByLabelText('Estado')).not.toBeInTheDocument();
	});

	it('por producto: sin disponible, estado ni orden, y la ubicación nombra su alcance', () => {
		renderUi(
			<InventarioGeneralTable
				response={realList}
				loading={false}
				hasError={false}
				hasFilters={false}
				ubicacion='branch'
				orden='name'
				warehouses={[]}
				onOrden={() => {}}
				onPaginate={() => {}}
				onOpen={() => {}}
			/>,
		);
		const table = screen.getByRole('table', { name: 'Inventario por producto' });
		const headers = within(table)
			.getAllByRole('columnheader')
			.map((header) => header.textContent);

		expect(headers).toEqual(['Producto', 'Ubicación', 'En bodega', 'Acciones']);
		expect(within(table).queryByRole('button', { name: /Producto/ })).not.toBeInTheDocument();
		expect(within(table).getByText('Toda la sucursal')).toBeInTheDocument();
		expect(within(table).getByText('9')).toBeInTheDocument();
	});

	it('por bodega: productos por ubicación, sin unidades ni alertas', () => {
		renderUi(
			<WarehouseStockTable
				warehouses={[aggregate({ warehouse: null, maximum_capacity: null }), aggregate()]}
				loading={false}
				hasError={false}
				onOpen={() => {}}
			/>,
		);
		const table = screen.getByRole('table', { name: 'Inventario por bodega' });
		const headers = within(table)
			.getAllByRole('columnheader')
			.map((header) => header.textContent);

		expect(headers).toEqual(['Bodega', 'Productos', 'Capacidad', 'Acciones']);
		expect(within(table).queryByText('Todo en orden')).not.toBeInTheDocument();
	});

	it('la capacidad informa el máximo sin inventar un porcentaje de uso', () => {
		renderUi(<WarehouseCapacity aggregate={aggregate()} />);

		expect(screen.getByText('Máximo 500')).toBeInTheDocument();
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	});

	it('la ficha de bodega sólo muestra la cifra que se conoce', () => {
		renderUi(<WarehouseSummary aggregate={aggregate()} />);

		expect(screen.getByText('Productos')).toBeInTheDocument();
		expect(screen.queryByText('Unidades')).not.toBeInTheDocument();
		expect(screen.queryByText('Bajo el umbral')).not.toBeInTheDocument();
		expect(screen.queryByText('Sin documento')).not.toBeInTheDocument();
	});
});
