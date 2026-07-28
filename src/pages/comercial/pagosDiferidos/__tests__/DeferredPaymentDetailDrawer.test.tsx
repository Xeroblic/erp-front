import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import { DEFERRED_PAYMENT_DETAILS_MOCK } from '@/store/slices/deferredPayments/deferredPaymentsMock';
import DeferredPaymentDetailDrawer from '../components/drawers/DeferredPaymentDetailDrawer';
import useDeferredPaymentDetail from '../hooks/useDeferredPaymentDetail';

vi.mock('../hooks/useDeferredPaymentDetail');

const refresh = vi.fn();
const baseHookResult = {
	document: DEFERRED_PAYMENT_DETAILS_MOCK[2],
	loading: false,
	error: null,
	actions: { refresh },
	flags: { isPaid: false, canDelete: false, canEdit: true, canPay: true },
	branch: { branchId: 1, subsidiaryId: 1 },
	hasDataContext: true,
};
const renderDrawer = (documentId: number) =>
	render(
		<Provider store={store}>
			<DeferredPaymentDetailDrawer documentId={documentId} onClose={vi.fn()} />
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
		expect(screen.getByText('Adjuntos del documento')).toBeInTheDocument();
		expect(screen.getByText('documento-FD-0002.pdf')).toBeInTheDocument();
		expect(
			screen.getByText('Las acciones se habilitarán con los flujos de ZF-7 y ZF-8.'),
		).toBeInTheDocument();
		expect(screen.getByText('Nota del documento')).toBeInTheDocument();
		expect(screen.getByText('Sin observaciones registradas.')).toBeInTheDocument();
	});

	it('muestra la nota y la señal de vencimiento del documento', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: DEFERRED_PAYMENT_DETAILS_MOCK[1],
			flags: {
				isPaid: false,
				canDelete: true,
				canEdit: true,
				canPay: true,
			},
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
		expect(screen.queryByText('Saldo pendiente')).not.toBeInTheDocument();
	});

	it('muestra saldo cero y progreso completo para un documento pagado', () => {
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			...baseHookResult,
			document: DEFERRED_PAYMENT_DETAILS_MOCK[9],
			flags: {
				isPaid: true,
				canDelete: false,
				canEdit: false,
				canPay: false,
			},
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
		expect(screen.queryByText('Saldo pendiente')).not.toBeInTheDocument();
		expect(refresh).toHaveBeenCalledOnce();
	});
});
