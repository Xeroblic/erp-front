import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsTestData';
import DeferredPaymentDetailDrawer from '../components/drawers/DeferredPaymentDetailDrawer';
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
				onClose={onClose}
				onEdit={onEdit}
			/>
		</Provider>,
	);

describe('DeferredPaymentDetailDrawer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		vi.mocked(useDeferredPaymentDetail).mockReturnValue(baseHookResult);
	});

	afterEach(() => {
		document.getElementById('portal-root')?.remove();
	});

	it('muestra el resumen financiero y los responsables del documento', () => {
		renderDrawer(2);

		expect(screen.getByText('FD-0002')).toBeInTheDocument();
		expect(screen.getAllByText('Transportes del Sur SpA').length).toBeGreaterThan(0);
		expect(screen.getByText('Saldo pendiente')).toBeInTheDocument();
		expect(screen.getByText('$ 430.000')).toBeInTheDocument();
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

	it('mantiene abierto el registro al interactuar con el modal renderizado en portal', () => {
		const onClose = vi.fn();
		renderDrawer(2, vi.fn(), onClose);

		fireEvent.click(screen.getByRole('button', { name: 'Registrar abono', hidden: true }));
		const amountInput = screen.getByLabelText('Monto (CLP)');
		fireEvent.mouseDown(amountInput);
		fireEvent.change(amountInput, { target: { value: '10000' } });

		expect(screen.getByPlaceholderText('dd-mm-aaaa')).toBeInTheDocument();
		expect(screen.getByRole('dialog', { name: 'Registrar abono' })).toBeInTheDocument();
		expect(amountInput).toHaveValue(10000);
		expect(onClose).not.toHaveBeenCalled();
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
	it('muestra el error sin datos y permite reintentar', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: null,
			error: 'Documento no encontrado',
		});

		renderDrawer(9999);
		fireEvent.click(screen.getByText('Reintentar'));

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
