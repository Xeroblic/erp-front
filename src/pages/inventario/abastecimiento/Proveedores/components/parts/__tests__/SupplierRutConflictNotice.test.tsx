import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SupplierRutConflictNotice from '../SupplierRutConflictNotice';

// `Alert` y `Button` leen tema y permisos desde Redux; el test no monta un Provider.
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: () => true, isSuperAdmin: false }),
}));

vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));

const activeConflict = { id: 7, display_name: 'PCExpress', is_active: true };
const inactiveConflict = { id: 12, display_name: 'Importadora Sur', is_active: false };

describe('SupplierRutConflictNotice — usar proveedor existente', () => {
	it('ofrece «Usar este proveedor» sólo si el caller lo pide y el proveedor está activo', () => {
		const onUseExistingSupplier = vi.fn();
		render(
			<SupplierRutConflictNotice
				conflict={activeConflict}
				isRestoring={false}
				onRestore={vi.fn()}
				onViewSupplier={vi.fn()}
				onUseExistingSupplier={onUseExistingSupplier}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: /Usar este proveedor/ }));

		expect(onUseExistingSupplier).toHaveBeenCalledWith(activeConflict);
	});

	it('sin el prop conserva el comportamiento del listado y la ficha', () => {
		render(
			<SupplierRutConflictNotice
				conflict={activeConflict}
				isRestoring={false}
				onRestore={vi.fn()}
				onViewSupplier={vi.fn()}
			/>,
		);

		expect(screen.queryByRole('button', { name: /Usar este proveedor/ })).toBeNull();
		expect(screen.getByRole('button', { name: /Ver proveedor/ })).toBeTruthy();
	});

	it('un proveedor desactivado se restaura, no se usa directamente', () => {
		render(
			<SupplierRutConflictNotice
				conflict={inactiveConflict}
				isRestoring={false}
				onRestore={vi.fn()}
				onViewSupplier={vi.fn()}
				onUseExistingSupplier={vi.fn()}
			/>,
		);

		expect(screen.queryByRole('button', { name: /Usar este proveedor/ })).toBeNull();
		expect(screen.getByRole('button', { name: /Restaurar este proveedor/ })).toBeTruthy();
	});
});
