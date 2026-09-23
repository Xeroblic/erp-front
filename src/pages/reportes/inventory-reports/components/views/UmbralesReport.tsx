import React from 'react';
import { StatusPill } from '@/components/procurement';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { Td, Th, Tr } from '@/components/ui/Table';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import UmbralModal from '@/pages/inventario/Inventario/InventarioProducto/components/UmbralModal';
import type { TInventoryReportFiltersApi } from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import useUmbralesReport from '@/pages/reportes/inventory-reports/hooks/useUmbralesReport';
import useUmbralEditor from '@/pages/reportes/inventory-reports/hooks/useUmbralEditor';
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
	ProductCell,
	UnitsCell,
} from '@/pages/reportes/inventory-reports/components/parts/ReportCells';
import {
	ESTADO_COLORS,
	ESTADO_OPTIONS,
	type IInventoryReportContext,
} from '@/pages/reportes/inventory-reports/types';
import { visibleStatusOf } from '@/pages/reportes/inventory-reports/utils';

interface IUmbralesReportProps {
	context: IInventoryReportContext;
	filtersApi: TInventoryReportFiltersApi;
}

const estadoLabel = (value: ReturnType<typeof visibleStatusOf>): string =>
	ESTADO_OPTIONS.find((option) => option.value === value)?.label ?? value;

/**
 * Umbrales: disponible frente al umbral de stock bajo de cada producto, por
 * sucursal. El umbral es del producto (§13): cambiarlo desde cualquier fila
 * vale para todas las sucursales.
 */
const UmbralesReport: React.FC<IUmbralesReportProps> = ({ context, filtersApi }) => {
	const {
		filters,
		hasFilters,
		setBusqueda,
		setSucursal,
		setEstado,
		setOrden,
		paginate,
		limpiar,
	} = filtersApi;
	const data = useUmbralesReport(context, filters);
	const editor = useUmbralEditor(data.refresh);
	const exporter = useLocalReportExport(data.buildExportDocument);
	// El umbral sólo se edita en el mock del §13: con datos del backend la edición
	// escribiría en el mock y la tabla no cambiaría. Con la API real será la edición de producto.
	const canEditThreshold = data.source === 'mock';
	const columnCount = canEditThreshold ? 7 : 6;
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
				estado={filters.estado}
				onEstado={setEstado}
				onLimpiar={limpiar}
			/>
			<ReportTableCard
				title='Umbrales de stock bajo'
				description={`Cuando el disponible llega al umbral o menos, el producto pide reposición · ${context.scopeLabel}`}
				ariaLabel='Reporte de umbrales'
				minWidthClass='min-w-[900px]'
				columnCount={columnCount}
				itemLabel={['fila', 'filas']}
				head={
					<Tr>
						<SortableTableHeader
							label='Producto'
							sortKey='producto'
							sort={sort}
							onSort={setOrden}
						/>
						<SortableTableHeader
							label='Sucursal'
							sortKey='sucursal'
							sort={sort}
							onSort={setOrden}
						/>
						<SortableTableHeader
							label='En bodega'
							sortKey='en_bodega'
							sort={sort}
							onSort={setOrden}
							align='right'
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
							label='Estado'
							sortKey='estado'
							sort={sort}
							onSort={setOrden}
							align='center'
						/>
						{canEditThreshold && (
							<Th scope='col' className='text-center'>
								Acciones
							</Th>
						)}
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
						: 'No hay productos con stock para evaluar'
				}
				emptyHint={
					hasFilters
						? 'Prueba ajustando o limpiando los filtros.'
						: 'Los productos con serie no tienen umbral y no aparecen acá.'
				}>
				{data.page.rows.map((row) => {
					const estado = visibleStatusOf(row);
					return (
						<Tr key={`${row.product.id}-${row.branch.id}`}>
							<Td>
								<ProductCell name={row.product.name} sku={row.product.sku} />
							</Td>
							<Td>{row.branch.name}</Td>
							<Td className='text-right'>
								<UnitsCell value={row.physical_quantity} />
							</Td>
							<Td className='text-right'>
								<UnitsCell value={row.available_quantity} emphasis />
							</Td>
							<Td className='text-right'>
								{row.threshold === null ? (
									<span className='text-sm text-zinc-500'>Sin umbral</span>
								) : (
									<UnitsCell value={row.threshold} />
								)}
							</Td>
							<Td className='text-center'>
								<StatusPill color={ESTADO_COLORS[estado]} width={9}>
									{estadoLabel(estado)}
								</StatusPill>
							</Td>
							{canEditThreshold && (
								<Td>
									<div className='flex justify-center'>
										<ProtectedButton
											permission='edit-product'
											subsidiaryId={context.subsidiaryId}
											scope='access'
											size='sm'
											variant='outline'
											icon='HeroBellAlert'
											aria-label={`${row.threshold === null ? 'Definir' : 'Cambiar'} umbral de ${row.product.name}`}
											onClick={() =>
												editor.open({
													productId: row.product.id,
													productName: row.product.name,
													threshold: row.threshold,
												})
											}>
											{row.threshold === null ? 'Definir' : 'Cambiar'}
										</ProtectedButton>
									</div>
								</Td>
							)}
						</Tr>
					);
				})}
			</ReportTableCard>
			<UmbralModal
				isOpen={editor.target !== null}
				onClose={editor.close}
				productName={editor.target?.productName ?? ''}
				formik={editor.formik}
				saving={editor.saving}
			/>
		</div>
	);
};

export default UmbralesReport;
