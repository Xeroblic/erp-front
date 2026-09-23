import React from 'react';
import type { TInventoryReportFiltersApi } from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import useEstadisticasReport from '@/pages/reportes/inventory-reports/hooks/useEstadisticasReport';
import useLocalReportExport from '@/pages/reportes/inventory-reports/hooks/useLocalReportExport';
import InventoryReportExport from '@/pages/reportes/inventory-reports/components/parts/InventoryReportExport';
import InventoryReportCharts from '@/pages/reportes/inventory-reports/components/charts/InventoryReportCharts';
import InventoryReportFilters from '@/pages/reportes/inventory-reports/components/filters/InventoryReportFilters';
import InventoryReportSummary from '@/pages/reportes/inventory-reports/components/parts/InventoryReportSummary';
import {
	ReportLoadError,
	SimulatedDataNotice,
} from '@/pages/reportes/inventory-reports/components/parts/ReportNotices';
import type { IInventoryReportContext } from '@/pages/reportes/inventory-reports/types';

interface IEstadisticasReportProps {
	context: IInventoryReportContext;
	filtersApi: TInventoryReportFiltersApi;
}

/** Estadísticas del inventario de la sucursal elegida o de toda la empresa. */
const EstadisticasReport: React.FC<IEstadisticasReportProps> = ({ context, filtersApi }) => {
	const { filters, setSucursal, limpiar } = filtersApi;
	const data = useEstadisticasReport(context, filters);
	// Las estadísticas se calculan acá: el archivo también.
	const exporter = useLocalReportExport(data.buildExportDocument);

	return (
		<div className='space-y-4'>
			{data.sources.includes('mock') && <SimulatedDataNotice />}
			<InventoryReportSummary
				kpis={data.stats?.kpis ?? null}
				loading={data.loading}
				expected
			/>
			{data.error && <ReportLoadError error={data.error} onRetry={data.refresh} />}
			<InventoryReportFilters
				branches={context.branches}
				sucursal={filters.sucursal}
				onSucursal={setSucursal}
				onLimpiar={limpiar}
			/>
			{data.loading && (
				<div className='grid gap-4 xl:grid-cols-2' role='status'>
					<span className='sr-only'>Cargando estadísticas…</span>
					{Array.from({ length: 4 }, (_, index) => (
						<div
							key={index}
							className='h-80 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			)}
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<p className='text-sm text-zinc-500 dark:text-zinc-400'>
					Los archivos incluyen los indicadores y la tabla de datos de cada gráfico ·{' '}
					{context.scopeLabel}
				</p>
				<InventoryReportExport
					subsidiaryId={context.subsidiaryId}
					exporting={exporter.exporting}
					disabled={!data.stats || data.loading}
					onExport={exporter.exportReport}
				/>
			</div>
			{!data.loading && data.stats && <InventoryReportCharts stats={data.stats} />}
		</div>
	);
};

export default EstadisticasReport;
