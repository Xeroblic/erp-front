import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import DeferredPaymentActionsFooter from '../components/detail/DeferredPaymentActionsFooter';
import { DeferredPaymentPaymentsSection } from '../components/detail/DeferredPaymentActivitySections';

vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		permission,
		className,
	}: {
		children: React.ReactNode;
		permission: string;
		className?: string;
	}) => (
		<button type='button' className={className} data-permission={permission}>
			{children}
		</button>
	),
}));

const renderFooter = (onDelete: () => void = vi.fn()) =>
	render(
		<DeferredPaymentActionsFooter
			branchId={1}
			subsidiaryId={1}
			status='pending'
			outstandingAmount={1000}
			busy={false}
			onRegisterPayment={vi.fn()}
			onMarkPaid={vi.fn()}
			onEdit={vi.fn()}
			onDelete={onDelete}
		/>,
	);

describe('DeferredPaymentActionsFooter', () => {
	it('separa el permiso semántico del cierre manual del registro de abonos', () => {
		renderFooter();

		expect(screen.getByRole('button', { name: 'Registrar abono' })).toHaveAttribute(
			'data-permission',
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.RECORD_PAYMENT,
		);
		expect(screen.getByRole('button', { name: 'Marcar pagada' })).toHaveAttribute(
			'data-permission',
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.MARK_PAID,
		);
		expect(ERP_PERMISSIONS.DEFERRED_PAYMENTS.RECORD_PAYMENT).not.toBe(
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.MARK_PAID,
		);
	});

	it('protege la eliminación del documento con delete-deferred-payment', () => {
		renderFooter();

		const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
		expect(deleteButton.parentElement).toHaveClass('grid', 'grid-cols-4');
		expect(deleteButton).toHaveClass('w-full', 'py-2', 'text-sm', 'font-semibold');
		expect(deleteButton).toHaveAttribute(
			'data-permission',
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.DELETE,
		);
		expect(ERP_PERMISSIONS.DEFERRED_PAYMENTS.DELETE).toBe('delete-deferred-payment');
		expect(ERP_PERMISSIONS.DEFERRED_PAYMENTS.DELETE).not.toBe(
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE,
		);
	});

	it('protege la anulación con su permiso específico', () => {
		render(
			<DeferredPaymentPaymentsSection
				payments={[
					{
						id: 10,
						amount: '1000.00',
						paid_at: '2026-08-03',
						method: 'transfer',
						notes: null,
						attachments: [],
					},
				]}
				onVoid={vi.fn()}
			/>,
		);

		expect(screen.getByRole('button', { name: 'Anular abono' })).toHaveAttribute(
			'data-permission',
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.VOID_PAYMENT,
		);
		expect(ERP_PERMISSIONS.DEFERRED_PAYMENTS.VOID_PAYMENT).not.toBe(
			ERP_PERMISSIONS.DEFERRED_PAYMENTS.RECORD_PAYMENT,
		);
	});
});
