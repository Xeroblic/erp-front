import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import { markDeferredPaymentPaid } from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsTestData';
import DeferredPaymentDetailDrawer from '../components/drawers/DeferredPaymentDetailDrawer';
import ConfirmDeferredPaymentActionModal from '../components/modals/ConfirmDeferredPaymentActionModal';
import useDeferredPaymentDetail from '../hooks/useDeferredPaymentDetail';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/components/authorization/PermissionGuard', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../hooks/useDeferredPaymentDetail');

const refresh = vi.fn();
const baseHookResult = {
	document: DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
	loading: false,
	error: null,
	actions: { refresh },
	branch: { branchId: 1, subsidiaryId: 1 },
	hasDataContext: true,
};
const renderDrawer = (documentId: number, onEdit = vi.fn(), onClose = vi.fn()) =>
	render(
		<Provider store={store}>
			<DeferredPaymentDetailDrawer
				documentId={documentId}
				selectionContext={{ type: 'subsidiary', id: 1 }}
				onClose={onClose}
				onEdit={onEdit}
			/>
		</Provider>,
	);

const dragFile = () => {
	fireEvent.dragEnter(window, { dataTransfer: { types: ['Files'] } });
};

const dropFile = (file: File) => {
	const dataTransfer = { files: [file], types: ['Files'], dropEffect: 'none' };
	fireEvent.drop(window, { dataTransfer });
};

describe('DeferredPaymentDetailDrawer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		vi.mocked(useDeferredPaymentDetail).mockReturnValue(baseHookResult);
	});

	afterEach(() => {
		vi.useRealTimers();
		document.getElementById('portal-root')?.remove();
	});

	it('muestra el resumen financiero y los responsables del documento', () => {
		renderDrawer(2);

		expect(screen.getAllByText('FD-0002')).toHaveLength(2);
		expect(screen.getByText('N° de documento').nextElementSibling).toHaveTextContent(
			DEFERRED_PAYMENT_DETAIL_FIXTURES[2].document_number,
		);
		expect(screen.queryByText('ID')).not.toBeInTheDocument();
		expect(screen.getAllByText('Transportes del Sur SpA').length).toBeGreaterThan(0);
		expect(screen.getByText('Saldo pendiente')).toBeInTheDocument();
		expect(screen.getByText('$ 430.000')).toBeInTheDocument();
		expect(screen.getByText('Si el total incluye IVA 19%:')).toBeInTheDocument();
		expect(screen.getByText('Neto: $ 823.529')).toBeInTheDocument();
		expect(screen.getByText('IVA: $ 156.471')).toBeInTheDocument();
		expect(screen.getByText('Total: $ 980.000')).toBeInTheDocument();
		expect(screen.getByText('Responsables de cobranza')).toBeInTheDocument();
		expect(screen.getByText('Carlos Muñoz')).toBeInTheDocument();
		expect(screen.getByText('carlos.munoz@zentria.cl')).toBeInTheDocument();
		expect(screen.getByText('Ítems del documento')).toBeInTheDocument();
		expect(screen.getByText('SERV-2-A')).toBeInTheDocument();
		expect(screen.getByText('Servicio principal facturado')).toBeInTheDocument();
		expect(screen.getByText('Abonos registrados')).toBeInTheDocument();
		expect(
			screen.getByText('Abono 1 registrado por transferencia bancaria.'),
		).toBeInTheDocument();
		expect(screen.getAllByText('Nota:')).toHaveLength(
			DEFERRED_PAYMENT_DETAIL_FIXTURES[2].payments.length,
		);
		expect(screen.getByText('Adjuntos del documento')).toBeInTheDocument();
		expect(screen.getByText('documento-FD-0002.pdf')).toBeInTheDocument();
		expect(
			screen.getByText('Pago parcial: los recordatorios continúan activos.'),
		).toBeInTheDocument();
		expect(screen.queryByText(/pago permitido/i)).not.toBeInTheDocument();
		expect(screen.getByText('Nota del documento')).toBeInTheDocument();
		expect(screen.getByText('Sin observaciones registradas.')).toBeInTheDocument();
	});

	it('muestra el desglose referencial de un documento con total decimal', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: {
				...DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
				total_amount: '59989.99',
			},
		});

		renderDrawer(2);

		expect(screen.getByText('Si el total incluye IVA 19%:')).toBeInTheDocument();
		expect(screen.getByText('Neto: $ 50.412')).toBeInTheDocument();
		expect(screen.getByText('IVA: $ 9.577,99')).toBeInTheDocument();
		expect(screen.getByText('Total: $ 59.989,99')).toBeInTheDocument();
	});

	it('mantiene abierto el registro al interactuar con el modal renderizado en portal', async () => {
		vi.useFakeTimers();
		const onClose = vi.fn();
		renderDrawer(2, vi.fn(), onClose);
		act(() => {
			fireEvent.click(screen.getByRole('button', { name: 'Registrar abono', hidden: true }));
		});
		await act(async () => {
			vi.advanceTimersByTime(400);
			await Promise.resolve();
		});
		vi.useRealTimers();
		screen.getByRole('dialog', { name: 'Registrar abono' });
		const amountInput = screen.getByLabelText('Monto (CLP)');
		await act(async () => {
			fireEvent.mouseDown(amountInput);
			fireEvent.change(amountInput, { target: { value: '10000' } });
			await Promise.resolve();
		});

		expect(screen.getByPlaceholderText('dd-mm-aaaa')).toBeInTheDocument();
		expect(screen.getByRole('dialog', { name: 'Registrar abono' })).toBeInTheDocument();
		expect(amountInput).toHaveValue(10000);
		expect(onClose).not.toHaveBeenCalled();
	});
	it('descarta el borrador al cancelar y abrir otro registro', async () => {
		renderDrawer(2);
		fireEvent.click(screen.getByRole('button', { name: 'Registrar abono', hidden: true }));
		await screen.findByRole('dialog', { name: 'Registrar abono' });
		fireEvent.change(screen.getByLabelText('Monto (CLP)'), { target: { value: '15000' } });
		fireEvent.change(screen.getByLabelText('Nota (opcional)'), {
			target: { value: 'borrador temporal' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		await waitFor(() =>
			expect(
				screen.queryByRole('dialog', { name: 'Registrar abono' }),
			).not.toBeInTheDocument(),
		);
		await waitFor(() => {
			fireEvent.click(screen.getByRole('button', { name: 'Registrar abono', hidden: true }));
			expect(screen.getByRole('dialog', { name: 'Registrar abono' })).toBeInTheDocument();
		});

		expect(screen.getByLabelText('Monto (CLP)')).toHaveValue(null);
		expect(screen.getByLabelText('Nota (opcional)')).toHaveValue('');
	});
	it('muestra los mensajes de los campos inválidos al registrar', async () => {
		renderDrawer(2);
		fireEvent.click(screen.getByRole('button', { name: 'Registrar abono', hidden: true }));
		await screen.findByRole('dialog', { name: 'Registrar abono' });
		fireEvent.change(screen.getByLabelText('Nota (opcional)'), {
			target: { value: 'a'.repeat(1001) },
		});
		fireEvent.change(screen.getByPlaceholderText('dd-mm-aaaa'), {
			target: { value: '' },
		});
		const dialog = screen.getByRole('dialog', { name: 'Registrar abono' });
		fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar abono' }));

		await waitFor(() => {
			expect(screen.getByText('Ingresa el monto')).toBeInTheDocument();
			expect(screen.getByText('Selecciona la fecha del abono')).toBeInTheDocument();
			expect(
				screen.getByText('La nota no puede superar los 1000 caracteres'),
			).toBeInTheDocument();
		});
	});
	it('limpia la anulación abierta al cambiar de documento', async () => {
		const view = renderDrawer(2);
		fireEvent.click(screen.getAllByRole('button', { name: 'Anular abono', hidden: true })[0]);
		expect(screen.getByRole('dialog', { name: 'Anular abono' })).toBeInTheDocument();

		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: DEFERRED_PAYMENT_DETAIL_FIXTURES[9],
		});
		view.rerender(
			<Provider store={store}>
				<DeferredPaymentDetailDrawer
					documentId={9}
					selectionContext={{ type: 'subsidiary', id: 1 }}
					onClose={vi.fn()}
					onEdit={vi.fn()}
				/>
			</Provider>,
		);

		await waitFor(() =>
			expect(screen.queryByRole('dialog', { name: 'Anular abono' })).not.toBeInTheDocument(),
		);
	});

	it('permite adjuntar y valida el comprobante al marcar pagada', async () => {
		renderDrawer(2);
		fireEvent.click(screen.getByRole('button', { name: 'Marcar pagada', hidden: true }));
		const dialog = await screen.findByRole('dialog', { name: 'Marcar documento como pagado' });
		const receipt = within(dialog).getByLabelText('Comprobante (opcional)');
		expect(receipt).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx');

		fireEvent.change(receipt, {
			target: { files: [new File(['contenido'], 'invalido.txt', { type: 'text/plain' })] },
		});
		expect(
			await within(dialog).findByText('Formato de comprobante no permitido'),
		).toBeInTheDocument();
		expect(within(dialog).getByRole('button', { name: 'Marcar pagada' })).toBeDisabled();
	});
	it('valida el comprobante no permitido al soltarlo al marcar pagada', async () => {
		renderDrawer(2);
		fireEvent.click(screen.getByRole('button', { name: 'Marcar pagada', hidden: true }));
		const dialog = await screen.findByRole('dialog', { name: 'Marcar documento como pagado' });

		dragFile();
		expect(await screen.findByTestId('attachments-drop-overlay')).toBeInTheDocument();
		dropFile(new File(['contenido'], 'invalido.txt', { type: 'text/plain' }));
		await waitFor(() =>
			expect(screen.queryByTestId('attachments-drop-overlay')).not.toBeInTheDocument(),
		);
		expect(
			await within(dialog).findByText('Formato de comprobante no permitido'),
		).toBeInTheDocument();
		expect(within(dialog).getByRole('button', { name: 'Marcar pagada' })).toBeDisabled();
	});
	it('bloquea el selector y el drop mientras se marca pagada', async () => {
		const args = { subsidiaryId: 1, documentId: 2 };
		const requestId = 'mark-paid-in-progress';
		renderDrawer(2);
		fireEvent.click(screen.getByRole('button', { name: 'Marcar pagada', hidden: true }));
		const dialog = await screen.findByRole('dialog', { name: 'Marcar documento como pagado' });

		act(() => {
			store.dispatch(markDeferredPaymentPaid.pending(requestId, args));
		});
		expect(within(dialog).getByLabelText('Comprobante (opcional)')).toBeDisabled();
		dragFile();
		expect(screen.queryByTestId('attachments-drop-overlay')).not.toBeInTheDocument();
		dropFile(new File(['contenido'], 'invalido.txt', { type: 'text/plain' }));
		expect(within(dialog).queryByText('Formato de comprobante no permitido')).not.toBeInTheDocument();

		act(() => {
			store.dispatch(
				markDeferredPaymentPaid.fulfilled(
					DEFERRED_PAYMENT_DETAIL_FIXTURES[2].payments[0],
					requestId,
					args,
				),
			);
		});
	});
	it('permite cerrar la confirmación con comprobante pendiente para continuar desde el detalle', () => {
		const setIsOpen = vi.fn();
		render(
			<Provider store={store}>
				<ConfirmDeferredPaymentActionModal
					isOpen
					setIsOpen={setIsOpen}
					title='Marcar documento como pagado'
					description='Documento pagado, comprobante pendiente'
					confirmLabel='Reintentar comprobante'
					busy={false}
					error='El documento ya está pagado y no admite modificaciones.'
					onConfirm={vi.fn()}
				/>
			</Provider>,
		);

		const dialog = screen.getByRole('dialog', { name: 'Marcar documento como pagado' });
		expect(
			within(dialog).getByText('El documento ya está pagado y no admite modificaciones.'),
		).toBeInTheDocument();
		expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
		expect(
			within(dialog).getByRole('button', { name: 'Reintentar comprobante' }),
		).toBeEnabled();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
		expect(setIsOpen).toHaveBeenCalledWith(false);
	});
	it('entrega el documento vigente al solicitar su edición', () => {
		const onEdit = vi.fn();
		renderDrawer(2, onEdit);

		fireEvent.click(screen.getByRole('button', { name: 'Editar', hidden: true }));

		expect(onEdit).toHaveBeenCalledOnce();
		expect(onEdit).toHaveBeenCalledWith(DEFERRED_PAYMENT_DETAIL_FIXTURES[2]);
	});

	it('mantiene la edición deshabilitada para un documento pagado', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: DEFERRED_PAYMENT_DETAIL_FIXTURES[9],
		});
		renderDrawer(9);

		const editButton = screen.getByRole('button', { name: 'Editar', hidden: true });

		expect(editButton).toBeDisabled();
		expect(editButton).toHaveAttribute('title', 'Editar no disponible para documentos pagados');
	});
	it('mantiene dentro del contenedor los adjuntos de abonos con nombres largos', () => {
		const longFileName = `${'comprobante-transferencia-'.repeat(8)}final.pdf`;
		const documentWithLongAttachment = {
			...DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
			payments: DEFERRED_PAYMENT_DETAIL_FIXTURES[2].payments.map((payment, index) =>
				index === 0
					? {
							...payment,
							attachments: payment.attachments.map((attachment) => ({
								...attachment,
								file_name: longFileName,
							})),
						}
					: payment,
			),
		};
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: documentWithLongAttachment,
		});

		renderDrawer(2);

		const fileName = screen.getByTitle(longFileName);
		const attachmentLink = fileName.closest('button');
		expect(fileName).toHaveClass('truncate');
		expect(attachmentLink).toHaveClass('w-full', 'min-w-0', 'max-w-full', 'overflow-hidden');
	});

	it('muestra Sin nota cuando un abono no tiene observaciones', () => {
		const documentWithoutPaymentNote = {
			...DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
			payments: DEFERRED_PAYMENT_DETAIL_FIXTURES[2].payments.map((payment, index) =>
				index === 0 ? { ...payment, notes: null } : payment,
			),
		};
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: documentWithoutPaymentNote,
		});

		renderDrawer(2);

		expect(screen.getByText('Sin nota')).toBeInTheDocument();
	});
	it('muestra la nota y la señal de vencimiento del documento', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: DEFERRED_PAYMENT_DETAIL_FIXTURES[1],
		});

		renderDrawer(1);

		expect(
			screen.getByText(
				'Cliente con seguimiento de cobranza coordinado por el equipo comercial.',
			),
		).toBeInTheDocument();
		expect(screen.getByText('Vencido 32 días')).toBeInTheDocument();
	});
	it('muestra solo el estado de carga mientras no existe un documento vigente', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: null,
			loading: true,
		});

		renderDrawer(2);

		expect(screen.getByLabelText('Cargando detalle del documento')).toBeInTheDocument();
		expect(screen.getByText('Documento ID #2')).toBeInTheDocument();
		expect(screen.queryByText('Cliente sin nombre')).not.toBeInTheDocument();
		expect(screen.queryByText('Saldo pendiente')).not.toBeInTheDocument();
	});

	it('muestra saldo cero y progreso completo para un documento pagado', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: DEFERRED_PAYMENT_DETAIL_FIXTURES[9],
		});

		renderDrawer(9);

		expect(screen.getByText('Pagado')).toBeInTheDocument();
		expect(screen.getByText('$ 0')).toBeInTheDocument();
		expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
		expect(screen.getByText('100% pagado')).toBeInTheDocument();
	});
	it('muestra el error sin datos y permite reintentar', async () => {
		vi.useFakeTimers();
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: null,
			error: 'Documento no encontrado',
		});

		renderDrawer(9999);
		await act(async () => {
			fireEvent.click(screen.getByText('Reintentar'));
			vi.advanceTimersByTime(400);
			await Promise.resolve();
		});

		expect(screen.getByText('No pudimos cargar el documento')).toBeInTheDocument();
		expect(screen.getByText('Documento ID #9999')).toBeInTheDocument();
		expect(screen.queryByText('Cliente sin nombre')).not.toBeInTheDocument();
		expect(screen.queryByText('Saldo pendiente')).not.toBeInTheDocument();
		expect(refresh).toHaveBeenCalledOnce();
	});
	it('usa el nombre personal en el detalle cuando el cliente no tiene empresa', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: {
				...DEFERRED_PAYMENT_DETAIL_FIXTURES[2],
				customer: {
					...DEFERRED_PAYMENT_DETAIL_FIXTURES[2].customer,
					billing_company: null,
					contact_name: 'Camila Araya',
					rut: '55.000.001-2',
				},
			},
		});

		renderDrawer(2);

		expect(screen.getAllByText('Camila Araya').length).toBeGreaterThan(0);
		expect(screen.getByText('RUT 55.000.001-2')).toBeInTheDocument();
	});
});
