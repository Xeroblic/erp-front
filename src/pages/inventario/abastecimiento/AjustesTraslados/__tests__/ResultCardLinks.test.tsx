import React, { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import AdjustmentResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentResultCard';
import TransferResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferResultCard';
import type { IAjusteResult } from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useInventoryAdjustment';
import type { ITrasladoResult } from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useInternalTransfer';
import type {
	IInventoryAdjustmentItem,
	IWarehouseStockMovementItem,
} from '@/interface/procurement.interface';

const adjustmentItem = (productId: number): IInventoryAdjustmentItem => ({
	product_id: productId,
	quantity_delta: -1,
	condition: 'fit',
	physical_quantity_before: 5,
	physical_quantity_after: 4,
	fit_quantity_before: 5,
	fit_quantity_after: 4,
	unfit_quantity_before: 0,
	unfit_quantity_after: 0,
});

const adjustmentResult = (
	productIds: number[],
	warehouseId: number | null = 12,
): IAjusteResult => ({
	adjustment: {
		id: 'op-1',
		operation_type: 'inventory_adjustment',
		branch_id: 4,
		warehouse_id: warehouseId,
		reason: 'Conteo',
		notes: null,
		related_stock_receipt_id: null,
		items: productIds.map(adjustmentItem),
		created_at: '2026-10-05T10:00:00Z',
	},
	products: {},
	locationLabel: 'Estante A3',
	availability: [],
});

const movementItem = (productId: number): IWarehouseStockMovementItem => ({
	product_id: productId,
	quantity: 2,
	condition: 'fit',
	origin_quantity_after: 3,
	destination_quantity_after: 2,
});

const transferResult = (productIds: number[]): ITrasladoResult => ({
	movement: {
		id: 'op-2',
		operation_type: 'warehouse_stock_placement',
		branch_id: 4,
		from_warehouse_id: null,
		to_warehouse_id: 8,
		reason: 'Reubicación',
		items: productIds.map(movementItem),
		global_stock_delta: 0,
		created_at: '2026-10-05T10:00:00Z',
	},
	products: {},
	fromLabel: 'Sin ubicación',
	toLabel: 'Bodega Central',
});

const Destination = () => {
	const location = useLocation();
	return <output data-testid='destino'>{location.pathname}</output>;
};

const renderAs = (ui: ReactElement, permisos: string[] = ['view-product']) => {
	const { Wrapper } = withStore(buildAuthState({ permisos }));
	return render(
		<Wrapper>
			<MemoryRouter initialEntries={['/resultado']}>
				<Routes>
					<Route path='/resultado' element={ui} />
					<Route path='/inventario/stock/*' element={<Destination />} />
				</Routes>
			</MemoryRouter>
		</Wrapper>,
	);
};

const followInventory = () =>
	fireEvent.click(screen.getByRole('button', { name: 'Ver en inventario' }));

describe('«Ver en inventario» tras un ajuste', () => {
	it('con un solo producto abre su ficha de inventario', () => {
		renderAs(<AdjustmentResultCard result={adjustmentResult([31])} onDismiss={() => {}} />);
		followInventory();
		expect(screen.getByTestId('destino')).toHaveTextContent('/inventario/stock/31');
	});

	it('con varios productos abre la ficha de la bodega ajustada', () => {
		renderAs(<AdjustmentResultCard result={adjustmentResult([31, 58])} onDismiss={() => {}} />);
		followInventory();
		expect(screen.getByTestId('destino')).toHaveTextContent('/inventario/stock/bodegas/12');
	});

	it('un ajuste «Sin ubicación» de varios productos abre esa ubicación', () => {
		renderAs(
			<AdjustmentResultCard result={adjustmentResult([31, 58], null)} onDismiss={() => {}} />,
		);
		followInventory();
		expect(screen.getByTestId('destino')).toHaveTextContent(
			'/inventario/stock/bodegas/sin-ubicacion',
		);
	});

	it('sin view-product no ofrece el atajo', () => {
		renderAs(<AdjustmentResultCard result={adjustmentResult([31])} onDismiss={() => {}} />, [
			'edit-product',
		]);
		expect(screen.queryByRole('button', { name: 'Ver en inventario' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Nuevo ajuste' })).toBeInTheDocument();
	});
});

describe('«Ver en inventario» tras un traslado', () => {
	it('con un solo producto abre su ficha de inventario', () => {
		renderAs(<TransferResultCard result={transferResult([31])} onDismiss={() => {}} />);
		followInventory();
		expect(screen.getByTestId('destino')).toHaveTextContent('/inventario/stock/31');
	});

	it('con varios productos abre la bodega de destino, donde quedaron', () => {
		renderAs(<TransferResultCard result={transferResult([31, 58])} onDismiss={() => {}} />);
		followInventory();
		expect(screen.getByTestId('destino')).toHaveTextContent('/inventario/stock/bodegas/8');
	});
});
