import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DeferredPaymentAttachmentsEditor from '../components/parts/DeferredPaymentAttachmentsEditor';

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, isLoading: false, isSuperAdmin: true }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

const attachment = {
	id: 7,
	file_name: 'factura.pdf',
	mime_type: 'application/pdf',
	size: 20,
	share_with_customer: true,
	url: '/attachments/7',
};

describe('DeferredPaymentAttachmentsEditor', () => {
	it('permite seleccionar varios archivos y mantiene la opcion de compartir visible', () => {
		const onAddFiles = vi.fn();
		render(
			<DeferredPaymentAttachmentsEditor
				attachments={[]}
				pending={[]}
				error={null}
				isUploading={false}
				busyAttachmentId={null}
				branchId={1}
				subsidiaryId={1}
				onAddFiles={onAddFiles}
				onRemovePending={vi.fn()}
				onSetPendingSharing={vi.fn()}
				onDelete={vi.fn()}
				onUpdateSharing={vi.fn()}
			/>,
		);

		const input = document.querySelector('#deferred-payment-attachments') as HTMLInputElement;
		expect(input).toHaveAttribute('multiple');
		expect(input).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx');
		fireEvent.change(input, {
			target: {
				files: [new File(['a'], 'uno.pdf'), new File(['b'], 'dos.xlsx')],
			},
		});
		expect(onAddFiles).toHaveBeenCalledOnce();
	});

	it('bloquea borrar y compartir adjuntos existentes al editar un documento pagado', () => {
		render(
			<DeferredPaymentAttachmentsEditor
				attachments={[attachment]}
				pending={[]}
				error={null}
				isUploading={false}
				busyAttachmentId={null}
				branchId={1}
				subsidiaryId={1}
				disabled
				onAddFiles={vi.fn()}
				onRemovePending={vi.fn()}
				onSetPendingSharing={vi.fn()}
				onDelete={vi.fn()}
				onUpdateSharing={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText('Compartir con el cliente')).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Eliminar factura.pdf' })).toBeDisabled();
		expect(screen.getByText('factura.pdf')).toBeInTheDocument();
	});
});
