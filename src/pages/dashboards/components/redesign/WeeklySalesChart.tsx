import React, { useMemo } from 'react';
import Chart from '@/components/Chart';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import useDarkMode from '@/hooks/useDarkMode';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';
import useDashboardTour from '@/hooks/tour/home/useDashboardTour';

/** Fila del reporte de ventas: según el modo, el backend nombra distinto la fecha y el monto. */
type TSaleRow = Record<string, unknown>;

interface IWeeklySalesSeries {
	name: string;
	data: number[];
}

interface WeeklySalesChartProps {
	dateRange: '7d' | '30d';
	setDateRange: (range: '7d' | '30d') => void;
	chartSeries: IWeeklySalesSeries[];
	chartCategories: string[];
	totalAmount: number;
	results: readonly TSaleRow[];
}

/** Primer campo con valor (el mismo criterio que `a || b`) que se puede escribir en el XML. */
const xmlFieldOf = (sale: TSaleRow, keys: readonly string[], fallback: string): string => {
	const value = keys.map((key) => sale[key]).find(Boolean);
	return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
};

const WeeklySalesChart: React.FC<WeeklySalesChartProps> = ({
	dateRange,
	setDateRange,
	chartSeries,
	chartCategories,
	totalAmount,
	results,
}) => {
	const { isDarkTheme } = useDarkMode();
	const { startTour } = useDashboardTour();

	const handleDownloadXml = () => {
		try {
			if (results.length === 0) {
				toast.warning('No hay datos para exportar');
				return;
			}

			let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<sales>\n';
			results.forEach((sale) => {
				xmlContent += `  <sale>\n`;
				xmlContent += `    <date>${xmlFieldOf(sale, ['sale_date', 'date'], 'N/A')}</date>\n`;
				xmlContent += `    <amount>${xmlFieldOf(sale, ['total_amount', 'amount'], '0')}</amount>\n`;
				xmlContent += `    <id>${xmlFieldOf(sale, ['id'], '')}</id>\n`;
				xmlContent += `  </sale>\n`;
			});
			xmlContent += '</sales>';

			const blob = new Blob([xmlContent], { type: 'application/xml' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `sales_report_${new Date().toISOString().split('T')[0]}.xml`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success('Reporte XML descargado');
		} catch {
			toast.error('Error al generar XML');
		}
	};

	// `Chart` vuelve a dibujar cuando cambia la identidad de `options`: sin memo, cada
	// render del dashboard reanimaría el gráfico.
	const chartOptions = useMemo<ApexCharts.ApexOptions>(
		() => ({
			chart: {
				type: 'area',
				fontFamily: 'inherit',
				toolbar: { show: false },
				background: 'transparent',
				animations: { enabled: true },
			},
			stroke: {
				width: 3,
				curve: 'smooth',
				colors: ['#22c55e'],
			},
			dataLabels: { enabled: false },
			xaxis: {
				categories: chartCategories,
				axisBorder: { show: false },
				axisTicks: { show: false },
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
					},
					formatter: (val) => {
						const d = new Date(val);
						// Show day/month. If 30 days, maybe show less labels? ApexCharts handles density usually.
						return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
					},
				},
			},
			yaxis: {
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
					},
					formatter: (val: number) =>
						`$${val > 1000 ? `${(val / 1000).toFixed(1)}k` : val}`,
				},
			},
			grid: {
				borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
				strokeDashArray: 4,
				yaxis: { lines: { show: true } },
				xaxis: { lines: { show: false } },
			},
			colors: ['#22c55e'],
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 0.5,
					opacityFrom: 0.2,
					opacityTo: 0.05,
					stops: [0, 100],
					colorStops: [
						{ offset: 0, color: '#22c55e', opacity: 0.2 },
						{ offset: 100, color: '#22c55e', opacity: 0 },
					],
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `$${val.toLocaleString('es-CL')}`,
				},
			},
		}),
		[chartCategories, isDarkTheme],
	);

	return (
		<>
			<Card className='h-full border-none shadow-xs'>
				<CardHeader className='flex flex-wrap items-center justify-between gap-4'>
					<CardHeaderChild>
						<div>
							<h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>
								Ventas
							</h3>
							<p className='text-xs text-gray-500'>
								{dateRange === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}
							</p>
						</div>
					</CardHeaderChild>
					<CardHeaderChild>
						<div className='flex items-center gap-2' id='weekly-sales-header'>
							<div className='flex rounded-md bg-gray-100 p-1 dark:bg-gray-800'>
								<button
									type='button'
									onClick={() => setDateRange('7d')}
									className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
										dateRange === '7d'
											? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
											: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
									}`}>
									7D
								</button>
								<button
									type='button'
									onClick={() => setDateRange('30d')}
									className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
										dateRange === '30d'
											? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
											: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
									}`}>
									30D
								</button>
							</div>
							<Button
								variant='outline'
								size='sm'
								onClick={handleDownloadXml}
								title='Descargar XML'
								className='dark:border-gray-700 dark:text-gray-300'>
								<Icon icon='HeroDocumentArrowDown' className='h-4 w-4' />
							</Button>
						</div>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='mb-4'>
						<span className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
							${totalAmount.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
						</span>
					</div>
					<Chart options={chartOptions} series={chartSeries} type='area' height={380} />
				</CardBody>
			</Card>
			<div className='fixed right-6 bottom-[50vh] z-50'>
				<button
					type='button'
					onClick={startTour}
					className='group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/30 bg-emerald-500/15 text-emerald-400 shadow-lg backdrop-blur-xs transition-all duration-300 hover:scale-110 hover:border-emerald-400/60 hover:shadow-emerald-500/25'
					title='Iniciar tour guiado'>
					<div className='absolute inset-2 animate-ping rounded-full bg-emerald-500 opacity-20' />
					<Icon icon='HeroQuestionMarkCircle' className='relative z-10 text-xl' />
					<span
						className='absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-lg'
						style={{ animationDuration: '2s' }}>
						?
					</span>
				</button>
			</div>
		</>
	);
};

export default WeeklySalesChart;
