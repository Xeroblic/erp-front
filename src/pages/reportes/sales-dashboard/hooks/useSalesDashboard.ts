import { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import { clearResults } from '@/store/slices/reports/reportSlice';
import type { IReportResult } from '@/interface/reports.interface';
import type {
	SaleRecord,
	ReportFiltersState,
	SalesDashboardStats,
	MappedFilters,
} from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseNumeric = (val: unknown): number | undefined => {
	if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
	if (typeof val === 'string') {
		const num = Number(val.replace(/[^0-9.-]/g, ''));
		return Number.isFinite(num) ? num : undefined;
	}
	return undefined;
};

const normalizeDate = (val?: string): string | undefined => {
	if (!val) return undefined;
	const dashParts = val.split('-');
	if (dashParts.length === 3) {
		const [a, b, c] = dashParts.map((p) => p.trim());
		if (a.length === 4) {
			const iso = new Date(`${a}-${b}-${c}T00:00:00`);
			if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
		}
		if (c.length === 4) {
			const iso = new Date(`${c}-${b}-${a}T00:00:00`);
			if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
		}
	}
	const iso = new Date(val);
	if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
	return undefined;
};

const parseDateSafe = (val: unknown): Date | null => {
	if (!val) return null;
	if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
	if (typeof val === 'string') {
		const iso = new Date(val);
		if (!Number.isNaN(iso.getTime())) return iso;
		const m = val.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
		if (m) {
			const [, dd, mm, yyyy] = m;
			const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
			if (!Number.isNaN(parsed.getTime())) return parsed;
		}
	}
	return null;
};

const extractDate = (r: SaleRecord): string | null =>
	r.sale_date || r.date || r.created_at || r.updated_at || null;

const extractAmount = (r: SaleRecord): number => {
	const raw = r.total_amount ?? (r as any).total ?? 0;
	return typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
};

const extractReturns = (r: SaleRecord): number => {
	const raw = r.returns ?? r.refunded_amount ?? 0;
	return typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSalesDashboard() {
	const [filters, setFilters] = useState<ReportFiltersState>({});
	const dispatch = useAppDispatch();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	// Normalizar datos del API
	const resultsData = useAppSelector((s) => s.reports.aggregatedResults);
	const results: SaleRecord[] = useMemo(() => {
		if (!resultsData) return [];
		return resultsData as SaleRecord[];
	}, [resultsData]);

	const reportsLoading = useAppSelector((s) => s.reports.loading);

	// Mapear filtros al formato API
	const mapFilters = (f: ReportFiltersState): MappedFilters => {
		const out: MappedFilters = {};
		const from = normalizeDate(f.dateFrom);
		const to = normalizeDate(f.dateTo);
		if (from) out.date_from = from;
		if (to) out.date_to = to;
		const priceMin = parseNumeric(f.priceMin);
		const priceMax = parseNumeric(f.priceMax);
		if (priceMin !== undefined) out.price_min = priceMin;
		if (priceMax !== undefined) out.price_max = priceMax;
		if (f.customer) {
			const num = Number(String(f.customer).replace(/\D/g, ''));
			out[!Number.isNaN(num) && num > 0 ? 'customer_id' : 'q'] =
				!Number.isNaN(num) && num > 0 ? num : f.customer;
		}
		if (f.branch) {
			const num = Number(String(f.branch).replace(/\D/g, ''));
			if (!Number.isNaN(num) && num > 0) out.branch_id = num;
		}
		return out;
	};

	// Cargar datos al montar / cambiar subsidiaria o cambiar filtros
	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;
		
		const promise = dispatch(
			fetchReportResults({ subsidiaryId: sid, type: 'sales', filters: mapFilters(filters) })
		);

		return () => {
			promise.abort();
		};
	}, [currentSubsidiaryId, filters, dispatch]);

	// Filtrado client-side
	const filteredResults = useMemo(() => {
		const priceMin = parseNumeric(filters.priceMin);
		const priceMax = parseNumeric(filters.priceMax);
		const fromDate = parseDateSafe(filters.dateFrom);
		const toDate = parseDateSafe(filters.dateTo);
		if (toDate) toDate.setHours(23, 59, 59, 999);

		const branchId =
			typeof filters.branch === 'string'
				? Number(filters.branch)
				: Number(filters.branch ?? 0);
		const customerText = (filters.customer || '').toString().trim().toLowerCase();
		const customerId = Number(customerText) || undefined;

		return results.filter((r) => {
			const amount = extractAmount(r);
			if (priceMin !== undefined && amount < priceMin) return false;
			if (priceMax !== undefined && amount > priceMax) return false;

			const rawDate = extractDate(r);
			if (fromDate || toDate) {
				const d = parseDateSafe(rawDate);
				if (!d || Number.isNaN(d.getTime())) return false;
				if (fromDate && d < fromDate) return false;
				if (toDate && d > toDate) return false;
			}

			if (branchId && branchId > 0) {
				const rBranch = r.branch_id;
				const numericBranch = Number(rBranch || 0);
				if (numericBranch !== branchId) return false;
			}

			if (customerText) {
				const rCustomerId = r.customer_id;
				const rCustomerName =
					typeof r.customer === 'string'
						? r.customer.toLowerCase()
						: (r.customer_name || '').toLowerCase();
				if (customerId) {
					if (Number(rCustomerId || 0) !== customerId) return false;
				} else if (!rCustomerName.includes(customerText)) {
					return false;
				}
			}

			return true;
		});
	}, [results, filters.priceMin, filters.priceMax, filters.dateFrom, filters.dateTo, filters.branch, filters.customer]);

	// Chart series + stats
	const { chartSeries, chartCategories, stats } = useMemo(() => {
		const dateMap = new Map<string, { total: number; returns: number }>();
		let totalSales = 0;
		let totalReturns = 0;

		filteredResults.forEach((r) => {
			const amount = extractAmount(r);
			const retVal = extractReturns(r);
			totalSales += amount;
			totalReturns += retVal;

			const rawDate = extractDate(r);
			const d = parseDateSafe(rawDate);
			if (!d) return;

			const key = d.toISOString().split('T')[0];
			if (!dateMap.has(key)) dateMap.set(key, { total: 0, returns: 0 });
			const entry = dateMap.get(key)!;
			entry.total += amount;
			entry.returns += retVal;
		});

		let keys = Array.from(dateMap.keys()).sort();
		if (filters.dateFrom && filters.dateTo) {
			const start = parseDateSafe(filters.dateFrom);
			const end = parseDateSafe(filters.dateTo);
			if (start && end) {
				const tempKeys: string[] = [];
				for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
					const k = d.toISOString().split('T')[0];
					tempKeys.push(k);
					if (!dateMap.has(k)) dateMap.set(k, { total: 0, returns: 0 });
				}
				keys = tempKeys.sort();
			}
		}

		const dataSales = keys.map((k) => dateMap.get(k)?.total || 0);
		const dataReturns = keys.map((k) => dateMap.get(k)?.returns || 0);

		const computedStats: SalesDashboardStats = {
			total: totalSales,
			returns: totalReturns,
			refundedTotal: totalReturns,
			count: results.length,
			avg: filteredResults.length > 0 ? totalSales / filteredResults.length : 0,
			retPct: totalSales > 0 ? (totalReturns / totalSales) * 100 : 0,
		};

		return {
			chartSeries: [
				{ name: 'Ventas', data: dataSales, color: '#22c55e' },
				{ name: 'Devoluciones', data: dataReturns, color: '#f97316' },
			],
			chartCategories: keys,
			stats: computedStats,
		};
	}, [filteredResults, filters.dateFrom, filters.dateTo, results.length]);

	return {
		filters,
		setFilters,
		filteredResults,
		chartSeries,
		chartCategories,
		stats,
		reportsLoading,
		currentSubsidiaryId,
		mapFilters,
	};
}
