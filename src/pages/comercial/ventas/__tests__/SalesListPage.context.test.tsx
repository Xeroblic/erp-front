import React, { type PropsWithChildren } from 'react';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateSpy = vi.hoisted(() => vi.fn());
const routeState = vi.hoisted(() => ({ saleId: '7' }));
const dispatchMock = vi.hoisted(() => vi.fn((action: { unwrap?: () => Promise<void> }) => action));
const salesServiceSpies = vi.hoisted(() => ({
	fetchPendingSerialAssignment: vi.fn(),
	startSaleReturn: vi.fn(),
	receiveSaleReturn: vi.fn(),
}));
/** Props con que la página monta el detalle (mockeado). */
const detailProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }));

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
	loadSalesList: (arg: unknown) => ({
		type: 'sales/load',
		meta: { arg },
		unwrap: async () => undefined,
	}),
	selectSalesList: (() => {
		const sales = [
			{
				id: 7,
				sale_number: 'V-7',
				status: 'pending',
				total_amount: '1000',
				pending_return: {
					id: 12,
					sale_cycle: 0,
					status: 'pending_receipt',
					source: 'channel',
				},
			},
		];
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
// La etapa de la filial la cubre SalesListPage.stage.test; aquí basta la etapa 1.
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: false,
		isMultiLocation: false,
		isLoading: false,
	}),
}));
vi.mock('@/services/salesService', () => ({
	fetchPendingSerialAssignment: salesServiceSpies.fetchPendingSerialAssignment,
	startSaleReturn: salesServiceSpies.startSaleReturn,
	receiveSaleReturn: salesServiceSpies.receiveSaleReturn,
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
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: PropsWithChildren & { onClick?: () => void }) => (
		<button onClick={onClick}>{children}</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children, onClick }: PropsWithChildren & { onClick?: () => void }) => (
		<button onClick={onClick}>{children}</button>
	),
}));
vi.mock('@/components/form/Input', () => ({ default: () => <input /> }));
vi.mock('@/components/form/SelectReact', () => ({ default: () => <select /> }));
vi.mock('@/components/ui/DataTable', () => ({
	default: ({
		columns,
		data,
	}: {
		columns: Array<{
			id?: string;
			accessorKey?: string;
			cell?: (props: { row: { original: unknown } }) => React.ReactNode;
		}>;
		data: unknown[];
	}) => {
		const actionColumn = columns.find((column) => column.id === 'actions');
		const statusColumn = columns.find((column) => column.accessorKey === 'status');
		return (
			<div>
				{data.length > 0 ? statusColumn?.cell?.({ row: { original: data[0] } }) : null}
				{data.length > 0 ? actionColumn?.cell?.({ row: { original: data[0] } }) : null}
			</div>
		);
	},
}));
vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: PropsWithChildren) => <span>{children}</span>,
}));
vi.mock('@/components/ui/Alert', () => ({
	default: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
vi.mock('@/components/layouts/Container/Container', () => ({
	default: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: PropsWithChildren) => <header>{children}</header>,
	SubheaderLeft: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));
vi.mock('@/components/ui/Tooltip', () => ({
	default: ({ children }: PropsWithChildren) => <>{children}</>,
}));
vi.mock('../detail/components/modals/SaleDetailPage', () => ({
	default: (props: Record<string, unknown>) => {
		detailProps.current = props;
		return <div data-testid='sale-detail' />;
	},
}));
vi.mock('../detail/components/modals/CloseSaleModal', () => ({
	default: ({ open }: { open: boolean }) =>
		open ? <div data-testid='close-sale-modal' /> : null,
}));
vi.mock('../detail/components/modals/DeleteSaleModal', () => ({
	default: ({ isOpen }: { isOpen: boolean }) =>
		isOpen ? <div data-testid='delete-sale-modal' /> : null,
}));

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

describe('SalesListPage con una devolución pendiente', () => {
	it('rotula la venta con «Devolución pendiente» junto a su estado', async () => {
		routeState.saleId = undefined as unknown as string;
		salesServiceSpies.fetchPendingSerialAssignment.mockResolvedValue({ data: [] });
		const store = configureStore({ reducer: { context: contextReducer } });
		render(
			<Provider store={store}>
				<SalesListPage />
			</Provider>,
		);

		expect(await screen.findByText('Devolución pendiente')).toBeInTheDocument();
	});
});

type TReturnWritesProp = {
	start: {
		send: (attempt: {
			subsidiaryId: number;
			saleId: number;
			payload: { reason: string };
		}) => Promise<unknown>;
	};
};

describe('SalesListPage tras una devolución', () => {
	const listLoads = () =>
		dispatchMock.mock.calls
			.map(([action]) => action as { type?: string; meta?: { arg?: unknown } })
			.filter((action) => action.type === 'sales/load');

	beforeEach(() => {
		routeState.saleId = '7';
		detailProps.current = null;
		dispatchMock.mockClear();
		salesServiceSpies.fetchPendingSerialAssignment.mockResolvedValue({ data: [] });
		salesServiceSpies.startSaleReturn.mockResolvedValue({ id: 12, sale_id: 7 });
	});

	it('recarga el listado con sus filtros cuando la devolución cambia la venta', async () => {
		const store = configureStore({ reducer: { context: contextReducer } });
		render(
			<Provider store={store}>
				<SalesListPage />
			</Provider>,
		);
		await screen.findByTestId('sale-detail');
		await waitFor(() => expect(listLoads().length).toBeGreaterThan(0));
		const before = listLoads();
		const writesProp = detailProps.current?.returnWrites as TReturnWritesProp | undefined;

		await act(async () => {
			await writesProp?.start.send({
				subsidiaryId: 1,
				saleId: 7,
				payload: { reason: 'El cliente devuelve la compra' },
			});
		});

		const after = listLoads();
		expect(after.length).toBe(before.length + 1);
		expect(after[after.length - 1].meta?.arg).toEqual(before[before.length - 1].meta?.arg);
	});

	it('no recarga el listado de otra filial con la respuesta de la anterior', async () => {
		const store = configureStore({ reducer: { context: contextReducer } });
		render(
			<Provider store={store}>
				<SalesListPage />
			</Provider>,
		);
		await screen.findByTestId('sale-detail');
		const writesProp = detailProps.current?.returnWrites as TReturnWritesProp | undefined;
		expect(writesProp).toBeDefined();
		act(() => {
			store.dispatch(setSubsidiary(2));
		});
		await act(async () => {
			await Promise.resolve();
		});
		const before = listLoads().length;

		await act(async () => {
			await writesProp?.start.send({
				subsidiaryId: 1,
				saleId: 7,
				payload: { reason: 'El cliente devuelve la compra' },
			});
		});

		expect(listLoads()).toHaveLength(before);
	});
});
