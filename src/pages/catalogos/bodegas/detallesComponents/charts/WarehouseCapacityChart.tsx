import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Chart from '@/components/Chart';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { ApexOptions } from 'apexcharts';
import useDarkMode from '@/hooks/useDarkMode';

interface WarehouseCapacityChartProps {
	currentCapacity: number;
	maximumCapacity: number;
}

/**
 * Gráfico de distribución de capacidad de la bodega
 * Muestra la capacidad utilizada vs disponible en formato pie/donut
 */
const WarehouseCapacityChart: React.FC<WarehouseCapacityChartProps> = ({
	currentCapacity,
	maximumCapacity,
}) => {
	const { isDarkTheme } = useDarkMode();

	const availableCapacity = maximumCapacity - currentCapacity;
	const usagePercentage = ((currentCapacity / maximumCapacity) * 100).toFixed(1);

	const chartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'donut',
				toolbar: { show: false },
				background: 'transparent',
			},
			labels: ['Utilizada', 'Disponible'],
			colors: ['#10b981', '#3b82f6'],
			dataLabels: {
				enabled: true,
				formatter: (val: number) => `${val.toFixed(1)}%`,
				style: {
					fontSize: '13px',
					fontWeight: 700,
					colors: ['#fff'],
				},
				dropShadow: {
					enabled: false,
				},
			},
			legend: {
				show: true,
				position: 'bottom',
				fontSize: '13px',
				fontWeight: 500,
				labels: {
					colors: isDarkTheme ? '#d1d5db' : '#374151',
				},
				markers: {
					size: 10,             // reemplaza width/height
					strokeWidth: 0,       // no quieres borde
					shape: 'circle',      // mantiene tu diseño original
				},
			},
			stroke: {
				width: 3,
				colors: [isDarkTheme ? '#1f2937' : '#fff'],
			},
			plotOptions: {
				pie: {
					donut: {
						size: '70%',
						labels: {
							show: true,
							name: {
								show: true,
								fontSize: '14px',
								fontWeight: 500,
								color: isDarkTheme ? '#9ca3af' : '#6b7280',
								offsetY: -5,
							},
							value: {
								show: true,
								fontSize: '32px',
								fontWeight: 700,
								color: isDarkTheme ? '#fff' : '#000',
								offsetY: 5,
								formatter: (val: string) => `${val}`,
							},
							total: {
								show: true,
								label: 'Capacidad Total',
								fontSize: '13px',
								fontWeight: 500,
								color: isDarkTheme ? '#9ca3af' : '#6b7280',
								formatter: () => `${maximumCapacity} u`,
							},
						},
					},
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `${val} unidades`,
				},
			},
		}),
		[isDarkTheme, maximumCapacity],
	);

	const series = [currentCapacity, availableCapacity];

	// Determinar color del badge según el porcentaje de uso
	const getBadgeColor = () => {
		const usage = parseFloat(usagePercentage);
		if (usage >= 90) return 'red';
		if (usage >= 70) return 'amber';
		return 'emerald';
	};

	return (
		<Card>
			<CardHeader className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroChartPie' className='size-5 text-emerald-500' />
					<CardTitle>Distribución de Capacidad</CardTitle>
				</div>
				<Badge color={getBadgeColor()} variant='outline'>
					{usagePercentage}% Utilizado
				</Badge>
			</CardHeader>
			<CardBody>
				<div className='flex flex-col gap-4'>
					<Chart
						series={series}
						options={chartOptions}
						type='donut'
						height={280}
						width='100%'
					/>

					<div className='grid grid-cols-2 gap-4 border-t pt-4 dark:border-zinc-800'>
						<div className='text-center'>
							<div className='text-2xl font-bold text-emerald-500'>
								{currentCapacity}
							</div>
							<div className='text-sm text-zinc-500 dark:text-zinc-400'>
								Utilizada
							</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-blue-500'>
								{availableCapacity}
							</div>
							<div className='text-sm text-zinc-500 dark:text-zinc-400'>
								Disponible
							</div>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default WarehouseCapacityChart;
