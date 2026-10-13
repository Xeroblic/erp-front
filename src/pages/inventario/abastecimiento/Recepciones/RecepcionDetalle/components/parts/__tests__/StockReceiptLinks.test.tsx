import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { postedKeyboardStockReceipt as receipt } from '@/mocks/db/procurement.db';
import { purchaseDocumentDetailLink, supplierDetailLink } from '@/config/procurementLinks';
import { inventarioBodegaLink } from '@/pages/inventario/Inventario/types';
import StockReceiptItemsTable from '../StockReceiptItemsTable';
import StockReceiptProgressCard from '../StockReceiptProgressCard';
import { receiptInventoryLink } from '../../../hooks/useRecepcionDetalle';
import StockReceiptSummaryCard from '../StockReceiptSummaryCard';

const renderAs = (ui: ReactElement, permisos: string[]) => {
	const { Wrapper } = withStore(buildAuthState({ permisos }));
	return render(
		<Wrapper>
			<MemoryRouter>{ui}</MemoryRouter>
		</Wrapper>,
	);
};

// La recepción 80 trae proveedor 7 y documento 61 (`1500`). Los destinos se
// pasan explícitos: qué recepción los recibe lo decide `useRecepcionDetalle`.
const supplierLink = supplierDetailLink(7);
const documentLink = purchaseDocumentDetailLink(61);

describe('StockReceiptSummaryCard', () => {
	it('con permisos enlaza proveedor y documento a sus fichas', () => {
		renderAs(
			<StockReceiptSummaryCard
				receipt={receipt}
				supplierLink={supplierLink}
				documentLink={documentLink}
			/>,
			['view-procurement-supplier', 'view-purchase-document'],
		);

		expect(
			screen.getByRole('link', { name: 'Ficha del proveedor: PCExpress' }),
		).toHaveAttribute('href', '/inventario/abastecimiento/proveedores/7');
		expect(
			screen.getByRole('link', { name: 'Ficha del documento de compra: 1500' }),
		).toHaveAttribute('href', '/inventario/abastecimiento/documentos-compra/61');
	});

	it('sin permisos muestra proveedor y documento como texto', () => {
		renderAs(
			<StockReceiptSummaryCard
				receipt={receipt}
				supplierLink={supplierLink}
				documentLink={documentLink}
			/>,
			['view-product'],
		);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText(/PCExpress/)).toBeInTheDocument();
		expect(screen.getByText('1500')).toBeInTheDocument();
	});
});

describe('StockReceiptItemsTable', () => {
	it('con permiso el origen de la línea enlaza al documento', () => {
		renderAs(
			<StockReceiptItemsTable
				items={receipt.items}
				documentNumber='1500'
				documentLink={documentLink}
			/>,
			['view-purchase-document'],
		);

		expect(
			screen.getByRole('link', { name: 'Ficha del documento de compra: Documento 1500' }),
		).toHaveAttribute('href', '/inventario/abastecimiento/documentos-compra/61');
	});

	it('sin permiso el origen queda como texto', () => {
		renderAs(
			<StockReceiptItemsTable
				items={receipt.items}
				documentNumber='1500'
				documentLink={documentLink}
			/>,
			['view-product'],
		);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('Documento 1500')).toBeInTheDocument();
	});
});

describe('StockReceiptProgressCard', () => {
	it('«En stock» ofrece ver la bodega de la recepción en Inventario', () => {
		renderAs(
			<StockReceiptProgressCard
				receipt={receipt}
				inventoryLink={inventarioBodegaLink(receipt.warehouse.id)}
			/>,
			['view-product'],
		);

		expect(screen.getByText('Ingresada al stock')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Ver en inventario' })).toBeInTheDocument();
	});

	it('sin destino (otra sucursal) no ofrece el atajo', () => {
		renderAs(<StockReceiptProgressCard receipt={receipt} inventoryLink={null} />, [
			'view-product',
		]);

		expect(screen.getByText('Ingresada al stock')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Ver en inventario' })).not.toBeInTheDocument();
	});
});

describe('receiptInventoryLink', () => {
	it('enlaza sólo si la recepción está en stock y es de la sucursal activa', () => {
		expect(receiptInventoryLink(receipt, receipt.branch_id, 'warehouse')?.to).toBe(
			`/inventario/stock/bodegas/${receipt.warehouse.id}`,
		);
		expect(receiptInventoryLink(receipt, receipt.branch_id + 1, 'warehouse')).toBeNull();
		expect(receiptInventoryLink(receipt, null, 'warehouse')).toBeNull();
		expect(
			receiptInventoryLink({ ...receipt, status: 'queued' }, receipt.branch_id, 'warehouse'),
		).toBeNull();
		expect(receiptInventoryLink(null, receipt.branch_id, 'warehouse')).toBeNull();
	});

	it('en la etapa 1 del backend enlaza «Sin ubicación», donde entró el stock', () => {
		expect(receiptInventoryLink(receipt, receipt.branch_id, 'unlocated')?.to).toBe(
			'/inventario/stock/bodegas/sin-ubicacion',
		);
	});

	it('sin una fuente común con Inventario no ofrece el atajo', () => {
		expect(receiptInventoryLink(receipt, receipt.branch_id, null)).toBeNull();
	});
});

describe('StockReceiptProgressCard — dónde quedó el stock', () => {
	it('en la etapa 1 no afirma que las unidades estén en la bodega', () => {
		renderAs(<StockReceiptProgressCard receipt={receipt} entersUnlocated />, ['view-product']);

		expect(
			screen.getByText(/disponibles en la sucursal, en «Sin ubicación»/),
		).toBeInTheDocument();
		expect(screen.queryByText(/disponibles en la bodega/)).not.toBeInTheDocument();
	});
});
