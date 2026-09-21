import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchPaginatedReportResults } from '@/store/slices/reports/reportsThunks';
import { ReportsService } from '@/services/reports/reports.service';
import { clearResults } from '@/store/slices/reports/reportSlice';
import type { ReportFiltersState, MappedFilters } from '../../types';
import {
	INVENTORY_REPORT_TABS,
	isInventoryReportType,
	toInventoryReportRow,
	type IInventoryReportTab,
	type TInventoryReportRow,
	type TInventoryReportType,
} from '../inventoryReportTabs';

const TAB_PARAM = 'tab';
const DEFAULT_TAB: TInventoryReportType = 'stock';

// Filtros → API
const mapFilters = (f: ReportFiltersState, pag?: PaginationState): MappedFilters => {
	const out: MappedFilters = {};
	if (f.dateFrom) out.date_from = f.dateFrom;
	if (f.dateTo) out.date_to = f.dateTo;
	if (f.parameter) out.q = f.parameter;
	if (f.branch) {
		const num = Number(String(f.branch).replace(/\D/g, ''));
		if (!Number.isNaN(num) && num > 0) out.branch_id = num;
	}
	if (pag) {
		out.page = pag.pageIndex + 1;
		out.per_page = pag.pageSize ?? 200;
	}
	return out;
};

export function useInventoryReports() {
	const [filters, setFilters] = useState<ReportFiltersState>({});
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 200 });
	const [searchParams, setSearchParams] = useSearchParams();
	const dispatch = useAppDispatch();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const [reportTypes, setReportTypes] = useState<string[]>([]);
	const resultsData = useAppSelector((s) => s.reports.paginatedResults);
	const reportsLoading = useAppSelector((s) => s.reports.loading);
	const reportsError = useAppSelector((s) => s.reports.error);

	// Sólo las pestañas que el backend informa en `GET S/reports`; Existencias
	// existe desde antes y se ofrece siempre.
	const tabs: IInventoryReportTab[] = useMemo(() => {
		const available = new Set(reportTypes);
		return INVENTORY_REPORT_TABS.filter(
			(tab) => tab.type === DEFAULT_TAB || available.has(tab.type),
		);
	}, [reportTypes]);

	const requestedTab = searchParams.get(TAB_PARAM);
	const activeType: TInventoryReportType =
		isInventoryReportType(requestedTab) && tabs.some((tab) => tab.type === requestedTab)
			? requestedTab
			: DEFAULT_TAB;
	const activeTab = tabs.find((tab) => tab.type === activeType) ?? INVENTORY_REPORT_TABS[0];

	const changeTab = useCallback(
		(tabId: string) => {
			if (!isInventoryReportType(tabId)) return;
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					if (tabId === DEFAULT_TAB) next.delete(TAB_PARAM);
					else next.set(TAB_PARAM, tabId);
					return next;
				},
				{ replace: true },
			);
		},
		[setSearchParams],
	);

	// Cada pestaña es otro reporte: vuelve a la primera página y limpia la tabla.
	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
		dispatch(clearResults());
	}, [filters, activeType, dispatch]);

	// Tipos disponibles: se leen aparte del slice de reportes, que comparte
	// `loading`/`error` con los resultados y apagaría el indicador de la tabla.
	// Si fallan, se ofrece sólo Existencias.
	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return undefined;
		let active = true;
		ReportsService.getTypes(sid)
			.then((response: unknown) => {
				// `fetchNormalized` ya desempaqueta `data`; se acepta también el sobre por si no.
				const wrapped =
					typeof response === 'object' && response !== null && 'data' in response
						? response.data
						: [];
				const list: unknown = Array.isArray(response) ? response : wrapped;
				const keys = (Array.isArray(list) ? list : [])
					.map((type: unknown) =>
						typeof type === 'object' && type !== null && 'key' in type
							? type.key
							: null,
					)
					.filter((key): key is string => typeof key === 'string');
				if (active) setReportTypes(keys);
			})
			.catch(() => {
				if (active) setReportTypes([]);
			});
		return () => {
			active = false;
		};
	}, [currentSubsidiaryId]);

	// Limpiar al desmontar
	useEffect(() => {
		return () => {
			dispatch(clearResults());
		};
	}, [dispatch]);

	// Cargar reportes (con cancelación de peticiones anteriores)
	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return undefined;

		const promise = dispatch(
			fetchPaginatedReportResults({
				subsidiaryId: sid,
				type: activeType,
				filters: mapFilters(filters, pagination),
			}),
		);

		return () => {
			promise.abort();
		};
	}, [
		currentSubsidiaryId,
		activeType,
		filters,
		pagination.pageIndex,
		pagination.pageSize,
		dispatch,
	]);

	const meta = resultsData?.meta || null;

	// Filas del backend (forma desconocida) → celdas según la pestaña activa.
	const rows: TInventoryReportRow[] = useMemo(() => {
		if (!resultsData || !Array.isArray(resultsData.data)) return [];
		return resultsData.data
			.filter((item): item is object => typeof item === 'object' && item !== null)
			.map((item) => toInventoryReportRow(item, activeTab.columns));
	}, [resultsData, activeTab]);

	// `accessorFn` y no `accessorKey`: los campos con punto (`product.name`) ya
	// vienen aplanados en la fila y TanStack los leería como ruta anidada.
	const columns = useMemo<ColumnDef<TInventoryReportRow>[]>(
		() =>
			activeTab.columns.map((column) => ({
				id: column.field,
				header: column.header,
				accessorFn: (row) => row[column.field],
				cell: (info) => info.getValue<string | number>(),
				enableSorting: true,
			})),
		[activeTab],
	);

	const retry = () => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;
		void dispatch(
			fetchPaginatedReportResults({
				subsidiaryId: sid,
				type: activeType,
				filters: mapFilters(filters, pagination),
			}),
		);
	};

	return {
		filters,
		setFilters,
		rows,
		columns,
		tabs,
		activeTab,
		changeTab,
		reportsLoading,
		reportsError,
		currentSubsidiaryId,
		mapFilters,
		retry,
		pagination,
		setPagination,
		meta,
	};
}
