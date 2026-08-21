import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
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
vi.mock('../hooks/useDeferredPaymentActions');
vi.mock('../hooks/useDeferredPaymentDetail');

const deleteDocument = vi.fn();
const clearMutationErrors = vi.fn();
/** Documento pendiente sin abonos: el caso que el backend sí permite eliminar. */
const documentWithoutPayments = DEFERRED_PAYMENT_DETAIL_FIXTURES[1];
/** Documento con dos abonos: el backend lo rechaza. */
const documentWithPayments = DEFERRED_PAYMENT_DETAIL_FIXTURES[2];

const mockActions = ({
	deletingDocumentId = null,
	errorDelete = null,
}: { deletingDocumentId?: number | null; errorDelete?: string | null } = {}) => {
	vi.mocked(useDeferredPaymentActions).mockReturnValue({
		formik: {} as ReturnType<typeof useDeferredPaymentActions>['formik'],
		state: {
			recordingPayment: false,
			uploadingReceipt: false,
			voidingPaymentId: null,
			markingPaid: false,
			deletingDocumentId,
			error: errorDelete,
			errorPayment: null,
			errorReceipt: null,
			errorVoid: null,
			errorMarkPaid: null,
			errorDelete,
			pendingMarkPaidReceipt: null,
			markPaidReceipt: null,
			markPaidReceiptError: null,
			markPaidReceiptTouched: false,
			busy: deletingDocumentId !== null,
		},
		actions: {
			voidPayment: vi.fn(),
			markPaid: vi.fn(),
			deleteDocument,
			retryMarkPaidReceipt: vi.fn(),
			setMarkPaidReceipt: vi.fn(),
			resetMarkPaidReceipt: vi.fn(),
			dismissMarkPaidReceipt: vi.fn(),
			clearMutationErrors,
		},
	});
};

const renderDrawer = (document: IDeferredPaymentDocument, onClose = vi.fn()) => {
	vi.mocked(useDeferredPaymentDetail).mockReturnValue({
		document,
		loading: false,
		error: null,
		actions: { refresh: vi.fn() },
		branch: { branchId: 1, subsidiaryId: 1 },
		hasDataContext: true,
	});
	render(
		<Provider store={store}>
			<DeferredPaymentDetailDrawer
				documentId={document.id}
				selectionContext={{ type: 'subsidiary', id: 1 }}
				onClose={onClose}
				onEdit={vi.fn()}
			/>
		</Provider>,
	);
	return onClose;
};

describe('DeferredPaymentDetailDrawer — eliminación del documento', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const portalRoot = window.document.createElement('div');
		portalRoot.id = 'portal-root';
		window.document.body.appendChild(portalRoot);
		mockActions();
	});

	afterEach(() => window.document.getElementById('portal-root')?.remove());

	it('pide confirmación antes de eliminar y cierra el detalle al lograrlo', async () => {
		deleteDocument.mockResolvedValue(true);
		const onClose = renderDrawer(documentWithoutPayments);

		const deleteTrigger = screen.getByRole('button', { name: 'Eliminar', hidden: true });
		fireEvent.click(deleteTrigger);

		expect(clearMutationErrors).toHaveBeenCalled();
		const confirmation = screen.getByRole('dialog', { name: 'Eliminar documento' });
		expect(
			within(confirmation).getByText(documentWithoutPayments.document_number),
		).toBeInTheDocument();
		expect(within(confirmation).getByText(/no se puede deshacer/i)).toBeInTheDocument();
		expect(deleteDocument).not.toHaveBeenCalled();

		const confirmDelete = within(confirmation).getByRole('button', {
			name: 'Eliminar documento',
		});
		fireEvent.click(confirmDelete);

		await waitFor(() => expect(deleteDocument).toHaveBeenCalledOnce());
		await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
	});

	it('advierte que un documento con abonos no se puede eliminar', () => {
		renderDrawer(documentWithPayments);

		const deleteTrigger = screen.getByRole('button', { name: 'Eliminar', hidden: true });
		fireEvent.click(deleteTrigger);

		expect(screen.getByText('El documento tiene abonos registrados')).toBeInTheDocument();
		expect(
			screen.getByText(
				`Los documentos con abonos no se pueden eliminar. Anula primero los ${documentWithPayments.payments.length} abono(s) registrado(s).`,
			),
		).toBeInTheDocument();
	});

	it('muestra el error del backend y mantiene abierta la confirmación', async () => {
		deleteDocument.mockResolvedValue(false);
		mockActions({ errorDelete: 'No se puede eliminar un documento con abonos registrados.' });
		const onClose = renderDrawer(documentWithPayments);

		const deleteTrigger = screen.getByRole('button', { name: 'Eliminar', hidden: true });
		fireEvent.click(deleteTrigger);
		const confirmDelete = screen.getByRole('button', { name: 'Eliminar documento' });
		fireEvent.click(confirmDelete);

		await waitFor(() => expect(deleteDocument).toHaveBeenCalledOnce());
		expect(
			screen.getByText('No se puede eliminar un documento con abonos registrados.'),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('bloquea el segundo envío mientras la eliminación está en vuelo', () => {
		mockActions({ deletingDocumentId: documentWithoutPayments.id });
		renderDrawer(documentWithoutPayments);

		// Con una eliminación en curso el disparador queda inhabilitado: no hay forma de
		// reabrir la confirmación ni de encolar una segunda petición desde la UI.
		const deleteTrigger = screen.getByRole('button', { name: 'Eliminar', hidden: true });
		expect(deleteTrigger).toBeDisabled();
		fireEvent.click(deleteTrigger);

		expect(
			screen.queryByRole('dialog', { name: 'Eliminar documento' }),
		).not.toBeInTheDocument();
		expect(deleteDocument).not.toHaveBeenCalled();
	});
});
