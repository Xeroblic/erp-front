import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import CreateCustomerSaleModal from '../components/modals/CreateCustomerSaleModal';

const apiSpies = vi.hoisted(() => ({
	fetchData: vi.fn(),
	fetchNormalized: vi.fn(),
	invalidateCache: vi.fn(),
}));
const toastSpies = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('react-toastify', () => ({ toast: toastSpies }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { dir: () => 'ltr' } }) }));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: () => true, isSuperAdmin: true }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const renderModal = ({
	refreshStoreOnSuccess,
	onSuccess,
}: {
	refreshStoreOnSuccess?: boolean;
	onSuccess?: (customer: ICustomerSale) => void;
} = {}) => {
	const store = configureStore({ reducer: { customerSales: customerSalesReducer } });
	render(
		<Provider store={store}>
			<CreateCustomerSaleModal
				isOpen
				setIsOpen={vi.fn()}
				subsidiaryId={1}
				refreshStoreOnSuccess={refreshStoreOnSuccess}
				onSuccess={onSuccess}
			/>
		</Provider>,
	);
	return store;
};

const fillValidForm = () => {
	fireEvent.change(screen.getByPlaceholderText('12345678-9'), {
		target: { value: '20761872-1' },
	});
	fireEvent.change(screen.getByPlaceholderText('Empresa S.A.'), {
		target: { value: 'pruebaa' },
	});
	fireEvent.change(screen.getByPlaceholderText('correo@example.cl'), {
		target: { value: 'nicolas.munoz@prueboide.com' },
	});
};

describe('CreateCustomerSaleModal', () => {
	beforeEach(() => {
		apiSpies.fetchNormalized.mockReset();
		apiSpies.fetchData.mockReset();
		toastSpies.error.mockReset();
		document.body.innerHTML = '';
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	it('muestra el mensaje del backend y marca el campo en un 422 de RUT duplicado', async () => {
		apiSpies.fetchNormalized.mockRejectedValue({
			response: {
				status: 422,
				data: {
					message: 'El RUT ya existe para esta subsidiary.',
					errors: { document_number: ['Duplicado'] },
				},
			},
		});
		renderModal();
		fillValidForm();
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() =>
			expect(toastSpies.error).toHaveBeenCalledWith('El RUT ya existe para esta subsidiary.'),
		);
		// `Input` no pinta el texto de invalidFeedback, solo el borde rojo del campo.
		await waitFor(() =>
			expect(screen.getByPlaceholderText('12345678-9').className).toContain(
				'!border-red-500',
			),
		);
		expect(screen.getByPlaceholderText('Empresa S.A.').className).not.toContain(
			'!border-red-500',
		);
	});

	it('usa el mensaje de alcance en un 403 sin cuerpo', async () => {
		apiSpies.fetchNormalized.mockRejectedValue({ response: { status: 403, data: {} } });
		renderModal();
		fillValidForm();
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() => expect(toastSpies.error).toHaveBeenCalledTimes(1));
		expect(toastSpies.error.mock.calls[0][0]).toContain('no tienes acceso a esta subsidiaria');
	});

	it('no refresca el overview cuando refreshStoreOnSuccess es false', async () => {
		apiSpies.fetchNormalized.mockResolvedValue({ id: 9, rut: '20761872-1', is_active: true });
		const onSuccess = vi.fn();
		renderModal({ refreshStoreOnSuccess: false, onSuccess });
		fillValidForm();
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
		expect(apiSpies.fetchData).not.toHaveBeenCalled();
		expect(apiSpies.fetchNormalized).toHaveBeenCalledTimes(1);
	});
});
