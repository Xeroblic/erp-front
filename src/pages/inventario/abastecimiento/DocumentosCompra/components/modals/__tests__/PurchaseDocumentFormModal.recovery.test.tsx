import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import purchaseDocuments, {
	setDocumentWriteAttempt,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import { createPurchaseDocument } from '@/services/procurement/purchaseDocuments.service';
import { draftReceiptDocument } from '@/mocks/db/procurement.db';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import PurchaseDocumentFormModal from '../PurchaseDocumentFormModal';

/**
 * Modal, Formik, Redux y selector de producto reales. Un intento incierto
 * conserva su cuerpo y clave tras otro timeout y el cierre del formulario.
 */

vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/hooks/useDir', () => ({
	default: () => ({ dir: 'ltr', isLTR: true, isRTL: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooterChild: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		onClick,
		isDisable,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		isDisable?: boolean;
	}) => (
		<button type='button' onClick={onClick} disabled={isDisable}>
			{children}
		</button>
	),
}));
vi.mock(
	'@/pages/inventario/abastecimiento/Proveedores/components/modals/SupplierFormModal',
	() => ({
		default: () => null,
	}),
);
vi.mock('../ProcurementProductFormModal', () => ({
	default: ({ isOpen }: { isOpen: boolean }) =>
		isOpen ? <div data-testid='product-modal'>Crear producto</div> : null,
}));

vi.mock('../../../hooks/useActiveSupplierOptions', () => ({
	default: () => ({
		suppliers: [],
		loading: false,
		unavailableReason: null,
		canList: true,
		addSupplier: vi.fn(),
		reload: vi.fn(),
	}),
}));
vi.mock('../../../hooks/useSupplierInlineEdit', () => ({
	default: () => ({
		editingSupplier: null,
		isLoadingSupplier: false,
		openSupplierEdit: vi.fn(),
		closeSupplierEdit: vi.fn(),
	}),
}));
const productSearch = vi.hoisted(() => ({ onSearchChange: vi.fn(), clearSearch: vi.fn() }));
vi.mock('../../../hooks/usePurchasableProductOptions', () => ({
	default: () => ({
		options: [
			{ value: '1', label: 'Producto A' },
			{ value: '2', label: 'Producto B' },
		],
		loading: false,
		hasMore: false,
		unavailableReason: null,
		search: '',
		onSearchChange: productSearch.onSearchChange,
		clearSearch: productSearch.clearSearch,
		getOption: () => ({ value: '1', label: 'Producto A' }),
		reload: vi.fn(),
		addProduct: vi.fn(),
	}),
}));

vi.mock('@/services/procurement/purchaseDocuments.service', () => ({
	createPurchaseDocument: vi.fn(),
	updatePurchaseDocument: vi.fn(),
	listPurchaseDocuments: vi.fn(),
	getPurchaseDocument: vi.fn(),
	confirmPurchaseDocument: vi.fn(),
	cancelPurchaseDocument: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

it('con intento incierto bloquea el selector real y recupera el reintento al cerrar y reabrir', async () => {
	const store = configureStore({ reducer: { purchaseDocuments } });
	const payload = {
		document_type: 'receipt' as const,
		supplier_id: null,
		document_number: 'B-99',
		issue_date: '2026-10-19',
		currency_code: 'CLP',
		total_amount: null,
		shipping_cost: null,
		shipping_cost_basis: null,
		notes: 'Original',
		items: [
			{
				product_id: 1,
				quantity: 1,
				unit_cost: '100.00',
				unit_cost_basis: 'net' as const,
				notes: null,
			},
		],
	};
	store.dispatch(
		setDocumentWriteAttempt({
			resourceKey: '1:new',
			subsidiaryId: 1,
			documentId: null,
			etag: null,
			idempotencyKey: 'recovery-original-key',
			payload,
			omitSupplier: false,
			includeShipping: false,
			shippingCostInput: '',
			status: 'uncertain',
			result: null,
			rejection: null,
		}),
	);
	const create = vi.mocked(createPurchaseDocument);
	create
		.mockRejectedValueOnce(
			Object.assign(new Error('timeout'), {
				isAxiosError: true,
				code: 'ECONNABORTED',
				request: {},
			}),
		)
		.mockResolvedValueOnce({ data: draftReceiptDocument, headers: { etag: '"saved"' } });
	const Harness = () => {
		const [open, setOpen] = useState(true);
		return (
			<>
				<button type='button' onClick={() => setOpen(true)}>
					Reabrir
				</button>
				<PurchaseDocumentFormModal isOpen={open} setIsOpen={setOpen} subsidiaryId={1} />
			</>
		);
	};
	render(
		<Provider store={store}>
			<MemoryRouter>
				<Harness />
			</MemoryRouter>
		</Provider>,
	);
	expect(screen.getByLabelText(/Folio/)).toBeDisabled();
	expect(screen.getByLabelText(/Producto/)).toBeDisabled();
	expect(screen.getByText('Producto A').parentElement!.parentElement!).toHaveAttribute(
		'aria-disabled',
		'true',
	);
	fireEvent.click(screen.getByRole('button', { name: 'Reintentar guardado' }));
	await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
	await waitFor(() =>
		expect(screen.getByRole('button', { name: 'Reintentar guardado' })).not.toBeDisabled(),
	);
	fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
	expect(screen.queryByLabelText(/Folio/)).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Reabrir' }));
	expect(screen.getByLabelText(/Folio/)).toHaveValue('B-99');
	expect(screen.getByLabelText(/Folio/)).toBeDisabled();
	fireEvent.click(screen.getByRole('button', { name: 'Reintentar guardado' }));
	await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
	expect(create.mock.calls[1]).toEqual(create.mock.calls[0]);
	expect(create.mock.calls[1][2]?.idempotencyKey).toBe('recovery-original-key');
	await waitFor(() => expect(screen.queryByLabelText(/Folio/)).not.toBeInTheDocument());
});
