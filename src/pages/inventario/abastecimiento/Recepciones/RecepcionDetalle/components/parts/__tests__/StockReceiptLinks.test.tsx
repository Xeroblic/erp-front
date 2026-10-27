import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import {
	postedKeyboardStockReceipt as receipt,
	queuedStockReceipt,
	reversedStockReceipt,
} from '@/mocks/db/procurement.db';
import { purchaseDocumentDetailLink, supplierDetailLink } from '@/config/procurementLinks';
import { inventarioBodegaLink } from '@/pages/inventario/Inventario/types';
import type { TStockReceiptEnteredLocation } from '@/interface/procurement.interface';
import StockReceiptItemsTable from '../StockReceiptItemsTable';
import StockReceiptProgressCard from '../StockReceiptProgressCard';
import {
	receiptInventoryLink,
	resolveReceiptStockLocation,
} from '../../../hooks/useRecepcionDetalle';
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
// Su stock ingresó a su bodega, «Bodega Central» (id 8).
const supplierLink = supplierDetailLink(7);
const documentLink = purchaseDocumentDetailLink(61);
const unlocated: TStockReceiptEnteredLocation = { scope: 'unlocated', warehouse: null };
const enteredUnlocated = { ...receipt, entered_location: unlocated };

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
			screen.getByRole('link', { name: /^Ficha del proveedor:\s*PCExpress$/ }),
		).toHaveAttribute('href', '/inventario/abastecimiento/proveedores/7');
		expect(
			screen.getByRole('link', { name: /^Ficha del documento de compra:\s*1500$/ }),
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
			screen.getByRole('link', { name: /^Ficha del documento de compra:\s*Documento 1500$/ }),
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
		expect(receiptInventoryLink(receipt, receipt.branch_id, true)?.to).toBe(
			`/inventario/stock/bodegas/${receipt.warehouse.id}`,
		);
		expect(receiptInventoryLink(receipt, receipt.branch_id + 1, true)).toBeNull();
		expect(receiptInventoryLink(receipt, null, true)).toBeNull();
		expect(
			receiptInventoryLink({ ...receipt, status: 'queued' }, receipt.branch_id, true),
		).toBeNull();
		expect(receiptInventoryLink(null, receipt.branch_id, true)).toBeNull();
	});

	it('enlaza «Sin ubicación» cuando el stock ingresó ahí, aunque la recepción indique una bodega', () => {
		expect(receiptInventoryLink(enteredUnlocated, receipt.branch_id, true)?.to).toBe(
			'/inventario/stock/bodegas/sin-ubicacion',
		);
	});

	it('sin `entered_location` no adivina dónde ingresó', () => {
		expect(
			receiptInventoryLink({ ...receipt, entered_location: null }, receipt.branch_id, true),
		).toBeNull();
	});

	it('sin una fuente común con Inventario no ofrece el atajo', () => {
		expect(receiptInventoryLink(receipt, receipt.branch_id, false)).toBeNull();
	});
});

describe('resolveReceiptStockLocation', () => {
	it('una recepción ingresada dice dónde ingresó, aunque la filial esté hoy en otra etapa', () => {
		expect(resolveReceiptStockLocation(enteredUnlocated, true)).toEqual(unlocated);
		expect(resolveReceiptStockLocation(receipt, false)).toEqual({
			scope: 'warehouse',
			warehouse: { id: 8, name: 'Bodega Central' },
		});
	});

	it('una revertida conserva dónde había ingresado', () => {
		expect(resolveReceiptStockLocation(reversedStockReceipt, false)).toEqual(
			reversedStockReceipt.entered_location,
		);
	});

	it('antes de ingresar, la etapa anticipa la bodega (etapa 2) o «Sin ubicación» (etapa 1)', () => {
		expect(resolveReceiptStockLocation(queuedStockReceipt, true)).toEqual({
			scope: 'warehouse',
			warehouse: queuedStockReceipt.warehouse,
		});
		expect(resolveReceiptStockLocation(queuedStockReceipt, false)).toEqual(unlocated);
	});

	it('ingresada sin `entered_location` no afirma ninguna ubicación', () => {
		expect(
			resolveReceiptStockLocation({ ...receipt, entered_location: null }, true),
		).toBeNull();
	});
});

describe('StockReceiptProgressCard — dónde quedó el stock', () => {
	it('en «Sin ubicación» no afirma que las unidades estén en la bodega', () => {
		renderAs(<StockReceiptProgressCard receipt={receipt} stockLocation={unlocated} />, [
			'view-product',
		]);

		expect(
			screen.getByText(/disponibles en la sucursal, en «Sin ubicación»/),
		).toBeInTheDocument();
		expect(screen.getByText('Disponible en «Sin ubicación»')).toBeInTheDocument();
		expect(screen.queryByText(/Bodega Central/)).not.toBeInTheDocument();
	});

	it('en una bodega la nombra', () => {
		renderAs(
			<StockReceiptProgressCard
				receipt={receipt}
				stockLocation={{ scope: 'warehouse', warehouse: { id: 8, name: 'Bodega Central' } }}
			/>,
			['view-product'],
		);

		expect(screen.getByText(/disponibles en «Bodega Central»/)).toBeInTheDocument();
		expect(screen.getByText('Disponible en «Bodega Central»')).toBeInTheDocument();
		expect(screen.queryByText(/Sin ubicación/)).not.toBeInTheDocument();
	});

	it('sin ubicación conocida no nombra ninguna', () => {
		renderAs(<StockReceiptProgressCard receipt={receipt} stockLocation={null} />, [
			'view-product',
		]);

		expect(
			screen.getByText(/Las unidades ya están disponibles en la sucursal/),
		).toBeInTheDocument();
		expect(screen.queryByText(/Sin ubicación/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Bodega Central/)).not.toBeInTheDocument();
	});
});
