import { useCallback, useMemo } from 'react';
import type { IReplenishmentReportRow } from '@/interface/inventoryReports.interface';
import type { IInventoryReportQuery } from '@/services/reports/inventoryReports.service';
import useInventoryReportQuery from '@/pages/reportes/inventory-reports/hooks/useInventoryReportQuery';
import useReportTable, {
	type IReportTableConfig,
} from '@/pages/reportes/inventory-reports/hooks/useReportTable';
import {
	filtersLabelOf,
	REPLENISHMENT_LABELS,
	type IInventoryReportContext,
	type IInventoryReportFilters,
} from '@/pages/reportes/inventory-reports/types';
import { buildAccionesDocument } from '@/pages/reportes/inventory-reports/export/reportDocument';
import { replenishmentKpis } from '@/pages/reportes/inventory-reports/utils';

const TABLE: IReportTableConfig<IReplenishmentReportRow> = {
	fields: ['producto', 'disponible', 'umbral', 'proveedor', 'sugerencia'],
	textsOf: (row) => [row.product.name, row.product.sku],
	valueOf: (row, field) => {
		if (field === 'disponible') return row.stock.available_quantity;
		if (field === 'umbral') return row.stock.threshold;
		if (field === 'proveedor') return row.recommendation.supplier?.display_name ?? null;
		if (field === 'sugerencia') return REPLENISHMENT_LABELS[row.recommendation.status];
		return row.product.name;
	},
};

/** Acciones: qué reponer y a qué proveedor (R2 `replenishment`). */
const useAccionesReport = (context: IInventoryReportContext, filters: IInventoryReportFilters) => {
	const { subsidiaryId, owner, branches, sourceOf } = context;
	const source = sourceOf('replenishment');
	const query = useMemo<IInventoryReportQuery | null>(
		() =>
			source
				? {
						subsidiaryId,
						type: 'replenishment',
						source,
						params: { branchId: filters.sucursal },
						branches,
					}
				: null,
		[subsidiaryId, source, filters.sucursal, branches],
	);
	const { result, loading, error, refresh } = useInventoryReportQuery(query, owner);
	const rows = result?.type === 'replenishment' ? result.rows : null;
	const kpis = useMemo(() => (rows ? replenishmentKpis(rows) : null), [rows]);
	const { sort, visible, page } = useReportTable(rows, filters, TABLE);

	const { scopeLabel, companyName } = context;
	const buildExportDocument = useCallback(
		() =>
			rows
				? buildAccionesDocument(visible, kpis, {
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

export default useAccionesReport;
