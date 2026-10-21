import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { expect, it, vi } from 'vitest';
import store from '@/store';
import type { IDeferredPaymentCreditProfile } from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsTestData';
import DeferredPaymentDetailDrawer from '../components/drawers/DeferredPaymentDetailDrawer';
import useDeferredPaymentDetail from '../hooks/useDeferredPaymentDetail';

const permissionState = vi.hoisted(() => ({ allowed: false }));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/components/authorization/PermissionGuard', () => ({
	default: ({
		children,
		fallback = null,
	}: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) => (permissionState.allowed ? children : fallback),
}));
// El editor del perfil toma la subsidiaria del usuario; el drawer la recibe de su hook de detalle.
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: 1,
		hasValidBranch: true,
		visibleBranches: [{ id: 1, name: 'Casa matriz' }],
	}),
}));
vi.mock('@/services/deferredPaymentsService', () => ({
	default: { getCreditProfile: vi.fn(), updateCreditProfile: vi.fn() },
}));
vi.mock('../hooks/useDeferredPaymentDetail');

const document = DEFERRED_PAYMENT_DETAIL_FIXTURES[2];
const creditProfile = (collectionEmail: string | null): IDeferredPaymentCreditProfile => ({
	id: 10,
	customer_sale_id: document.customer.id,
	is_active: true,
	payment_term_days: 30,
	credit_limit: null,
	collection_email: collectionEmail,
	notes: null,
});
const WARNING = /no recibirá los recordatorios automáticos de cobranza/;

it('advierte al cliente sin correo y sólo con permiso permite registrarlo para quitar el aviso', async () => {
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
	vi.mocked(deferredPaymentsService.getCreditProfile).mockResolvedValue(creditProfile(null));
	vi.mocked(deferredPaymentsService.updateCreditProfile).mockResolvedValue(
		creditProfile('cobranza@cliente.cl'),
	);
	const drawer = () => (
		<Provider store={store}>
			<DeferredPaymentDetailDrawer
				documentId={document.id}
				selectionContext={{ type: 'subsidiary', id: 1 }}
				onClose={vi.fn()}
				onEdit={vi.fn()}
			/>
		</Provider>
	);
	const addEmailButton = () =>
		screen.queryByRole('button', { name: 'Agregar correo de cobranza', hidden: true });

	const view = render(drawer());
	expect(await screen.findByText(WARNING)).toBeInTheDocument();
	expect(addEmailButton()).not.toBeInTheDocument();

	permissionState.allowed = true;
	view.rerender(drawer());
	fireEvent.click(addEmailButton() as HTMLElement);
	fireEvent.change(await screen.findByLabelText('Correo de cobranza'), {
		target: { value: 'cobranza@cliente.cl' },
	});
	vi.mocked(deferredPaymentsService.getCreditProfile).mockResolvedValue(
		creditProfile('cobranza@cliente.cl'),
	);
	fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones', hidden: true }));
	await waitFor(() =>
		expect(deferredPaymentsService.updateCreditProfile).toHaveBeenCalledWith(
			1,
			document.customer.id,
			expect.objectContaining({ collection_email: 'cobranza@cliente.cl' }),
			expect.any(AbortSignal),
		),
	);
	fireEvent.keyDown(window.document, { key: 'Escape' });

	await waitFor(() => expect(screen.queryByText(WARNING)).not.toBeInTheDocument());
	portalRoot.remove();
});
