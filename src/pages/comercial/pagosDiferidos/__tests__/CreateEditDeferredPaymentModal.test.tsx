import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usersAdminReducer from '@/store/slices/usersAdmin/usersAdminSlice';
import CreateEditDeferredPaymentModal from '../components/modals/CreateEditDeferredPaymentModal';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: () => true, isSuperAdmin: true }),
}));
vi.mock('@/store/slices/deferredPayments/deferredPaymentsConfig', () => ({ default: true }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: 1, hasValidBranch: true }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

describe('CreateEditDeferredPaymentModal', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});
	const renderModal = (onClose = vi.fn()) => {
		const store = configureStore({
			reducer: {
				customerSales: customerSalesReducer,
				deferredPayments: deferredPaymentsReducer,
				usersAdmin: usersAdminReducer,
			},
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		render(<CreateEditDeferredPaymentModal isOpen onClose={onClose} />, {
			wrapper: Wrapper,
		});
		return { onClose };
	};

	it('muestra el formulario de creación con total e ítems', () => {
		renderModal();

		expect(screen.getByRole('heading', { name: 'Nuevo documento' })).toBeInTheDocument();
		expect(screen.getByText('Ítems del documento')).toBeInTheDocument();
		expect(screen.getByText('Total estimado')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).toBeInTheDocument();
	});

	it('no se cierra al hacer clic fuera y sí permite cancelar explícitamente', () => {
		const { onClose } = renderModal();

		fireEvent.mouseDown(document.body);
		expect(onClose).not.toHaveBeenCalled();
		expect(screen.getByRole('heading', { name: 'Nuevo documento' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
