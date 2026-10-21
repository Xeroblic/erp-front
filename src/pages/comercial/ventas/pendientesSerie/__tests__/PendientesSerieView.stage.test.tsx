import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import pendingSerialReducer from '@/store/slices/pendingSerial/pendingSerialSlice';
import PendientesSerieView from '../PendientesSerieView';

type IRequestCfg = { url: string; method?: string; params?: Record<string, unknown> };

interface ICapturedCloseProps {
	saleId: number;
	isMultiLocation?: boolean;
}

const { fetchData, stage, closeProps } = vi.hoisted(() => ({
	fetchData: vi.fn<(cfg: IRequestCfg) => Promise<unknown>>(),
	stage: { isMultiLocation: true },
	closeProps: { current: null as ICapturedCloseProps | null },
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return {
		injectReducer: vi.fn(),
		useAppDispatch: redux.useDispatch,
		useAppSelector: redux.useSelector,
	};
});
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({}) }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ subsidiaryId: 1, branchId: 1, hasValidBranch: true }),
}));
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: stage.isMultiLocation,
		isMultiLocation: stage.isMultiLocation,
		isLoading: false,
	}),
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
// Los modales se sustituyen: la prueba mira con qué abre la bandeja el cierre.
vi.mock('@/pages/comercial/ventas/detail/components/modals/CloseSaleModal', () => ({
	default: (props: ICapturedCloseProps) => {
		closeProps.current = props;
		return <div data-testid='close-sale'>Cierre {props.saleId}</div>;
	},
}));
vi.mock('@/pages/comercial/ventas/detail/components/modals/SaleDetailPage', () => ({
	default: () => <div data-testid='sale-detail' />,
}));
vi.mock('@/pages/comercial/ventas/detail/hooks/useSaleReturnWrites', () => ({
	useSaleReturnWrites: () => ({}),
}));

const PENDING_SALE = {
	id: 91,
	sale_number: 'V-91',
	wc_order_id: null,
	wc_order_number: null,
	status: 'processing',
	is_closed: false,
	subsidiary_id: 1,
	branch_id: 1,
	customer_name: 'Cliente',
	created_at: '2026-10-20T10:00:00Z',
	serialized_items: [],
};

const createStore = () =>
	configureStore({
		reducer: {
			pendingSerial: pendingSerialReducer,
			auth: () => ({ loading: false, user: null }),
		},
	});

const renderView = () =>
	render(
		<Provider store={createStore()}>
			<PendientesSerieView />
		</Provider>,
	);

beforeEach(() => {
	fetchData.mockReset();
	closeProps.current = null;
	fetchData.mockImplementation((cfg: IRequestCfg) => {
		if (cfg.url.endsWith('/pending-serial-assignment/count'))
			return Promise.resolve({ data: { count: 1 } });
		return Promise.resolve({
			data: {
				data: [PENDING_SALE],
				meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
			},
		});
	});
});

describe('pendientes de serie: asignar series abre el cierre con la etapa', () => {
	it.each([
		[true, 'etapa 2'],
		[false, 'etapa 1'],
	])('pasa isMultiLocation=%s al cierre (%s)', async (multiLocation) => {
		stage.isMultiLocation = multiLocation;
		renderView();
		await screen.findByText('V-91');
		fireEvent.click(screen.getByRole('button', { name: /Asignar series/ }));
		await screen.findByTestId('close-sale');
		expect(closeProps.current).toMatchObject({ saleId: 91, isMultiLocation: multiLocation });
	});
});
