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
vi.mock('@/store', () => ({ useAppDispatch: () => vi.fn(), useAppSelector: () => null }));
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
		options: [],
		loading: false,
		hasMore: false,
		unavailableReason: null,
		search: '',
		onSearchChange: productSearch.onSearchChange,
		clearSearch: productSearch.clearSearch,
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

describe('PurchaseDocumentFormModal — foco al enviar con errores', () => {
	it('desplaza al primer campo inválido cuando los errores ya están pintados', async () => {
		// `Input` marca el error con el borde rojo, que exige el campo tocado e inválido.
		const errorVisibleAtScroll: boolean[] = [];
		const scrollIntoView = vi.fn(() => {
			errorVisibleAtScroll.push(folioInput().className.includes('!border-red-500'));
		});
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView,
		});
		render(renderModal({ isOpen: true, subsidiaryId: 4 }));

		fireEvent.click(screen.getByRole('button', { name: 'Crear documento' }));

		await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
		expect(errorVisibleAtScroll).toEqual([true]);
	});
});

describe('PurchaseDocumentFormModal — búsqueda de productos', () => {
	it('al salir del selector de una línea se limpia el término compartido', () => {
		const { container } = render(renderModal({ isOpen: true, subsidiaryId: 4 }));
		const productInput = container.querySelector<HTMLInputElement>(
			'input[id="items.0.product_id"]',
		);
		if (!productInput) throw new Error('No se encontró el selector de producto.');

		fireEvent.focus(productInput);
		fireEvent.change(productInput, { target: { value: 'cable' } });
		expect(productSearch.onSearchChange).toHaveBeenLastCalledWith('cable');
		expect(productSearch.clearSearch).not.toHaveBeenCalled();

		// react-select vacía la caja al salir (y al elegir o cerrar el menú).
		fireEvent.blur(productInput);

		expect(productSearch.clearSearch).toHaveBeenCalled();
	});
});
