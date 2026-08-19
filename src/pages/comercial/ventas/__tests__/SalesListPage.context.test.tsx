import React, { type PropsWithChildren } from 'react';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateSpy = vi.hoisted(() => vi.fn());
const routeState = vi.hoisted(() => ({ saleId: '7' }));
const dispatchMock = vi.hoisted(() =>
	vi.fn((action: { unwrap?: () => Promise<void> }) => action),
);
const salesServiceSpies = vi.hoisted(() => ({
	fetchPendingSerialAssignment: vi.fn(),
}));

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return {
		injectReducer: vi.fn(),
		useAppDispatch: () => dispatchMock,
		useAppSelector: reactRedux.useSelector,
	};
});
vi.mock('@/store/slices/salesSlice', () => ({
	default: (state = {}) => state,
	clearDetail: () => ({ type: 'sales/clearDetail' }),
	loadSalesList: () => ({ type: 'sales/load', unwrap: async () => undefined }),
	selectSalesList: (() => {
		const sales = [{ id: 7, sale_number: 'V-7', status: 'pending', total_amount: '1000' }];
		return () => sales;
	})(),
	selectSalesListSubsidiaryId: () => 1,
	selectSalesMeta: () => null,
	selectSalesLoading: () => false,
}));
vi.mock('@/store/slices/sales/salesSlice', () => ({
	downloadShippingLabel: () => ({ type: 'sales/download' }),
}));
vi.mock('@/store/selectors/subsidiarySelectors', () => ({
	selectEffectiveSubsidiaryId: (state: { context: { subsidiaryId: number | null } }) =>
		state.context.subsidiaryId,
}));
vi.mock('@/services/salesService', () => ({
	fetchPendingSerialAssignment: salesServiceSpies.fetchPendingSerialAssignment,
}));
vi.mock('react-router-dom', () => ({
	useNavigate: () => navigateSpy,
	useParams: () => routeState,
}));
vi.mock('@/components/ui/Card', () => ({
	default: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardHeader: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardTitle: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Button', () => ({ default: ({ children, onClick }: PropsWithChildren & { onClick?: () => void }) => <button onClick={onClick}>{children}</button> }));
vi.mock('@/components/ui/ProtectedButton', () => ({ default: ({ children, onClick }: PropsWithChildren & { onClick?: () => void }) => <button onClick={onClick}>{children}</button> }));
vi.mock('@/components/form/Input', () => ({ default: () => <input /> }));
vi.mock('@/components/form/SelectReact', () => ({ default: () => <select /> }));
vi.mock('@/components/ui/DataTable', () => ({
	default: ({ columns, data }: { columns: Array<{ id?: string; cell?: (props: { row: { original: unknown } }) => React.ReactNode }>; data: unknown[] }) => {
		const actionColumn = columns.find((column) => column.id === 'actions');
		return (
			<div>
				{data.length > 0 ? actionColumn?.cell?.({ row: { original: data[0] } }) : null}
			</div>
		);
	},
}));
vi.mock('@/components/ui/Badge', () => ({ default: ({ children }: PropsWithChildren) => <span>{children}</span> }));
vi.mock('@/components/ui/Alert', () => ({ default: ({ children }: PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({ default: ({ children }: PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/layouts/Container/Container', () => ({ default: ({ children }: PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: PropsWithChildren) => <header>{children}</header>,
	SubheaderLeft: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/icon/Icon', () => ({ default: ({ icon }: { icon: string }) => <span>{icon}</span> }));
vi.mock('@/components/ui/Tooltip', () => ({ default: ({ children }: PropsWithChildren) => <>{children}</> }));
vi.mock('../detail/components/modals/SaleDetailPage', () => ({ default: () => <div data-testid='sale-detail' /> }));
vi.mock('../detail/components/modals/CloseSaleModal', () => ({ default: ({ open }: { open: boolean }) => open ? <div data-testid='close-sale-modal' /> : null }));
vi.mock('../detail/components/modals/DeleteSaleModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid='delete-sale-modal' /> : null }));

import SalesListPage from '../SalesListPage';

const setSubsidiary = createAction<number | null>('context/setSubsidiary');
const contextReducer = createReducer({ subsidiaryId: 1 as number | null }, (builder) => {
	builder.addCase(setSubsidiary, (state, action) => {
		state.subsidiaryId = action.payload;
	});
});

describe('SalesListPage con cambio de subsidiaria', () => {
	beforeEach(() => {
		navigateSpy.mockClear();
		dispatchMock.mockClear();
		salesServiceSpies.fetchPendingSerialAssignment.mockResolvedValue({
			data: [{ id: 7, items: [] }],
		});
		routeState.saleId = '7';
	});

	it('cierra el detalle de ruta y reemplaza la URL al invalidar su contexto', async () => {
		const store = configureStore({ reducer: { context: contextReducer } });
		render(
			<Provider store={store}>
				<SalesListPage />
			</Provider>,
		);

		await screen.findByTestId('sale-detail');
		await screen.findByRole('button', { name: 'Ver pendientes' });
		act(() => store.dispatch(setSubsidiary(2)));
		await act(async () => {
			await Promise.resolve();
		});

		await waitFor(() => expect(screen.queryByTestId('sale-detail')).not.toBeInTheDocument());
		expect(navigateSpy).toHaveBeenCalledWith('/comercial/ventas', { replace: true });
	});

	it('cierra acciones pendientes de la subsidiaria anterior', async () => {
		routeState.saleId = undefined as unknown as string;
		const store = configureStore({ reducer: { context: contextReducer } });
		render(
			<Provider store={store}>
				<SalesListPage />
			</Provider>,
		);

		await screen.findByRole('button', { name: 'Ver pendientes' });
		await screen.findByRole('button', { name: 'DuoBarcodeRead' });
		act(() => screen.getByRole('button', { name: 'DuoBarcodeRead' }).click());
		act(() => screen.getByRole('button', { name: 'HeroTrash' }).click());
		expect(screen.getByTestId('close-sale-modal')).toBeInTheDocument();
		expect(screen.getByTestId('delete-sale-modal')).toBeInTheDocument();

		act(() => store.dispatch(setSubsidiary(2)));
		await act(async () => {
			await Promise.resolve();
		});

		expect(screen.queryByTestId('close-sale-modal')).not.toBeInTheDocument();
		expect(screen.queryByTestId('delete-sale-modal')).not.toBeInTheDocument();
	});
});
