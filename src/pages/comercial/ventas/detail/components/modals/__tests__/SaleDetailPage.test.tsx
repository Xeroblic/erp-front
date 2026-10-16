import React, { type PropsWithChildren } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SaleDetailPage from '../SaleDetailPage';

const dispatchMock = vi.hoisted(() => vi.fn((action: unknown) => action));
const fetchDataMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), error: vi.fn() }));

vi.mock('react-toastify', () => ({ toast: toastMock }));
vi.mock('@/store', () => ({
	injectReducer: vi.fn(),
	useAppDispatch: () => dispatchMock,
	useAppSelector: <T,>(selector: (state: Record<string, never>) => T): T => selector({}),
}));
vi.mock('@/store/slices/salesSlice', () => {
	const detail = { id: 7, status: 'pending', can_close: false, is_closed: false };
	const items: unknown[] = [];
	return {
		default: (state = {}) => state,
		loadSaleDetail: () => ({ type: 'sales/loadDetail' }),
		loadSaleItems: () => ({ type: 'sales/loadItems' }),
		closeSaleThunk: () => ({ type: 'sales/close' }),
		selectSaleDetail: () => detail,
		selectSaleItems: () => items,
		selectSalesLoading: () => false,
	};
});
vi.mock('@/store/slices/sales/salesSlice', () => ({
	downloadShippingLabel: () => ({ type: 'sales/download' }),
}));
vi.mock('@/services/ApiService', () => ({
	default: { fetchData: fetchDataMock },
}));
vi.mock('@/services/salesService', () => ({
	default: { confirmSaleReturn: vi.fn() },
}));
vi.mock('react-router-dom', () => ({
	useNavigate: () => vi.fn(),
}));
// El store de esta prueba no tiene `auth`: la etapa de la filial se fija en la 1.
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: false,
		isMultiLocation: false,
		isLoading: false,
	}),
}));
vi.mock('@/components/ui/Modal', () => ({
	default: ({ children, isOpen }: PropsWithChildren & { isOpen: boolean }) =>
		isOpen ? <div role='dialog'>{children}</div> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Card', () => ({
	default: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardHeader: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardTitle: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: PropsWithChildren) => <span>{children}</span>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: PropsWithChildren & { onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children, onClick }: PropsWithChildren & { onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/Tooltip', () => ({
	default: ({ children }: PropsWithChildren) => <span>{children}</span>,
}));
vi.mock('@/components/ui/Spinner', () => ({ default: () => <span /> }));
vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));
vi.mock('../../tables/SaleItemsTable', () => ({ default: () => <div /> }));
vi.mock('../CloseSaleModal', () => ({ default: () => null }));
vi.mock('../CorrectSerialModal', () => ({ default: () => null }));

describe('SaleDetailPage al cerrarse sin desmontar', () => {
	beforeEach(() => {
		dispatchMock.mockClear();
		fetchDataMock.mockReset();
		fetchDataMock.mockResolvedValue({ data: { data: [] } });
		toastMock.success.mockClear();
	});

	it('mantiene la misma cantidad de hooks al pasar isOpen de true a false y de vuelta', () => {
		const onClose = vi.fn();
		const { rerender, container } = render(
			<SaleDetailPage subsidiaryId={1} saleId={7} isOpen onClose={onClose} />,
		);
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		expect(() =>
			rerender(
				<SaleDetailPage subsidiaryId={1} saleId={7} isOpen={false} onClose={onClose} />,
			),
		).not.toThrow();
		expect(container).toBeEmptyDOMElement();

		rerender(<SaleDetailPage subsidiaryId={1} saleId={7} isOpen onClose={onClose} />);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});

describe('SaleDetailPage al crear una cotización desde la venta', () => {
	const mockCreateQuoteResponse = (data: { message?: string; quote_id?: number }) => {
		fetchDataMock.mockReset();
		fetchDataMock.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve(url.endsWith('/create-quote') ? { data } : { data: { data: [] } }),
		);
	};

	beforeEach(() => {
		toastMock.success.mockClear();
	});

	it('no repite el número cuando el mensaje del backend ya lo incluye', async () => {
		mockCreateQuoteResponse({
			message: 'Cotización creada, número de cotización: 628',
			quote_id: 628,
		});
		render(<SaleDetailPage subsidiaryId={1} saleId={7} isOpen onClose={vi.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: 'Crear cotización desde venta' }));

		await waitFor(() =>
			expect(toastMock.success).toHaveBeenCalledWith(
				'Cotización creada, número de cotización: 628',
			),
		);
	});

	it('agrega el número cuando el mensaje del backend no lo trae', async () => {
		mockCreateQuoteResponse({ quote_id: 628 });
		render(<SaleDetailPage subsidiaryId={1} saleId={7} isOpen onClose={vi.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: 'Crear cotización desde venta' }));

		await waitFor(() =>
			expect(toastMock.success).toHaveBeenCalledWith(
				'Cotización creada correctamente, número de cotización: 628',
			),
		);
	});
});
