import { useMemo, useState, useEffect } from 'react';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchPaginatedReportResults } from '@/store/slices/reports/reportsThunks';
import { clearResults } from '@/store/slices/reports/reportSlice';
import type { IReportResult } from '@/interface/reports.interface';
import type {
	StockRecord,
	InventoryRow,
	ReportFiltersState,
	MappedFilters,
} from '../../types';

export function useInventoryReports() {
	const [filters, setFilters] = useState<ReportFiltersState>({});
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 200 });
	const dispatch = useAppDispatch();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const resultsData = useAppSelector((s) => s.reports.paginatedResults);

	// Normalizar datos del API
	const results: StockRecord[] = useMemo(() => {
		if (!resultsData || !resultsData.data) return [];
		return resultsData.data as StockRecord[];
	}, [resultsData]);

	// Extract meta for pagination
	const meta = useMemo(() => {
		return resultsData?.meta || null;
	}, [resultsData]);

	const reportsLoading = useAppSelector((s) => s.reports.loading);
	const reportsError = useAppSelector((s) => s.reports.error);

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
			out.per_page = pag.pageSize;
		}
		return out;
	};

	// Reset page when filters change
	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, [filters]);

	// Limpiar al desmontar
	useEffect(() => {
		return () => {
			dispatch(clearResults());
		};
	}, [dispatch]);

	// Cargar reportes (con cancelación de peticiones anteriores)
	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;

		const promise = dispatch(
			fetchPaginatedReportResults({
				subsidiaryId: sid,
				type: 'stock',
				filters: mapFilters(filters, pagination),
			}),
		);

		return () => {
			promise.abort();
		};
	}, [currentSubsidiaryId, filters, pagination.pageIndex, pagination.pageSize, dispatch]);

	// Mapeo a rows de tabla
	const rows: InventoryRow[] = useMemo(() => {
		return results.map((r) => ({
			sku: r.sku ?? '—',
			nombre: r.product_name ?? '—',
			bodega: r.warehouse_name ?? r.branch_name ?? '—',
			stock: Number(r.quantity ?? 0),
		}));
	}, [results]);

	// Definición de columnas
	const columns = useMemo<ColumnDef<InventoryRow>[]>(
		() => [
			{
				accessorKey: 'sku',
				header: 'SKU',
				cell: (info) => info.getValue<string>(),
				enableSorting: true,
			},
			{
				accessorKey: 'nombre',
				header: 'Producto',
				cell: (info) => info.getValue<string>(),
				enableSorting: true,
			},
			{
				accessorKey: 'bodega',
				header: 'Bodega',
				cell: (info) => info.getValue<string>(),
				enableSorting: true,
			},
			{
				accessorKey: 'stock',
				header: 'Stock',
				cell: (info) => info.getValue<number>(),
				enableSorting: true,
			},
		],
		[],
	);

	const retry = () => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;
		dispatch(
			fetchPaginatedReportResults({
				subsidiaryId: sid,
				type: 'stock',
				filters: mapFilters(filters, pagination),
			}),
		);
	};

	return {
		filters,
		setFilters,
		rows,
		columns,
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
