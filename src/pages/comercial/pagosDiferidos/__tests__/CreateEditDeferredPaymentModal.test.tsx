import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usersAdminReducer from '@/store/slices/usersAdmin/usersAdminSlice';
import CreateEditDeferredPaymentModal from '../components/modals/CreateEditDeferredPaymentModal';
import { DEFERRED_PAYMENT_DOCUMENT_FIXTURES } from './deferredPaymentTestFixtures';

const toastSpies = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('react-toastify', () => ({ toast: toastSpies }));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: () => true, isSuperAdmin: true }),
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: 1, hasValidBranch: true }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

describe('CreateEditDeferredPaymentModal', () => {
	beforeEach(() => {
		toastSpies.error.mockClear();
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});
	const renderModal = (onClose = vi.fn(), document = null as IDeferredPaymentDocument | null) => {
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
		const renderResult = render(
			<CreateEditDeferredPaymentModal
				isOpen
				onClose={onClose}
				deferredPaymentDocument={document}
			/>,
			{ wrapper: Wrapper },
		);
		return { onClose, ...renderResult };
	};

	it('muestra el formulario de creación con total e ítems', async () => {
		renderModal();

		expect(screen.getByRole('heading', { name: 'Nuevo documento' })).toBeInTheDocument();
		expect(screen.getByLabelText('Número de documento')).toHaveAttribute(
			'placeholder',
			'Ej.: FAC-001234',
		);
		expect(screen.getByLabelText('Orden de compra (opcional)')).toHaveAttribute(
			'placeholder',
			'Ej.: OC-12345',
		);
		const notes = screen.getByLabelText('Notas (opcional)');
		await act(async () => {
			fireEvent.blur(notes);
			await Promise.resolve();
		});
		expect(notes).not.toHaveClass('!border-green-500');
		expect(notes).toHaveClass('bg-zinc-50', 'dark:bg-zinc-900');
		expect(notes.style.getPropertyValue('--textarea-border')).toBe('#d4d4d8');
		expect(screen.getByText('Ítems del documento')).toBeInTheDocument();
		expect(screen.getByText('Total estimado')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).toBeInTheDocument();
	});

	it('descarta el borrador al desmontar y reabrir el formulario', () => {
		const firstCreate = renderModal();
		fireEvent.change(screen.getByLabelText('Número de documento'), {
			target: { value: 'FD-STALE-001' },
		});
		firstCreate.unmount();

		const secondCreate = renderModal();
		expect(screen.getByLabelText('Número de documento')).toHaveValue('');
		secondCreate.unmount();

		const savedDocument = DEFERRED_PAYMENT_DOCUMENT_FIXTURES[1];
		const firstEdit = renderModal(vi.fn(), savedDocument);
		fireEvent.change(screen.getByLabelText('Notas (opcional)'), {
			target: { value: 'BORRADOR NO GUARDADO' },
		});
		firstEdit.unmount();

		renderModal(vi.fn(), savedDocument);
		expect(screen.getByLabelText('Notas (opcional)')).toHaveValue(savedDocument.notes);
	});
	it('muestra etiquetas y mensajes al omitir campos obligatorios', async () => {
		renderModal();

		expect(screen.getByLabelText('Código')).toBeInTheDocument();
		expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
		expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
		expect(screen.getByLabelText('Precio unitario')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Crear documento' }));

		expect(toastSpies.error).toHaveBeenCalledWith(
			'El total del documento debe ser mayor a 0',
		);
		expect(await screen.findByText('Selecciona un cliente')).toBeInTheDocument();
		expect(screen.getByText('Ingresa el número de documento')).toBeInTheDocument();
		expect(screen.getByText('Ingresa el código del ítem')).toBeInTheDocument();
		expect(screen.getByText('Ingresa la descripción del ítem')).toBeInTheDocument();
	});
	it('permite agregar y quitar seriales del ítem', async () => {
		renderModal();
		const serialInput = screen.getByLabelText('Seriales (opcional)');

		await act(async () => {
			fireEvent.change(serialInput, { target: { value: 'SER-NUEVO-001' } });
			fireEvent.keyDown(serialInput, { key: 'Enter' });
			await Promise.resolve();
		});

		expect(screen.getByText('SER-NUEVO-001')).toBeInTheDocument();
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Quitar serial SER-NUEVO-001' }));
			await Promise.resolve();
		});
		expect(screen.queryByText('SER-NUEVO-001')).not.toBeInTheDocument();
	});

	it('precarga notas y seriales al editar un documento', () => {
		const document = DEFERRED_PAYMENT_DOCUMENT_FIXTURES[1];
		renderModal(vi.fn(), document);

		expect(screen.getByLabelText('Notas (opcional)')).toHaveValue(document.notes);
		expect(screen.getByText('SER-1-001')).toBeInTheDocument();
	});
	it('muestra la validación de notas demasiado largas', async () => {
		renderModal();
		const notes = screen.getByLabelText('Notas (opcional)');

		await act(async () => {
			fireEvent.change(notes, { target: { value: 'a'.repeat(1001) } });
			fireEvent.blur(notes);
			await Promise.resolve();
		});

		expect(
			await screen.findByText('Las notas no pueden superar los 1000 caracteres'),
		).toBeInTheDocument();
	});
	it('mantiene el cuerpo desplazable y las acciones fuera del área de scroll', () => {
		renderModal();
		const body = document.querySelector('[data-component-name="Modal/ModalBody"]');
		const footer = document.querySelector('[data-component-name="Modal/ModalFooter"]');
		const form = body?.closest('form');

		expect(body).toHaveClass('overflow-y-auto', 'min-h-0', 'flex-1');
		expect(form).toHaveClass('overflow-hidden', 'min-h-0', 'flex-1');
		expect(footer).toHaveClass('shrink-0');
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
