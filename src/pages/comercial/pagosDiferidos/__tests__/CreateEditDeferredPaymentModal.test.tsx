import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usersAdminReducer from '@/store/slices/usersAdmin/usersAdminSlice';
import CreateEditDeferredPaymentModal from '../components/modals/CreateEditDeferredPaymentModal';
import DEFERRED_PAYMENT_DOCUMENT_FIXTURES from './deferredPaymentTestFixtures';

const toastSpies = vi.hoisted(() => ({
	error: vi.fn(),
	success: vi.fn(),
	warn: vi.fn(),
}));
const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));
const scrollIntoViewSpy = vi.hoisted(() => vi.fn());

vi.mock('react-toastify', () => ({ toast: toastSpies }));
vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: true }),
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
		toastSpies.success.mockClear();
		toastSpies.warn.mockClear();
		apiSpies.fetchData.mockImplementation(() => new Promise(() => undefined));
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoViewSpy,
		});
		scrollIntoViewSpy.mockReset();
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
		expect(screen.getByText('Suma referencial de ítems')).toBeInTheDocument();
		expect(
			screen.getByLabelText('Total del documento — debe coincidir con la factura'),
		).toBeInTheDocument();
		expect(screen.getByTestId('items.0.price-vat-row')).toHaveClass('md:col-span-2');
		expect(screen.getByRole('button', { name: 'Crear documento' })).toBeInTheDocument();
		const createCustomerButton = screen.getByRole('button', { name: 'Crear cliente' });
		expect(createCustomerButton).toHaveTextContent('Crear cliente');
	});

	it('acepta precio unitario con decimales en formato es-CL', async () => {
		renderModal();

		const unitPrice = screen.getByLabelText('Precio neto');
		await act(async () => {
			fireEvent.change(unitPrice, { target: { value: '50.411,76' } });
			await Promise.resolve();
		});
		expect(unitPrice).toHaveValue('$ 50.411,76');
		expect(screen.getByText('Bruto calculado: $ 59.989,99')).toBeInTheDocument();
		expect(screen.getByText('$ 59.990')).toBeInTheDocument();
	});

	it('conserva la coma decimal mientras se escribe un precio unitario y el total', async () => {
		renderModal();
		const unitPrice = screen.getByLabelText('Precio neto');
		const totalAmount = screen.getByLabelText(
			'Total del documento — debe coincidir con la factura',
		);

		await act(async () => {
			fireEvent.change(unitPrice, { target: { value: '50' } });
			fireEvent.change(unitPrice, { target: { value: '50,' } });
			await Promise.resolve();
		});
		expect(unitPrice).toHaveValue('$ 50,');
		await act(async () => {
			fireEvent.change(unitPrice, { target: { value: '50,4' } });
			fireEvent.change(unitPrice, { target: { value: '50,41' } });
			await Promise.resolve();
		});
		expect(unitPrice).toHaveValue('$ 50,41');

		await act(async () => {
			fireEvent.change(totalAmount, { target: { value: '50' } });
			fireEvent.change(totalAmount, { target: { value: '50,' } });
			await Promise.resolve();
		});
		expect(totalAmount).toHaveValue('$ 50,');
		await act(async () => {
			fireEvent.change(totalAmount, { target: { value: '50,4' } });
			fireEvent.change(totalAmount, { target: { value: '50,41' } });
			await Promise.resolve();
		});
		expect(totalAmount).toHaveValue('$ 50,41');
	});

	it('convierte el valor neto con IVA y permite ingresar un bruto sin convertirlo', async () => {
		renderModal();
		const unitPrice = screen.getByLabelText('Precio neto');
		const calculateVat = screen.getByLabelText('Calcular IVA');

		await act(async () => {
			fireEvent.change(unitPrice, { target: { value: '100' } });
			await Promise.resolve();
		});
		expect(screen.getByText('Bruto calculado: $ 119')).toBeInTheDocument();

		await act(async () => {
			fireEvent.click(calculateVat);
			await Promise.resolve();
		});
		expect(calculateVat).not.toBeChecked();
		expect(screen.getByLabelText('Precio bruto c/ IVA')).toHaveValue('$ 100');

		await act(async () => {
			fireEvent.change(screen.getByLabelText('Precio bruto c/ IVA'), {
				target: { value: '120' },
			});
			await Promise.resolve();
		});
		expect(screen.queryByText('Bruto calculado: $ 120')).not.toBeInTheDocument();
	});

	it('mantiene el total oficial al ingresar un precio sin IVA', async () => {
		renderModal();
		const totalAmount = screen.getByLabelText(
			'Total del documento — debe coincidir con la factura',
		);
		await act(async () => {
			fireEvent.change(totalAmount, { target: { value: '475976' } });
			fireEvent.change(screen.getByLabelText('Precio neto'), {
				target: { value: '100' },
			});
			await Promise.resolve();
		});
		expect(screen.getByText('Bruto calculado: $ 119')).toBeInTheDocument();
		expect(totalAmount).toHaveValue('$ 475.976');
	});

	it('muestra siempre la ayuda de desglose cuando el total oficial es positivo', async () => {
		renderModal();
		const totalAmount = screen.getByLabelText(
			'Total del documento — debe coincidir con la factura',
		);

		await act(async () => {
			fireEvent.change(totalAmount, { target: { value: '299950' } });
			await Promise.resolve();
		});

		expect(screen.getByText('Si el total incluye IVA 19%:')).toBeInTheDocument();
		expect(screen.getByText('Neto: $ 252.059')).toBeInTheDocument();
		expect(screen.getByText('IVA: $ 47.891')).toBeInTheDocument();
		expect(screen.getByText('Total: $ 299.950')).toBeInTheDocument();

		await act(async () => {
			fireEvent.click(screen.getByLabelText('Calcular IVA'));
			await Promise.resolve();
		});
		expect(screen.getByText('Si el total incluye IVA 19%:')).toBeInTheDocument();
	});

	it('muestra el desglose en edición aunque el precio guardado no se reinterprete', () => {
		renderModal(vi.fn(), DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]);

		expect(screen.getByText('Si el total incluye IVA 19%:')).toBeInTheDocument();
		expect(screen.getByText('Total: $ 2.500.000')).toBeInTheDocument();
		expect(screen.getByLabelText('Precio bruto c/ IVA')).toBeInTheDocument();
		expect(screen.getByRole('checkbox', { name: 'Calcular IVA' })).toHaveAccessibleName(
			'Calcular IVA',
		);
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
		expect(screen.getByLabelText('Precio neto')).toBeInTheDocument();
		const issueDate = screen.getAllByPlaceholderText('dd-mm-aaaa')[0];
		fireEvent.change(issueDate, { target: { value: '' } });

		fireEvent.click(screen.getByRole('button', { name: 'Crear documento' }));

		expect(await screen.findByText('Selecciona un cliente')).toBeInTheDocument();
		expect(toastSpies.error).not.toHaveBeenCalled();
		expect(screen.getByText('Ingresa el número de documento')).toBeInTheDocument();
		expect(screen.getByText('Selecciona la fecha de emisión')).toBeInTheDocument();
		expect(screen.getByText('Ingresa el código del ítem')).toBeInTheDocument();
		expect(screen.getByText('Ingresa la descripción del ítem')).toBeInTheDocument();
		expect(screen.getByTestId('items.0.price-vat-row')).toHaveClass('md:col-span-2');
		expect(screen.getByTestId('items.0.vat-toggle').parentElement).toHaveClass('md:col-span-2');
		expect(screen.getByRole('button', { name: 'Quitar ítem 1' }).parentElement).toHaveClass(
			'absolute',
			'right-4',
			'top-4',
		);
	});
	it('mantiene la ayuda de adjuntos mientras se envía el documento', async () => {
		renderModal(vi.fn(), DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]);

		expect(screen.getByText(/cuando esté disponible/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled(),
		);
		expect(screen.getByText(/cuando esté disponible/)).toBeInTheDocument();
		fireEvent.drop(window, {
			dataTransfer: {
				files: [new File(['contenido'], 'durante-envio.pdf', { type: 'application/pdf' })],
				types: ['Files'],
			},
		});
		expect(screen.queryByText('durante-envio.pdf')).not.toBeInTheDocument();
	});
	it('enfoca y desplaza el primer campo obligatorio inválido al crear', async () => {
		renderModal();
		scrollIntoViewSpy.mockImplementation(() => {
			expect(screen.getByText('Selecciona un cliente')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: 'Crear documento' }));

		const customerField = screen.getByLabelText('Cliente');
		await waitFor(() => expect(customerField).toHaveFocus());
		expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
	});
	it('enfoca el primer campo inválido de un ítem cuando los datos del documento son válidos', async () => {
		renderModal(vi.fn(), DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]);
		const codeField = screen.getByLabelText('Código');
		fireEvent.change(codeField, { target: { value: '' } });

		fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

		await waitFor(() => expect(codeField).toHaveFocus());
		expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
	});
	it('enfoca el campo obligatorio vacío al editar sin alterar el guardado', async () => {
		renderModal(vi.fn(), DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]);
		const documentNumber = screen.getByLabelText('Número de documento');
		fireEvent.change(documentNumber, { target: { value: '' } });

		fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

		await waitFor(() => expect(documentNumber).toHaveFocus());
		expect(screen.getByText('Ingresa el número de documento')).toBeInTheDocument();
	});
	it('muestra el toast y marca el total oficial cuando es cero', async () => {
		renderModal(vi.fn(), DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]);
		const totalAmount = screen.getByLabelText(
			'Total del documento — debe coincidir con la factura',
		);
		await act(async () => {
			fireEvent.change(totalAmount, { target: { value: '0' } });
			fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
			await Promise.resolve();
		});

		expect(screen.queryByText('El total del documento debe ser mayor a 0')).toBeInTheDocument();

		await vi.waitFor(() => {
			expect(toastSpies.error).toHaveBeenCalledWith(
				'El total del documento debe ser mayor a 0',
			);
		});
		await waitFor(() => expect(totalAmount).toHaveFocus());
		expect(totalAmount).toHaveClass('!border-red-500');
	});
	it('advierte sin bloquear cuando los ítems difieren del total oficial', async () => {
		renderModal(vi.fn(), DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]);
		await act(async () => {
			fireEvent.change(
				screen.getByLabelText('Total del documento — debe coincidir con la factura'),
				{ target: { value: '475976' } },
			);
			await Promise.resolve();
		});

		expect(
			screen.getByText(/La suma de los ítems no coincide con el total del documento/),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
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
	it('separa los seriales pegados y omite los duplicados', async () => {
		renderModal();
		const serialInput = screen.getByLabelText('Seriales (opcional)');

		await act(async () => {
			fireEvent.paste(serialInput, {
				clipboardData: {
					getData: () => ' SER-001,SER-002\nSER-001   SER-003 ',
				},
			});
			await Promise.resolve();
		});

		expect(screen.getByRole('button', { name: 'Quitar serial SER-001' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Quitar serial SER-002' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Quitar serial SER-003' })).toBeInTheDocument();
		expect(toastSpies.warn).toHaveBeenCalledWith('Se omitió 1 serial duplicado.');

		await act(async () => {
			fireEvent.paste(serialInput, {
				clipboardData: { getData: () => 'SER-003 SER-004' },
			});
			await Promise.resolve();
		});

		expect(screen.getByRole('button', { name: 'Quitar serial SER-004' })).toBeInTheDocument();
		expect(toastSpies.warn).toHaveBeenLastCalledWith('Se omitió 1 serial duplicado.');
	});
	it('agrega un único serial al pegarlo', async () => {
		renderModal();
		const serialInput = screen.getByLabelText('Seriales (opcional)');

		await act(async () => {
			fireEvent.paste(serialInput, {
				clipboardData: { getData: () => ' SER-ÚNICO-001 ' },
			});
			await Promise.resolve();
		});

		expect(
			screen.getByRole('button', { name: 'Quitar serial SER-ÚNICO-001' }),
		).toBeInTheDocument();
	});
	it('reemplaza el borrador al pegar seriales', async () => {
		renderModal();
		const serialInput = screen.getByLabelText('Seriales (opcional)');

		await act(async () => {
			fireEvent.change(serialInput, { target: { value: 'VIEJO-1' } });
			fireEvent.paste(serialInput, {
				clipboardData: { getData: () => 'SER-A SER-B' },
			});
			await Promise.resolve();
		});

		expect(serialInput).toHaveValue('');
		expect(screen.getByRole('button', { name: 'Quitar serial SER-A' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Quitar serial SER-B' })).toBeInTheDocument();
		fireEvent.keyDown(serialInput, { key: 'Enter' });
		expect(
			screen.queryByRole('button', { name: 'Quitar serial VIEJO-1' }),
		).not.toBeInTheDocument();
	});
	it('omite un serial existente después de recortar sus espacios', async () => {
		const document = {
			...DEFERRED_PAYMENT_DOCUMENT_FIXTURES[1],
			items: DEFERRED_PAYMENT_DOCUMENT_FIXTURES[1].items.map((item) => ({
				...item,
				serials: [' SER-1-001 '],
			})),
		};
		renderModal(vi.fn(), document);
		const serialInput = screen.getByLabelText('Seriales (opcional)');

		await act(async () => {
			fireEvent.paste(serialInput, {
				clipboardData: { getData: () => 'SER-1-001' },
			});
			await Promise.resolve();
		});

		expect(screen.getAllByRole('button', { name: /Quitar serial/ })).toHaveLength(1);
		expect(toastSpies.warn).toHaveBeenCalledWith('Se omitió 1 serial duplicado.');
	});
	it('crea 100 seriales independientes al pegar un bloque', async () => {
		renderModal();
		const serialInput = screen.getByLabelText('Seriales (opcional)');
		const serials = Array.from({ length: 100 }, (_, index) => `SER-${index + 1}`);

		await act(async () => {
			fireEvent.paste(serialInput, {
				clipboardData: { getData: () => serials.join(' \t\n') },
			});
			await Promise.resolve();
		});

		expect(screen.getAllByRole('button', { name: /Quitar serial SER-/ })).toHaveLength(100);
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
