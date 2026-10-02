import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { postedKeyboardStockReceipt as receipt } from '@/mocks/db/procurement.db';
import { purchaseDocumentDetailLink, supplierDetailLink } from '@/config/procurementLinks';
import StockReceiptItemsTable from '../StockReceiptItemsTable';
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
