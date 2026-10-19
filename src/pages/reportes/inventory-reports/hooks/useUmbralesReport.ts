import { useCallback, useMemo } from 'react';
import type { IStockHealthReportRow } from '@/interface/inventoryReports.interface';
import type { IInventoryReportQuery } from '@/services/reports/inventoryReports.service';
import useInventoryReportQuery from '@/pages/reportes/inventory-reports/hooks/useInventoryReportQuery';
import useReportTable, {
	type IReportTableConfig,
} from '@/pages/reportes/inventory-reports/hooks/useReportTable';
import {
	filtersLabelOf,
	type IInventoryReportContext,
	type IInventoryReportFilters,
} from '@/pages/reportes/inventory-reports/types';
import { buildUmbralesDocument } from '@/pages/reportes/inventory-reports/export/reportDocument';
import {
	STATUS_RANK,
	thresholdKpis,
	visibleStatusOf,
} from '@/pages/reportes/inventory-reports/utils';

const TABLE: IReportTableConfig<IStockHealthReportRow> = {
	fields: ['producto', 'sucursal', 'en_bodega', 'disponible', 'umbral', 'estado'],
	textsOf: (row) => [row.product.name, row.product.sku],
	valueOf: (row, field) => {
		if (field === 'sucursal') return row.branch.name;
		if (field === 'en_bodega') return row.physical_quantity;
		if (field === 'disponible') return row.available_quantity;
		if (field === 'umbral') return row.threshold;
		if (field === 'estado') return STATUS_RANK[visibleStatusOf(row)];
		return row.product.name;
	},
};

/** Umbrales: disponible frente al umbral de cada producto y sucursal (R1 `stock_health`). */
const useUmbralesReport = (context: IInventoryReportContext, filters: IInventoryReportFilters) => {
	const { subsidiaryId, owner, branches, sourceOf } = context;
	const source = sourceOf('stock_health');
	const query = useMemo<IInventoryReportQuery | null>(
		() =>
			source
				? {
						subsidiaryId,
						type: 'stock_health',
						source,
						params: { branchId: filters.sucursal },
						branches,
					}
				: null,
		[subsidiaryId, source, filters.sucursal, branches],
	);
	const { result, loading, error, refresh } = useInventoryReportQuery(query, owner);
	const rows = result?.type === 'stock_health' ? result.rows : null;
	// Los KPI resumen todo el reporte de la sucursal elegida: no cambian con el estado.
	const kpis = useMemo(() => (rows ? thresholdKpis(rows) : null), [rows]);

	const { estado } = filters;
	const byEstado = useCallback(
		(row: IStockHealthReportRow) => estado === null || visibleStatusOf(row) === estado,
		[estado],
	);
	const { sort, visible, page } = useReportTable(rows, filters, TABLE, byEstado);

	const { scopeLabel, companyName } = context;
	const buildExportDocument = useCallback(
		() =>
			rows
				? buildUmbralesDocument(visible, kpis, {
						companyName,
						scopeLabel,
						filtersLabel: filtersLabelOf(filters),
						simulated: source === 'mock',
						generatedAt: new Date(),
					})
				: null,
		[rows, visible, kpis, companyName, scopeLabel, filters, source],
	);

	return {
		source,
		hasReport: rows !== null,
		kpis,
		sort,
		page,
		loading,
		error,
		refresh,
		buildExportDocument,
	};
};

export default useUmbralesReport;
