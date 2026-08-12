import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import DeleteCustomerSaleModal from '../components/modals/DeleteCustomerSaleModal';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));
const toastSpies = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('react-toastify', () => ({ toast: toastSpies }));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch };
});
vi.mock('@/components/ui/Modal', () => ({
	default: ({ children }: PropsWithChildren) => <section>{children}</section>,
	ModalHeader: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		isDisable,
	}: PropsWithChildren & { onClick?: () => void; isDisable?: boolean }) => (
		<button type='button' onClick={onClick} disabled={isDisable}>
			{children}
		</button>
	),
}));

const renderModal = (onDeleted = vi.fn(), setIsOpen = vi.fn()) => {
	const store = configureStore({ reducer: { customerSales: customerSalesReducer } });
	render(
		<Provider store={store}>
			<DeleteCustomerSaleModal
				isOpen
				setIsOpen={setIsOpen}
				customerId={8}
				subsidiaryId={1}
				onDeleted={onDeleted}
			/>
		</Provider>,
	);
	return { onDeleted, setIsOpen };
};

describe('DeleteCustomerSaleModal', () => {
	beforeEach(() => {
		apiSpies.fetchData.mockReset();
		toastSpies.error.mockReset();
	});

	it('cierra y refresca sólo luego de eliminar exitosamente', async () => {
		apiSpies.fetchData.mockResolvedValue({ data: { message: 'Cliente eliminado' } });
		const { onDeleted, setIsOpen } = renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

		await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
		expect(setIsOpen).toHaveBeenCalledWith(false);
		expect(toastSpies.error).not.toHaveBeenCalled();
	});

	it('mantiene el modal abierto y muestra el error si DELETE falla', async () => {
		apiSpies.fetchData.mockRejectedValue({ response: { status: 500, data: {} } });
		const { onDeleted, setIsOpen } = renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

		await waitFor(() => expect(toastSpies.error).toHaveBeenCalledOnce());
		expect(onDeleted).not.toHaveBeenCalled();
		expect(setIsOpen).not.toHaveBeenCalledWith(false);
	});
});
