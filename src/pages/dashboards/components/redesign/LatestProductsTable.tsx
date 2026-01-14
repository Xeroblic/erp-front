import React, { useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import Icon from '@/components/icon/Icon';

const LatestProductsTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { items: products, loading } = useAppSelector((state) => state.products);

    useEffect(() => {
        if (user?.branch_id) {
            dispatch(fetchProducts({ 
                branchId: user.branch_id, 
                params: { 
                    page: 1, 
                    per_page: 5, 
                    // sort_by: 'created_at', // Removed as it causes type error
                    // sort_direction: 'desc' 
                } 
            }));
        }
    }, [dispatch, user?.branch_id]);

    return (
        <Card className='border-zinc-100 shadow-sm dark:border-zinc-800'>
            <CardHeader className='border-b border-zinc-100 px-6 py-4 dark:border-zinc-800'>
                <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Últimos Productos</h3>
                <p className='text-xs text-zinc-500'>Nuevas incorporaciones al catálogo</p>
            </CardHeader>
            <CardBody className='p-0'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm'>
                        <thead className='bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400'>
                            <tr>
                                <th className='px-6 py-3'>Producto</th>
                                <th className='px-6 py-3'>SKU</th>
                                <th className='px-6 py-3'>Stock</th>
                                <th className='px-6 py-3'>Precio</th>
                                <th className='px-6 py-3'>Estado</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className='px-6 py-8 text-center text-zinc-500'>Cargando...</td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.slice(0, 5).map((product: any) => (
                                    <tr key={product.id} className='hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'>
                                        <td className='px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100'>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex h-8 w-8 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800'>
                                                    {/* Placeholder img */}
                                                    <Icon icon='HeroTag' className='text-zinc-400' />
                                                </div>
                                                <div>
                                                    <div>{product.name}</div>
                                                    <div className='text-[10px] text-zinc-400'>{product.brand_name || 'Generico'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 text-zinc-500 font-mono text-xs'>{product.sku}</td>
                                        <td className='px-6 py-4'>
                                            <Badge 
                                                variant='outline' 
                                                className={(product.stock || 0) > 0 ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}
                                            >
                                                {product.stock || 0} un.
                                            </Badge>
                                        </td>
                                        <td className='px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300'>
                                            ${product.price?.toLocaleString('es-CL') || '0'}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <Badge 
                                                color={product.is_active ? 'blue' : 'gray'} 
                                                variant='solid' 
                                                className={product.is_active ? 'bg-blue-500' : 'bg-gray-500'}
                                            >
                                                {product.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className='px-6 py-8 text-center text-zinc-500'>No se encontraron productos recientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    );
};

export default LatestProductsTable;
