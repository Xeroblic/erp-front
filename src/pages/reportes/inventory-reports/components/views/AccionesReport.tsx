import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { StatusPill } from '@/components/procurement';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { Td, Th, Tr } from '@/components/ui/Table';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import type { IReplenishmentReportRow } from '@/interface/inventoryReports.interface';
import { inventarioProductoPath } from '@/pages/inventario/Inventario/types';
import type { TInventoryReportFiltersApi } from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import useAccionesReport from '@/pages/reportes/inventory-reports/hooks/useAccionesReport';
import useLocalReportExport from '@/pages/reportes/inventory-reports/hooks/useLocalReportExport';
import InventoryReportFilters from '@/pages/reportes/inventory-reports/components/filters/InventoryReportFilters';
import InventoryReportExport from '@/pages/reportes/inventory-reports/components/parts/InventoryReportExport';
import InventoryReportSummary from '@/pages/reportes/inventory-reports/components/parts/InventoryReportSummary';
import ReportTableCard from '@/pages/reportes/inventory-reports/components/parts/ReportTableCard';
import {
	ReportLoadError,
	SimulatedDataNotice,
} from '@/pages/reportes/inventory-reports/components/parts/ReportNotices';
import {
	EmptyCell,
	formatReportDate,
	ProductCell,
	UnitsCell,
} from '@/pages/reportes/inventory-reports/components/parts/ReportCells';
import {
	REPLENISHMENT_COLORS,
	REPLENISHMENT_LABELS,
	SUPPLIER_DETAIL_PATH,
	type IInventoryReportContext,
} from '@/pages/reportes/inventory-reports/types';

const COLUMN_COUNT = 6;

const SupplierCell: React.FC<{ recommendation: IReplenishmentReportRow['recommendation'] }> = ({
	recommendation,
}) => {
	const { supplier, last_purchase: lastPurchase } = recommendation;
	if (!supplier && !lastPurchase) return <EmptyCell />;
	return (
		<div className='min-w-0'>
			{supplier ? (
				<p className='truncate text-sm font-semibold'>{supplier.display_name}</p>
			) : (
				<p className='text-sm text-zinc-500'>Ningún proveedor elegible</p>
			)}
			{lastPurchase && (
				<p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
					Última compra el {formatReportDate(lastPurchase.received_on)} (hace{' '}
					{lastPurchase.days_since_purchase}{' '}
					{lastPurchase.days_since_purchase === 1 ? 'día' : 'días'})
				</p>
			)}
		</div>
	);
};

interface IAccionesReportProps {
	context: IInventoryReportContext;
	filtersApi: TInventoryReportFiltersApi;
}

/**
 * Acciones: productos bajo el umbral, con el proveedor al que conviene
 * comprarle según las compras anteriores. El contrato no sugiere cantidad:
 * el stock objetivo está fuera de alcance (§13).
 */
const AccionesReport: React.FC<IAccionesReportProps> = ({ context, filtersApi }) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const { filters, hasFilters, setBusqueda, setSucursal, setOrden, paginate, limpiar } =
		filtersApi;
	const data = useAccionesReport(context, filters);
	const exporter = useLocalReportExport(data.buildExportDocument);
	const sort: TableSortState<string> = data.sort
		? { key: data.sort.field, direction: data.sort.direction }
		: null;

	return (
		<div className='space-y-4'>
			{data.source === 'mock' && <SimulatedDataNotice />}
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
				title='Qué reponer'
				description={`Productos bajo el umbral y el proveedor de su compra más reciente · ${context.scopeLabel}`}
				ariaLabel='Reporte de reposición'
				minWidthClass='min-w-[960px]'
				columnCount={COLUMN_COUNT}
				head={
					<Tr>
						<SortableTableHeader
							label='Producto'
							sortKey='producto'
							sort={sort}
							onSort={setOrden}
						/>
						<SortableTableHeader
							label='Disponible'
							sortKey='disponible'
							sort={sort}
							onSort={setOrden}
							align='right'
						/>
						<SortableTableHeader
							label='Umbral'
							sortKey='umbral'
							sort={sort}
							onSort={setOrden}
							align='right'
						/>
						<SortableTableHeader
							label='Proveedor sugerido'
							sortKey='proveedor'
							sort={sort}
							onSort={setOrden}
						/>
						<SortableTableHeader
							label='Sugerencia'
							sortKey='sugerencia'
							sort={sort}
							onSort={setOrden}
							align='center'
						/>
						<Th scope='col' className='text-center'>
							Acciones
						</Th>
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
						: 'No hay nada que reponer'
				}
				emptyHint={
					hasFilters
						? 'Prueba ajustando o limpiando los filtros.'
						: 'Todos los productos con umbral tienen disponible por encima de él.'
				}>
				{data.page.rows.map((row) => {
					const { supplier } = row.recommendation;
					return (
						<Tr key={row.product.id}>
							<Td>
								<ProductCell name={row.product.name} sku={row.product.sku} />
							</Td>
							<Td className='text-right'>
								<UnitsCell value={row.stock.available_quantity} emphasis />
							</Td>
							<Td className='text-right'>
								{row.stock.threshold === null ? (
									<EmptyCell />
								) : (
									<UnitsCell value={row.stock.threshold} />
								)}
							</Td>
							<Td>
								<SupplierCell recommendation={row.recommendation} />
							</Td>
							<Td className='text-center'>
								<StatusPill
									color={REPLENISHMENT_COLORS[row.recommendation.status]}
									width={10}>
									{REPLENISHMENT_LABELS[row.recommendation.status]}
								</StatusPill>
							</Td>
							<Td>
								<div className='flex flex-wrap justify-center gap-2'>
									{supplier && (
										<ProtectedButton
											permission='view-procurement-supplier'
											subsidiaryId={context.subsidiaryId}
											scope='visible'
											size='sm'
											variant='outline'
											icon='HeroTruck'
											aria-label={`Ver proveedor ${supplier.display_name}`}
											onClick={() =>
												navigate(`${SUPPLIER_DETAIL_PATH}/${supplier.id}`)
											}>
											Proveedor
										</ProtectedButton>
									)}
									<PermissionGuard permission='view-product'>
										<Button
											size='sm'
											variant='outline'
											icon='HeroEye'
											color='violet'
											aria-label={`Ver ficha de ${row.product.name}`}
											onClick={() =>
												navigate(inventarioProductoPath(row.product.id), {
													state: { from: `${pathname}${search}` },
												})
											}>
											Ver
										</Button>
									</PermissionGuard>
								</div>
							</Td>
						</Tr>
					);
				})}
			</ReportTableCard>
		</div>
	);
};

export default AccionesReport;
