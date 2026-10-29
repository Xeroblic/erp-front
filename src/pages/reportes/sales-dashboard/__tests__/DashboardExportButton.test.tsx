import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';
import type { ReportFiltersState, SaleRecord, SalesDashboardStats } from '@/pages/reportes/types';
import { generateExecutiveReport } from '../utils/pdf/generateExecutiveReport';
import DashboardExportButton from '../components/DashboardExportButton';

vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('../utils/pdf/generateExecutiveReport', () => ({ generateExecutiveReport: vi.fn() }));
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

const generateMock = vi.mocked(generateExecutiveReport);

describe('DashboardExportButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('avisa con un toast cuando no se puede generar el PDF', async () => {
		generateMock.mockRejectedValueOnce(new Error('pdfmake'));
		render(
			<DashboardExportButton
				stats={{} as SalesDashboardStats}
				filteredResults={[{} as SaleRecord]}
				topCustomers={[]}
				filters={{} as ReportFiltersState}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Reporte Ejecutivo PDF' }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				'No pudimos generar el reporte PDF. Intenta nuevamente.',
			),
		);
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'Reporte Ejecutivo PDF' }),
			).not.toBeDisabled(),
		);
	});
});
