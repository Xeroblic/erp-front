import React, { useEffect, useMemo, useRef } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { IProduct } from '@/interface/product.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

const LatestProductsTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const { branchId } = useCurrentBranch();
    const { items: products, loading } = useAppSelector((state) => state.products);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        // Only fetch once when component mounts and branchId is available
        if (branchId && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            dispatch(fetchProducts({ 
                branchId, 
                params: { 
                    page: 1, 
                    per_page: 15,
                } 
            }));
        }
    }, [dispatch, branchId]);

    // Get latest 5 products (assuming API returns newest first or we sort by ID desc)
    const latestProducts = useMemo(() => {
        return [...products]
            .sort((a, b) => {
                // Sort by ID descending (newer products have higher IDs)
                return (b.id || 0) - (a.id || 0);
            })
            .slice(0, 5);
    }, [products]);

    const columns = useMemo<ColumnDef<IProduct>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Producto',
            cell: ({ row }) => (
                <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800'>
                        <Icon icon='HeroTag' className='text-zinc-400' />
                    </div>
                    <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.original.name}</div>
                        <div className='text-[10px] text-zinc-400'>{row.original?.brand?.name || 'Generico'}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'sku',
            header: 'SKU',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-zinc-500">{row.original.sku}</span>
            ),
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
            cell: ({ row }) => (
                <Badge 
                    variant='outline' 
                    className={(row.original.stock || 0) > 0 ? 'px-2 text-emerald-600 border-emerald-200' : 'px-2 text-red-600 border-red-200'}
                >
                    {row.original.stock || 0} un.
                </Badge>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Precio',
            cell: ({ row }) => (
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    ${row.original.price?.toLocaleString('es-CL') || '0'}
                </span>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Estado',
            cell: ({ row }) => (
                <Badge 
                    color={row.original.is_active ? 'blue' : 'gray'} 
                    variant='solid' 
                    className={row.original.is_active ? 'bg-blue-500 px-2' : 'bg-gray-500 px-2'}
                >
                    {row.original.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
    ], []);

    return (
        <Card className='border-zinc-100 shadow-sm dark:border-zinc-800'>
            <CardHeader className='border-b border-zinc-100 px-6 py-4 dark:border-zinc-800'>
                <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Últimos Productos</h3>
                <p className='text-xs text-zinc-500'>Nuevas incorporaciones al catálogo</p>
            </CardHeader>
            <CardBody className='p-6'>
                <DataTable
                    columns={columns}
                    data={latestProducts}
                    loading={loading}
                    pageSize={5}
                    searchPlaceholder='Buscar productos...'
                    emptyMessage='No se encontraron productos recientes.'
                />
            </CardBody>
        </Card>
    );
};

export default LatestProductsTable;
