import React, { useMemo, useState } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Chart from '@/components/Chart';
import Icon from '@/components/icon/Icon';
import { ApexOptions } from 'apexcharts';
import useDarkMode from '@/hooks/useDarkMode';
import { IWarehouse } from '@/interface/warehouse.interface';
import Collapse from '@/components/utils/Collapse';
import Button from '@/components/ui/Button';

interface WarehousesChartsProps {
	warehouses: IWarehouse[];
}

/**
 * Componente con charts para analizar bodegas
 */
const WarehousesCharts: React.FC<WarehousesChartsProps> = ({ warehouses }) => {
	const { isDarkTheme } = useDarkMode();
	const [isOpen, setIsOpen] = useState(false);

	// Chart 1: Distribución por tipo de bodega
	const typeData = useMemo(() => {
		const typeCounts = new Map<string, number>();

		warehouses.forEach((w) => {
			const type = w.warehouse_type || 'Sin tipo';
			typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
		});

		return {
			labels: Array.from(typeCounts.keys()),
			values: Array.from(typeCounts.values()),
		};
	}, [warehouses]);

	// Chart 2: Estado de bodegas (activas/inactivas)
	const statusData = useMemo(() => {
		const active = warehouses.filter((w) => w.is_active).length;
		const inactive = warehouses.length - active;

		return {
			labels: ['Activas', 'Inactivas'],
			values: [active, inactive],
		};
	}, [warehouses]);

	// Chart 3: Capacidad máxima por bodega
	const capacityData = useMemo(() => {
		const sorted = [...warehouses]
			.filter((w) => w.maximum_capacity && w.maximum_capacity > 0)
			.sort((a, b) => (b.maximum_capacity || 0) - (a.maximum_capacity || 0));

		return {
			labels: sorted.map((w) => w.name),
			values: sorted.map((w) => w.maximum_capacity || 0),
		};
	}, [warehouses]);

	// Opciones para el chart de tipo (donut)
	const typeChartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'donut',
				toolbar: { show: false },
				background: 'transparent',
			},
			labels: typeData.labels,
			colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
			dataLabels: {
				enabled: true,
				formatter: (val: number) => `${val.toFixed(0)}%`,
				style: {
					fontSize: '13px',
					fontWeight: 700,
					colors: ['#fff'],
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
					width: 12,
					height: 12,
					radius: 12,
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
								fontSize: '13px',
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
							},
							total: {
								show: true,
								label: 'Total Bodegas',
								fontSize: '13px',
								fontWeight: 500,
								color: isDarkTheme ? '#9ca3af' : '#6b7280',
								formatter: () => `${warehouses.length}`,
							},
						},
					},
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `${val} bodega${val !== 1 ? 's' : ''}`,
				},
			},
		}),
		[isDarkTheme, typeData.labels, warehouses.length],
	);

	// Opciones para el chart de estado (donut)
	const statusChartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'donut',
				toolbar: { show: false },
				background: 'transparent',
			},
			labels: statusData.labels,
			colors: ['#10b981', '#ef4444'],
			dataLabels: {
				enabled: true,
				formatter: (val: number) => `${val.toFixed(0)}%`,
				style: {
					fontSize: '13px',
					fontWeight: 700,
					colors: ['#fff'],
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
					width: 12,
					height: 12,
					radius: 12,
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
							},
							total: {
								show: true,
								label: 'Total Bodegas',
								fontSize: '13px',
								fontWeight: 500,
								color: isDarkTheme ? '#9ca3af' : '#6b7280',
								formatter: () => `${warehouses.length}`,
							},
						},
					},
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `${val} bodega${val !== 1 ? 's' : ''}`,
				},
			},
		}),
		[isDarkTheme, statusData.labels, warehouses.length],
	);

	// Opciones para el chart de capacidad (barras horizontales)
	const capacityChartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'bar',
				toolbar: { show: false },
				background: 'transparent',
			},
			plotOptions: {
				bar: {
					horizontal: true,
					borderRadius: 6,
					barHeight: '70%',
					dataLabels: {
						position: 'center',
					},
				},
			},
			dataLabels: {
				enabled: false,
			},
			xaxis: {
				categories: capacityData.labels,
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
						fontSize: '11px',
					},
					formatter: (val: string) => `${val} u`,
				},
				axisBorder: {
					show: false,
				},
			},
			yaxis: {
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
						fontSize: '12px',
						fontWeight: 500,
					},
				},
			},
			colors: ['#3b82f6'],
			grid: {
				borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
				strokeDashArray: 4,
				xaxis: {
					lines: {
						show: true,
					},
				},
				yaxis: {
					lines: {
						show: false,
					},
				},
				padding: {
					left: 10,
					right: 20,
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `${val} unidades`,
				},
			},
			legend: {
				show: false,
			},
		}),
		[isDarkTheme, capacityData.labels],
	);

	if (warehouses.length === 0) {
		return null;
	}

	return (
		<Card className='mb-6'>
			<CardHeader className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroChartBarSquare' className='size-5 text-blue-500' />
					<CardTitle>Análisis de Bodegas</CardTitle>
				</div>
				<Button
					size='sm'
					variant='outline'
					icon={isOpen ? 'HeroChevronUp' : 'HeroChevronDown'}
					onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? 'Ocultar' : 'Mostrar'} gráficos
				</Button>
			</CardHeader>
			<Collapse isOpen={isOpen}>
				<CardBody>
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
						{/* Chart 1: Distribución por tipo */}
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Icon
										icon='HeroSquares2x2'
										className='size-4 text-violet-500'
									/>
									<CardTitle className='text-base'>
										Distribución por Tipo
									</CardTitle>
								</div>
							</CardHeader>
							<CardBody>
								<Chart
									series={typeData.values}
									options={typeChartOptions}
									type='donut'
									height={280}
									width='100%'
								/>
							</CardBody>
						</Card>

						{/* Chart 2: Estado de bodegas */}
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Icon
										icon='HeroCheckCircle'
										className='size-4 text-emerald-500'
									/>
									<CardTitle className='text-base'>Estado de Bodegas</CardTitle>
								</div>
							</CardHeader>
							<CardBody>
								<Chart
									series={statusData.values}
									options={statusChartOptions}
									type='donut'
									height={280}
									width='100%'
								/>
							</CardBody>
						</Card>

						{/* Chart 3: Capacidad máxima */}
						{capacityData.labels.length > 0 && (
							<Card className='lg:col-span-2 xl:col-span-1'>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<Icon icon='HeroScale' className='size-4 text-blue-500' />
										<CardTitle className='text-base'>
											Capacidad Máxima
										</CardTitle>
									</div>
								</CardHeader>
								<CardBody>
									<Chart
										series={[
											{
												name: 'Capacidad',
												data: capacityData.values,
											},
										]}
										options={capacityChartOptions}
										type='bar'
										height={Math.max(250, capacityData.labels.length * 60)}
										width='100%'
									/>
								</CardBody>
							</Card>
						)}
					</div>
				</CardBody>
			</Collapse>
		</Card>
	);
};

export default WarehousesCharts;
