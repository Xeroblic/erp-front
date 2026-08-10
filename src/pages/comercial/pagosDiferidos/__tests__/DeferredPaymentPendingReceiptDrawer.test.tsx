import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsTestData';
import DeferredPaymentDetailDrawer from '../components/drawers/DeferredPaymentDetailDrawer';
import { useDeferredPaymentActions } from '../hooks/useDeferredPaymentActions';
import useDeferredPaymentDetail from '../hooks/useDeferredPaymentDetail';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/components/authorization/PermissionGuard', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		isDisable,
	}: {
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
		isDisable?: boolean;
	}) => (
		<button type='button' disabled={isDisable} onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('../hooks/useDeferredPaymentActions');
vi.mock('../hooks/useDeferredPaymentDetail');

const dismissMarkPaidReceipt = vi.fn();
const markPaid = vi.fn();
const retryMarkPaidReceipt = vi.fn();
const document = DEFERRED_PAYMENT_DETAIL_FIXTURES[2];
let actionsHookResult: ReturnType<typeof useDeferredPaymentActions>;

describe('DeferredPaymentDetailDrawer con comprobante pendiente', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const portalRoot = window.document.createElement('div');
		portalRoot.id = 'portal-root';
		window.document.body.appendChild(portalRoot);
		vi.mocked(useDeferredPaymentDetail).mockReturnValue({
			document,
			loading: false,
			error: null,
			actions: { refresh: vi.fn() },
			branch: { branchId: 1, subsidiaryId: 1 },
			hasDataContext: true,
		});
		actionsHookResult = {
			formik: {} as ReturnType<typeof useDeferredPaymentActions>['formik'],
			state: {
				recordingPayment: false,
				uploadingReceipt: false,
				voidingPaymentId: null,
				markingPaid: false,
				deletingDocumentId: null,
				error: null,
				errorPayment: null,
				errorReceipt: null,
				errorVoid: null,
				errorMarkPaid: null,
				errorDelete: null,
				pendingMarkPaidReceipt: {
					subsidiaryId: 1,
					documentId: document.id,
					paymentId: 10,
					file: new File(['comprobante'], 'cierre.pdf', { type: 'application/pdf' }),
				},
				markPaidReceipt: null,
				markPaidReceiptError: null,
				markPaidReceiptTouched: false,
				busy: false,
			},
			actions: {
				voidPayment: vi.fn(),
				markPaid,
				deleteDocument: vi.fn(),
				retryMarkPaidReceipt,
				setMarkPaidReceipt: vi.fn(),
				resetMarkPaidReceipt: vi.fn(),
				dismissMarkPaidReceipt,
				clearMutationErrors: vi.fn(),
			},
		};
		vi.mocked(useDeferredPaymentActions).mockReturnValue(actionsHookResult);
	});

	afterEach(() => window.document.getElementById('portal-root')?.remove());

	it('exige confirmar el descarte antes de cerrar el detalle', () => {
		const onClose = vi.fn();
		render(
			<Provider store={store}>
				<DeferredPaymentDetailDrawer
					documentId={document.id}
					onClose={onClose}
					onEdit={vi.fn()}
				/>
			</Provider>,
		);

		fireEvent.keyDown(window.document, { key: 'Escape' });

		const confirmation = screen.getByRole('dialog', {
			name: 'Descartar comprobante pendiente',
		});
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancelar' }));
		expect(screen.getByText('Documento pagado, comprobante pendiente')).toBeInTheDocument();

		fireEvent.keyDown(window.document, { key: 'Escape' });
		fireEvent.click(
			within(
				screen.getByRole('dialog', { name: 'Descartar comprobante pendiente' }),
			).getByRole('button', { name: 'Descartar comprobante' }),
		);
		expect(dismissMarkPaidReceipt).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('muestra el error cuando falla el reintento del comprobante', () => {
		actionsHookResult.state.errorReceipt = 'El abono indicado no pertenece a este documento.';
		render(
			<Provider store={store}>
				<DeferredPaymentDetailDrawer
					documentId={document.id}
					onClose={vi.fn()}
					onEdit={vi.fn()}
				/>
			</Provider>,
		);

		expect(screen.getByText('No se pudo subir el comprobante')).toBeInTheDocument();
		expect(
			screen.getByText('El abono indicado no pertenece a este documento.'),
		).toBeInTheDocument();
	});

	it('reintenta el comprobante sin volver a ejecutar el cierre manual', () => {
		retryMarkPaidReceipt.mockResolvedValue(true);
		render(
			<Provider store={store}>
				<DeferredPaymentDetailDrawer
					documentId={document.id}
					onClose={vi.fn()}
					onEdit={vi.fn()}
				/>
			</Provider>,
		);

		fireEvent.click(
			screen.getByRole('button', { name: 'Reintentar comprobante', hidden: true }),
		);

		expect(retryMarkPaidReceipt).toHaveBeenCalledOnce();
		expect(markPaid).not.toHaveBeenCalled();
	});
});
