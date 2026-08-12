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

interface RenderModalOptions {
	refreshStoreOnSuccess?: boolean;
	onSuccess?: (customer: ICustomerSale) => void;
	subsidiaryId?: number | null;
	isOpen?: boolean;
	isEdit?: boolean;
	initialData?: Partial<ICustomerSale> | null;
	setIsOpen?: (value: boolean) => void;
}

const renderModal = ({
	refreshStoreOnSuccess,
	onSuccess,
	subsidiaryId = 1,
	isOpen = true,
	isEdit = false,
	initialData = null,
	setIsOpen = vi.fn(),
}: RenderModalOptions = {}) => {
	const store = configureStore({ reducer: { customerSales: customerSalesReducer } });
	const view = render(
		<Provider store={store}>
			<CreateCustomerSaleModal
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				subsidiaryId={subsidiaryId}
				isEdit={isEdit}
				initialData={initialData}
				refreshStoreOnSuccess={refreshStoreOnSuccess}
				onSuccess={onSuccess}
			/>
		</Provider>,
	);
	const rerenderModal = (next: RenderModalOptions = {}) =>
		view.rerender(
			<Provider store={store}>
				<CreateCustomerSaleModal
					isOpen={next.isOpen ?? isOpen}
					setIsOpen={next.setIsOpen ?? setIsOpen}
					subsidiaryId={next.subsidiaryId ?? subsidiaryId}
					isEdit={next.isEdit ?? isEdit}
					initialData={next.initialData ?? initialData}
					refreshStoreOnSuccess={next.refreshStoreOnSuccess ?? refreshStoreOnSuccess}
					onSuccess={next.onSuccess ?? onSuccess}
				/>
			</Provider>,
		);
	return { store, rerenderModal, unmount: view.unmount };
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

const fillContactGroup = () => {
	fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
		target: { value: 'Nicolás Muñoz' },
	});
	fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), {
		target: { value: '+56912345678' },
	});
};

const getSubmittedPayload = (): Record<string, unknown> =>
	(apiSpies.fetchNormalized.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;

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

	describe('contacto principal', () => {
		it('omite el grupo completo en el payload mínimo que el formulario da por válido', async () => {
			apiSpies.fetchNormalized.mockResolvedValue({
				id: 9,
				rut: '20761872-1',
				is_active: true,
			});
			const onSuccess = vi.fn();
			renderModal({ refreshStoreOnSuccess: false, onSuccess });
			fillValidForm();
			fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

			await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
			const payload = getSubmittedPayload();
			// El backend exige los tres o ninguno: enviar el grupo a medias devolvía un 422.
			expect(payload).not.toHaveProperty('primary_contact');
			expect(payload).not.toHaveProperty('primary_contact_name');
			expect(payload).not.toHaveProperty('primary_contact_email');
			expect(payload).not.toHaveProperty('primary_contact_phone');
			expect(payload.rut).toBe('20761872-1');
		});

		it('envía el grupo entero cuando nombre, email y teléfono están completos', async () => {
			apiSpies.fetchNormalized.mockResolvedValue({
				id: 9,
				rut: '20761872-1',
				is_active: true,
			});
			const onSuccess = vi.fn();
			renderModal({ refreshStoreOnSuccess: false, onSuccess });
			fillValidForm();
			fillContactGroup();
			fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

			await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
			expect(getSubmittedPayload()).toMatchObject({
				primary_contact: {
					name: 'Nicolás Muñoz',
					email: 'nicolas.munoz@prueboide.com',
					phone: '+56912345678',
				},
				primary_contact_name: 'Nicolás Muñoz',
				primary_contact_email: 'nicolas.munoz@prueboide.com',
				primary_contact_phone: '+56912345678',
			});
		});

		it('conserva el borrador cuando el backend responde 422 por contacto incompleto', async () => {
			apiSpies.fetchNormalized.mockRejectedValue({
				response: {
					status: 422,
					data: {
						message: 'Contacto principal incompleto',
						errors: {
							primary_contact_phone: ['El teléfono del contacto es obligatorio'],
						},
					},
				},
			});
			const onSuccess = vi.fn();
			renderModal({ refreshStoreOnSuccess: false, onSuccess });
			fillValidForm();
			fillContactGroup();
			fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

			await waitFor(() =>
				expect(toastSpies.error).toHaveBeenCalledWith('Contacto principal incompleto'),
			);
			expect(onSuccess).not.toHaveBeenCalled();
			expect(screen.getByPlaceholderText('12345678-9')).toHaveValue('20761872-1');
			expect(screen.getByPlaceholderText('Empresa S.A.')).toHaveValue('pruebaa');
			expect(screen.getByPlaceholderText('Juan Pérez')).toHaveValue('Nicolás Muñoz');
			expect(screen.getByPlaceholderText('+56 9 1234 5678')).toHaveValue('+56912345678');
		});
	});

	describe('edición', () => {
		const initialData: Partial<ICustomerSale> = {
			id: 42,
			document_number: '20761872-1',
			billing_company: 'pruebaa',
			email: 'nicolas.munoz@prueboide.com',
			is_active: true,
		};

		it('serializa el RUT como document_number para que el backend valide la unicidad', async () => {
			apiSpies.fetchNormalized.mockResolvedValue({ ...initialData, is_active: true });
			const onSuccess = vi.fn();
			renderModal({ refreshStoreOnSuccess: false, onSuccess, isEdit: true, initialData });
			fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

			await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
			const payload = getSubmittedPayload();
			expect(payload.document_number).toBe('20761872-1');
			// `rut` salta la comprobación de duplicado por subsidiaria en el update.
			expect(payload).not.toHaveProperty('rut');
		});

		it('marca el campo y mantiene el modal abierto ante un 422 de RUT duplicado', async () => {
			apiSpies.fetchNormalized.mockRejectedValue({
				response: {
					status: 422,
					data: {
						message: 'El RUT ya existe para esta subsidiary.',
						errors: { document_number: ['Duplicado'] },
					},
				},
			});
			const onSuccess = vi.fn();
			const setIsOpen = vi.fn();
			renderModal({
				refreshStoreOnSuccess: false,
				onSuccess,
				setIsOpen,
				isEdit: true,
				initialData,
			});
			fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

			await waitFor(() =>
				expect(toastSpies.error).toHaveBeenCalledWith(
					'El RUT ya existe para esta subsidiary.',
				),
			);
			await waitFor(() =>
				expect(screen.getByPlaceholderText('12345678-9').className).toContain(
					'!border-red-500',
				),
			);
			expect(onSuccess).not.toHaveBeenCalled();
			expect(setIsOpen).not.toHaveBeenCalledWith(false);
		});
	});

	describe('respuestas obsoletas', () => {
		/** Deja la mutación colgada hasta que el test la resuelve a mano. */
		const pendingCreate = () => {
			let resolveCreate: ((customer: Partial<ICustomerSale>) => void) | undefined;
			apiSpies.fetchNormalized.mockImplementation(
				() =>
					new Promise<Partial<ICustomerSale>>((resolve) => {
						resolveCreate = resolve;
					}),
			);
			return () => resolveCreate?.({ id: 9, rut: '20761872-1', is_active: true });
		};

		it('descarta el alta iniciada en una subsidiaria si el usuario cambia a otra', async () => {
			const resolveCreate = pendingCreate();
			const onSuccess = vi.fn();
			const setIsOpen = vi.fn();
			const { rerenderModal } = renderModal({
				refreshStoreOnSuccess: false,
				onSuccess,
				setIsOpen,
				subsidiaryId: 1,
			});
			fillValidForm();
			fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
			await waitFor(() => expect(apiSpies.fetchNormalized).toHaveBeenCalledTimes(1));

			// El usuario cambia de subsidiaria antes de que resuelva la creación.
			rerenderModal({ subsidiaryId: 2 });
			resolveCreate();

			await waitFor(() =>
				expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled(),
			);
			expect(onSuccess).not.toHaveBeenCalled();
			expect(setIsOpen).not.toHaveBeenCalledWith(false);
		});

		it('descarta el alta cuando el modal padre se cierra antes de resolver', async () => {
			const resolveCreate = pendingCreate();
			const onSuccess = vi.fn();
			const setIsOpen = vi.fn();
			const { rerenderModal } = renderModal({
				refreshStoreOnSuccess: false,
				onSuccess,
				setIsOpen,
			});
			fillValidForm();
			fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
			await waitFor(() => expect(apiSpies.fetchNormalized).toHaveBeenCalledTimes(1));

			rerenderModal({ isOpen: false });
			resolveCreate();

			await waitFor(() => expect(apiSpies.fetchNormalized).toHaveBeenCalledTimes(1));
			expect(onSuccess).not.toHaveBeenCalled();
			expect(setIsOpen).not.toHaveBeenCalledWith(false);
		});

		it('descarta el alta si el overlay se desmonta por cambiar de contexto', async () => {
			const resolveCreate = pendingCreate();
			const onSuccess = vi.fn();
			const setIsOpen = vi.fn();
			const { unmount } = renderModal({
				refreshStoreOnSuccess: false,
				onSuccess,
				setIsOpen,
			});
			fillValidForm();
			fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
			await waitFor(() => expect(apiSpies.fetchNormalized).toHaveBeenCalledTimes(1));

			unmount();
			resolveCreate();

			await waitFor(() => expect(apiSpies.fetchNormalized).toHaveBeenCalledTimes(1));
			expect(onSuccess).not.toHaveBeenCalled();
			expect(setIsOpen).not.toHaveBeenCalledWith(false);
		});
	});
});
