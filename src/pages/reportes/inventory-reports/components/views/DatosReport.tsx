import React from 'react';
import { Td, Tr } from '@/components/ui/Table';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import type { TInventoryReportFiltersApi } from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import useDatosReport from '@/pages/reportes/inventory-reports/hooks/useDatosReport';
import useLocalReportExport from '@/pages/reportes/inventory-reports/hooks/useLocalReportExport';
import InventoryReportFilters from '@/pages/reportes/inventory-reports/components/filters/InventoryReportFilters';
import InventoryReportExport from '@/pages/reportes/inventory-reports/components/parts/InventoryReportExport';
import InventoryReportSummary from '@/pages/reportes/inventory-reports/components/parts/InventoryReportSummary';
import ReportTableCard from '@/pages/reportes/inventory-reports/components/parts/ReportTableCard';
import { ReportLoadError } from '@/pages/reportes/inventory-reports/components/parts/ReportNotices';
import {
	EmptyCell,
	formatReportDate,
	ProductCell,
	UnitsCell,
} from '@/pages/reportes/inventory-reports/components/parts/ReportCells';
import type { IInventoryReportContext } from '@/pages/reportes/inventory-reports/types';

interface IDatosReportProps {
	context: IInventoryReportContext;
	filtersApi: TInventoryReportFiltersApi;
}

/** Datos: existencias por producto, exportables a PDF y Excel. */
const DatosReport: React.FC<IDatosReportProps> = ({ context, filtersApi }) => {
	const { filters, hasFilters, setBusqueda, setSucursal, setOrden, paginate, limpiar } =
		filtersApi;
	const data = useDatosReport(context, filters);
	const exporter = useLocalReportExport(data.buildExportDocument);
	const sort: TableSortState<string> = data.sort
		? { key: data.sort.field, direction: data.sort.direction }
		: null;

	return (
		<div className='space-y-4'>
			<InventoryReportSummary kpis={data.kpis} loading={data.loading} expected />
			{data.error && <ReportLoadError error={data.error} onRetry={data.refresh} />}
			<InventoryReportFilters
				branches={context.branches}
				sucursal={filters.sucursal}
				onSucursal={setSucursal}
				busqueda={filters.busqueda}
				onBusqueda={setBusqueda}
				onLimpiar={limpiar}
			/>
			<ReportTableCard
				title='Existencias'
				description={`Unidades de cada producto · ${context.scopeLabel}`}
				ariaLabel='Reporte de existencias'
				minWidthClass='min-w-[560px]'
				columnCount={3}
				head={
					<Tr>
						<SortableTableHeader
							label='Producto'
							sortKey='producto'
							sort={sort}
							onSort={setOrden}
						/>
						<SortableTableHeader
							label='Stock'
							sortKey='stock'
							sort={sort}
							onSort={setOrden}
							align='right'
						/>
						<SortableTableHeader
							label='Actualizado'
							sortKey='actualizado'
							sort={sort}
							onSort={setOrden}
						/>
					</Tr>
				}
				headerActions={
					<InventoryReportExport
						subsidiaryId={context.subsidiaryId}
						exporting={exporter.exporting}
						disabled={!data.hasReport}
						onExport={exporter.exportReport}
					/>
				}
				page={data.page}
				perPage={filters.perPage}
				onPaginate={paginate}
				loading={data.loading}
				hasError={Boolean(data.error)}
				emptyTitle={
					hasFilters
						? 'Ningún producto coincide con estos filtros'
						: 'Este reporte todavía no tiene datos'
				}
				emptyHint={
					hasFilters
						? 'Prueba ajustando o limpiando los filtros.'
						: 'Aparecerán acá cuando la empresa tenga productos registrados.'
				}>
				{data.page.rows.map((row) => (
					<Tr key={`${row.sku}|${row.product_name}`}>
						<Td>
							<ProductCell name={row.product_name} sku={row.sku} />
						</Td>
						<Td className='text-right'>
							<UnitsCell value={row.quantity} emphasis />
						</Td>
						<Td>
							{row.updated_at ? (
								<span className='tabular-nums'>
									{formatReportDate(row.updated_at)}
								</span>
							) : (
								<EmptyCell />
							)}
						</Td>
					</Tr>
				))}
			</ReportTableCard>
		</div>
	);
};

export default DatosReport;
