import { useCallback, useMemo } from 'react';
import type { IInventoryReportQuery } from '@/services/reports/inventoryReports.service';
import useInventoryReportQuery from '@/pages/reportes/inventory-reports/hooks/useInventoryReportQuery';
import type {
	IInventoryReportContext,
	IInventoryReportFilters,
} from '@/pages/reportes/inventory-reports/types';
import { buildEstadisticasDocument } from '@/pages/reportes/inventory-reports/export/reportDocument';
import {
	agingBuckets,
	branchStockTotals,
	countByStatus,
	statisticsKpis,
	topProductsByUnits,
	type IInventoryReportStats,
} from '@/pages/reportes/inventory-reports/utils';

/**
 * Estadísticas: se calculan en el navegador con dos reportes completos: R1
 * (`stock_health`) para cantidades y estados, y R3 (`dead_stock` con
 * `days=0`, es decir, todo el stock) para la antigüedad.
 */
const useEstadisticasReport = (
	context: IInventoryReportContext,
	filters: IInventoryReportFilters,
) => {
	const { subsidiaryId, owner, branches, sourceOf } = context;
	const healthSource = sourceOf('stock_health');
	const deadSource = sourceOf('dead_stock');
	const healthQuery = useMemo<IInventoryReportQuery | null>(
		() =>
			healthSource
				? {
						subsidiaryId,
						type: 'stock_health',
						source: healthSource,
						params: { branchId: filters.sucursal },
						branches,
					}
				: null,
		[subsidiaryId, healthSource, filters.sucursal, branches],
	);
	const deadQuery = useMemo<IInventoryReportQuery | null>(
		() =>
			deadSource
				? {
						subsidiaryId,
						type: 'dead_stock',
						source: deadSource,
						params: { branchId: filters.sucursal, days: 0 },
						branches,
					}
				: null,
		[subsidiaryId, deadSource, filters.sucursal, branches],
	);
	const health = useInventoryReportQuery(healthQuery, owner);
	const dead = useInventoryReportQuery(deadQuery, owner);
	const healthRows = health.result?.type === 'stock_health' ? health.result.rows : null;
	const deadRows = dead.result?.type === 'dead_stock' ? dead.result.rows : null;

	const stats = useMemo<IInventoryReportStats | null>(
		() =>
			healthRows && deadRows
				? {
						kpis: statisticsKpis(healthRows, deadRows),
						statuses: countByStatus(healthRows),
						branches: branchStockTotals(healthRows),
						topProducts: topProductsByUnits(healthRows),
						aging: agingBuckets(deadRows),
					}
				: null,
		[healthRows, deadRows],
	);

	const { refresh: refreshHealth } = health;
	const { refresh: refreshDead } = dead;
	const refresh = useCallback(() => {
		refreshHealth();
		refreshDead();
	}, [refreshHealth, refreshDead]);

	const { scopeLabel, companyName } = context;
	const simulated = healthSource === 'mock' || deadSource === 'mock';
	const buildExportDocument = useCallback(
		() =>
			stats
				? buildEstadisticasDocument(stats, {
						companyName,
						scopeLabel,
						// La sucursal ya va en el alcance; Estadísticas no tiene otros filtros.
						filtersLabel: null,
						simulated,
						generatedAt: new Date(),
					})
				: null,
		[stats, companyName, scopeLabel, simulated],
	);

	return {
		buildExportDocument,
		sources: [healthSource, deadSource],
		stats,
		loading: health.loading || dead.loading,
		error: health.error ?? dead.error,
		refresh,
	};
};

export default useEstadisticasReport;
