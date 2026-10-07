import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import type { SalesDashboardStats, SaleRecord, ReportFiltersState } from '../../types';
import { generateExecutiveReport } from '../utils/pdf/generateExecutiveReport';

interface Props {
	stats: SalesDashboardStats;
	filteredResults: SaleRecord[];
	topCustomers: { name: string; total: number }[];
	filters: ReportFiltersState;
}

const DashboardExportButton: React.FC<Props> = ({
	stats,
	filteredResults,
	topCustomers,
	filters,
}) => {
	const [loading, setLoading] = useState(false);

	const handleExport = async () => {
		setLoading(true);
		try {
			await generateExecutiveReport({
				stats,
				filteredResults,
				topCustomers,
				filters,
			});
		} catch {
			toast.error('No pudimos generar el reporte PDF. Intenta nuevamente.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			variant='solid'
			className='gap-2 border-none bg-zinc-900 font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
			icon='HeroDocumentArrowDown'
			isDisable={loading || filteredResults.length === 0}
			onClick={handleExport}>
			{loading ? 'Generando...' : 'Reporte Ejecutivo PDF'}
		</Button>
	);
};

export default DashboardExportButton;
