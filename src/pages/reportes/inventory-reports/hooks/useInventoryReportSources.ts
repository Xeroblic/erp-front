import { useCallback, useEffect, useState } from 'react';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import type {
	TInventoryReportSource,
	TInventoryReportType,
} from '@/interface/inventoryReports.interface';
import { ReportsService } from '@/services/reports/reports.service';
import { reportRowsOf } from '@/services/reports/inventoryReports.service';

/** Claves que informa `GET S/reports`. */
const reportKeysOf = (body: unknown): string[] =>
	reportRowsOf(body)
		.map((type) =>
			typeof type === 'object' && type !== null && 'key' in type ? type.key : null,
		)
		.filter((key): key is string => typeof key === 'string');

/**
 * De dónde sale cada reporte. `stock` siempre del backend. R1–R3, del backend
 * si `GET S/reports` los informa; si no, del mock del contrato cuando la
 * bandera de datos simulados está encendida; si no, no hay pestaña.
 *
 * `ready` es `false` mientras no responde la lista de tipos: hasta entonces
 * sólo se puede ofrecer `stock`, para no pedir al mock un reporte que el
 * backend quizá ya publica.
 */
const useInventoryReportSources = (subsidiaryId: number) => {
	const [reportKeys, setReportKeys] = useState<string[] | null>(null);

	useEffect(() => {
		let active = true;
		ReportsService.getTypes(subsidiaryId)
			.then((body: unknown) => {
				if (active) setReportKeys(reportKeysOf(body));
			})
			// Sin la lista se ofrece lo que no depende de ella.
			.catch(() => {
				if (active) setReportKeys([]);
			});
		return () => {
			active = false;
		};
	}, [subsidiaryId]);

	const sourceOf = useCallback(
		(type: TInventoryReportType): TInventoryReportSource | null => {
			if (type === 'stock') return 'api';
			if (reportKeys === null) return null;
			if (reportKeys.includes(type)) return 'api';
			return INVENTORY_STOCK_USE_MOCKS ? 'mock' : null;
		},
		[reportKeys],
	);

	return { ready: reportKeys !== null, sourceOf };
};

export default useInventoryReportSources;
