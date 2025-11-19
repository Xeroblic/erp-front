import React, { useMemo, useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import Chart from '@/components/Chart';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import ReportExportButton from './ReportExportButton';

const SalesDashboard: React.FC = () => {
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

	// Cuando cambian filtros o sucursal, pedir resultados del slice para el reporte 'sales'
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
		dispatch(fetchReportResults({ subsidiaryId: sid, type: 'sales', filters: mapped }) as any);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentSubsidiaryId, filters]);

	// Derivar métricas principales a partir de results (si vienen). Agrupar por fecha.
	const series = useMemo(() => {
		// Obtener rango de fechas de los filtros
		const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
		const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

		// Agrupar ventas por fecha
		const salesByDate = new Map<string, { total: number; returns: number }>();

		if (results && results.length > 0) {
			results.forEach((r: any, index: number) => {
				// Obtener fecha de la venta - intentar múltiples campos
				const saleDate =
					r?.sale_date || r?.date || r?.created_at || r?.fecha || r?.fecha_venta;
				if (!saleDate) {
					if (index < 3) {
						console.warn(
							'[SalesDashboard] Registro sin fecha (índice',
							index,
							'):',
							Object.keys(r),
						);
					}
					return;
				}

				let dateKey: string;
				try {
					const dateObj = new Date(saleDate);
					if (isNaN(dateObj.getTime())) {
						if (index < 3) {
							console.warn(
								'[SalesDashboard] Fecha inválida (índice',
								index,
								'):',
								saleDate,
							);
						}
						return;
					}
					dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
				} catch (e) {
					if (index < 3) {
						console.warn(
							'[SalesDashboard] Error al parsear fecha (índice',
							index,
							'):',
							saleDate,
							e,
						);
					}
					return;
				}

				// Obtener total_amount - priorizar total_amount como solicitado
				const totalAmountRaw =
					r?.total_amount ?? r?.total ?? r?.amount ?? r?.monto ?? r?.price ?? 0;
				const totalAmount =
					typeof totalAmountRaw === 'string'
						? parseFloat(totalAmountRaw) || 0
						: Number(totalAmountRaw) || 0;

				// Obtener devoluciones (si existe)
				const returnsRaw = r?.returns ?? r?.devoluciones ?? r?.return_amount ?? 0;
				const returns =
					typeof returnsRaw === 'string'
						? parseFloat(returnsRaw) || 0
						: Number(returnsRaw) || 0;

				if (index < 3) {
					console.log(
						`[SalesDashboard] Procesando registro ${index}: fecha=${dateKey}, total_amount=${totalAmount}, returns=${returns}`,
					);
				}

				if (!salesByDate.has(dateKey)) {
					salesByDate.set(dateKey, { total: 0, returns: 0 });
				}

				const current = salesByDate.get(dateKey)!;
				current.total += totalAmount;
				current.returns += returns;
			});
		}

		// Generar todas las fechas en el rango (o usar las fechas de los datos si no hay filtros)
		let allDates: string[] = [];

		if (dateFrom && dateTo && !isNaN(dateFrom.getTime()) && !isNaN(dateTo.getTime())) {
			// Generar todas las fechas entre dateFrom y dateTo
			const current = new Date(dateFrom);
			current.setHours(0, 0, 0, 0);
			const end = new Date(dateTo);
			end.setHours(23, 59, 59, 999);

			while (current <= end) {
				const dateKey = current.toISOString().split('T')[0];
				allDates.push(dateKey);
				// Inicializar con 0 si no hay datos para esta fecha
				if (!salesByDate.has(dateKey)) {
					salesByDate.set(dateKey, { total: 0, returns: 0 });
				}
				current.setDate(current.getDate() + 1);
			}
		} else {
			// Si no hay filtros de fecha, usar solo las fechas que tienen datos
			allDates = Array.from(salesByDate.keys()).sort();
		}

		// Ordenar todas las fechas
		const sortedDates = allDates.sort((a, b) => a.localeCompare(b));

		const totals: number[] = sortedDates.map((dateKey) => salesByDate.get(dateKey)?.total || 0);
		const returns: number[] = sortedDates.map(
			(dateKey) => salesByDate.get(dateKey)?.returns || 0,
		);
		return [
			{ name: 'Ventas', data: totals },
			{ name: 'Devoluciones', data: returns },
		];
	}, [results, filters.dateFrom, filters.dateTo]);

	const categories = useMemo(() => {
		// Obtener rango de fechas de los filtros
		const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
		const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

		// Obtener todas las fechas únicas de los datos
		const datesSet = new Set<string>();
		if (results && results.length > 0) {
			results.forEach((r: any) => {
				const saleDate = r?.sale_date || r?.date || r?.created_at;
				if (saleDate) {
					try {
						const dateObj = new Date(saleDate);
						if (!isNaN(dateObj.getTime())) {
							const dateKey = dateObj.toISOString().split('T')[0];
							datesSet.add(dateKey);
						}
					} catch {
						// Ignorar fechas inválidas
					}
				}
			});
		}

		// Generar todas las fechas en el rango (o usar las fechas de los datos si no hay filtros)
		let allDates: string[] = [];

		if (dateFrom && dateTo && !isNaN(dateFrom.getTime()) && !isNaN(dateTo.getTime())) {
			// Generar todas las fechas entre dateFrom y dateTo
			const current = new Date(dateFrom);
			current.setHours(0, 0, 0, 0);
			const end = new Date(dateTo);
			end.setHours(23, 59, 59, 999);

			while (current <= end) {
				const dateKey = current.toISOString().split('T')[0];
				allDates.push(dateKey);
				current.setDate(current.getDate() + 1);
			}
		} else {
			// Si no hay filtros de fecha, usar solo las fechas que tienen datos
			allDates = Array.from(datesSet).sort();
		}

		// Formatear fechas para mostrar en el gráfico
		// Incluir siempre el año en el formato
		const formattedDates = allDates.map((dateStr) => {
			try {
				const dt = new Date(dateStr);
				if (isNaN(dt.getTime())) return dateStr;

				const day = String(dt.getDate()).padStart(2, '0');
				const month = String(dt.getMonth() + 1).padStart(2, '0');
				const year = dt.getFullYear();
				const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

				// Si hay más de 90 días, mostrar formato compacto DD/MM/YY
				if (allDates.length > 90) {
					const shortYear = String(year).slice(-2);
					return `${day}/${month}/${shortYear}`;
				}
				// Si hay más de 30 días, mostrar DD/MM/YYYY
				if (allDates.length > 30) {
					return `${day}/${month}/${year}`;
				}
				// Si hay más de 7 días, mostrar día de semana + DD/MM/YYYY
				if (allDates.length > 7) {
					return `${days[dt.getDay()]} ${day}/${month}/${year}`;
				}
				// Si hay 7 o menos días, mostrar día de semana + DD/MM/YYYY
				return `${days[dt.getDay()]} ${day}/${month}/${year}`;
			} catch {
				return dateStr;
			}
		});

		return formattedDates;
	}, [results, filters.dateFrom, filters.dateTo]);

	return (
		<div className='space-y-6'>
			<Card className='border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-indigo-50/60 shadow-sm dark:from-indigo-900/10 dark:to-transparent'>
				<CardHeader className='rounded-t-md bg-white/60 dark:bg-zinc-900/40'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100'>
								<Icon
									icon='HeroReceiptPercent'
									className='h-6 w-6 text-indigo-700'
								/>
							</div>
							<div>
								<h2 className='text-lg font-bold text-indigo-900'>
									Dashboard de Ventas
								</h2>
								<p className='text-sm text-indigo-700'>
									Tendencia de ventas y devoluciones
								</p>
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
					{(() => {
						// Calcular métricas reales desde los datos - usar total_amount como solicitado
						const totalSales = results.reduce((sum: number, r: any) => {
							const amountRaw = r?.total_amount ?? r?.total ?? r?.amount ?? 0;
							const amount =
								typeof amountRaw === 'string'
									? parseFloat(amountRaw) || 0
									: Number(amountRaw) || 0;
							return sum + amount;
						}, 0);
						const totalReturns = results.reduce((sum: number, r: any) => {
							const returnsRaw =
								r?.returns ?? r?.devoluciones ?? r?.return_amount ?? 0;
							const returns =
								typeof returnsRaw === 'string'
									? parseFloat(returnsRaw) || 0
									: Number(returnsRaw) || 0;
							return sum + returns;
						}, 0);
						const salesCount = results.length;
						const avgTicket = salesCount > 0 ? totalSales / salesCount : 0;
						const returnsPercent =
							totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;

						return (
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
									<div className='text-xs text-zinc-500'>Ventas totales</div>
									<div className='mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
										${' '}
										{totalSales.toLocaleString('es-CL', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</div>
								</div>
								<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
									<div className='text-xs text-zinc-500'>Ticket promedio</div>
									<div className='mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
										${' '}
										{avgTicket.toLocaleString('es-CL', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
								</div>
								<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
									<div className='text-xs text-zinc-500'>Devoluciones (%)</div>
									<div className='mt-1 text-2xl font-bold text-rose-600'>
										{returnsPercent.toFixed(1)}%
									</div>
								</div>
							</div>
						);
					})()}

					<div className='mt-6'>
						{series && series.length > 0 && categories && categories.length > 0 ? (
							<div className='overflow-x-auto'>
								<div
									style={{
										minWidth:
											categories.length > 30
												? `${categories.length * 40}px`
												: '100%',
									}}>
									<Chart
										type='line'
										height={320}
										series={[
											{
												name: 'Ventas',
												data: series[0].data,
												color: '#4F46E5',
											},
											{
												name: 'Devoluciones',
												data: series[1].data,
												color: '#E11D48',
											},
										]}
										options={{
											stroke: {
												width: [3, 3], // Ambas visibles
												curve: 'smooth',
											},
											markers: {
												size: [0, 4], // Ventas sin puntos – Devoluciones SIEMPRE con puntos
												strokeColors: ['#4F46E5', '#E11D48'],
												hover: {
													sizeOffset: 3,
												},
											},
											tooltip: {
												shared: true,
												intersect: false,
												theme: 'dark',
												x: { format: 'dd/MM/yyyy' },
											},
											xaxis: {
												categories,
												labels: {
													rotate:
														categories.length > 30
															? -45
															: categories.length > 7
																? -30
																: 0,
													rotateAlways: categories.length > 7,
													style: {
														fontSize:
															categories.length > 90
																? '9px'
																: categories.length > 30
																	? '10px'
																	: '12px',
													},
													trim: true,
												},
											},
											yaxis: {
												labels: {
													formatter: (value) =>
														`$${value.toLocaleString('es-CL', {
															minimumFractionDigits: 0,
														})}`,
												},
											},
											chart: {
												zoom: { enabled: true, type: 'x' },
												toolbar: { show: false },
											},
											dataLabels: { enabled: false },
											grid: {
												strokeDashArray: 4,
												borderColor: '#E5E7EB55',
											},
											legend: {
												position: 'top',
												horizontalAlign: 'left',
												itemMargin: { horizontal: 12 },
											},
										}}
									/>
								</div>
							</div>
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

export default SalesDashboard;
