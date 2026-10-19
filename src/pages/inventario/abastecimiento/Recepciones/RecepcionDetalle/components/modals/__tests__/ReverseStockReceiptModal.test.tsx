import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReverseStockReceiptModal from '../ReverseStockReceiptModal';

/**
 * Los dos 409 definitivos de `reverse` (tarea 12 del backend) se explican en
 * el modal y bloquean confirmar otra vez: reintentar no los resuelve.
 */

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/hooks/useDir', () => ({
	default: () => ({ dir: 'ltr', isLTR: true, isRTL: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooterChild: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// `Alert` lee el tema desde Redux; acá sólo importa qué aviso se muestra.
vi.mock('@/components/ui/Alert', () => ({
	default: ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
		<div role='alert'>
			<strong>{title}</strong>
			{children}
		</div>
	),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const dispatch = vi.hoisted(() => vi.fn());
vi.mock('@/store', () => ({ useAppDispatch: () => dispatch }));
vi.mock('@/store/slices/procurement/stockReceiptsSlice', () => ({
	reverseStockReceiptThunk: (args: unknown) => ({ type: 'reverse', args }),
}));

const conflict = (code: string, message: string) => ({
	isAxiosError: true,
	response: { status: 409, data: { code, message } },
});

const reverseWith = (rejection: unknown) => {
	dispatch.mockReturnValue({ unwrap: () => Promise.reject(rejection) });
	render(
		<ReverseStockReceiptModal
			isOpen
			setIsOpen={vi.fn()}
			receipt={{ id: 80 }}
			subsidiaryId={2}
			onReversed={vi.fn()}
		/>,
	);
	fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Error de digitación' } });
	fireEvent.click(screen.getByRole('button', { name: /Revertir/ }));
};

afterEach(() => {
	dispatch.mockReset();
});

describe('ReverseStockReceiptModal', () => {
	it('con unidades reservadas lo explica y no deja confirmar de nuevo', async () => {
		reverseWith(
			conflict('RECEIPT_STOCK_RESERVED', 'Revertir dejaría el disponible bajo cero.'),
		);

		expect(await screen.findByText('Hay unidades reservadas')).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: /Revertir/ })).toBeDisabled(),
		);
	});

	it('con unidades consumidas propone un ajuste y no deja confirmar de nuevo', async () => {
		reverseWith(conflict('RECEIPT_ALREADY_CONSUMED', 'Parte del stock ya se usó.'));

		expect(await screen.findByText('Las unidades ya se consumieron')).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: /Revertir/ })).toBeDisabled(),
		);
	});

	it('el motivo respeta el tope del backend', () => {
		render(
			<ReverseStockReceiptModal
				isOpen
				setIsOpen={vi.fn()}
				receipt={{ id: 80 }}
				subsidiaryId={2}
				onReversed={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText('Motivo')).toHaveAttribute('maxLength', '500');
	});
});
