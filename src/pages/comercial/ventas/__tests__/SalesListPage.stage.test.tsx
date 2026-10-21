import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import salesReducer from '@/store/slices/salesSlice';
import type { ISale } from '@/interface/sales.interface';
import SalesListPage from '../SalesListPage';

type IRequestCfg = { url: string; method?: string; params?: Record<string, unknown> };

interface ICapturedDetailProps {
	saleId: number;
	openReceiveReturn?: boolean;
}

interface ICapturedCloseProps {
	saleId: number;
	isMultiLocation?: boolean;
}

const { fetchData, stage, detailProps, closeProps } = vi.hoisted(() => ({
	fetchData: vi.fn<(cfg: IRequestCfg) => Promise<unknown>>(),
	stage: { isMultiLocation: true },
	detailProps: { current: null as ICapturedDetailProps | null },
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
vi.mock('@/store/selectors/subsidiarySelectors', () => ({
	selectEffectiveSubsidiaryId: () => 1,
}));
vi.mock('@/store/slices/sales/salesSlice', () => ({
	downloadShippingLabel: () => ({ type: 'sales/download' }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({}) }));
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: stage.isMultiLocation,
		isMultiLocation: stage.isMultiLocation,
		isLoading: false,
	}),
}));
// El permiso lo cubre ProtectedButton por su cuenta: aquí sólo importa cuándo se ofrece.
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		onClick,
		'aria-label': ariaLabel,
	}: PropsWithChildren<{ onClick?: () => void; 'aria-label'?: string }>) => (
		<button type='button' aria-label={ariaLabel} onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
// Los modales se sustituyen: la prueba mira con qué los abre el listado.
vi.mock('../detail/components/modals/SaleDetailPage', () => ({
	default: (props: ICapturedDetailProps) => {
		detailProps.current = props;
		return <div data-testid='sale-detail'>Detalle {props.saleId}</div>;
	},
}));
vi.mock('../detail/components/modals/CloseSaleModal', () => ({
	default: (props: ICapturedCloseProps) => {
		closeProps.current = props;
		return <div data-testid='close-sale'>Cierre {props.saleId}</div>;
	},
}));

const PENDING = { id: 12, sale_cycle: 0, status: 'pending_receipt', source: 'channel' } as const;

let sales: Partial<ISale>[];
let pendingSerial: Array<{ id: number; items: unknown[] }>;

const createStore = () =>
	configureStore({
		reducer: { salesModule: salesReducer, auth: () => ({ loading: false, user: null }) },
	});

const renderList = () =>
	render(
		<Provider store={createStore()}>
			<SalesListPage />
		</Provider>,
	);

const RECEIVE_LABEL = 'Recibir la devolución de la venta 90';

beforeEach(() => {
	fetchData.mockReset();
	stage.isMultiLocation = true;
	detailProps.current = null;
	closeProps.current = null;
	sales = [
		{ id: 90, sale_number: 'V-90', status: 'refunded', pending_return: PENDING },
		{ id: 91, sale_number: 'V-91', status: 'processing', pending_return: null },
	];
	pendingSerial = [];
	fetchData.mockImplementation((cfg: IRequestCfg) => {
		if (cfg.url.endsWith('/pending-serial-assignment'))
			return Promise.resolve({ data: { data: pendingSerial } });
		if (cfg.url.endsWith('/pending-serial-assignment/count'))
			return Promise.resolve({ data: { count: pendingSerial.length } });
		return Promise.resolve({
			data: {
				data: sales,
				meta: { current_page: 1, last_page: 1, per_page: 5, total: sales.length },
			},
		});
	});
});

describe('listado de ventas: devolución pendiente (etapa 2)', () => {
	it('ofrece «Recibir devolución» sólo en la venta con pending_return', async () => {
		renderList();
		// El listado se vuelve a pintar al llegar los datos: se busca de nuevo en cada intento.
		await waitFor(() =>
			expect(screen.getByRole('button', { name: RECEIVE_LABEL })).toBeInTheDocument(),
		);
		expect(
			screen.queryByRole('button', { name: 'Recibir la devolución de la venta 91' }),
		).not.toBeInTheDocument();
	});

	it('abre el detalle directo en la recepción', async () => {
		renderList();
		await waitFor(() => {
			fireEvent.click(screen.getByRole('button', { name: RECEIVE_LABEL }));
			expect(screen.getByTestId('sale-detail')).toBeInTheDocument();
		});
		expect(detailProps.current).toMatchObject({ saleId: 90, openReceiveReturn: true });
	});

	it('el ojo abre el detalle sin abrir la recepción', async () => {
		renderList();
		await screen.findByRole('button', { name: RECEIVE_LABEL });
		const eye = document.querySelectorAll('button');
		// El ojo de la primera fila: el botón violeta que no es la recepción ni el ticket.
		const viewButton = Array.from(eye).find(
			(button) => button.className.includes('violet') && !button.getAttribute('aria-label'),
		);
		expect(viewButton).toBeDefined();
		fireEvent.click(viewButton as HTMLButtonElement);
		await screen.findByTestId('sale-detail');
		expect(detailProps.current?.openReceiveReturn).toBe(false);
	});

	it('en la etapa 1 no ofrece la recepción', async () => {
		stage.isMultiLocation = false;
		renderList();
		await screen.findByText('V-90');
		expect(screen.queryByRole('button', { name: RECEIVE_LABEL })).not.toBeInTheDocument();
	});
});

describe('listado de ventas: devolución pendiente con series por asignar', () => {
	const assignButtons = () =>
		Array.from(document.querySelectorAll('button')).filter((candidate) =>
			candidate.className.includes('amber-500/30'),
		);

	beforeEach(() => {
		pendingSerial = [
			{ id: 90, items: [] },
			{ id: 91, items: [] },
		];
	});

	it('en la etapa 2 ofrece recibir en vez de asignar series', async () => {
		renderList();
		await waitFor(() => expect(assignButtons()).toHaveLength(1));
		expect(screen.getByRole('button', { name: RECEIVE_LABEL })).toBeInTheDocument();
	});

	it('en la etapa 1 conserva asignar series', async () => {
		stage.isMultiLocation = false;
		renderList();
		await waitFor(() => expect(assignButtons()).toHaveLength(2));
	});
});

describe('listado de ventas: asignar series abre el cierre con la etapa', () => {
	beforeEach(() => {
		pendingSerial = [{ id: 91, items: [] }];
	});

	it.each([
		[true, 'etapa 2'],
		[false, 'etapa 1'],
	])('pasa isMultiLocation=%s al cierre (%s)', async (multiLocation) => {
		stage.isMultiLocation = multiLocation;
		renderList();
		await screen.findByText('V-91');
		const assign = await waitFor(() => {
			const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
				candidate.className.includes('amber-500/30'),
			);
			expect(button).toBeDefined();
			return button as HTMLButtonElement;
		});
		fireEvent.click(assign);
		await screen.findByTestId('close-sale');
		expect(closeProps.current).toMatchObject({ saleId: 91, isMultiLocation: multiLocation });
	});
});
