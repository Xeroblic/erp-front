import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';
import type { ReportsService } from '@/services/reports/reports.service';
import ReportExportButton from '../ReportExportButton';

const exportMock = vi.hoisted(() => vi.fn<typeof ReportsService.export>());

vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/services/reports/reports.service', () => ({
	ReportsService: { export: exportMock },
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		isDisable,
		onClick,
	}: {
		children: React.ReactNode;
		isDisable?: boolean;
		onClick?: () => void;
	}) => (
		<button type='button' disabled={isDisable} onClick={onClick}>
			{children}
		</button>
	),
}));

describe('ReportExportButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('avisa con un toast cuando la descarga falla y vuelve a habilitar los botones', async () => {
		exportMock.mockRejectedValueOnce(new Error('500'));
		render(<ReportExportButton subsidiaryId={2} type='sales' filters={{}} />);

		fireEvent.click(screen.getByRole('button', { name: 'PDF' }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				'No pudimos descargar el reporte. Intenta nuevamente.',
			),
		);
		expect(exportMock).toHaveBeenCalledWith(2, 'sales', { format: 'pdf' });
		await waitFor(() => expect(screen.getByRole('button', { name: 'PDF' })).not.toBeDisabled());
	});
});
