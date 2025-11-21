import React, { useMemo } from 'react';
import Chart from '@/components/Chart';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface Props {
	data: any[];
}

const SalesAnalytics: React.FC<Props> = ({ data }) => {
	// 🔥 LÓGICA DE EXTRACCIÓN BLINDADA
	const processedData = useMemo(() => {
		return data.map((r) => {
			const rawAmt = r.total_amount ?? r.total ?? r.amount ?? r.monto ?? 0;
			const amount =
				typeof rawAmt === 'string' ? parseFloat(rawAmt) : Number(rawAmt) || 0;

			let customerName = 'Cliente Anónimo';
			if (typeof r.customer === 'string') {
				customerName = r.customer;
			} else if (r.customer && typeof r.customer === 'object') {
				customerName =
					r.customer.billing_company ||
					r.customer.contact_name ||
					r.customer.name ||
					'Cliente Anónimo';
			} else if (r.billing_snapshot) {
				customerName = `${r.billing_snapshot.first_name} ${r.billing_snapshot.last_name}`;
			}

			const dateRaw = r.sale_date || r.date || r.created_at;

			return {
				...r,
				_amount: amount,
				_customerName: customerName,
				_date: dateRaw,
			};
		});
	}, [data]);

	// 1. STATUS DATA
	const statusData = useMemo(() => {
		const counts: Record<string, number> = {};
		processedData.forEach((r) => {
			const rawStatus = String(r.status || 'Desconocido');
			const status =
				rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/_/g, ' ');
			counts[status] = (counts[status] || 0) + 1;
		});
		return {
			labels: Object.keys(counts),
			series: Object.values(counts),
		};
	}, [processedData]);

	// 2. TOP CLIENTES
	const topCustomers = useMemo(() => {
		const customerMap = new Map<string, number>();
		processedData.forEach((r) => {
			if (r.status === 'cancelled' || r.status === 'canceled') return;
			const name = r._customerName.trim() || 'Desconocido';
			customerMap.set(name, (customerMap.get(name) || 0) + r._amount);
		});
		const sorted = Array.from(customerMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
		return {
			categories: sorted.map(([name]) =>
				name.length > 15 ? name.substring(0, 15) + '...' : name,
			),
			data: sorted.map(([, amount]) => amount),
		};
	}, [processedData]);

	// 3. MENSUAL
	const monthlyData = useMemo(() => {
		const timeData: {
			key: string;
			label: string;
			amount: number;
			time: number;
		}[] = [];
		processedData.forEach((r) => {
			if (!r._date) return;
			const d = new Date(r._date);
			if (isNaN(d.getTime())) return;
			const monthNames = [
				'Ene',
				'Feb',
				'Mar',
				'Abr',
				'May',
				'Jun',
				'Jul',
				'Ago',
				'Sep',
				'Oct',
				'Nov',
				'Dic',
			];
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
			const existing = timeData.find((t) => t.key === key);
			if (existing) {
				existing.amount += r._amount;
			} else {
				timeData.push({ key, label, amount: r._amount, time: d.getTime() });
			}
		});
		timeData.sort((a, b) => a.time - b.time);
		return {
			categories: timeData.map((t) => t.label),
			data: timeData.map((t) => t.amount),
		};
	}, [processedData]);

	return (
		<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
			{/* 1. ESTADO DE ÓRDENES (Tema: Emerald/Green) */}
			<Card className='h-full border border-emerald-100 shadow-sm dark:border-emerald-900/30'>
				<CardHeader className='border-b border-emerald-100 pb-3 dark:border-emerald-900/30'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'>
								<Icon icon='DuoChartPie' className='h-6 w-6' />
							</div>
							<Badge
								variant='outline'
								className='border-emerald-200 text-base font-bold text-emerald-800 dark:border-emerald-800 dark:text-emerald-100'>
								Estado de Órdenes
							</Badge>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<Chart
						type='donut'
						height={300}
						series={statusData.series}
						options={{
							labels: statusData.labels,
							colors: [
								'#10B981', // Emerald
								'#F59E0B', // Amber
								'#EF4444', // Red
								'#6366F1', // Indigo
								'#8B5CF6', // Violet
							],
							legend: { position: 'bottom', fontSize: '11px' },
							plotOptions: { pie: { donut: { size: '65%' } } },
							dataLabels: { enabled: false },
							stroke: { show: false },
							tooltip: {
								theme: 'dark',
								y: { formatter: (val: number) => `${val} órdenes` },
							},
						}}
					/>
				</CardBody>
			</Card>

			{/* 2. TOP CLIENTES (Tema: Violet/Purple) */}
			<Card className='h-full border border-violet-100 shadow-sm dark:border-violet-900/30'>
				<CardHeader className='border-b border-violet-100 pb-3 dark:border-violet-900/30'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400'>
								<Icon icon='DuoCrown' className='h-6 w-6' />
							</div>
							<Badge
								variant='outline'
								className='border-violet-200 text-base font-bold text-violet-800 dark:border-violet-800 dark:text-violet-100'>
								Top 5 Clientes
							</Badge>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<Chart
						type='bar'
						height={300}
						series={[{ name: 'Total', data: topCustomers.data }]}
						options={{
							plotOptions: {
								bar: {
									horizontal: true,
									borderRadius: 4,
									barHeight: '60%',
									distributed: true,
								},
							},
							colors: [
								'#4338ca', // Indigo 700
								'#4f46e5', // Indigo 600
								'#6366f1', // Indigo 500
								'#818cf8', // Indigo 400
								'#a5b4fc', // Indigo 300
							],
							xaxis: {
								categories: topCustomers.categories,
								labels: {
									style: { colors: '#64748B', fontSize: '10px' },
									formatter: (val: number | string): string => {
										const numVal = Number(val);
										if (isNaN(numVal)) return String(val);
										if (numVal >= 1000000)
											return `$${(numVal / 1000000).toFixed(1)}M`;
										if (numVal >= 1000)
											return `$${(numVal / 1000).toFixed(0)}K`;
										return `$${numVal}`;
									},
								},
							},
							yaxis: {
								labels: {
									style: {
										colors: '#64748B',
										fontSize: '11px',
										fontWeight: 600,
									},
									maxWidth: 120,
								},
							},
							grid: { show: false },
							legend: { show: false },
							tooltip: {
								theme: 'dark',
								y: {
									formatter: (val: number) =>
										`$${val.toLocaleString('es-CL')}`,
								},
							},
						}}
					/>
				</CardBody>
			</Card>

			{/* 3. HISTORIAL MENSUAL (Tema: Blue/Sky) */}
			<Card className='h-full border border-blue-100 shadow-sm dark:border-blue-900/30'>
				<CardHeader className='border-b border-blue-100 pb-3 dark:border-blue-900/30'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400'>
								<Icon icon='DuoTimeSchedule' className='h-6 w-6' />
							</div>
							<Badge
								variant='outline'
								className='border-blue-200 text-base font-bold text-blue-800 dark:border-blue-800 dark:text-blue-100'>
								Historial Mensual
							</Badge>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<Chart
						type='bar'
						height={300}
						series={[{ name: 'Ventas', data: monthlyData.data }]}
						options={{
							plotOptions: {
								bar: {
									borderRadius: 2,
									columnWidth: '60%',
								},
							},
							colors: ['#3B82F6'], // Blue 500
							xaxis: {
								categories: monthlyData.categories,
								labels: {
									style: { colors: '#64748B', fontSize: '10px' },
									rotate: -45,
									trim: true,
								},
							},
							yaxis: {
								labels: {
									style: { colors: '#64748B', fontSize: '10px' },
									// FIX: Formatter con tipo correcto
									formatter: (val: number) => {
										if (val >= 1000000)
											return `$${(val / 1000000).toFixed(0)}M`;
										return `$${(val / 1000).toFixed(0)}K`;
									},
								},
							},
							grid: { borderColor: '#E5E7EB55', strokeDashArray: 4 },
							tooltip: {
								theme: 'dark',
								y: {
									formatter: (val: number) =>
										`$${val.toLocaleString('es-CL')}`,
								},
							},
						}}
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default SalesAnalytics;
