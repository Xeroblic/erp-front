import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import { useAppDispatch, useAppSelector } from '@/store';
import Icon from '@/components/icon/Icon';

// Redesign Components
import StatsCard from './components/redesign/StatsCard';
import WeeklySalesChart from './components/redesign/WeeklySalesChart';
import TimelineWidget from './components/redesign/TimelineWidget';
import LatestProductsTable from './components/redesign/LatestProductsTable';
import { fetchDashboardStats } from '@/store/slices/technicalReviews/thunks/dashboardThunks';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import { selectSalesResults } from '@/store/slices/reports/reportSlice';
import { readSessionItem, writeSessionItem } from '@/utils/sessionStorage.util';

import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Badge from '@/components/ui/Badge';
import useDashboardTour from '@/hooks/tour/home/useDashboardTour';
import Tabs, { Tab } from '@/components/ui/Tabs';
import QuickLinks from './components/redesign/QuickLinks';

type TSaleRow = Record<string, unknown>;

/** Monto de una venta: el reporte lo trae como número o texto según el modo. */
const saleAmountOf = (row: TSaleRow): number => {
	const raw = row.total_amount ?? row.total ?? row.amount ?? 0;
	const value = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
	return Number.isFinite(value) ? value : 0;
};

/** Fecha de una venta, del primer campo que la traiga y sea válida. */
const saleDateOf = (row: TSaleRow): Date | null => {
	const raw = [
		row.sale_date,
		row.date,
		row.created_at,
		row.updated_at,
		row.createdAt,
		row.period,
		row.fecha,
	].find((value) => typeof value === 'string' && value !== '');
	if (typeof raw !== 'string') return null;
	const parsed = new Date(raw);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Llave para la caché de columnas
const SESSION_COLUMNS_KEY = 'dashboard_quicklinks_columns';

const DashboardContainer: React.FC = () => {
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);
	const { branchId } = useCurrentBranch();
	const { dashboardStats } = useAppSelector((state) => state.technicalReviews);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { data: salesRows } = useAppSelector((state) =>
		selectSalesResults(state, 'dashboard', subsidiaryId),
	);
	const { startTour } = useDashboardTour();

	const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
	const [activeTab, setActiveTab] = useState('quick-links');

	// --- ESTADO DE COLUMNAS (Subido desde QuickLinks) ---
	const [columnCount, setColumnCount] = useState<number>(() => {
		const savedCols = readSessionItem(SESSION_COLUMNS_KEY);
		return savedCols ? parseInt(savedCols, 10) : 3;
	});

	const handleColumnCountChange = (cols: number) => {
		setColumnCount(cols);
		writeSessionItem(SESSION_COLUMNS_KEY, cols.toString());
	};
	// -----------------------------------------------------

	useEffect(() => {
		if (branchId) {
			dispatch(fetchDashboardStats({ branchId }));
		}
	}, [dispatch, branchId]);

	// Al cambiar de filial o salir de Inicio se cancela la consulta en curso.
	useEffect(() => {
		if (!subsidiaryId) return undefined;
		const start = new Date();
		start.setDate(start.getDate() - 30);
		const request = dispatch(
			fetchReportResults({
				consumer: 'dashboard',
				subsidiaryId: Number(subsidiaryId),
				type: 'sales',
				filters: { date_from: start.toISOString().split('T')[0] },
			}),
		);
		return () => request.abort();
	}, [dispatch, subsidiaryId]);

	const chartResults = useMemo<TSaleRow[]>(() => salesRows ?? [], [salesRows]);

	const weeklyStats = useMemo(() => {
		const today = new Date();
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(today.getDate() - 7);

		return chartResults.reduce<{ count: number; amount: number }>(
			(stats, row) => {
				const date = saleDateOf(row);
				if (!date || date < oneWeekAgo || date > today) return stats;
				return { count: stats.count + 1, amount: stats.amount + saleAmountOf(row) };
			},
			{ count: 0, amount: 0 },
		);
	}, [chartResults]);

	const { chartSeries, chartCategories, totalAmount } = useMemo(() => {
		const dateMap = new Map<string, number>();
		const today = new Date();
		const days = dateRange === '7d' ? 7 : 30;
		const categories: string[] = [];

		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			const key = d.toISOString().split('T')[0];
			categories.push(key);
			dateMap.set(key, 0);
		}

		let total = 0;

		chartResults.forEach((row) => {
			const date = saleDateOf(row);
			if (!date) return;
			const key = date.toISOString().split('T')[0];
			if (!dateMap.has(key)) return;
			const amount = saleAmountOf(row);
			dateMap.set(key, (dateMap.get(key) || 0) + amount);
			total += amount;
		});

		const dataSales = categories.map((key) => dateMap.get(key) || 0);

		return {
			chartSeries: [{ name: 'Ventas', data: dataSales }],
			chartCategories: categories,
			totalAmount: total,
		};
	}, [chartResults, dateRange]);

	return (
		<PageWrapper isProtectedRoute title='Dashboard' name='Dashboard General'>
			<Subheader
				id='dashboard-header'
				className='flex min-h-[60px] items-center justify-center border-b border-gray-200 dark:border-gray-700'>
				<SubheaderLeft>
					<div className='flex items-center space-x-4'>
						<Icon
							icon='HeroUserCircle'
							className='text-2xl text-gray-900 dark:text-white'
						/>
						<div className='min-w-[220px] shrink-0'>
							<Badge
								typewriter
								className='text-2xl font-semibold text-gray-900 dark:text-white'>
								{user?.first_name
									? `¡Hola, ${user.first_name}!`
									: '¡Hola, Usuario!'}
							</Badge>
						</div>

						<Badge className='text-sm text-gray-500 dark:text-gray-400'>
							Resumen de Operaciones
						</Badge>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container className='py-4'>
				{/* Contenedor relativo para posicionar el selector al lado de las tabs */}
				<div className='relative w-full'>
					{/* Selector de columnas visible solo si la tab activa es 'quick-links' */}
					{activeTab === 'quick-links' && (
						<div className='absolute top-0 right-0 z-10 mr-4 flex h-14 items-center gap-3'>
							<span className='hidden text-sm font-medium text-gray-500 sm:block dark:text-gray-400'>
								Diseño:
							</span>
							<div className='flex rounded-lg border border-gray-200 bg-white p-1 shadow-xs dark:border-gray-700 dark:bg-gray-800'>
								{[1, 2, 3, 4].map((num) => (
									<button
										key={num}
										onClick={() => handleColumnCountChange(num)}
										className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold transition-all duration-200 ${
											columnCount === num
												? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
												: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
										}`}
										title={`${num} Columna${num > 1 ? 's' : ''}`}>
										{num}
									</button>
								))}
							</div>
						</div>
					)}

					<Tabs activeTab={activeTab} onTabChange={setActiveTab} variant='pills'>
						<Tab id='quick-links' text='Enlaces Rápidos' icon='HeroLink'>
							<div className='mt-6'>
								{/* Pasamos el state columnCount como prop */}
								<QuickLinks columnCount={columnCount} />
							</div>
						</Tab>
						<Tab id='dashboard' text='Resumen de Operaciones' icon='HeroChartPie'>
							<div className='mt-6 flex flex-col gap-8'>
								<div
									id='dashboard-stats'
									className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
									<div id='dashboard-stats-sales-week'>
										<StatsCard
											title='Ventas Semana'
											value={weeklyStats.count}
											icon='HeroShoppingBag'
											colorClass='bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
											subtitle='Órdenes'
										/>
									</div>
									<div id='dashboard-stats-sales-weekend'>
										<StatsCard
											title='Monto Semana'
											value={totalAmount}
											icon='HeroCurrencyDollar'
											colorClass='bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
											subtitle='Ingresos'
											trend='up'
										/>
									</div>
									<div id='dashboard-stats-pending'>
										<StatsCard
											title='Pendientes'
											value={dashboardStats.pending}
											icon='HeroClock'
											colorClass='bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
											subtitle='Por revisar'
										/>
									</div>
									<div id='dashboard-stats-reviews-aproved'>
										<StatsCard
											title='Aprobados'
											value={dashboardStats.approved}
											icon='HeroCheckBadge'
											colorClass='bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
											subtitle='Total Histórico'
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
									<div id='dashboard-chart' className='lg:col-span-2'>
										<WeeklySalesChart
											dateRange={dateRange}
											setDateRange={setDateRange}
											chartSeries={chartSeries}
											chartCategories={chartCategories}
											totalAmount={totalAmount}
											results={chartResults}
										/>
									</div>
									<div id='dashboard-timeline' className='lg:col-span-1'>
										<TimelineWidget />
									</div>
								</div>

								<div id='dashboard-products' className='w-full'>
									<LatestProductsTable />
								</div>
							</div>
						</Tab>
					</Tabs>
				</div>
			</Container>

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
		</PageWrapper>
	);
};

export default DashboardContainer;
