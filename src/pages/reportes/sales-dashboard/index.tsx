import React, { useMemo } from 'react';
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
import ReportFilters from '../components/ReportFilters';

const apexToolbarMenuStyles = `
	.apexcharts-menu {
		background-color: #0f172a !important;
		border: 1px solid #334155 !important;
		box-shadow: 0 10px 30px rgba(0,0,0,0.35) !important;
	}
	.apexcharts-menu-item {
		color: #e2e8f0 !important;
	}
	.apexcharts-menu-item:hover {
		background: #1f2937 !important;
	}
	.apexcharts-menu-item.disabled {
		color: #64748b !important;
	}
`;

const SalesDashboard: React.FC = () => {
	const {
		filteredResults,
		chartSeries,
		chartCategories,
		stats,
		currentSubsidiaryId,
		filters,
		setFilters,
		mapFilters,
	} = useSalesDashboard();

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
				animations: { enabled: false },
			},
			stroke: {
				width: [3, 3],
				curve: 'smooth',
				colors: ['#22c55e', '#f97316'],
			},
			markers: {
				size: 0,
				strokeColors: ['#22c55e', '#f97316'],
				hover: { size: 5 },
			},
			dataLabels: { enabled: false },
			grid: {
				strokeDashArray: 4,
				borderColor: '#E5E7EB66',
				yaxis: { lines: { show: true } },
				xaxis: { lines: { show: false } },
			},
			xaxis: {
				type: 'datetime',
				categories: chartCategories,
				tickAmount: 6,
				labels: {
					style: { fontSize: '11px', colors: '#64748B' },
					datetimeFormatter: {
						year: 'yyyy',
						month: "MMM 'yy",
						day: 'dd MMM',
						hour: 'HH:mm',
					},
				},
				tooltip: { enabled: false },
				axisBorder: { show: false },
				axisTicks: { show: false },
			},
			yaxis: {
				labels: {
					style: { colors: '#64748B' },
					formatter: (val: number) =>
						`$${val.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
				},
			},
			legend: { position: 'top', horizontalAlign: 'left' },
			tooltip: {
				theme: 'dark',
				shared: true,
				intersect: false,
				x: { format: 'dd MMM yyyy' },
				y: { formatter: (val: number) => `$${val.toLocaleString('es-CL')}` },
			},
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 0.5,
					opacityFrom: 0.16,
					opacityTo: 0.01,
					stops: [0, 100],
					colorStops: [
						{ offset: 0, color: '#22c55e', opacity: 0.16 },
						{ offset: 100, color: '#22c55e', opacity: 0 },
					],
				},
			},
		}),
		[chartCategories],
	);

	return (
		<PageWrapper title='Reporte de Ventas'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroReceiptPercent' className='h-6 w-6 text-indigo-600' />
						<div className='flex flex-col items-start justify-start'>
							<Badge className='bg-transparent text-2xl font-bold text-zinc-800 dark:text-zinc-100'>
								Dashboard de Ventas
							</Badge>
							<p className='mt-1 text-zinc-500 dark:text-zinc-400'>
								Análisis financiero y control de devoluciones
							</p>
						</div>
					</div>
				</SubheaderLeft>
			</Subheader>
			<Container className='py-6'>
				<div className='flex flex-col gap-6'>
					<style>{apexToolbarMenuStyles}</style>

					<ReportFilters
						initial={filters}
						onApply={(f) => setFilters(f)}
						onReset={() => setFilters({})}
					/>

					<div>
						<Card className='h-full border-indigo-100 shadow-md dark:border-indigo-900/20'>
							<CardHeader className='border-b border-zinc-100 pb-4 dark:border-zinc-800'>
								<div className='flex flex-wrap items-center justify-between gap-4'>
									<div>
										<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
											Resumen General
										</h2>
										<p className='text-xs text-zinc-500'>
											Datos actualizados en tiempo real
										</p>
									</div>
									<ReportExportButton
										subsidiaryId={Number(currentSubsidiaryId ?? 0)}
										type='sales'
										filters={mapFilters(filters)}
									/>
								</div>
							</CardHeader>

							<CardBody className='space-y-6'>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									{/* Ventas Totales */}
									<Card className='rounded-2xl border border-emerald-200/70 bg-emerald-50/60 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-900/10'>
										<CardBody className='flex items-start gap-3 p-4'>
											<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-200'>
												<Icon
													icon='HeroCubeTransparent'
													className='h-5 w-5'
												/>
											</div>
											<div className='space-y-1'>
												<p className='text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-200'>
													Ventas Totales
												</p>
												<p className='text-2xl font-bold text-emerald-900 dark:text-white'>
													$
													{stats.total.toLocaleString('es-CL', {
														maximumFractionDigits: 0,
													})}
												</p>
												<p className='text-xs text-emerald-700/80 dark:text-emerald-200/80'>
													Ingresos acumulados del rango seleccionado
												</p>
											</div>
										</CardBody>
									</Card>

									{/* Ticket Promedio */}
									<Card className='rounded-2xl border border-indigo-200/70 bg-indigo-50/60 shadow-sm dark:border-indigo-800/50 dark:bg-indigo-900/10'>
										<CardBody className='flex items-start gap-3 p-4'>
											<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-800/60 dark:text-indigo-200'>
												<Icon
													icon='HeroChartBarSquare'
													className='h-5 w-5'
												/>
											</div>
											<div className='space-y-1'>
												<p className='text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-200'>
													Ticket Promedio
												</p>
												<p className='text-2xl font-bold text-indigo-900 dark:text-white'>
													$
													{stats.avg.toLocaleString('es-CL', {
														maximumFractionDigits: 0,
													})}
												</p>
												<p className='text-xs text-indigo-700/80 dark:text-indigo-200/80'>
													Promedio por orden en el periodo
												</p>
											</div>
										</CardBody>
									</Card>

									{/* Reembolsado */}
									<Card className='rounded-2xl border border-amber-200/70 bg-amber-50/60 shadow-sm dark:border-amber-800/50 dark:bg-amber-900/10'>
										<CardBody className='flex items-start gap-3 p-4'>
											<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-200'>
												<Icon
													icon='HeroArrowPathRoundedSquare'
													className='h-5 w-5'
												/>
											</div>
											<div className='space-y-1'>
												<p className='text-xs font-semibold uppercase text-amber-700 dark:text-amber-200'>
													Reembolsado
												</p>
												<p className='text-2xl font-bold text-amber-800 dark:text-amber-200'>
													$
													{stats.refundedTotal.toLocaleString('es-CL', {
														maximumFractionDigits: 0,
													})}
												</p>
												<p className='text-xs text-amber-700/80 dark:text-amber-200/80'>
													Monto total devuelto en el rango
												</p>
											</div>
										</CardBody>
									</Card>
								</div>

								<div className='relative z-0 mt-4 min-h-[350px] w-full'>
									{filteredResults.length > 0 ? (
										<Chart
											type='area'
											height={350}
											series={chartSeries}
											options={chartOptions}
										/>
									) : (
										<div className='flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-700'>
											<Icon
												icon='HeroChartBar'
												className='mb-2 h-12 w-12 opacity-50'
											/>
											<p>Sin datos para mostrar</p>
										</div>
									)}
								</div>
							</CardBody>
						</Card>

						<div className='relative z-0 mt-6'>
							<SalesAnalytics data={filteredResults} />
						</div>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default SalesDashboard;
