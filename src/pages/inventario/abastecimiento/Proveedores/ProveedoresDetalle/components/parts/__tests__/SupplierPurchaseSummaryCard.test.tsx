import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { supplierPurchaseDocumentsLink } from '@/config/procurementLinks';
import SupplierPurchaseSummaryCard from '../SupplierPurchaseSummaryCard';

const summary = {
	last_purchase_on: '2026-09-20',
	received_units: 40,
	products_supplied_count: 3,
	receipt_count: 2,
};

const DocumentsListProbe = () => {
	const { pathname, search } = useLocation();
	return <p>{`${pathname}${search}`}</p>;
};

const renderAs = (permisos: string[]) => {
	const { Wrapper } = withStore(buildAuthState({ permisos }));
	return render(
		<Wrapper>
			<MemoryRouter initialEntries={['/inventario/abastecimiento/proveedores/3']}>
				<Routes>
					<Route
						path='/inventario/abastecimiento/proveedores/:proveedorId'
						element={
							<SupplierPurchaseSummaryCard
								summary={summary}
								documentsLink={supplierPurchaseDocumentsLink(3)}
							/>
						}
					/>
					<Route
						path='/inventario/abastecimiento/documentos-compra'
						element={<DocumentsListProbe />}
					/>
				</Routes>
			</MemoryRouter>
		</Wrapper>,
	);
};

describe('SupplierPurchaseSummaryCard — Ver documentos', () => {
	it('lleva al listado de documentos filtrado por el proveedor', () => {
		renderAs(['view-procurement-supplier', 'view-purchase-document']);

		fireEvent.click(screen.getByRole('button', { name: 'Ver documentos' }));

		expect(
			screen.getByText('/inventario/abastecimiento/documentos-compra?supplier_id=3'),
		).toBeInTheDocument();
	});

	it('sin view-purchase-document no ofrece un listado que no podría abrir', () => {
		renderAs(['view-procurement-supplier']);

		expect(screen.queryByRole('button', { name: 'Ver documentos' })).not.toBeInTheDocument();
		expect(screen.getByText('Recepciones')).toBeInTheDocument();
	});
});
