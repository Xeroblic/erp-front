import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { IWarehouseProduct } from '@/interface/warehouse.interface';
import type { IProduct } from '@/interface/product.interface';

// Define expected interface
interface EnrichedProduct extends IWarehouseProduct {
	stock: number;
	brand_display: string;
}

const columnHelper = createColumnHelper<EnrichedProduct>();

interface AssociatedProductsTableProps {
	products: IWarehouseProduct[];
	allProducts: IProduct[];
	branchId: number;
	onRemoveProduct: (product: IWarehouseProduct) => void;
}

const AssociatedProductsTable: React.FC<AssociatedProductsTableProps> = ({
	products,
	allProducts,
	branchId,
	onRemoveProduct,
}) => {
	const navigate = useNavigate();

	// Enriquecer productos con datos del inventario
	const enrichedProducts = useMemo(() => {
		return products.map((p) => ({
			...p,
			stock: allProducts.find((x) => x.id === p.id)?.stock ?? 0,
			brand_display:
				p.brand_name ?? allProducts.find((x) => x.id === p.id)?.brand?.name ?? 'N/A',
		}));
	}, [products, allProducts]);

	const columns = useMemo(
		() => [
			columnHelper.accessor('sku', {
				id: 'sku',
				header: 'SKU',
				cell: (info) => <span className='font-mono text-sm'>{info.getValue()}</span>,
			}),
			columnHelper.accessor('name', {
				id: 'name',
				header: 'Nombre',
				cell: (info) => <span className='text-sm'>{info.getValue()}</span>,
			}),
			columnHelper.accessor('brand_display', {
				id: 'brand',
				header: 'Marca',
				cell: (info) => <span className='text-sm text-gray-600'>{info.getValue()}</span>,
			}),
			columnHelper.accessor('stock', {
				id: 'stock',
				header: 'Stock',
				cell: (info) => <span className='text-sm'>{info.getValue()}</span>,
			}),
			columnHelper.accessor('quantity', {
				id: 'quantity',
				header: 'Cantidad',
				cell: (info) => <span className='font-semibold'>{info.getValue()}</span>,
			}),
			columnHelper.accessor('sync_stock', {
				id: 'sync_stock',
				header: 'Modo',
				cell: (info) => {
					const value = info.getValue();
					return value ? (
						<Badge color='emerald' variant='outline'>
							<Icon icon='HeroArrowPath' className='mr-1 h-3 w-3' />
							Auto-Sync
						</Badge>
					) : (
						<Badge color='blue' variant='outline'>
							<Icon icon='HeroPencilSquare' className='mr-1 h-3 w-3' />
							Manual
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => {
					const product = info.row.original;
					return (
						<div className='flex items-center gap-2'>
							<Button
								size='sm'
								variant='outline'
								icon='HeroEye'
								onClick={() =>
									navigate(
										`/catalogos/productos/${product.id}?branchId=${branchId}`,
									)
								}
								title='Ver producto'
							/>
							<Button
								size='sm'
								variant='outline'
								color='red'
								onClick={() => onRemoveProduct(product)}>
								<Icon icon='HeroTrash' />
							</Button>
						</div>
					);
				},
			}),
		],
		[branchId, onRemoveProduct, navigate],
	);

	return (
		<DataTable
			columns={columns}
			data={enrichedProducts}
			searchPlaceholder='Buscar productos asociados...'
			emptyMessage='No hay productos asociados'
		/>
	);
};

export default AssociatedProductsTable;
