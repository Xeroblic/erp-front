import React, { useMemo, useRef, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Chart from '@/components/Chart';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import SalesAnalytics from '../components/SalesAnalytics';
import { useSalesDashboard } from './hooks/useSalesDashboard';
import type { ApexOptions } from 'apexcharts';
import ReportExportButton from '../components/ReportExportButton';
import DashboardExportButton from './components/DashboardExportButton';
import ReportFilters from '../components/ReportFilters';
import gsap from 'gsap';
import useDarkMode from '@/hooks/useDarkMode';

const AnimatedNumber = ({ value }: { value: number }) => {
	const spanRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (!spanRef.current) return;

		const obj = { val: 0 };

		// Get current value from text if possible, to animate from current -> new
		const currentText = spanRef.current.innerText.replace(/\./g, '');
		const currentVal = parseInt(currentText, 10);
		if (!isNaN(currentVal)) {
			obj.val = currentVal;
		}

		gsap.to(obj, {
			val: value,
			duration: 1.5, // Ligeramente más suave
			ease: 'power4.out',
			onUpdate: () => {
				if (spanRef.current) {
					spanRef.current.innerText = Math.round(obj.val).toLocaleString('es-CL', {
						maximumFractionDigits: 0,
					});
				}
			},
		});
	}, [value]);

	return (
		<span ref={spanRef} className='font-bold text-white dark:text-white'>
			0
		</span>
	);
};

const apexToolbarMenuStyles = `
    .apexcharts-menu {
        background-color: #18181b !important;
        border: 1px solid #27272a !important;
        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5) !important;
        border-radius: 12px !important;
        padding: 8px !important;
    }
    .apexcharts-menu-item {
        color: #e4e4e7 !important;
        border-radius: 6px !important;
        padding: 6px 12px !important;
        font-size: 13px !important;
        transition: all 0.2s ease !important;
    }
    .apexcharts-menu-item:hover {
        background: #27272a !important;
        color: #ffffff !important;
    }
    .apexcharts-menu-item.disabled {
        color: #52525b !important;
    }
    .apexcharts-legend {
        z-index: 1 !important;
    }
`;

const SalesDashboard: React.FC = () => {
	const {
		filteredResults,
		chartSeries,
		chartCategories,
		stats,
		topCustomers,
		currentSubsidiaryId,
		filters,
		setFilters,
		mapFilters,
		currentMonthRange,
	} = useSalesDashboard();
	const { isDarkTheme } = useDarkMode();

	const chartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'area',
				zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
				toolbar: {
					show: true,
					tools: { pan: true, zoom: true, reset: true },
					autoSelected: 'zoom',
				},
				fontFamily: 'inherit',
				animations: {
					enabled: true,
					easing: 'easeinout',
					speed: 800,
				},
				parentHeightOffset: 0,
			},
			stroke: {
				width: [3, 3],
				curve: 'smooth',
				colors: ['#2dd4bf', '#fb7185'],
			},
			markers: {
				size: 0,
				strokeColors: ['#2dd4bf', '#fb7185'],
				strokeWidth: 3,
				colors: ['#fff'],
				hover: { size: 6 },
			},
			dataLabels: { enabled: false },
			grid: {
				strokeDashArray: 5,
				borderColor: 'rgba(161, 161, 170, 0.15)', // Más sutil
				padding: { top: 10, right: 0, bottom: 0, left: 10 },
				yaxis: { lines: { show: true } },
				xaxis: { lines: { show: false } },
			},
			xaxis: {
				type: 'datetime',
				categories: chartCategories,
				min: currentMonthRange.start,
				max: currentMonthRange.end,
				tickAmount: 10,
				labels: {
					style: { fontSize: '11px', colors: '#a1a1aa', fontWeight: 500 },
					datetimeFormatter: {
						year: 'yyyy',
						month: "MMM 'yy",
						day: 'dd MMM',
						hour: 'HH:mm',
					},
					offsetY: 4,
				},
				tooltip: { enabled: false },
				axisBorder: { show: true, color: 'rgba(113, 113, 122, 0.25)' }, // Borde inferior normal
				axisTicks: { show: false },
			},
			yaxis: {
				labels: {
					style: { colors: '#a1a1aa', fontSize: '11px', fontWeight: 500 },
					formatter: (val: number) =>
						`$${val.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
					offsetX: -4,
				},
			},
			legend: {
				position: 'top',
				horizontalAlign: 'right',
				fontWeight: 600,
				fontSize: '13px',
				labels: { colors: isDarkTheme ? '#e4e4e7' : '#27272a' },
				offsetY: 10,
			},
			tooltip: {
				theme: 'dark',
				shared: true,
				intersect: false,
				style: { fontSize: '13px' },
				x: { format: 'dd MMM yyyy' },
				y: { formatter: (val: number) => `$${val.toLocaleString('es-CL')}` },
			},
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 1,
					opacityFrom: 0.45, // Más fuerte arriba
					opacityTo: 0.05, // Casi transparente abajo
					stops: [0, 90, 100],
					colorStops: [
						[
							{ offset: 0, color: '#2dd4bf', opacity: 0.4 },
							{ offset: 100, color: '#2dd4bf', opacity: 0 },
						],
						[
							{ offset: 0, color: '#fb7185', opacity: 0.4 },
							{ offset: 100, color: '#fb7185', opacity: 0 },
						],
					],
				},
			},
		}),
		[chartCategories, currentMonthRange, isDarkTheme],
	);

	const kpiContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (kpiContainerRef.current) {
			gsap.fromTo(
				kpiContainerRef.current.children,
				{ y: 40, opacity: 0, scale: 0.95 },
				{
					y: 0,
					opacity: 1,
					scale: 1,
					stagger: 0.1,
					duration: 0.7,
					ease: 'back.out(1.4)',
					delay: 0.1,
				},
			);
		}
	}, []);

	return (
		<PageWrapper title='Reporte de Ventas'>
			<style>{apexToolbarMenuStyles}</style>

			<Subheader className='relative mb-4 border-b border-zinc-200 bg-zinc-50/95 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-[#121214]/95 sm:px-6'>
				<SubheaderLeft>
					<div className='flex items-center gap-4'>
						<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-500/10 dark:text-indigo-400'>
							<Icon icon='HeroReceiptPercent' className='h-7 w-7' />
						</div>
						<div className='flex flex-col items-start justify-center'>
							<Badge className='bg-transparent px-0 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white'>
								Dashboard de Ventas
							</Badge>
							<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
								Análisis financiero y control de devoluciones
							</p>
						</div>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container className='pb-10'>
				<div className='flex flex-col gap-8'>
					{/* Controles de Filtrado */}
					<div className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#121214]'>
						<ReportFilters
							initial={filters}
							onApply={(f) => setFilters(f)}
							onReset={() => setFilters({})}
						/>
					</div>

					{/* Fila de KPIs (Métricas Principales) */}
					<div
						ref={kpiContainerRef}
						className='grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5'>
						{/* KPI: Ventas Totales */}
						<div className='group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-emerald-500/40 dark:from-emerald-600 dark:to-teal-700'>
							<div className='relative flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
									<Icon
										icon='HeroCube'
										className='h-5 w-5 text-white dark:text-white'
										color='white'
									/>
								</div>
								<p className='text-xs font-bold uppercase tracking-wider text-emerald-50'>
									Ventas Totales
								</p>
							</div>
							<div className='relative mt-4'>
								<h3 className='text-3xl font-extrabold tracking-tight text-white drop-shadow-sm'>
									{'$'}
									<AnimatedNumber value={stats.total} />
								</h3>
								<p className='mt-1 text-xs font-medium text-emerald-100'>
									Ingresos acumulados
								</p>
							</div>
						</div>

						{/* KPI: Ticket Promedio */}
						<div className='group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-indigo-500/40 dark:from-indigo-600 dark:to-violet-700'>
							<div className='relative flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
									<Icon
										icon='HeroReceiptPercent'
										className='h-5 w-5 text-white dark:text-white'
										color='white'
									/>
								</div>
								<p className='text-xs font-bold uppercase tracking-wider text-indigo-50'>
									Ticket Promedio
								</p>
							</div>
							<div className='relative mt-4'>
								<h3 className='text-3xl font-extrabold tracking-tight text-white drop-shadow-sm'>
									{'$'}
									<AnimatedNumber value={stats.avg} />
								</h3>
								<p className='mt-1 text-xs font-medium text-indigo-100'>
									Valor por orden
								</p>
							</div>
						</div>

						{/* KPI: Reembolsado */}
						<div className='group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-5 text-white shadow-lg shadow-orange-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-orange-500/40 dark:from-orange-600 dark:to-amber-700'>
							<div className='relative flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
									<Icon
										icon='HeroArrowPathRoundedSquare'
										className='h-5 w-5 text-white dark:text-white'
										color='white'
									/>
								</div>
								<p className='text-xs font-bold uppercase tracking-wider text-orange-50'>
									Reembolsado
								</p>
							</div>
							<div className='relative mt-4'>
								<h3 className='text-3xl font-extrabold tracking-tight text-white drop-shadow-sm'>
									{'$'}
									<AnimatedNumber value={stats.refundedTotal} />
								</h3>
								<p className='mt-1 text-xs font-medium text-orange-100'>
									Monto devuelto
								</p>
							</div>
						</div>

						{/* KPI: Promedio Mensual */}
						<div className='group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 p-5 text-white shadow-lg shadow-pink-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-pink-500/40 dark:from-pink-600 dark:to-rose-700'>
							<div className='relative flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
									<Icon
										icon='HeroCalculator'
										className='h-5 w-5 text-white dark:text-white'
										color='white'
									/>
								</div>
								<p className='text-xs font-bold uppercase tracking-wider text-pink-50'>
									Promedio Mes
								</p>
							</div>
							<div className='relative mt-4'>
								<h3 className='text-3xl font-extrabold tracking-tight text-white drop-shadow-sm'>
									{'$'}
									<AnimatedNumber value={stats.monthlyAvg} />
								</h3>
								<p className='mt-1 text-xs font-medium text-pink-100'>
									Ventas promedio al mes
								</p>
							</div>
						</div>

						{/* KPI: Proyección a 30 Días */}
						<div className='group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-5 text-white shadow-lg shadow-blue-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-blue-500/40 dark:from-blue-600 dark:to-cyan-700'>
							<div className='relative flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
									<Icon
										icon='HeroSparkles'
										className='h-5 w-5 text-white dark:text-white'
										color='white'
									/>
								</div>
								<p className='text-xs font-bold uppercase tracking-wider text-blue-50'>
									Proyección
								</p>
							</div>
							<div className='relative mt-4'>
								<h3 className='text-3xl font-extrabold tracking-tight text-white drop-shadow-sm'>
									{'$'}
									<AnimatedNumber value={stats.projectedTotal} />
								</h3>
								<p className='mt-1 text-xs font-medium text-blue-100'>
									Estimación (RL) a 30 días
								</p>
							</div>
						</div>
					</div>

					{/* Sección Principal del Gráfico */}
					<Card className='relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#121214]'>
						<CardHeader className='border-b border-zinc-100 bg-transparent px-6 py-6 dark:border-zinc-800 sm:px-8'>
							<div className='flex flex-wrap items-center justify-between gap-6'>
								<div className='flex flex-col gap-1'>
									<h2 className='text-xl font-bold tracking-tight text-zinc-900 dark:text-white'>
										Tendencia de Ingresos
									</h2>
									<div className='flex items-center gap-2'>
										<span className='relative flex h-2 w-2'>
											<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75'></span>
											<span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500'></span>
										</span>
										<p className='text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
											{filters.dateFrom || filters.dateTo
												? 'Rango temporal personalizado aplicado'
												: 'Vista inicial predeterminada a los últimos 30 días'}
										</p>
									</div>
								</div>
								<div className='shrink-0'>
									<div className='flex items-center gap-3'>
										<DashboardExportButton
											stats={stats}
											filteredResults={filteredResults}
											topCustomers={topCustomers}
											filters={filters}
										/>
										<ReportExportButton
											subsidiaryId={Number(currentSubsidiaryId ?? 0)}
											type='sales'
											filters={mapFilters(filters)}
										/>
									</div>
								</div>
							</div>
						</CardHeader>

						<CardBody className='relative p-4 sm:p-8'>
							<div className='min-h-[400px] w-full'>
								{filteredResults.length > 0 ? (
									<Chart
										type='area'
										height={420}
										series={chartSeries}
										options={chartOptions}
									/>
								) : (
									<div className='flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-[#18181b]'>
										<div className='mb-4 rounded-full bg-white p-4 shadow-sm dark:bg-zinc-900'>
											<Icon
												icon='HeroChartBar'
												className='h-8 w-8 text-zinc-400 dark:text-zinc-500'
											/>
										</div>
										<h4 className='text-base font-bold text-zinc-600 dark:text-zinc-300'>
											Sin datos en este periodo
										</h4>
										<p className='mt-1 max-w-sm text-center text-xs font-medium text-zinc-500'>
											Ajusta los filtros en la parte superior para visualizar
											las estadísticas de ventas y devoluciones.
										</p>
									</div>
								)}
							</div>
						</CardBody>
					</Card>

					{/* Sección Analítica Secundaria */}
					<div className='mt-6'>
						<SalesAnalytics data={filteredResults} />
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default SalesDashboard;
