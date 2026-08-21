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
import { calculateLinearRegressionProjection } from '@/utils/predictions';

const parseNumeric = (val: unknown): number | undefined => {
	if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
	if (typeof val === 'string') {
		const cleanString = val.replace(/[^0-9.-]/g, '');
		if (cleanString === '') return undefined;
		const num = Number(cleanString);
		return Number.isFinite(num) ? num : undefined;
	}
	return undefined;
};

const normalizeDate = (val?: string): string | undefined => {
	if (!val) return undefined;
	const trimmed = val.trim();
	const datePart = trimmed.split(' ')[0].split('T')[0];

	// YYYY-MM-DD
	if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(datePart)) {
		return datePart.replace(/\//g, '-');
	}
	// DD-MM-YYYY
	if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(datePart)) {
		const [d, m, y] = datePart.split(/[/-]/);
		return `${y}-${m}-${d}`;
	}

	const iso = new Date(trimmed);
	if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
	return undefined;
};

const parseDateSafe = (val: unknown): Date | null => {
	if (!val) return null;
	if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
	if (typeof val === 'string') {
		const trimmed = val.trim();
		const datePart = trimmed.split(' ')[0].split('T')[0];

		// YYYY-MM-DD
		if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(datePart)) {
			const [y, m, d] = datePart.split(/[/-]/);
			const parsed = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
			if (!Number.isNaN(parsed.getTime())) return parsed;
		}
		// DD-MM-YYYY
		if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(datePart)) {
			const [d, m, y] = datePart.split(/[/-]/);
			const parsed = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
			if (!Number.isNaN(parsed.getTime())) return parsed;
		}

		// Fallback normal
		const iso = new Date(trimmed);
		if (!Number.isNaN(iso.getTime())) return iso;
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

const extractCustomerName = (r: SaleRecord): string => {
	if (typeof r.customer === 'string') return r.customer;
	if (r.customer && typeof r.customer === 'object') {
		return (
			r.customer.billing_company ||
			r.customer.contact_name ||
			r.customer.name ||
			'Cliente Anónimo'
		);
	}
	if (r.billing_snapshot) {
		return `${r.billing_snapshot.first_name ?? ''} ${r.billing_snapshot.last_name ?? ''}`.trim();
	}
	return r.customer_name || 'Cliente Anónimo';
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
		const out: MappedFilters = { all: 1, raw: 1 }; // Forzamos todo el histórico + estados verdaderos (para detectar wc-refunded)
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
			if (!Number.isNaN(num) && num > 0) {
				out.customer_id = num;
			} else {
				out.q = f.customer;
			}
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
			fetchReportResults({ subsidiaryId: sid, type: 'sales', filters: mapFilters(filters) }),
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

				// Normalizar fechas a tiempos locales a medianoche (start of day) para comparar justamente
				const compareTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

				if (fromDate) {
					const fromTime = new Date(
						fromDate.getFullYear(),
						fromDate.getMonth(),
						fromDate.getDate(),
					).getTime();
					if (compareTime < fromTime) return false;
				}
				if (toDate) {
					const toTime = new Date(
						toDate.getFullYear(),
						toDate.getMonth(),
						toDate.getDate(),
						23,
						59,
						59,
						999,
					).getTime();
					if (d.getTime() > toTime) return false;
				}
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
	}, [
		results,
		filters.priceMin,
		filters.priceMax,
		filters.dateFrom,
		filters.dateTo,
		filters.branch,
		filters.customer,
	]);

	const currentMonthRange = useMemo(() => {
		if (filters.dateFrom || filters.dateTo) {
			const start = filters.dateFrom ? parseDateSafe(filters.dateFrom)?.getTime() : undefined;
			let end = filters.dateTo ? parseDateSafe(filters.dateTo)?.getTime() : undefined;
			if (end) {
				const endDate = new Date(end);
				endDate.setHours(23, 59, 59, 999);
				end = endDate.getTime();
			} else if (start) {
				const endDate = new Date(start);
				endDate.setMonth(endDate.getMonth() + 1);
				end = Math.min(endDate.getTime(), new Date().getTime());
			} else if (end && !start) {
				const startDate = new Date(end);
				startDate.setMonth(startDate.getMonth() - 1);
				return { start: startDate.getTime(), end };
			}
			return { start, end };
		}

		// Rango predeterminado (últimos 30 días)
		const now = new Date();
		const endDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			23,
			59,
			59,
			999,
		).getTime(); // Hoy al final del día

		const startDayDate = new Date();
		startDayDate.setDate(now.getDate() - 30);
		startDayDate.setHours(0, 0, 0, 0); // Inicio del día

		const startDay = startDayDate.getTime();

		return { start: startDay, end: endDay };
	}, [filters.dateFrom, filters.dateTo]);

	// Chart series + stats
	const { chartSeries, chartCategories, stats } = useMemo(() => {
		const dateMap = new Map<
			string,
			{
				total: number;
				returns: number;
				confirmed: number;
				process: number;
				cancelled: number;
			}
		>();
		let totalConfirmedSales = 0;
		let totalReturns = 0;
		let confirmedCount = 0;

		filteredResults.forEach((r) => {
			const rawAmount = extractAmount(r);
			const amount = Math.max(0, rawAmount); // Solo sumamos positivos para las barras
			const retVal = extractReturns(r);

			let statusRaw = String(r.status || (r as any).estado || '')
				.toLowerCase()
				.trim();
			if (statusRaw.startsWith('wc-')) statusRaw = statusRaw.substring(3);
			if (statusRaw.startsWith('order-')) statusRaw = statusRaw.substring(6);

			const rawDate = extractDate(r);
			const d = parseDateSafe(rawDate);
			if (!d) return;

			const key = d.toISOString().split('T')[0];
			if (!dateMap.has(key))
				dateMap.set(key, { total: 0, returns: 0, confirmed: 0, process: 0, cancelled: 0 });
			const entry = dateMap.get(key)!;

			const isCancelled =
				[
					'refunded',
					'returned',
					'anulado',
					'cancelled',
					'canceled',
					'cancelado',
					'failed',
					'devuelto',
					'reembolsado',
					'rechazado',
				].includes(statusRaw) ||
				rawAmount < 0 ||
				retVal > 0;
			const isProcess = [
				'processing',
				'on-hold',
				'pending',
				'procesando',
				'espera',
				'pendiente',
			].includes(statusRaw);

			let actualReturn = 0;
			if (isCancelled) {
				actualReturn = Math.abs(rawAmount) > 0 ? Math.abs(rawAmount) : retVal;
				entry.cancelled += actualReturn;
				totalReturns += actualReturn;
			} else if (isProcess) {
				entry.process += amount;
			} else {
				entry.confirmed += amount; // completed, confirmed, etc.
				totalConfirmedSales += amount;
				confirmedCount++;
			}

			entry.total += amount;
			entry.returns += actualReturn;
		});

		// --- FIX: Crear un arreglo CONTINUO de fechas que cubra todo el rango temporal ---
		let keys = Array.from(dateMap.keys()).sort();

		let startRange = currentMonthRange.start;
		let endRange = currentMonthRange.end;

		// Si por alguna razón hay fechas fuera del rango visual (ej. error en filtros), forzamos su inclusión para que no se pierdan
		if (keys.length > 0) {
			const firstDataTime = new Date(`${keys[0]}T12:00:00`).getTime();
			const lastDataTime = new Date(`${keys[keys.length - 1]}T12:00:00`).getTime();
			if (!startRange || firstDataTime < startRange) startRange = firstDataTime;
			if (!endRange || lastDataTime > endRange) endRange = lastDataTime;
		}

		if (startRange && endRange) {
			// Usamos 12:00:00 para iterar libre de problemas de huso horario
			const firstD = new Date(startRange);
			const lastD = new Date(endRange);
			firstD.setHours(12, 0, 0, 0);
			lastD.setHours(12, 0, 0, 0);

			const tempKeys: string[] = [];
			for (let d = new Date(firstD); d <= lastD; d.setDate(d.getDate() + 1)) {
				const k = d.toISOString().split('T')[0];
				tempKeys.push(k);
				// Rellenar días intermedios con 0 si no hubo ventas
				if (!dateMap.has(k))
					dateMap.set(k, {
						total: 0,
						returns: 0,
						confirmed: 0,
						process: 0,
						cancelled: 0,
					});
			}
			keys = tempKeys;
		}

		const dataSales = keys.map((k) => dateMap.get(k)?.total || 0);
		const dataReturns = keys.map((k) => dateMap.get(k)?.returns || 0);

		const dataConfirmed = keys.map((k) => dateMap.get(k)?.confirmed || 0);
		const dataProcess = keys.map((k) => dateMap.get(k)?.process || 0);
		const dataCancelled = keys.map((k) => dateMap.get(k)?.cancelled || 0);

		// Calcular span de días para las promedios
		const daysSpan = Math.max(1, keys.length);
		const monthsSpan = Math.max(1, daysSpan / 30.4);
		const computedMonthlyAvg = totalConfirmedSales / monthsSpan;

		// --- MACHINE LEARNING (Frontend) ---
		// Tomamos solo los últimos 90 días para que la proyección refleje
		// la realidad reciente del negocio y no la historia de hace 3 años.
		const recentDataForPrediction = dataConfirmed.slice(-90);
		const computedProjection = calculateLinearRegressionProjection(recentDataForPrediction, 30);

		const computedStats: SalesDashboardStats = {
			total: totalConfirmedSales,
			returns: totalReturns,
			refundedTotal: totalReturns,
			count: confirmedCount,
			avg: confirmedCount > 0 ? totalConfirmedSales / confirmedCount : 0,
			retPct: totalConfirmedSales > 0 ? (totalReturns / totalConfirmedSales) * 100 : 0,
			monthlyAvg: computedMonthlyAvg,
			projectedTotal: computedProjection,
		};

		return {
			chartSeries: [
				{ name: 'Confirmadas', data: dataConfirmed, color: '#10b981' }, // Emerald 500
				{ name: 'En Proceso', data: dataProcess, color: '#3b82f6' }, // Blue 500
				{ name: 'Devueltas / Canc.', data: dataCancelled, color: '#f43f5e' }, // Rose 500
			],
			chartCategories: keys,
			stats: computedStats,
		};
	}, [filteredResults, filters.dateFrom, filters.dateTo, results.length, currentMonthRange]);

	const topCustomers = useMemo(() => {
		const customerMap = new Map<string, number>();
		filteredResults.forEach((r) => {
			if (r.status === 'cancelled' || r.status === 'canceled') return;
			const name = extractCustomerName(r).trim() || 'Desconocido';
			customerMap.set(name, (customerMap.get(name) || 0) + extractAmount(r));
		});
		return Array.from(customerMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([name, total]) => ({ name, total }));
	}, [filteredResults]);

	return {
		filters,
		setFilters,
		filteredResults,
		chartSeries,
		chartCategories,
		stats,
		topCustomers,
		reportsLoading,
		currentSubsidiaryId,
		mapFilters,
		currentMonthRange,
	};
}
