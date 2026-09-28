import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PurchaseDocumentFormModal from '../PurchaseDocumentFormModal';

/**
 * Modal de documento completo (Formik real, líneas y alta de producto) ante
 * un cambio de filial. El listado cierra el modal, pero este componente sigue
 * montado con su estado: al reabrir «Nuevo documento» en la filial nueva no
 * puede reaparecer el borrador ni el alta de producto de la anterior.
 */

vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/store', () => ({ useAppDispatch: () => vi.fn() }));
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
vi.mock('../../../hooks/usePurchasableProductOptions', () => ({
	default: () => ({
		options: [],
		loading: false,
		hasMore: false,
		unavailableReason: null,
		search: '',
		onSearchChange: vi.fn(),
		getOption: () => null,
		reload: vi.fn(),
		addProduct: vi.fn(),
	}),
}));

const renderModal = ({ isOpen, subsidiaryId }: { isOpen: boolean; subsidiaryId: number }) => (
	<MemoryRouter>
		<PurchaseDocumentFormModal
			isOpen={isOpen}
			subsidiaryId={subsidiaryId}
			setIsOpen={vi.fn()}
			document={null}
		/>
	</MemoryRouter>
);

const folioInput = (): HTMLInputElement => {
	const input = screen.getByLabelText(/Folio/);
	if (!(input instanceof HTMLInputElement)) throw new Error('El folio no es un input.');
	return input;
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('PurchaseDocumentFormModal — cambio de filial', () => {
	it('al reabrir en otra filial no conserva el borrador ni el alta de producto', async () => {
		const { rerender } = render(renderModal({ isOpen: true, subsidiaryId: 4 }));

		fireEvent.change(folioInput(), { target: { value: 'F-4410' } });
		fireEvent.click(screen.getByRole('button', { name: /Agregar línea/ }));
		fireEvent.click(screen.getAllByRole('button', { name: /Nuevo producto/ })[1]);
		await waitFor(() => expect(folioInput().value).toBe('F-4410'));
		expect(screen.getAllByText(/Línea \d/)).toHaveLength(2);
		expect(screen.getByTestId('product-modal')).toBeTruthy();

		// El listado cierra el modal en el mismo render en que cambia la filial.
		rerender(renderModal({ isOpen: false, subsidiaryId: 9 }));
		rerender(renderModal({ isOpen: true, subsidiaryId: 9 }));

		expect(folioInput().value).toBe('');
		expect(screen.getAllByText(/Línea \d/)).toHaveLength(1);
		expect(screen.queryByTestId('product-modal')).toBeNull();
	});

	it('en la misma filial, cerrar desde afuera y reabrir conserva el borrador', async () => {
		const { rerender } = render(renderModal({ isOpen: true, subsidiaryId: 4 }));
		fireEvent.change(folioInput(), { target: { value: 'F-4410' } });
		await waitFor(() => expect(folioInput().value).toBe('F-4410'));

		rerender(renderModal({ isOpen: false, subsidiaryId: 4 }));
		rerender(renderModal({ isOpen: true, subsidiaryId: 4 }));

		expect(folioInput().value).toBe('F-4410');
	});
});
