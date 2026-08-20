import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import DeferredPaymentsExportDropdown from '../components/parts/DeferredPaymentsExportDropdown';

vi.mock('@/components/ui/Dropdown', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DropdownToggle: ({ children }: { children: React.ReactNode }) => children,
	DropdownMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
	DropdownItem: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
		<li {...props}>{children}</li>
	),
}));

vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		permission,
		branchId,
		subsidiaryId,
		scope,
		isDisable,
	}: {
		children: React.ReactNode;
		permission?: string;
		branchId?: number | null;
		subsidiaryId?: number | null;
		scope?: string;
		isDisable?: boolean;
	}) => (
		<button
			type='button'
			disabled={isDisable}
			data-permission={permission}
			data-branch-id={branchId ?? ''}
			data-subsidiary-id={subsidiaryId ?? ''}
			data-scope={scope}>
			{children}
		</button>
	),
}));

describe('DeferredPaymentsExportDropdown', () => {
	it('protege la exportación con el permiso y contexto de la vista', () => {
		render(
			<DeferredPaymentsExportDropdown
				branchId={3}
				subsidiaryId={8}
				disabled={false}
				isExporting={false}
				onExportPage={vi.fn()}
				onExportAll={vi.fn()}
			/>,
		);

		const button = screen.getByRole('button', { name: 'Exportar' });
		expect(button).toHaveAttribute('data-permission', ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW);
		expect(button).toHaveAttribute('data-branch-id', '3');
		expect(button).toHaveAttribute('data-subsidiary-id', '8');
		expect(button).toHaveAttribute('data-scope', 'access');
	});

	it('ejecuta la opción seleccionada y bloquea ambas durante la descarga', () => {
		const onExportPage = vi.fn();
		const onExportAll = vi.fn();
		const { rerender } = render(
			<DeferredPaymentsExportDropdown
				branchId={3}
				subsidiaryId={8}
				disabled={false}
				isExporting={false}
				onExportPage={onExportPage}
				onExportAll={onExportAll}
			/>,
		);

		fireEvent.click(screen.getByText('Página actual'));
		fireEvent.click(screen.getByText('Todo lo filtrado'));
		expect(onExportPage).toHaveBeenCalledOnce();
		expect(onExportAll).toHaveBeenCalledOnce();

		rerender(
			<DeferredPaymentsExportDropdown
				branchId={3}
				subsidiaryId={8}
				disabled={false}
				isExporting
				onExportPage={onExportPage}
				onExportAll={onExportAll}
			/>,
		);
		fireEvent.click(screen.getByText('Página actual'));
		fireEvent.click(screen.getByText('Todo lo filtrado'));
		expect(onExportPage).toHaveBeenCalledOnce();
		expect(onExportAll).toHaveBeenCalledOnce();
		expect(screen.getByRole('button', { name: 'Exportar' })).toBeDisabled();
	});
});
