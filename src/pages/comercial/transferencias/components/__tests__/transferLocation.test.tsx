import type { PropsWithChildren, ReactElement } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ITransfer } from '@/interface/transfers.interface';
import TransferDetailModal from '../modals/TransferDetailModal';
import TransfersTable from '../tables/TransfersTable';

vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

/** Respuesta de la etapa 2: sale de una bodega y entra en «Sin ubicación». */
const transfer: ITransfer = {
	id: 7,
	status: 'completed',
	transfer_number: 'TR-7',
	created_at: '2026-10-15T12:00:00Z',
	updated_at: '2026-10-15T12:00:00Z',
	from_branch: { id: 1, name: 'Casa matriz' },
	to_branch: { id: 2, name: 'Sucursal Norte' },
	from_warehouse: { id: 11, name: 'Mesón' },
	to_warehouse: { id: null, name: null },
	totals: { items: 1, quantity: 2 },
	// Con ítems el detalle no vuelve a pedir la transferencia.
	items: [
		{ id: 1, product_id: 31, product_name: 'Cable HDMI', product_sku: 'SKU-1', quantity: 2 },
	],
};

// `Button` lee el usuario para sus permisos.
const store = () => configureStore({ reducer: { auth: () => ({ loading: false, user: null }) } });

const withStore = (ui: ReactElement) => render(<Provider store={store()}>{ui}</Provider>);

const renderDetail = (isMultiLocation: boolean) =>
	withStore(
		<TransferDetailModal
			isOpen
			onClose={vi.fn()}
			transfer={transfer}
			isMultiLocation={isMultiLocation}
		/>,
	);

describe('Ubicación de un traslado en el detalle y la tabla', () => {
	it('detalle, etapa 2: «Sin ubicación» cuando la bodega viene sin id', () => {
		renderDetail(true);

		expect(screen.getByText('Sin ubicación')).toBeInTheDocument();
		expect(screen.getByText('Mesón')).toBeInTheDocument();
		expect(screen.queryByText('Bodega no definida')).not.toBeInTheDocument();
	});

	it('detalle, etapa 1: el texto de siempre', () => {
		renderDetail(false);

		expect(screen.getByText('Bodega no definida')).toBeInTheDocument();
		expect(screen.queryByText('Sin ubicación')).not.toBeInTheDocument();
	});

	it('tabla, etapa 2: «Sin ubicación» cuando la bodega viene sin id', () => {
		withStore(<TransfersTable transfers={[transfer]} onView={vi.fn()} isMultiLocation />);

		expect(screen.getByText('Sin ubicación')).toBeInTheDocument();
		expect(screen.queryByText('Bodega destino')).not.toBeInTheDocument();
	});

	it('tabla, etapa 1: el texto de siempre', () => {
		withStore(<TransfersTable transfers={[transfer]} onView={vi.fn()} />);

		expect(screen.getByText('Bodega destino')).toBeInTheDocument();
		expect(screen.queryByText('Sin ubicación')).not.toBeInTheDocument();
	});
});
