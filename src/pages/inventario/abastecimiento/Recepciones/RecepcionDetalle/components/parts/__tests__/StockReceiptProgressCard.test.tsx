import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import { queuedStockReceipt as receipt } from '@/mocks/db/procurement.db';
import StockReceiptProgressCard from '../StockReceiptProgressCard';

const renderCard = (ui: ReactElement) => {
	const { Wrapper } = withStore(buildAuthState({ permisos: ['view-product'] }));
	return render(
		<Wrapper>
			<MemoryRouter>{ui}</MemoryRouter>
		</Wrapper>,
	);
};

describe('StockReceiptProgressCard en `queued`', () => {
	it('mientras se consulta sola avisa que la pantalla se actualiza', () => {
		renderCard(<StockReceiptProgressCard receipt={receipt} onRefresh={vi.fn()} />);

		expect(screen.getByText('Ingresando al stock')).toBeInTheDocument();
		expect(screen.queryByText('Sigue ingresando')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Actualizar' })).not.toBeInTheDocument();
	});

	it('tras el tope ya no promete actualizarse y ofrece «Actualizar»', () => {
		const onRefresh = vi.fn();
		renderCard(
			<StockReceiptProgressCard receipt={receipt} isPollingStalled onRefresh={onRefresh} />,
		);

		expect(screen.getByRole('status')).toHaveTextContent('Sigue ingresando');
		expect(screen.queryByText(/se actualiza sola cuando termine/)).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
		expect(onRefresh).toHaveBeenCalledTimes(1);
	});
});
