import React, { useState, useMemo } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import type { IProduct } from '@/interface/product.interface';
import StockSeriesModal from '../modals/StockSeriesModal';
import { useProductos } from '../../hooks/useProductos';
import DataTable from '@/components/ui/DataTable';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';

interface StockAdminTabProps {
    subsidiaryId: number;
}

const StockAdminTab: React.FC<StockAdminTabProps> = ({ subsidiaryId }) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 100,
    });

    const memoizedFilters = useMemo(() => ({ search: globalFilter }), [globalFilter]);

    const { products, loading, meta, refresh } = useProductos({
        subsidiaryId,
        mode: 'subsidiaries',
        filters: memoizedFilters, 
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
    });

    const handleOpenModal = (product: IProduct) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    const columns = useMemo<ColumnDef<IProduct>[]>(() => {
        const baseColumns: ColumnDef<IProduct>[] = [
            {
                accessorKey: 'id',
                header: 'ID.',
                cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>
            },
            {
                accessorKey: 'sku',
                header: 'SKU',
                cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span>
            },  
            {
                accessorKey: 'name',
                header: 'Producto',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-100">{row.original.name}</p>
                        {row.original.serial_tracking && (
                            <Badge variant="outline" color="emerald" className="mt-1 px-1.5 py-0 text-[10px]">
                                Serializado
                            </Badge>
                        )}
                    </div>
                )
            },
            {
                accessorKey: 'stock',
                header: 'Stock Total',
                cell: ({ row }) => (
                    <span className="font-semibold">{row.original.stock}</span>
                )
            },
            {
                id: 'grades',
                header: 'Stock por Grado',
                cell: ({ row }) => {
                    const children = row.original.children || [];
                    if (children.length === 0) return <span className="text-gray-400 text-sm">Sin desglose</span>;
                    
                    return (
                        <div className="flex flex-wrap gap-1">
                            {/* FIX 2: Validación ?? 0 para evitar el error de c.stock nulo/indefinido */}
                            {children.filter(c => (c.stock ?? 0) > 0).map(child => (
                                <Badge key={child.id} variant="outline" color="blue" className="px-1.5">
                                    {child.grade}: {child.stock}
                                </Badge>
                            ))}
                        </div>
                    );
                }
            }
        ];

        if (isSelectionMode) {
            baseColumns.unshift({
                id: 'selection',
                header: 'Sel.',
                size: 50,
                cell: ({ row }) => {
                    const canSelect = row.original.serial_tracking;
                    
                    return canSelect ? (
                        <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedProduct?.id === row.original.id}
                            onChange={() => handleOpenModal(row.original)}
                        />
                    ) : (
                        <span className="text-gray-300">-</span>
                    );
                },
            });
        }

        return baseColumns;
    }, [isSelectionMode, selectedProduct]);

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Icon icon='HeroSquare3Stack3D' className='h-5 w-5 text-blue-500' />
                        Administración de Stock
                    </CardTitle>
                    <div className='flex items-center gap-3'>
                        <Button 
                            variant={isSelectionMode ? 'solid' : 'outline'} 
                            color={isSelectionMode ? 'blue' : 'zinc'}
                            size='sm' 
                            icon='HeroListBullet'
                            onClick={() => setIsSelectionMode(!isSelectionMode)}
                        >
                            {isSelectionMode ? 'Ocultar Selección' : 'Gestionar Series'}
                        </Button>
                        <Button variant='outline' size='sm' icon='HeroArrowPath' onClick={refresh}>
                            Recargar
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    <DataTable
                        columns={columns}
                        data={products}
                        loading={loading}
                        searchValue={globalFilter}
                        onSearchChange={setGlobalFilter}
                        manualPagination={true}
                        pageCount={meta.last_page}
                        paginationState={pagination}
                        onPaginationChange={setPagination}
                        emptyMessage="No se encontraron productos para administrar."
                    />
                </CardBody>
            </Card>

            {isModalOpen && selectedProduct && (
                <StockSeriesModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    product={selectedProduct}
                    subsidiaryId={subsidiaryId}
                />
            )}
        </div>
    );
};

export default StockAdminTab;