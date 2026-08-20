import React, { type PropsWithChildren } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentCreditProfileListItem } from '@/interface/deferredPayments.interface';
import CarteraCreditoView from '../CarteraCreditoView';

const editModalProps = vi.hoisted(() => vi.fn());

const profile = (customerSaleId: number): IDeferredPaymentCreditProfileListItem => ({
	id: customerSaleId,
	customer_sale_id: customerSaleId,
	is_active: true,
	payment_term_days: 30,
	credit_limit: '500000.00',
	notes: null,
	outstanding_balance: '0.00',
	available_credit: '500000.00',
	credit_limit_exceeded: false,
	customer: {
		id: customerSaleId,
		customer_code: null,
		rut: '11.111.111-1',
		billing_company: `Cliente ${customerSaleId}`,
		contact_name: null,
		email: null,
		phone: null,
	},
	created_at: null,
	updated_at: null,
});

let carteraState: {
	data: { rows: IDeferredPaymentCreditProfileListItem[]; meta: null };
	state: { loading: boolean; error: null; hasDataContext: boolean };
	filters: {
		search: string;
		status: 'all';
		setSearch: (value: string) => void;
		setStatus: (value: 'all') => void;
		setPagination: (page: number, perPage: number) => void;
		reset: () => void;
	};
	actions: { retry: () => void; refresh: () => void; refreshAfterDeletion: () => void };
	branch: { branchId: number | null; subsidiaryId: number | null };
};

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../hooks/useCarteraCredito', () => ({ default: () => carteraState }));
vi.mock('../components/CreditProfileEditModal', () => ({
	default: ({
		profile: selectedProfile,
		subsidiaryId,
		initialDeleteConfirmation,
	}: {
		profile: IDeferredPaymentCreditProfileListItem;
		subsidiaryId: number;
		initialDeleteConfirmation?: boolean;
	}) => {
		editModalProps({ profile: selectedProfile, subsidiaryId, initialDeleteConfirmation });
		return <div data-testid='credit-profile-edit-modal' data-subsidiary-id={subsidiaryId} />;
	},
}));
vi.mock('@/pages/comercial/pagosDiferidos/utils', () => ({
	formatDeferredPaymentAmount: (amount: string) => amount,
}));
vi.mock('@/components/ui/Alert', () => ({
	default: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		ariaLabel,
	}: PropsWithChildren & { onClick?: () => void; ariaLabel?: string }) => (
		<button type='button' aria-label={ariaLabel} onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		onClick,
		'aria-label': ariaLabel,
	}: PropsWithChildren & { onClick?: () => void; 'aria-label'?: string }) => (
		<button type='button' aria-label={ariaLabel} onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/Card', () => ({
	default: ({ children }: PropsWithChildren) => <section>{children}</section>,
	CardBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	CardHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	CardTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
}));
vi.mock('@/components/layouts/Container/Container', () => ({
	default: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => null }));
vi.mock('@/components/form/Input', () => ({ default: () => <input /> }));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
vi.mock('@/components/form/SelectReact', () => ({
	default: () => <select aria-label='Estado del crédito' />,
}));
vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: PropsWithChildren) => <header>{children}</header>,
	SubheaderLeft: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Table', () => ({
	default: ({ children }: PropsWithChildren) => <table>{children}</table>,
	TBody: ({ children }: PropsWithChildren) => <tbody>{children}</tbody>,
	Td: ({ children }: PropsWithChildren) => <td>{children}</td>,
	THead: ({ children }: PropsWithChildren) => <thead>{children}</thead>,
	Th: ({ children }: PropsWithChildren) => <th>{children}</th>,
	Tr: ({ children }: PropsWithChildren) => <tr>{children}</tr>,
}));
vi.mock('@/components/ui/Tooltip', () => ({
	default: ({ children }: PropsWithChildren) => children,
}));
vi.mock('@/templates/Table/TableFooterTemplateV2', () => ({ default: () => null }));

describe('CarteraCreditoView con cambio de subsidiaria', () => {
	beforeEach(() => {
		editModalProps.mockClear();
		carteraState = {
			data: { rows: [profile(8)], meta: null },
			state: { loading: false, error: null, hasDataContext: true },
			filters: {
				search: '',
				status: 'all',
				setSearch: vi.fn(),
				setStatus: vi.fn(),
				setPagination: vi.fn(),
				reset: vi.fn(),
			},
			actions: { retry: vi.fn(), refresh: vi.fn(), refreshAfterDeletion: vi.fn() },
			branch: { branchId: 1, subsidiaryId: 1 },
		};
	});

	it('cierra síncronamente la edición antes de reutilizar el mismo customer_sale_id en otra subsidiaria', async () => {
		const view = render(<CarteraCreditoView />);

		fireEvent.click(screen.getByRole('button', { name: 'Editar crédito de Cliente 8' }));
		expect(await screen.findByTestId('credit-profile-edit-modal')).toHaveAttribute(
			'data-subsidiary-id',
			'1',
		);

		carteraState = {
			...carteraState,
			data: { rows: [profile(8)], meta: null },
			branch: { branchId: 2, subsidiaryId: 2 },
		};
		view.rerender(<CarteraCreditoView />);

		expect(screen.queryByTestId('credit-profile-edit-modal')).not.toBeInTheDocument();
	});

	it('abre directamente la confirmación de eliminación para un perfil suspendido', async () => {
		carteraState = {
			...carteraState,
			data: { rows: [{ ...profile(8), is_active: false }], meta: null },
		};
		render(<CarteraCreditoView />);

		fireEvent.click(screen.getByRole('button', { name: 'Eliminar crédito de Cliente 8' }));

		expect(await screen.findByTestId('credit-profile-edit-modal')).toBeInTheDocument();
		expect(editModalProps).toHaveBeenLastCalledWith(
			expect.objectContaining({ initialDeleteConfirmation: true, subsidiaryId: 1 }),
		);
	});
});
