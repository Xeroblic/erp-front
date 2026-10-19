import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { draftManualStockReceipt, postedKeyboardStockReceipt } from '@/mocks/db/procurement.db';
import RecepcionesTable from '../RecepcionesTable';

/**
 * El listado llega paginado del servidor y el contrato no tiene parámetro de
 * orden: la tabla no ofrece ordenar en el cliente, que sólo reordenaría la
 * página visible.
 */
describe('RecepcionesTable', () => {
	it('muestra las filas en el orden del servidor, sin encabezados ordenables', () => {
		const serverOrder = [postedKeyboardStockReceipt, draftManualStockReceipt];
		const { Wrapper } = withStore(buildAuthState({ permisos: ['view-product'] }));
		const { container } = render(
			<Wrapper>
				<MemoryRouter>
					<RecepcionesTable
						rows={serverOrder}
						meta={null}
						loading={false}
						hasError={false}
						hasActiveFilters={false}
						onPaginationChange={vi.fn()}
						onView={vi.fn()}
					/>
				</MemoryRouter>
			</Wrapper>,
		);

		const header = container.querySelector('thead');
		expect(header).not.toBeNull();
		expect(within(header as HTMLElement).queryAllByRole('button')).toHaveLength(0);
		expect(within(header as HTMLElement).getByText('Recepción')).toBeInTheDocument();
		expect(screen.getAllByText(/^#\d+$/).map((cell) => cell.textContent)).toEqual(
			serverOrder.map((receipt) => `#${receipt.id}`),
		);
	});
});
