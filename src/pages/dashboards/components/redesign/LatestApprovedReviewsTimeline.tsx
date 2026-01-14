import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Timeline, { TimelineItem } from '@/components/Timeline';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchItems } from '@/store/slices/technicalReviews/thunks/itemsThunks';
// Use React.lazy for the modal to avoid heavy bundle load / context issues
const PrintLabel = React.lazy(() => import('@/pages/technical-reviews/components/items/PrintLabel'));
import { IItem } from '@/interface/technicalReviews.interface';

import { useCurrentBranch } from '@/hooks/useCurrentBranch';

type FilterType = 'all' | 'pending' | 'approved';

interface Props {}

const LatestApprovedReviewsTimeline: React.FC<Props> = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { branchId } = useCurrentBranch(); // Use the hook instead of direct specific selector
    const { items, itemsLoading } = useAppSelector((state) => state.technicalReviews);

    // Local state for printing and filtering
    const [itemToPrint, setItemToPrint] = useState<IItem | null>(null);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        if (branchId) {
            // Determine API params based on filter
            const params: any = {
                page: 1, 
                per_page: 10,
                // sort_by: 'updated_at', 
                // sort_direction: 'desc'
            };

            if (filter === 'approved') {
                params.review_status = 'approved';
            } else if (filter === 'pending') {
                // User considers 'in_review' as pending/active work.
                params.review_status = 'in_review'; 
            }
            // 'all' sends no review_status param

            dispatch(fetchItems({ 
                branchId,
                params
            }));
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
        // If Approved, show Label button
        // If Pending/In Review/Others, show Review button
        const isApproved = 
            (typeof item.review_status === 'object' ? (item.review_status as any).value : item.review_status) === 'approved';
        
        if (isApproved) {
            return (
                <Button 
                    size='sm' 
                    variant='outline' 
                    color='zinc'
                    className='h-7 px-3 text-[10px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    onClick={() => handlePrint(item)}
                >
                    <Icon icon='HeroPrinter' className='mr-1.5 h-3.5 w-3.5 text-zinc-500' />
                    Etiqueta
                </Button>
            );
        }

        return (
            <Button 
                size='sm' 
                variant='solid' 
                className='h-7 px-3 text-[10px] font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none'
                onClick={() => handleReview(item)}
            >
                <Icon icon='HeroEye' className='mr-1.5 h-3.5 w-3.5' />
                Revisar
            </Button>
        );
    };

    return (
        <Card className='h-full border-zinc-100 shadow-sm dark:border-zinc-800'>
            <CardHeader className='flex flex-col gap-4 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between'>
                 <div>
                    <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Últimos Ítems</h3>
                    <p className='text-xs text-zinc-500'>Línea de tiempo de revisiones</p>
                 </div>
            </CardHeader>
            <CardBody className='max-h-[400px] overflow-y-auto'>
                 <div className='flex items-center gap-2'>
                    <div className='flex border border-zinc-500 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50'>
                        {(['all', 'pending', 'approved'] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                                    filter === f
                                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100' 
                                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                            >
                                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Aprobados'}
                            </button>
                        ))}
                    </div>
                 </div>
                {itemsLoading ? (
                     <div className='flex justify-center py-8 text-sm text-zinc-500'>Cargando...</div>
                ) : items.length > 0 ? (
                    <div className="flex flex-col p-4">
                        {items.slice(0, 10).map((item, index) => {
                             const isFirst = index === 0;
                             const isLast = index === items.length - 1 || index === 9;

                             return (
                             <div key={item.id} className="group relative flex gap-4">
                                {/* Timeline Line */}
                                <div 
                                    className={`absolute left-5 w-px bg-zinc-600 dark:bg-zinc-700 -translate-x-1/2 z-0
                                        ${isFirst ? 'top-6 bottom-0' : 
                                          isLast ? 'top-0 h-6' : 
                                          'top-0 bottom-0'}
                                    `}
                                ></div>

                                {/* Icon Column */}
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-950 mt-1 ${
                                        (typeof item.review_status === 'object' ? (item.review_status as any).value : item.review_status) === 'approved' 
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        <Icon icon={(typeof item.review_status === 'object' ? (item.review_status as any).value : item.review_status) === 'approved' ? 'HeroCheck' : 'HeroClock'} className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pb-8 group-last:pb-2 pt-1.5">
                                    <div className="flex flex-col gap-3">
                                        <div className='flex items-start justify-between gap-4'>
                                            <div className='flex flex-col min-w-0 flex-1'>
                                                <span className='font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug truncate pr-2'>
                                                    {item.details?.brand || 'Sin Marca'} {item.details?.model || item.product?.name || 'Sin Modelo'}
                                                </span>
                                                <span className='text-[10px] text-zinc-400 mt-0.5 font-mono truncate'>
                                                    S/N: {item.serial_number}
                                                </span>
                                            </div>
                                            <div className='flex flex-col items-end shrink-0'>
                                                <span className='text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full'>
                                                    {new Date(item.updated_at || item.created_at || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='mt-1 flex items-center justify-between'>
                                            <Badge 
                                                variant='outline' 
                                                color={
                                                    (typeof item.review_status === 'object' ? (item.review_status as any).value : item.review_status) === 'approved' 
                                                        ? 'emerald' 
                                                        : 'sky'
                                                }
                                                className={`text-[10px] px-2.5 py-0.5 font-semibold ${
                                                    (typeof item.review_status === 'object' ? (item.review_status as any).value : item.review_status) === 'approved'
                                                        ? 'bg-emerald-500 text-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                        : 'bg-sky-500 text-sky-50 dark:bg-sky-900/20 dark:text-sky-400'
                                                }`}
                                            >
                                                {(() => {
                                                    const grade = item.grade;
                                                    const status = typeof item.review_status === 'object' ? (item.review_status as any).label : item.review_status;
                                                    
                                                    if (filter !== 'approved' && status) return status;

                                                    if (typeof grade === 'object' && grade !== null) {
                                                        return (grade as any).label || (grade as any).value || 'Aprobado';
                                                    }
                                                    return grade || 'Aprobado';
                                                })()}
                                            </Badge>
                                            
                                            <div className="flex items-center">
                                                {renderAction(item)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                             );
                        })}
                    </div>
                ) : (
                    <div className='py-8 text-center text-sm text-zinc-500'>
                        No hay equipos en esta categoría.
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
                        autoPrint={true} // Auto trigger print dialog
                    />
                )}
            </Suspense>
        </Card>
    );
};

export default LatestApprovedReviewsTimeline;
