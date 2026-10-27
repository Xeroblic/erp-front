import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { supplierDetailLink } from '@/config/procurementLinks';
import DetailLink from '../DetailLink';

const renderAs = (ui: ReactElement, permisos: string[]) => {
	const { Wrapper } = withStore(buildAuthState({ permisos }));
	return render(
		<Wrapper>
			<MemoryRouter>{ui}</MemoryRouter>
		</Wrapper>,
	);
};

describe('DetailLink', () => {
	it('con el permiso de la ficha enlaza a su ruta con nombre accesible', () => {
		renderAs(
			<DetailLink link={supplierDetailLink(7)} srLabel='Ficha del proveedor'>
				PCExpress
			</DetailLink>,
			['view-procurement-supplier'],
		);

		// `\s*`: con jsdom 30 el span sr-only es inline y dom-accessibility-api recorta
		// su espacio final; el navegador sí lo conserva («Ficha del proveedor: PCExpress»).
		expect(
			screen.getByRole('link', { name: /^Ficha del proveedor:\s*PCExpress$/ }),
		).toHaveAttribute('href', '/inventario/abastecimiento/proveedores/7');
	});

	it('sin el permiso de la ficha deja sólo el texto', () => {
		renderAs(
			<DetailLink link={supplierDetailLink(7)} srLabel='Ficha del proveedor'>
				PCExpress
			</DetailLink>,
			['view-product'],
		);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('PCExpress')).toBeInTheDocument();
	});

	it('sin destino deja el texto aunque tenga el permiso', () => {
		renderAs(
			<DetailLink link={null} srLabel='Ficha del proveedor'>
				PCExpress
			</DetailLink>,
			['super-admin'],
		);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});
});
