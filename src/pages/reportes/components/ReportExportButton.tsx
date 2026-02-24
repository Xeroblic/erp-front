import React, { useState } from 'react';
import { ReportsService } from '@/services/reports/reports.service';
import type { IReportExportParams, ReportFormat } from '@/interface/reports.interface';

interface Props {
	subsidiaryId: number;
	type: string;
	filters: IReportExportParams;
}

const ReportExportButton: React.FC<Props> = ({ subsidiaryId, type, filters }) => {
	const [loading, setLoading] = useState(false);

	const doExport = async (format: ReportFormat) => {
		setLoading(true);
		try {
			const res = await ReportsService.export(subsidiaryId, type, { ...filters, format });
			const blob = res instanceof Blob ? res : new Blob([res as unknown as BlobPart]);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${type}.${format}`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch {
			// Silencioso
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex items-center gap-2'>
			<button
				disabled={loading}
				onClick={() => doExport('pdf')}
				className='rounded border px-3 py-1'>
				PDF
			</button>
			<button
				disabled={loading}
				onClick={() => doExport('xlsx')}
				className='rounded border px-3 py-1'>
				XLSX
			</button>
		</div>
	);
};

export default ReportExportButton;
