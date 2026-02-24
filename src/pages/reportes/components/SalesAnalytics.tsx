import React, { useMemo, useEffect, useRef } from 'react';
import Chart from '@/components/Chart';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import gsap from 'gsap';
import type { SaleRecord } from '../types';

interface Props {
	data: SaleRecord[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractAmount = (r: SaleRecord): number => {
	const raw = r.total_amount ?? (r as unknown as { total?: string | number }).total ?? 0;
	return typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
};

const extractCustomerName = (r: SaleRecord): string => {
	if (typeof r.customer === 'string') return r.customer;
	if (r.customer && typeof r.customer === 'object') {
		return (
			r.customer.billing_company ||
			r.customer.contact_name ||
			r.customer.name ||
			'Cliente Anónimo'
		);
	}
	if (r.billing_snapshot) {
		return `${r.billing_snapshot.first_name ?? ''} ${r.billing_snapshot.last_name ?? ''}`.trim();
	}
	return r.customer_name || 'Cliente Anónimo';
};

// ─── Component ───────────────────────────────────────────────────────────────

const SalesAnalytics: React.FC<Props> = ({ data }) => {
	const processedData = useMemo(() => {
		return data.map((r) => ({
			...r,
			_amount: extractAmount(r),
			_customerName: extractCustomerName(r),
			_date: r.sale_date || r.date || r.created_at || r.updated_at || null,
		}));
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
				name.length > 15 ? `${name.substring(0, 15)}...` : name,
			),
			data: sorted.map(([, amount]) => amount),
		};
	}, [processedData]);

	// 3. MENSUAL
	const monthlyData = useMemo(() => {
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
		const timeData: { key: string; label: string; amount: number; time: number }[] = [];

		processedData.forEach((r) => {
			if (!r._date) return;
			const d = new Date(r._date);
			if (isNaN(d.getTime())) return;
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

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (containerRef.current) {
			gsap.fromTo(
				containerRef.current.children,
				{ y: 50, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					stagger: 0.15,
					duration: 0.8,
					ease: 'power3.out',
					delay: 0.3,
					onComplete: () => {
						// Forzar re-render de las métricas de ApexCharts que dependen del BoundingClientRect visual
						window.dispatchEvent(new Event('resize'));
					},
				},
			);
		}
	}, []);

	return (
		<div ref={containerRef} className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
			{/* 1. ESTADO DE ÓRDENES */}
			<Card className='h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#121214]'>
				<CardHeader className='border-b border-zinc-100 bg-transparent px-6 py-5 dark:border-zinc-800'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400'>
								<Icon icon='DuoChartPie' className='h-6 w-6' />
							</div>
							<h3 className='text-base font-bold text-zinc-900 dark:text-white'>
								Estado de Órdenes
							</h3>
						</div>
					</div>
				</CardHeader>
				<CardBody className='p-6'>
					<Chart
						type='donut'
						height={320}
						series={statusData.series}
						options={{
							labels: statusData.labels,
							colors: ['#2dd4bf', '#fbbf24', '#f43f5e', '#818cf8', '#a78bfa'],
							legend: {
								position: 'bottom',
								fontSize: '12px',
								labels: { colors: '#9ca3af' },
							},
							plotOptions: { pie: { donut: { size: '70%' }, expandOnClick: false } },
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

			{/* 2. TOP CLIENTES */}
			<Card className='h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#121214]'>
				<CardHeader className='border-b border-zinc-100 bg-transparent px-6 py-5 dark:border-zinc-800'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'>
								<Icon icon='DuoCrown' className='h-6 w-6' />
							</div>
							<h3 className='text-base font-bold text-zinc-900 dark:text-white'>
								Top 5 Clientes
							</h3>
						</div>
					</div>
				</CardHeader>
				<CardBody className='p-6'>
					<Chart
						type='bar'
						height={320}
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
							colors: ['#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'],
							xaxis: {
								categories: topCustomers.categories,
								labels: {
									style: { colors: '#64748B', fontSize: '10px' },
									formatter: (val: string | number): string => {
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
									style: { colors: '#64748B', fontSize: '11px', fontWeight: 600 },
									maxWidth: 120,
								},
							},
							grid: { show: false },
							legend: { show: false },
							tooltip: {
								theme: 'dark',
								y: {
									formatter: (val: number) => `$${val.toLocaleString('es-CL')}`,
								},
							},
						}}
					/>
				</CardBody>
			</Card>

			{/* 3. HISTORIAL MENSUAL */}
			<Card className='h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#121214] md:col-span-2 xl:col-span-1'>
				<CardHeader className='border-b border-zinc-100 bg-transparent px-6 py-5 dark:border-zinc-800'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400'>
								<Icon icon='DuoTimeSchedule' className='h-6 w-6' />
							</div>
							<h3 className='text-base font-bold text-zinc-900 dark:text-white'>
								Historial Mensual
							</h3>
						</div>
					</div>
				</CardHeader>
				<CardBody className='p-6'>
					<Chart
						type='bar'
						height={320}
						series={[{ name: 'Ventas', data: monthlyData.data }]}
						options={{
							plotOptions: { bar: { borderRadius: 2, columnWidth: '60%' } },
							colors: ['#3B82F6'],
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
									formatter: (val: number) => `$${val.toLocaleString('es-CL')}`,
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
