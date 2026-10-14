import React, { type PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SaleDetailPage from '../SaleDetailPage';

const dispatchMock = vi.hoisted(() => vi.fn((action: unknown) => action));
const fetchDataMock = vi.hoisted(() => vi.fn());

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
