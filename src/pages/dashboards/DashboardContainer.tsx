import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import { useAppDispatch, useAppSelector } from '@/store';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

// Redesign Components
import StatsCard from './components/redesign/StatsCard';
import WeeklySalesChart from './components/redesign/WeeklySalesChart';
import TimelineWidget from './components/redesign/TimelineWidget';
import LatestProductsTable from './components/redesign/LatestProductsTable';
import { fetchDashboardStats } from '@/store/slices/technicalReviews/thunks/dashboardThunks';
// Remove sales stats thunk as endpoint is 404, we derive from reports
// import { fetchSalesStatistics, selectSalesStatistics } from '@/store/slices/sales/salesSlice';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';

import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Badge from '@/components/ui/Badge';
import FloatingInfo from '@/components/ui/FloatingInfo/FloatingInfo';
import { TutorialStep } from '@/components/types/TutorialModal';

const DashboardContainer: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.auth);
	const { branchId } = useCurrentBranch(); // Use hook
	const { dashboardStats } = useAppSelector((state) => state.technicalReviews);
	// const salesStats = useAppSelector(selectSalesStatistics);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const reportsResults = useAppSelector((state) => state.reports.results);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchDashboardStats({ branchId }));
		}
		if (subsidiaryId) {
			// Fetch simplified sales stats (using report results for last 30 days to calculate week locally)
			// This avoids the 404 on /sales/statistics
			const today = new Date();
			const start = new Date();
			start.setDate(today.getDate() - 30);
			const dateFrom = start.toISOString().split('T')[0];

			// We fetch here to ensure data is available for Stats Cards AND Chart
			dispatch(
				fetchReportResults({
					subsidiaryId: Number(subsidiaryId),
					type: 'sales',
					filters: { date_from: dateFrom },
				}),
			);
		}
	}, [dispatch, branchId, subsidiaryId]);

	// Calculate Weekly Stats from Reports
	const weeklyStats = useMemo(() => {
		if (!reportsResults) return { count: 0, amount: 0 };

		let data: any[] = [];
		if (Array.isArray(reportsResults)) data = reportsResults;
		else if (typeof reportsResults === 'object' && 'data' in reportsResults) {
			data = (reportsResults as any).data || [];
		}

		const today = new Date();
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(today.getDate() - 7);
		// Reset time part for accurate date comparison if needed, or keep precise.
		// For simplicity, let's keep precise as "last 7 days"

		let count = 0;
		let amount = 0;

		data.forEach((r: any) => {
			const rawDate = r?.sale_date || r?.date || r?.created_at;
			if (!rawDate) return;

			const d = new Date(rawDate);
			if (d >= oneWeekAgo && d <= today) {
				count++;
				// Check all possible amount fields as API might vary
				const rawAmt = r?.total_amount ?? r?.total ?? r?.amount ?? 0;
				const val = typeof rawAmt === 'string' ? parseFloat(rawAmt) : Number(rawAmt) || 0;
				amount += val;
			}
		});

		return { count, amount };
	}, [reportsResults]);

const dashboardTutorialSteps: TutorialStep[] = [
	{
		title: 'Panel de Control',
		description: `
			<p>Bienvenido al <strong>Centro de Operaciones</strong> de tu empresa. Desde aquí tendrás una visión completa del estado de tu negocio en tiempo real.</p>
			<br/>
			<p>Este panel te permite:</p>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li>Monitorear indicadores clave de rendimiento</li>
				<li>Identificar tendencias y oportunidades</li>
				<li>Acceder rápidamente a las operaciones pendientes</li>
			</ul>
		`,
		icon: 'HeroHome',
		image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
	},
	{
		title: 'Indicadores de Ventas',
		description: `
			<p>En la sección superior encontrarás los <strong>indicadores de ventas semanales</strong>:</p>
			<br/>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li><strong>Ventas Semana:</strong> Cantidad de órdenes procesadas en los últimos 7 días</li>
				<li><strong>Monto Semana:</strong> Ingresos totales generados en el período</li>
			</ul>
			<br/>
			<p>Haz clic en "Órdenes" o "Ingresos" para acceder al detalle completo de cada métrica.</p>
		`,
		icon: 'HeroShoppingBag',
		image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
	},
	{
		title: 'Estado de Revisiones Técnicas',
		description: `
			<p>Mantén el control de las <strong>revisiones técnicas</strong> con estos indicadores:</p>
			<br/>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li><strong>Pendientes:</strong> Equipos que requieren revisión inmediata</li>
				<li><strong>Aprobados:</strong> Total histórico de revisiones completadas exitosamente</li>
			</ul>
			<br/>
			<p>Accede directamente al módulo de revisiones desde los enlaces rápidos de cada tarjeta.</p>
		`,
		icon: 'HeroClipboardDocumentCheck',
		image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
	},
	{
		title: 'Gráfico de Ventas',
		description: `
			<p>Visualiza la <strong>evolución de tus ingresos</strong> con el gráfico interactivo de ventas.</p>
			<br/>
			<p>Funcionalidades disponibles:</p>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li><strong>7D / 30D:</strong> Alterna entre vista semanal y mensual</li>
				<li><strong>Exportar:</strong> Descarga los datos en formato de archivo para análisis externo</li>
				<li><strong>Monto total:</strong> Visualiza el acumulado del período seleccionado</li>
			</ul>
		`,
		icon: 'HeroChartBar',
		image: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=400&fit=crop',
	},
	{
		title: 'Últimos Ítems en Revisión',
		description: `
			<p>Gestiona las <strong>revisiones técnicas recientes</strong> desde esta sección.</p>
			<br/>
			<p>Acciones disponibles:</p>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li><strong>Revisar:</strong> Continúa con revisiones pendientes o en proceso</li>
				<li><strong>Etiqueta:</strong> Descarga e imprime etiquetas de identificación para equipos aprobados</li>
				<li><strong>Filtros:</strong> Visualiza por estado (Todos, Pendientes, Aprobados)</li>
			</ul>
		`,
		icon: 'HeroQueueList',
		image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop',
	},
	{
		title: 'Ventas Recientes y Productos',
		description: `
			<p>En la parte inferior encontrarás dos secciones adicionales:</p>
			<br/>
			<p><strong>Últimas Ventas:</strong></p>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li>Historial de ventas recientes con acceso rápido</li>
				<li>Descarga de etiquetas de envío para despacho</li>
			</ul>
			<br/>
			<p><strong>Productos Recientes:</strong></p>
			<ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
				<li>Últimos productos agregados al inventario</li>
				<li>Acceso directo para edición o visualización</li>
			</ul>
		`,
		icon: 'HeroArchiveBox',
		image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
	},
];

	return (
		<PageWrapper isProtectedRoute title='Dashboard' name='Dashboard General'>
			<Subheader className='border-b border-gray-200 dark:border-gray-700'>
				<SubheaderLeft>
					<div className='flex items-center space-x-4'>
						<Icon
							icon='HeroUserCircle'
							className='text-2xl text-gray-900 dark:text-white'
						/>
						<Badge
							typewriter
							className='text-2xl font-semibold text-gray-900 dark:text-white'>
							{`¡Hola, ${user?.first_name || 'Usuario'}!`}
						</Badge>
						<Badge className='text-sm text-gray-500 dark:text-gray-400'>
							Resumen de Operaciones
						</Badge>
					</div>
				</SubheaderLeft>
				{/* <SubheaderRight>
                    <div className='flex gap-2'>
                        <Button
                            variant='solid'
                            color='blue'
                            onClick={() => navigate('/technical-reviews/items')}
                            className='shadow-lg shadow-blue-500/30'
                        >
                            <div className='flex items-center gap-2'>
                                <Icon icon='HeroClipboardDocumentList' className='text-lg' />
                                <div className='text-left'>
                                    <div className='text-xs font-semibold'>Modo B: Items</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant='solid'
                            className='bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 border-none'
                            onClick={() => navigate('/technical-reviews/batches')}
                        >
                            <div className='flex items-center gap-2'>
                                <Icon icon='HeroQrCode' className='text-lg' />
                                <div className='text-left'>
                                    <div className='text-xs font-semibold'>Modo A: Lotes</div>
                                </div>
                            </div>
                        </Button>
                    </div>
                </SubheaderRight> */}
			</Subheader>

			<Container className='py-8'>
				<div className='flex flex-col gap-8'>
					{/* Row 1: Stats Cards (2 Sales, 2 Reviews) */}
					<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
						{/* Sales Stats - Week */}
						<StatsCard
							title='Ventas Semana'
							value={weeklyStats.count}
							icon='HeroShoppingBag'
							colorClass='bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
							subtitle='Órdenes'
						/>
						<StatsCard
							title='Monto Semana'
							value={weeklyStats.amount}
							icon='HeroCurrencyDollar'
							colorClass='bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
							subtitle='Ingresos'
							trend='up'
						/>
						{/* Review Stats */}
						<StatsCard
							title='Pendientes'
							value={dashboardStats.pending}
							icon='HeroClock'
							colorClass='bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
							subtitle='Por revisar'
						/>
						<StatsCard
							title='Aprobados'
							value={dashboardStats.approved}
							icon='HeroCheckBadge'
							colorClass='bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
							subtitle='Total Histórico'
						/>
					</div>

					<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
						<div className='lg:col-span-2'>
							<WeeklySalesChart />
						</div>
						<div className='lg:col-span-1'>
							<TimelineWidget />
						</div>
					</div>

					<div className='w-full'>
						<LatestProductsTable />
					</div>
				</div>
			</Container>

			{/* Tutorial FloatingInfo */}
			<FloatingInfo
				label='Dashboard General'
				value='Aprende a usar el sistema'
				tutorialSteps={dashboardTutorialSteps}
				tutorialTitle='Guía del Dashboard'
			/>
		</PageWrapper>
	);
};

export default DashboardContainer;
