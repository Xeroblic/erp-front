import React, { useEffect, useState } from 'react';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchItems } from '@/store/slices/technicalReviews';
import { IItem } from '@/interface/technicalReviews.interface';

const LatestReviewsTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { user } = useAppSelector((state) => state.auth);
    const { items, itemsMeta, itemsLoading, itemsError } = useAppSelector((state) => state.technicalReviews);

    // Initial Pagination State
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 5, // Show 5 per page for dashboard compactness
    });

    useEffect(() => {
        if (user?.branch_id) {
            dispatch(fetchItems({
                branchId: user.branch_id,
                params: {
                    page: pagination.pageIndex + 1,
                    per_page: pagination.pageSize,
                }
            }));
        }
    }, [dispatch, pagination.pageIndex, pagination.pageSize, user?.branch_id]);

    const columns: ColumnDef<IItem>[] = [
        {
            accessorKey: 'serial_number',
            header: 'Serie',
            cell: ({ row }) => <span className='font-mono font-medium'>{row.original.serial_number}</span>,
        },
        {
            accessorKey: 'created_at',
            header: 'Fecha Ingreso',
             cell: ({ row }) => (
                <span className='text-sm text-gray-500'>
                    {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '-'}
                </span>
            ),
        },
        {
            id: 'equipment',
            header: 'Equipo',
            cell: ({ row }) => {
                const details = row.original.details;
                return (
                    <div className='flex flex-col'>
                         <span className='font-semibold text-gray-700 dark:text-gray-300'>
                            {details?.brand} {details?.model}
                        </span>
                        <span className='text-xs text-gray-500 capitalize'>{row.original.equipment_type}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'review_status',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.original.review_status;
                let color: 'blue' | 'yellow' | 'green' | 'red' | 'gray' = 'gray';
                let label = status as string;

                switch (status) {
                    case 'pending': color = 'yellow'; label = 'Pendiente'; break;
                    case 'in_review': color = 'blue'; label = 'En Revisión'; break;
                    case 'reviewed': color = 'green'; label = 'Revisado'; break;
                    case 'approved': color = 'green'; label = 'Aprobado'; break;
                }

                return <Badge color={color} variant='solid'>{label}</Badge>;
            },
        },
        {
            accessorKey: 'grade',
            header: 'Grado',
            cell: ({ row }) => {
                 const grade = row.original.grade || row.original.suggested_grade;
                 return grade ? (
                    <Badge variant='outline' className='font-bold'>{grade}</Badge>
                 ) : (
                    <span className='text-gray-400'>-</span>
                 );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <Button
                    size='sm'
                    icon='HeroEye'
                    variant='outline'
                    onClick={() => navigate(`/technical-reviews/items/${row.original.id}`)}
                >
                    Ver
                </Button>
            ),
        },
    ];

    return (
        <Card className='h-full border-none shadow-sm'>
             <CardHeader className='flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800'>
                <div className='flex items-center gap-2'>
                     <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'>
                        <Icon icon='HeroClipboardDocumentList' className='h-6 w-6' />
                     </div>
                     <div>
                        <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Últimas Revisiones</h3>
                        <p className='text-xs text-gray-500'>Listado de ingresos técnicos recientes</p>
                     </div>
                </div>
                 <Button 
                    size='sm' 
                    variant='outline' 
                    onClick={() => navigate('/technical-reviews/items')}
                    className='hidden sm:flex'
                >
                    Ver Todas
                </Button>
            </CardHeader>
            <CardBody className='p-0'>
                {itemsError ? (
                    <div className='flex flex-col items-center justify-center py-12 text-red-500'>
                        <Icon icon='HeroExclamationCircle' className='mb-3 h-12 w-12 opacity-50' />
                        <p>Error cargando revisiones.</p>
                        <p className='text-xs text-gray-400 mt-2'>{itemsError}</p>
                    </div>
                ) : items.length > 0 ? (
                     <DataTable<IItem>
                        columns={columns}
                        data={items}
                        loading={itemsLoading}
                        manualPagination={true}
                        pageCount={itemsMeta?.last_page || 1}
                        paginationState={pagination}
                        onPaginationChange={setPagination}
                        searchPlaceholder='Buscar por serie...' 
                    />
                ) : (
                    <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
                        <Icon icon='HeroClipboard' className='mb-3 h-12 w-12 opacity-50' />
                        <p>No se encontraron revisiones recientes.</p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default LatestReviewsTable;
