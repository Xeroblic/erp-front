import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IWarehouse, IWarehouseProduct } from '@/interface/warehouse.interface';
import WarehousesTable from '../tables/WarehousesTable';
import AssociatedProductsTable from '../detallesComponents/tables/AssociatedProductsTable';

// Sólo concede los permisos listados: así la prueba falla si un botón pide
// un permiso que el backend no define (como el `update-warehouse` anterior).
const granted = vi.hoisted(() => ({ permissions: new Set<string>() }));

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: ({ permission }: { permission?: string | string[] }) =>
			typeof permission === 'string' && granted.permissions.has(permission),
		hasAnyPermission: () => false,
		isLoading: false,
		isSuperAdmin: false,
	}),
}));
vi.mock('@/hooks/useColorIntensity', () => ({
	default: () => ({ textColor: 'text-white', shadeColorIntensity: '600' }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

const warehouse: IWarehouse = {
	id: 1,
	name: 'Bodega Central',
	code: 'BOD-001',
	branch_id: 1,
	warehouse_type: 'Principal',
	maximum_capacity: 999,
	current_capacity: 12,
	is_active: true,
	requires_serial_tracking: false,
};

const product: IWarehouseProduct = {
	id: 5,
	sku: 'SKU-5',
	name: 'Notebook',
	quantity: 3,
	sync_stock: true,
};

const renderList = () =>
	render(
		<MemoryRouter>
			<WarehousesTable
				warehouses={[warehouse]}
				loading={false}
				hasError={false}
				hasFilters={false}
				onEdit={vi.fn()}
				onDelete={vi.fn()}
				branchId={1}
			/>
		</MemoryRouter>,
	);

describe('permisos de bodegas contra la WarehousePolicy del backend', () => {
	beforeEach(() => {
		granted.permissions = new Set();
	});

	it('Ver, Editar y Eliminar del listado piden view-warehouse-detail, edit-warehouse y delete-warehouse', () => {
		granted.permissions = new Set([
			'view-warehouse-detail',
			'edit-warehouse',
			'delete-warehouse',
		]);
		renderList();

		expect(screen.getByRole('button', { name: 'Ver Bodega Central' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Editar Bodega Central' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Eliminar Bodega Central' })).toBeInTheDocument();
	});

	it('sin permisos de bodega el listado no ofrece acciones', () => {
		renderList();

		expect(screen.queryByRole('button', { name: /Bodega Central/ })).not.toBeInTheDocument();
	});

	it('Quitar de la ficha pide detach-warehouse-product', () => {
		const renderDetail = () =>
			render(
				<MemoryRouter>
					<AssociatedProductsTable
						products={[product]}
						allProducts={[]}
						branchId={1}
						onRemoveProduct={vi.fn()}
					/>
				</MemoryRouter>,
			);

		const { unmount } = renderDetail();
		expect(
			screen.queryByRole('button', { name: 'Quitar Notebook de la bodega' }),
		).not.toBeInTheDocument();
		unmount();

		granted.permissions = new Set(['detach-warehouse-product']);
		renderDetail();
		expect(
			screen.getByRole('button', { name: 'Quitar Notebook de la bodega' }),
		).toBeInTheDocument();
	});
});
