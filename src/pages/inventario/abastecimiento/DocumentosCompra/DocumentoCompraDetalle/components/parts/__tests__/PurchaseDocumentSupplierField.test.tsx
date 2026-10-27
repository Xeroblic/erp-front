import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { supplierDetailLink } from '@/config/procurementLinks';
import PurchaseDocumentSupplierField from '../PurchaseDocumentSupplierField';

const supplier = { id: 12, display_name: 'Distribuidora Sur', rut: '77000111-2', is_active: true };

const renderAs = (permisos: string[]) => {
	const { Wrapper } = withStore(buildAuthState({ permisos }));
	return render(
		<Wrapper>
			<MemoryRouter>
				<PurchaseDocumentSupplierField
					supplier={supplier}
					supplierLink={supplierDetailLink(supplier.id)}
				/>
			</MemoryRouter>
		</Wrapper>,
	);
};

describe('PurchaseDocumentSupplierField', () => {
	it('con `view-procurement-supplier` enlaza a la ficha del proveedor', () => {
		renderAs(['view-purchase-document', 'view-procurement-supplier']);

		expect(
			screen.getByRole('link', { name: /^Ficha del proveedor:\s*Distribuidora Sur$/ }),
		).toHaveAttribute('href', '/inventario/abastecimiento/proveedores/12');
	});

	it('sin el permiso deja el nombre como texto', () => {
		renderAs(['view-purchase-document']);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('Distribuidora Sur')).toBeInTheDocument();
	});
});
