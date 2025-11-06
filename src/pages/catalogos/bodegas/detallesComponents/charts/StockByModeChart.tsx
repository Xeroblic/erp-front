import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Chart from '@/components/Chart';
import Icon from '@/components/icon/Icon';
import { ApexOptions } from 'apexcharts';
import useDarkMode from '@/hooks/useDarkMode';
import { IWarehouseProduct } from '@/interface/warehouse.interface';

interface StockByModeChartProps {
	products: IWarehouseProduct[];
}

/**
 * Gráfico de productos por modo de sincronización
 * Muestra la cantidad de productos en modo Manual vs Auto-Sync
 */
const StockByModeChart: React.FC<StockByModeChartProps> = ({ products }) => {
	const { isDarkTheme } = useDarkMode();

	const { manualCount, autoSyncCount } = useMemo(() => {
		const manual = products.filter((p) => !p.sync_stock).length;
		const autoSync = products.filter((p) => p.sync_stock).length;
		return { manualCount: manual, autoSyncCount: autoSync };
	}, [products]);

	const chartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'bar',
				toolbar: { show: false },
				background: 'transparent',
			},
			plotOptions: {
				bar: {
					horizontal: false,
					columnWidth: '55%',
					borderRadius: 8,
					dataLabels: {
						position: 'top',
					},
				},
			},
			dataLabels: {
				enabled: true,
				offsetY: -20,
				style: {
					fontSize: '12px',
					fontWeight: 600,
					colors: [isDarkTheme ? '#fff' : '#000'],
				},
			},
			xaxis: {
				categories: ['Manual', 'Auto-Sync'],
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
						fontSize: '12px',
					},
				},
				axisBorder: {
					show: false,
				},
				axisTicks: {
					show: false,
				},
			},
			yaxis: {
				title: {
					text: 'Cantidad de Productos',
					style: {
						color: isDarkTheme ? '#9ca3af' : '#6b7280',
						fontSize: '12px',
					},
				},
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
					},
					formatter: (val: number) => Math.floor(val).toString(),
				},
			},
			colors: ['#3b82f6', '#10b981'],
			grid: {
				borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
				strokeDashArray: 4,
				xaxis: {
					lines: {
						show: false,
					},
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `${val} productos`,
				},
			},
			legend: {
				show: false,
			},
		}),
		[isDarkTheme],
	);

	const series = [
		{
			name: 'Productos',
			data: [manualCount, autoSyncCount],
		},
	];

	const totalProducts = manualCount + autoSyncCount;

	return (
		<Card>
			<CardHeader className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroChartBar' className='size-5 text-blue-500' />
					<CardTitle>Productos por Modo</CardTitle>
				</div>
				<div className='text-sm text-zinc-500 dark:text-zinc-400'>
					Total: {totalProducts} productos
				</div>
			</CardHeader>
			<CardBody>
				<div className='flex flex-col gap-4'>
					<Chart
						series={series}
						options={chartOptions}
						type='bar'
						height={280}
						width='100%'
					/>

					<div className='grid grid-cols-2 gap-4 border-t pt-4 dark:border-zinc-800'>
						<div className='flex items-center gap-3'>
							<div className='size-3 rounded-full bg-blue-500' />
							<div>
								<div className='text-lg font-bold'>{manualCount}</div>
								<div className='text-sm text-zinc-500 dark:text-zinc-400'>
									Manual
								</div>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<div className='size-3 rounded-full bg-emerald-500' />
							<div>
								<div className='text-lg font-bold'>{autoSyncCount}</div>
								<div className='text-sm text-zinc-500 dark:text-zinc-400'>
									Auto-Sync
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default StockByModeChart;
