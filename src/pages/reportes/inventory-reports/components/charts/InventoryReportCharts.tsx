import React, { type ReactNode, useMemo } from 'react';
import type { ApexOptions } from 'apexcharts';
import Chart from '@/components/Chart';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import useDarkMode from '@/hooks/useDarkMode';
import type { TIcons } from '@/types/icons.type';
import { ESTADO_OPTIONS } from '@/pages/reportes/inventory-reports/types';
import type { IInventoryReportStats } from '@/pages/reportes/inventory-reports/utils';

/** Mismos tonos que las etiquetas de estado (Tailwind 500). */
const STATUS_HEX: Record<(typeof ESTADO_OPTIONS)[number]['value'], string> = {
	out: '#ef4444',
	critical: '#f59e0b',
	unconfigured: '#71717a',
	healthy: '#10b981',
};

const plural = (value: number, one: string, other: string): string =>
	`${value.toLocaleString('es-CL')} ${value === 1 ? one : other}`;

const ChartCard: React.FC<{
	icon: TIcons;
	title: string;
	summary: string;
	isEmpty: boolean;
	children: ReactNode;
}> = ({ icon, title, summary, isEmpty, children }) => (
	<Card className='h-full'>
		<CardHeader>
			<div className='flex items-center gap-2'>
				<Icon icon={icon} size='text-xl' />
				<CardTitle className='text-lg'>{title}</CardTitle>
			</div>
			<span className='text-sm text-zinc-500 dark:text-zinc-400'>{summary}</span>
		</CardHeader>
		<CardBody>
			{isEmpty ? (
				<div className='flex h-48 items-center justify-center text-center text-sm text-zinc-500'>
					No hay datos para graficar con estos filtros.
				</div>
			) : (
				children
			)}
		</CardBody>
	</Card>
);

/**
 * Gráficos de Estadísticas: estado del stock, stock por sucursal, antigüedad
 * y productos con más unidades. Usan el mismo `Chart` (ApexCharts) que
 * Bodegas y Ventas.
 */
const InventoryReportCharts: React.FC<{ stats: IInventoryReportStats }> = ({ stats }) => {
	const { isDarkTheme } = useDarkMode();
	const axisColor = isDarkTheme ? '#9ca3af' : '#6b7280';
	const gridColor = isDarkTheme ? '#374151' : '#e5e7eb';

	const base = useMemo<ApexOptions>(
		() => ({
			chart: { toolbar: { show: false }, background: 'transparent' },
			tooltip: { theme: isDarkTheme ? 'dark' : 'light' },
			grid: { borderColor: gridColor, strokeDashArray: 4 },
			legend: { labels: { colors: axisColor } },
			xaxis: { labels: { style: { colors: axisColor } } },
			yaxis: { labels: { style: { colors: axisColor } } },
		}),
		[isDarkTheme, axisColor, gridColor],
	);

	const statusTotal = ESTADO_OPTIONS.reduce(
		(total, option) => total + stats.statuses[option.value],
		0,
	);
	const statusOptions = useMemo<ApexOptions>(
		() => ({
			...base,
			labels: ESTADO_OPTIONS.map((option) => option.label),
			colors: ESTADO_OPTIONS.map((option) => STATUS_HEX[option.value]),
			legend: { position: 'bottom', labels: { colors: axisColor } },
			dataLabels: { enabled: true },
			stroke: { colors: [isDarkTheme ? '#18181b' : '#ffffff'] },
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: { formatter: (value: number) => plural(value, 'producto', 'productos') },
			},
		}),
		[base, axisColor, isDarkTheme],
	);

	const branchOptions = useMemo<ApexOptions>(
		() => ({
			...base,
			chart: { ...base.chart, stacked: true },
			plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
			colors: ['#10b981', '#f59e0b'],
			xaxis: {
				categories: stats.branches.map((branch) => branch.branch),
				labels: { style: { colors: axisColor } },
			},
			legend: { position: 'bottom', labels: { colors: axisColor } },
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: { formatter: (value: number) => plural(value, 'unidad', 'unidades') },
			},
		}),
		[base, stats.branches, axisColor, isDarkTheme],
	);

	const agingOptions = useMemo<ApexOptions>(
		() => ({
			...base,
			plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
			colors: ['#8b5cf6'],
			xaxis: {
				categories: stats.aging.map((bucket) => bucket.label),
				labels: { style: { colors: axisColor } },
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (value: number, { dataPointIndex }: { dataPointIndex: number }) =>
						`${plural(value, 'unidad', 'unidades')} en ${plural(
							stats.aging[dataPointIndex]?.products ?? 0,
							'producto',
							'productos',
						)}`,
				},
			},
		}),
		[base, stats.aging, axisColor, isDarkTheme],
	);

	const topOptions = useMemo<ApexOptions>(
		() => ({
			...base,
			plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '65%' } },
			colors: ['#3b82f6'],
			xaxis: {
				categories: stats.topProducts.map((product) => product.name),
				labels: { style: { colors: axisColor } },
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: { formatter: (value: number) => plural(value, 'unidad', 'unidades') },
			},
		}),
		[base, stats.topProducts, axisColor, isDarkTheme],
	);

	const agingUnits = stats.aging.reduce((total, bucket) => total + bucket.units, 0);
	const branchUnits = stats.branches.reduce(
		(total, branch) => total + branch.available + branch.unavailable,
		0,
	);

	return (
		<div className='grid gap-4 xl:grid-cols-2'>
			<ChartCard
				icon='HeroChartPie'
				title='Estado del stock'
				summary='Por producto y sucursal'
				isEmpty={statusTotal === 0}>
				<Chart
					type='donut'
					height={300}
					options={statusOptions}
					series={ESTADO_OPTIONS.map((option) => stats.statuses[option.value])}
				/>
			</ChartCard>
			<ChartCard
				icon='HeroBuildingStorefront'
				title='Stock por sucursal'
				summary={plural(branchUnits, 'unidad', 'unidades')}
				isEmpty={branchUnits === 0}>
				<Chart
					type='bar'
					height={Math.max(220, stats.branches.length * 56)}
					options={branchOptions}
					series={[
						{
							name: 'Disponible',
							data: stats.branches.map((branch) => branch.available),
						},
						{
							name: 'Reservado o no vendible',
							data: stats.branches.map((branch) => branch.unavailable),
						},
					]}
				/>
			</ChartCard>
			<ChartCard
				icon='HeroClock'
				title='Antigüedad del stock'
				summary='Días desde el último movimiento'
				isEmpty={agingUnits === 0}>
				<Chart
					type='bar'
					height={280}
					options={agingOptions}
					series={[{ name: 'Unidades', data: stats.aging.map((bucket) => bucket.units) }]}
				/>
			</ChartCard>
			<ChartCard
				icon='HeroArchiveBox'
				title='Productos con más unidades'
				summary={`Los ${stats.topProducts.length} primeros`}
				isEmpty={stats.topProducts.length === 0}>
				<Chart
					type='bar'
					height={Math.max(220, stats.topProducts.length * 36)}
					options={topOptions}
					series={[
						{
							name: 'Unidades',
							data: stats.topProducts.map((product) => product.units),
						},
					]}
				/>
			</ChartCard>
		</div>
	);
};

export default InventoryReportCharts;
