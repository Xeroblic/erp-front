import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PagosDiferidosView from '../PagosDiferidosView';

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
}

interface ReminderModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
	SubheaderLeft: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	SubheaderRight: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/layouts/Container/Container', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => null }));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: ButtonProps) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<button type='button'>{children}</button>
	),
}));
vi.mock('../components/kpis/DeferredPaymentsKpis', () => ({ default: () => null }));
vi.mock('../components/filters/DeferredPaymentsFilters', () => ({ default: () => null }));
vi.mock('../components/tables/DeferredPaymentsTable', () => ({ default: () => null }));
vi.mock('../components/drawers/DeferredPaymentDetailDrawer', () => ({ default: () => null }));
vi.mock('../components/modals/CreateEditDeferredPaymentModal', () => ({ default: () => null }));
vi.mock('../components/ReminderCadenceCard', () => ({
	default: ({ isOpen, setIsOpen }: ReminderModalProps) =>
		isOpen ? (
			<div role='dialog' aria-label='Recordatorios automáticos'>
				<button type='button' onClick={() => setIsOpen(false)}>
					Cerrar recordatorios
				</button>
			</div>
		) : null,
}));
vi.mock('../hooks/usePagosDiferidos', () => ({
	default: () => ({
		data: { list: [], summary: null, meta: null },
		state: {
			loading: false,
			loadingSummary: false,
			error: null,
			errorSummary: null,
			hasDataContext: true,
		},
		filters: {
			values: { page: 1, per_page: 10 },
			search: '',
			setSearch: vi.fn(),
			setFilter: vi.fn(),
			reset: vi.fn(),
			hasFilters: false,
			hasInvalidDateRange: false,
			isSearchDebouncing: false,
		},
		selection: {
			selectedId: null,
			context: null,
			openDetail: vi.fn(),
			closeDetail: vi.fn(),
		},
		actions: { retryList: vi.fn(), retrySummary: vi.fn() },
		branch: { branchId: 1, subsidiaryId: 1 },
	}),
}));

describe('PagosDiferidosView recordatorios', () => {
	it('abre y cierra la consulta de recordatorios desde el encabezado', () => {
		render(
			<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<PagosDiferidosView />
			</MemoryRouter>,
		);

		expect(
			screen.queryByRole('dialog', { name: 'Recordatorios automáticos' }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Recordatorios' }));
		expect(
			screen.getByRole('dialog', { name: 'Recordatorios automáticos' }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Cerrar recordatorios' }));
		expect(
			screen.queryByRole('dialog', { name: 'Recordatorios automáticos' }),
		).not.toBeInTheDocument();
	});
});
