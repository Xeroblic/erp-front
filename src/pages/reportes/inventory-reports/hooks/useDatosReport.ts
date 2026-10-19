import { useCallback, useMemo } from 'react';
import type { IStockReportRow } from '@/interface/inventoryReports.interface';
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
import { buildDatosDocument } from '@/pages/reportes/inventory-reports/export/reportDocument';
import { stockKpis } from '@/pages/reportes/inventory-reports/utils';

const TABLE: IReportTableConfig<IStockReportRow> = {
	fields: ['producto', 'stock', 'actualizado'],
	textsOf: (row) => [row.product_name, row.sku],
	valueOf: (row, field) => {
		if (field === 'stock') return row.quantity;
		if (field === 'actualizado') return row.updated_at;
		return row.product_name;
	},
};

/** Datos: existencias por producto (`stock`, el reporte que ya publica el backend). */
const useDatosReport = (context: IInventoryReportContext, filters: IInventoryReportFilters) => {
	const { subsidiaryId, owner, branches } = context;
	const query = useMemo<IInventoryReportQuery>(
		() => ({
			subsidiaryId,
			type: 'stock',
			source: 'api',
			params: { branchId: filters.sucursal },
			branches,
		}),
		[subsidiaryId, filters.sucursal, branches],
	);
	const { result, loading, error, refresh } = useInventoryReportQuery(query, owner);
	const rows = result?.type === 'stock' ? result.rows : null;
	const kpis = useMemo(() => (rows ? stockKpis(rows) : null), [rows]);
	const { sort, visible, page } = useReportTable(rows, filters, TABLE);

	const { scopeLabel, companyName } = context;
	const buildExportDocument = useCallback(
		() =>
			rows
				? buildDatosDocument(visible, kpis, {
						companyName,
						scopeLabel,
						filtersLabel: filtersLabelOf(filters),
						simulated: false,
						generatedAt: new Date(),
					})
				: null,
		[rows, visible, kpis, companyName, scopeLabel, filters],
	);

	return {
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

export default useDatosReport;
