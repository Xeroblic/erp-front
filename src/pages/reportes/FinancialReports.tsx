import React, { useMemo, useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import Chart from '@/components/Chart';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import ReportExportButton from './ReportExportButton';

const FinancialReports: React.FC = () => {
	const [filters, setFilters] = useState<ReportFiltersState>({});
	const dispatch = useAppDispatch();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const resultsData = useAppSelector((s) => s.reports.results);
	// Extraer datos: resultsData puede ser { data: [...], meta: {...} } o directamente un array
	const results = (() => {
		if (!resultsData) return [];
		if (Array.isArray(resultsData)) return resultsData;
		// Si es un objeto, intentar extraer data
		if (resultsData && typeof resultsData === 'object' && 'data' in resultsData) {
			const extracted = (resultsData as any).data;
			return Array.isArray(extracted) ? extracted : [];
		}
		return [];
	})();
	const reportsLoading = useAppSelector((s) => s.reports.loading);
	const reportsError = useAppSelector((s) => s.reports.error);

	// Mapear filtros al formato esperado por el API
	const mapFilters = (f: ReportFiltersState) => {
		const out: Record<string, any> = {
			// No incluir per_page - el thunk obtendrá todas las páginas automáticamente
		};
		if (f.dateFrom) out.date_from = f.dateFrom;
		if (f.dateTo) out.date_to = f.dateTo;
		if (typeof f.priceMin === 'number') out.price_min = f.priceMin;
		if (typeof f.priceMax === 'number') out.price_max = f.priceMax;
		if (f.customer) {
			const num = Number(String(f.customer).replace(/\D/g, ''));
			if (!Number.isNaN(num) && num > 0) out.customer_id = num;
			else out.q = f.customer;
		}
		if (f.branch) {
			const num = Number(String(f.branch).replace(/\D/g, ''));
			if (!Number.isNaN(num) && num > 0) out.branch_id = num;
		}
		return out;
	};

	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;
		const mapped = mapFilters(filters);
		// 'financial' no existe en backend, usar 'sales' como fallback (mapeado en ReportResults.page.tsx)
		dispatch(fetchReportResults({ subsidiaryId: sid, type: 'sales', filters: mapped }) as any);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentSubsidiaryId, filters]);

	// Derivar métricas y series a partir de results - agrupar por fecha similar a SalesDashboard
	const series = useMemo(() => {
		if (!results || results.length === 0) {
			// Datos vacíos cuando no hay resultados
			return [
				{ name: 'Ingresos', data: [0, 0, 0, 0, 0, 0, 0] },
				{ name: 'Gastos', data: [0, 0, 0, 0, 0, 0, 0] },
			];
		}

		// Agrupar por fecha similar a SalesDashboard
		const financialByDate = new Map<string, { income: number; expenses: number }>();

		results.forEach((r: any) => {
			// Obtener fecha - usar sale_date para reportes de ventas
			const recordDate = r?.sale_date || r?.date || r?.created_at || r?.period || r?.fecha;
			if (!recordDate) {
				console.warn('[FinancialReports] Registro sin fecha:', r);
				return;
			}

			let dateKey: string;
			try {
				const dateObj = new Date(recordDate);
				if (isNaN(dateObj.getTime())) {
					console.warn('[FinancialReports] Fecha inválida:', recordDate);
					return;
				}
				dateKey = dateObj.toISOString().split('T')[0];
			} catch (e) {
				console.warn('[FinancialReports] Error al parsear fecha:', recordDate, e);
				return;
			}

			// Obtener ingresos - usar total_amount de ventas como ingresos
			const incomeRaw = r?.total_amount ?? r?.income ?? r?.ingresos ?? r?.total_income ?? r?.amount ?? 0;
			const income = typeof incomeRaw === 'string' ? parseFloat(incomeRaw) || 0 : Number(incomeRaw) || 0;

			// Obtener gastos - para reportes de ventas, los gastos podrían ser 0 o algún campo específico
			// Por ahora, asumimos que no hay gastos en reportes de ventas
			const expensesRaw = r?.expenses ?? r?.gastos ?? r?.total_expenses ?? r?.cost ?? 0;
			const expenses = typeof expensesRaw === 'string' ? parseFloat(expensesRaw) || 0 : Number(expensesRaw) || 0;

			if (!financialByDate.has(dateKey)) {
				financialByDate.set(dateKey, { income: 0, expenses: 0 });
			}

			const current = financialByDate.get(dateKey)!;
			current.income += income;
			current.expenses += expenses;
		});

		// Ordenar por fecha y tomar los últimos 7 días
		const sortedDates = Array.from(financialByDate.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.slice(-7);

		const income: number[] = sortedDates.map(([, data]) => data.income);
		const expenses: number[] = sortedDates.map(([, data]) => data.expenses);

		// Si hay menos de 7 días, rellenar con ceros al inicio
		while (income.length < 7) income.unshift(0);
		while (expenses.length < 7) expenses.unshift(0);

		// Tomar solo los últimos 7
		const finalIncome = income.slice(-7);
		const finalExpenses = expenses.slice(-7);

		return [
			{ name: 'Ingresos', data: finalIncome },
			{ name: 'Gastos', data: finalExpenses },
		];
	}, [results]);

	const categories = useMemo(() => {
		if (!results || results.length === 0) {
			return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
		}

		// Agrupar por fecha y obtener las últimas 7 fechas (similar a SalesDashboard)
		const datesSet = new Set<string>();
		results.forEach((r: any) => {
			const recordDate = r?.sale_date || r?.date || r?.created_at || r?.period || r?.fecha;
			if (recordDate) {
				try {
					const dateObj = new Date(recordDate);
					if (!isNaN(dateObj.getTime())) {
						const dateKey = dateObj.toISOString().split('T')[0];
						datesSet.add(dateKey);
					}
				} catch {
					// Ignorar fechas inválidas
				}
			}
		});

		const sortedDates = Array.from(datesSet).sort().slice(-7);

		// Formatear fechas para mostrar en el gráfico
		const formattedDates = sortedDates.map((dateStr) => {
			try {
				const dt = new Date(dateStr);
				const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
				return days[dt.getDay()] || dateStr;
			} catch {
				return dateStr;
			}
		});

		// Si hay menos de 7, rellenar con días de la semana
		while (formattedDates.length < 7) {
			const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
			formattedDates.unshift(days[formattedDates.length % 7]);
		}

		return formattedDates.slice(-7);
	}, [results]);

	// Debug: Log para verificar datos
	React.useEffect(() => {
		console.log('[FinancialReports] ========== DEBUG COMPLETO ==========');
		console.log('[FinancialReports] resultsData:', resultsData);
		console.log('[FinancialReports] resultsDataType:', typeof resultsData);
		console.log('[FinancialReports] resultsDataIsArray:', Array.isArray(resultsData));
		if (resultsData && typeof resultsData === 'object' && !Array.isArray(resultsData)) {
			console.log('[FinancialReports] resultsDataKeys:', Object.keys(resultsData));
			console.log('[FinancialReports] resultsData.data:', (resultsData as any)?.data);
			console.log('[FinancialReports] resultsData.data es array:', Array.isArray((resultsData as any)?.data));
			console.log('[FinancialReports] resultsData.data.length:', Array.isArray((resultsData as any)?.data) ? (resultsData as any).data.length : 'N/A');
			console.log('[FinancialReports] resultsData.meta:', (resultsData as any)?.meta);
		}
		console.log('[FinancialReports] results (extraído):', results);
		console.log('[FinancialReports] results.length:', results?.length || 0);
		console.log('[FinancialReports] loading:', reportsLoading);
		console.log('[FinancialReports] error:', reportsError);
		if (results && results.length > 0) {
			console.log('[FinancialReports] ✅ Datos recibidos:', results.length, 'registros');
			console.log('[FinancialReports] Primer registro:', results[0]);
			console.log('[FinancialReports] Series calculadas:', series);
			console.log('[FinancialReports] Categories:', categories);
		} else {
			console.log('[FinancialReports] ❌ No hay datos disponibles');
			if (resultsData) {
				console.log('[FinancialReports] resultsData completo (JSON):', JSON.stringify(resultsData, null, 2));
			}
		}
		console.log('[FinancialReports] ====================================');
	}, [results, resultsData, reportsLoading, reportsError, series, categories]);

	// Calcular métricas totales
	const totalIncome = series[0].data.reduce((a, b) => a + b, 0);
	const totalExpenses = series[1].data.reduce((a, b) => a + b, 0);
	const netProfit = totalIncome - totalExpenses;
	const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

	return (
		<div className='space-y-6'>
			{reportsError && (
				<Card className='border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'>
					<CardBody>
						<div className='flex items-center justify-between'>
							<div className='text-rose-700 dark:text-rose-400'>
								<strong>Error cargando reporte financiero:</strong>{' '}
								{typeof reportsError === 'object' && reportsError !== null
									? JSON.stringify(reportsError)
									: String(reportsError)}
								{String(reportsError).includes('400') && (
									<div className='mt-2 text-sm'>
										El tipo de reporte "financial" no está disponible en el backend. Se está usando "sales" como fallback.
									</div>
								)}
							</div>
							<Button
								variant='outline'
								color='rose'
								size='sm'
								onClick={() => {
									const sid = Number(currentSubsidiaryId ?? 0);
									if (!sid) return;
									dispatch(
										fetchReportResults({
											subsidiaryId: sid,
											type: 'sales',
											filters: mapFilters(filters),
										}) as any,
									);
								}}>
								Reintentar
							</Button>
						</div>
					</CardBody>
				</Card>
			)}
			<Card className='border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-50/60 shadow-sm dark:from-amber-900/10 dark:to-transparent'>
				<CardHeader className='rounded-t-md bg-white/60 dark:bg-zinc-900/40'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100'>
								<Icon icon='HeroBanknotes' className='h-6 w-6 text-amber-700' />
							</div>
							<div>
								<h2 className='text-lg font-bold text-amber-900'>
									Reportes Financieros
								</h2>
								<p className='text-sm text-amber-700'>Ingresos vs Gastos</p>
							</div>
						</div>
						<div>
							<ReportExportButton
								subsidiaryId={Number(currentSubsidiaryId ?? 0)}
								type='sales'
								filters={mapFilters(filters)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
							<div className='text-xs text-zinc-500'>Ingresos totales</div>
							<div className='mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
								$ {totalIncome.toLocaleString()}
							</div>
						</div>
						<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
							<div className='text-xs text-zinc-500'>Gastos totales</div>
							<div className='mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400'>
								$ {totalExpenses.toLocaleString()}
							</div>
						</div>
						<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
							<div className='text-xs text-zinc-500'>Margen de ganancia (%)</div>
							<div
								className={`mt-1 text-2xl font-bold ${
									profitMargin >= 0
										? 'text-emerald-600 dark:text-emerald-400'
										: 'text-rose-600 dark:text-rose-400'
								}`}>
								{profitMargin}%
							</div>
						</div>
					</div>

					<div className='mt-6'>
						{series && series.length > 0 && categories && categories.length > 0 ? (
							<Chart
								type='bar'
								height={320}
								series={series as any}
								options={{ 
									xaxis: { 
										categories,
										type: 'category',
									}, 
									stroke: { width: 3 },
									tooltip: {
										enabled: true,
									},
								}}
							/>
						) : (
							<div className='flex h-80 items-center justify-center text-zinc-500'>
								No hay datos para mostrar en el gráfico
							</div>
						)}
					</div>
				</CardBody>
			</Card>

			<ReportFilters onApply={setFilters} />
		</div>
	);
};

export default FinancialReports;

