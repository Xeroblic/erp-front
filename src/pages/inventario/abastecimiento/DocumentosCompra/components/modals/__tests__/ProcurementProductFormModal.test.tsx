import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProcurementProductFormModal from '../ProcurementProductFormModal';

/**
 * Estados del alta que dependen de un intento guardado en el store: el modal
 * sólo los muestra y delega el envío en `submit` del hook.
 */

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
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const hookState = vi.hoisted(() => ({
	submit: vi.fn(() => Promise.resolve()),
	isSubmitting: false,
	isAwaitingAttempt: false,
	isLocked: false,
	isReconciling: false,
	recoveredProduct: null as { name: string; sku: string } | null,
	pendingProductName: null as string | null,
}));

vi.mock('../../../hooks/useProcurementProductForm', () => ({
	default: () => ({
		...hookState,
		formik: {
			values: {
				name: 'Mouse',
				brand_id: '3',
				product_type: 'general',
				serial_tracking: false,
				is_active: true,
				category_ids: [],
			},
			errors: {},
			touched: {},
			handleChange: vi.fn(),
			handleBlur: vi.fn(),
			setFieldValue: vi.fn(),
			setFieldTouched: vi.fn(),
		},
		reset: vi.fn(),
		sku: 'LOGN-MOUS-A1B',
		hasBranch: true,
		brandOptions: [{ value: '3', label: 'Logitech' }],
		categoryOptions: [],
		loadingBrands: false,
		brandsFailed: false,
		loadingCategories: false,
	}),
}));

const renderModal = () =>
	render(<ProcurementProductFormModal isOpen setIsOpen={vi.fn()} subsidiaryId={4} />);

beforeEach(() => {
	hookState.submit.mockClear();
	hookState.isSubmitting = false;
	hookState.isAwaitingAttempt = false;
	hookState.isLocked = false;
	hookState.isReconciling = false;
	hookState.recoveredProduct = null;
	hookState.pendingProductName = null;
});

describe('ProcurementProductFormModal — intento guardado', () => {
	it('con un envío en curso de un montaje anterior avisa y bloquea los campos', () => {
		hookState.isSubmitting = true;
		hookState.isAwaitingAttempt = true;
		hookState.isLocked = true;
		hookState.pendingProductName = 'Mouse';
		renderModal();

		expect(screen.getByText(/Hay un envío de «Mouse» en curso/)).toBeTruthy();
		expect(screen.getByLabelText(/Nombre/)).toHaveProperty('disabled', true);
	});

	it('un producto creado después de cerrar se usa con «Usar producto»', () => {
		hookState.isLocked = true;
		hookState.recoveredProduct = { name: 'Mouse', sku: 'LOGN-MOUS-A1B' };
		hookState.pendingProductName = 'Mouse';
		renderModal();

		expect(screen.getByText(/se creó después de\s+cerrar esta pantalla/)).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: /Usar producto/ }));

		expect(hookState.submit).toHaveBeenCalledTimes(1);
	});
});
