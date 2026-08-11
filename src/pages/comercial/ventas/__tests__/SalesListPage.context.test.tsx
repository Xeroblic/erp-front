import React, { type PropsWithChildren } from 'react';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateSpy = vi.hoisted(() => vi.fn());
const routeState = vi.hoisted(() => ({ saleId: '7' }));

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return {
		injectReducer: vi.fn(),
		useAppDispatch: () => (action: { unwrap?: () => Promise<void> }) => action,
		useAppSelector: reactRedux.useSelector,
	};
});
vi.mock('@/store/slices/salesSlice', () => ({
	default: (state = {}) => state,
	clearDetail: () => ({ type: 'sales/clearDetail' }),
	loadSalesList: () => ({ type: 'sales/load', unwrap: async () => undefined }),
	selectSalesList: (() => {
		const emptySales: never[] = [];
		return () => emptySales;
	})(),
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
	fetchPendingSerialAssignment: vi.fn().mockResolvedValue({ data: [] }),
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
vi.mock('@/components/ui/Button', () => ({ default: ({ children }: PropsWithChildren) => <button>{children}</button> }));
vi.mock('@/components/ui/ProtectedButton', () => ({ default: ({ children }: PropsWithChildren) => <button>{children}</button> }));
vi.mock('@/components/form/Input', () => ({ default: () => <input /> }));
vi.mock('@/components/form/SelectReact', () => ({ default: () => <select /> }));
vi.mock('@/components/ui/DataTable', () => ({ default: () => <div /> }));
vi.mock('@/components/ui/Badge', () => ({ default: ({ children }: PropsWithChildren) => <span>{children}</span> }));
vi.mock('@/components/ui/Alert', () => ({ default: ({ children }: PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({ default: ({ children }: PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/layouts/Container/Container', () => ({ default: ({ children }: PropsWithChildren) => <div>{children}</div> }));
vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: PropsWithChildren) => <header>{children}</header>,
	SubheaderLeft: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));
vi.mock('@/components/ui/Tooltip', () => ({ default: ({ children }: PropsWithChildren) => <>{children}</> }));
vi.mock('../detail/components/modals/SaleDetailPage', () => ({ default: () => <div data-testid='sale-detail' /> }));
vi.mock('../detail/components/modals/CloseSaleModal', () => ({ default: () => null }));
vi.mock('../detail/components/modals/DeleteSaleModal', () => ({ default: () => null }));

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
		act(() => store.dispatch(setSubsidiary(2)));

		await waitFor(() => expect(screen.queryByTestId('sale-detail')).not.toBeInTheDocument());
		expect(navigateSpy).toHaveBeenCalledWith('/comercial/ventas', { replace: true });
	});
});
