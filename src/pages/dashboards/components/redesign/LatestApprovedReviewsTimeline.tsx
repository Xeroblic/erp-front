import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchItems } from '@/store/slices/technicalReviews/thunks/itemsThunks';
const PrintLabel = React.lazy(
	() => import('@/pages/technical-reviews/components/items/PrintLabel'),
);
import { IItem } from '@/interface/technicalReviews.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Spinner from '@/components/ui/Spinner';

type FilterType = 'all' | 'pending' | 'approved';

interface Props {}

const LatestApprovedReviewsTimeline: React.FC<Props> = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { branchId } = useCurrentBranch();
	const { items, itemsLoading } = useAppSelector((state) => state.technicalReviews);

	const [itemToPrint, setItemToPrint] = useState<IItem | null>(null);
	const [isPrintOpen, setIsPrintOpen] = useState(false);
	const [filter, setFilter] = useState<FilterType>('all');

	useEffect(() => {
		if (branchId) {
			const params: any = {
				page: 1,
				per_page: 10,
			};

			if (filter === 'approved') {
				params.review_status = 'approved';
			} else if (filter === 'pending') {
				params.review_status = 'in_review';
			}

			dispatch(
				fetchItems({
					branchId,
					params,
				}),
			);
		}
	}, [dispatch, branchId, filter]);

	const handlePrint = (item: IItem) => {
		setItemToPrint(item);
		setIsPrintOpen(true);
	};

	const handleReview = (item: IItem) => {
		const batchId = item.batch_id || item.batch?.id;
		if (batchId) {
			navigate(`/technical-reviews/batches/${batchId}/items/${item.id}`);
		} else {
			console.error('No batch_id found for item', item);
		}
	};

	const renderAction = (item: IItem) => {
		const isApproved =
			(typeof item.review_status === 'object'
				? (item.review_status as any).value
				: item.review_status) === 'approved';

		if (isApproved) {
			return (
				<Button
					size='sm'
					variant='outline'
					color='zinc'
					className='h-7 shrink-0 px-2.5 text-[10px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800'
					onClick={() => handlePrint(item)}>
					<Icon icon='HeroPrinter' className='h-3.5 w-3.5 text-zinc-500 sm:mr-1.5' />
					<span className='hidden sm:inline'>Etiqueta</span>
				</Button>
			);
		}

		return (
			<Button
				size='sm'
				variant='solid'
				className='h-7 shrink-0 bg-blue-600 px-2.5 text-[10px] font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 dark:shadow-none'
				onClick={() => handleReview(item)}>
				<Icon icon='HeroEye' className='h-3.5 w-3.5 sm:mr-1.5' />
				<span className='hidden sm:inline'>Revisar</span>
			</Button>
		);
	};

	return (
		<Card className='h-full border-zinc-100 shadow-sm dark:border-zinc-800'>
			<CardHeader className='flex flex-col items-start gap-3 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800 sm:px-6'>
				<div className='flex self-start'>
					<div className='flex gap-3'>
						<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'>
							<Icon icon='HeroClipboardDocumentCheck' className='text-xl' />
						</div>
						<div>
							<h3 className='text-base font-bold leading-tight text-zinc-900 dark:text-zinc-100'>
								Últimos Ítems
							</h3>
							<p className='text-xs font-medium text-zinc-500'>
								Línea de tiempo de revisiones
							</p>
						</div>
					</div>
				</div>

				<div
					id='timeline-reviews-filters'
					className='flex self-start rounded-lg border border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-600 dark:bg-zinc-800/50'>
					{(['all', 'pending', 'approved'] as FilterType[]).map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
								filter === f
									? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
									: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							{f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Aprobados'}
						</button>
					))}
				</div>
			</CardHeader>
			<CardBody
				id='timeline-reviews-list'
				className='no-scrollbar max-h-[500px] overflow-y-auto p-0'>
				{itemsLoading ? (
					<div className='flex flex-col items-center justify-center gap-2 py-12 text-sm text-zinc-500'>
						<Spinner nombre='Cargando items...' />
					</div>
				) : items.length > 0 ? (
					<div className='flex flex-col p-3 sm:p-4'>
						{items.slice(0, 10).map((item, index) => {
							const isFirst = index === 0;
							const isLast = index === items.length - 1 || index === 9;

							return (
								<div key={item.id} className='group relative flex gap-3 sm:gap-4'>
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
										<div
											className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-950 sm:h-10 sm:w-10 ${
												(typeof item.review_status === 'object'
													? (item.review_status as any).value
													: item.review_status) === 'approved'
													? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
													: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
											}`}>
											<Icon
												icon={
													(typeof item.review_status === 'object'
														? (item.review_status as any).value
														: item.review_status) === 'approved'
														? 'HeroCheck'
														: 'HeroClock'
												}
												className='h-4 w-4 sm:h-5 sm:w-5'
											/>
										</div>
									</div>

									{/* Content Column - Fully responsive */}
									<div className='min-w-0 flex-1 pb-6 pt-1.5 group-last:pb-2 sm:pb-8'>
										<div className='flex flex-col gap-2.5'>
											{/* Product info and date */}
											<div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
												<div className='flex min-w-0 flex-1 flex-col'>
													<span className='truncate text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100'>
														{item.details?.brand || 'Sin Marca'}{' '}
														{item.details?.model ||
															item.product?.name ||
															'Sin Modelo'}
													</span>
													<span className='mt-0.5 truncate font-mono text-[10px] text-zinc-400'>
														S/N: {item.serial_number}
													</span>
												</div>
												<span className='shrink-0 self-start rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 dark:bg-zinc-800 sm:self-auto'>
													{new Date(
														item.updated_at ||
															item.created_at ||
															Date.now(),
													).toLocaleDateString()}
												</span>
											</div>

											{/* Badge and action button */}
											<div className='flex flex-wrap items-center justify-between gap-2'>
												<Badge
													variant='outline'
													color={
														(typeof item.review_status === 'object'
															? (item.review_status as any).value
															: item.review_status) === 'approved'
															? 'emerald'
															: 'sky'
													}
													className={`px-2.5 py-0.5 text-[10px] font-semibold ${
														(typeof item.review_status === 'object'
															? (item.review_status as any).value
															: item.review_status) === 'approved'
															? 'bg-emerald-500 text-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
															: 'bg-sky-500 text-sky-50 dark:bg-sky-900/20 dark:text-sky-400'
													}`}>
													{(() => {
														const grade = item.grade;
														const status =
															typeof item.review_status === 'object'
																? (item.review_status as any).label
																: item.review_status;

														if (filter !== 'approved' && status)
															return status;

														if (
															typeof grade === 'object' &&
															grade !== null
														) {
															return (
																(grade as any).label ||
																(grade as any).value ||
																'Aprobado'
															);
														}
														return grade || 'Aprobado';
													})()}
												</Badge>

												{renderAction(item)}
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
						<p className='text-sm font-medium'>No hay equipos en esta categoría.</p>
					</div>
				)}
			</CardBody>

			{/* Print Modal */}
			<Suspense fallback={null}>
				{isPrintOpen && (
					<PrintLabel
						isOpen={isPrintOpen}
						onClose={() => {
							setIsPrintOpen(false);
							setItemToPrint(null);
						}}
						item={itemToPrint}
						autoPrint={true}
					/>
				)}
			</Suspense>
		</Card>
	);
};

export default LatestApprovedReviewsTimeline;
