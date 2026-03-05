import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchSales,
	selectSales,
	selectSalesLoading,
	downloadShippingLabel,
} from '@/store/slices/sales/salesSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Spinner from '@/components/ui/Spinner';

interface Props {}

const LatestSalesTimeline: React.FC<Props> = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { branchId } = useCurrentBranch();

	const currentUser = useAppSelector((state) => state.auth.user);
	const personalizacionUsuario = useAppSelector(
		(state) => state.personalizacion?.personalizacionUsuario,
	);

	const subsidiaryId =
		personalizacionUsuario?.subsidiary_id ??
		currentUser?.subsidiary?.id ??
		currentUser?.branch?.subsidiary?.id ??
		null;

	const sales = useAppSelector(selectSales);
	const loading = useAppSelector(selectSalesLoading).fetch;

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(
				fetchSales({
					subsidiaryId,
					page: 1,
					perPage: 10,
					filters: { with_customer: 1 },
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	const handleViewSale = (id: number) => {
		navigate(`/sales/${id}`);
	};

	return (
		<Card className='h-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
			<CardHeader
				id='timeline-sales-header'
				className='flex flex-col items-start justify-between gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:px-6'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
						<Icon icon='HeroCurrencyDollar' className='text-xl' />
					</div>
					<div>
						<h3 className='text-base font-bold leading-tight text-zinc-900 dark:text-zinc-100'>
							Últimas Ventas
						</h3>
						<p className='text-xs font-medium text-zinc-500'>Pedidos recientes</p>
					</div>
				</div>
			</CardHeader>
			<CardBody
				id='timeline-sales-list'
				className='no-scrollbar max-h-[500px] overflow-y-auto p-0'>
				{loading ? (
					<div className='flex flex-col items-center justify-center gap-2 py-12 text-sm text-zinc-500'>
						<Spinner nombre='Cargando ventas...' />
					</div>
				) : sales.length > 0 ? (
					<div className='flex flex-col p-3 sm:p-4'>
						{sales.slice(0, 10).map((sale, index) => {
							const isFirst = index === 0;
							const isLast = index === sales.length - 1 || index === 9;

							return (
								<div key={sale.id} className='group relative flex gap-3 sm:gap-4'>
									<div
										className={`absolute left-4 w-px -translate-x-1/2 bg-zinc-300 dark:bg-zinc-700 sm:left-5 ${
											isFirst
												? 'bottom-0 top-6'
												: isLast
													? 'top-0 h-6'
													: 'bottom-0 top-0'
										} `}
										style={{ zIndex: -1 }}></div>

									{/* Icon Column */}
									<div className='relative flex shrink-0 flex-col items-center'>
										<div className='mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-white dark:bg-blue-900/20 dark:text-blue-400 dark:ring-zinc-900 sm:h-10 sm:w-10'>
											<Icon
												icon='HeroShoppingBag'
												className='h-4 w-4 sm:h-5 sm:w-5'
											/>
										</div>
									</div>

									{/* Content Column - Fully responsive */}
									<div className='min-w-0 flex-1 pb-6 pt-1.5 group-last:pb-2 sm:pb-8'>
										<div className='flex flex-col gap-2.5'>
											{/* Customer name and status */}
											<div className='flex flex-col gap-1.5'>
												<span
													className='cursor-pointer truncate text-sm font-bold leading-tight text-zinc-900 hover:underline dark:text-zinc-100'
													onClick={() => handleViewSale(sale.id)}>
													{sale.customer?.name || 'Cliente sin nombre'}
												</span>
												<div className='flex flex-wrap items-center gap-1.5 text-xs'>
													<span className='font-mono text-[11px] text-zinc-400'>
														#{sale.sale_number}
													</span>
													<Badge
														variant='outline'
														color='emerald'
														className={`h-5 px-1.5 py-0 text-[10px] ${
															sale.status === 'completed'
																? 'border-emerald-700 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10'
																: sale.status === 'cancelled'
																	? 'border-red-700 bg-red-50 font-bold text-red-900 dark:bg-red-900/30 dark:text-white'
																	: 'border-blue-200 bg-blue-50 font-bold text-blue-600 dark:bg-blue-900/10'
														}`}>
														{(() => {
															const statusMap: Record<
																string,
																string
															> = {
																completed: 'Completado',
																processing: 'Procesando',
																cancelled: 'Cancelado',
																pending: 'Pendiente',
																shipped: 'Enviado',
																delivered: 'Entregado',
															};
															return (
																statusMap[sale.status] ||
																sale.status
															);
														})()}
													</Badge>
												</div>
											</div>

											{/* Amount, date and action button */}
											<div className='flex flex-wrap items-center justify-between gap-2'>
												<div className='flex flex-col'>
													<div className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
														$
														{Number(sale.total_amount).toLocaleString(
															'es-CL',
														)}
													</div>
													<div className='text-[10px] text-zinc-400'>
														{new Date(
															sale.sale_date,
														).toLocaleDateString()}
													</div>
												</div>

												<Button
													size='sm'
													variant='outline'
													color='zinc'
													className='h-7 shrink-0 px-2.5 text-[10px] font-medium'
													onClick={() =>
														dispatch(
															downloadShippingLabel({
																subsidiaryId: Number(subsidiaryId),
																id: sale.id,
															}),
														)
													}>
													<Icon
														icon='HeroArrowDownTray'
														className='h-3.5 w-3.5 sm:mr-1.5'
													/>
													<span className='hidden sm:inline'>
														Etiqueta
													</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center py-16 text-zinc-400'>
						<div className='mb-3 rounded-full bg-zinc-50 p-4 dark:bg-zinc-800/50'>
							<Icon icon='HeroInbox' className='h-8 w-8 text-zinc-300' />
						</div>
						<p className='text-sm font-medium'>No hay ventas recientes</p>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default LatestSalesTimeline;
