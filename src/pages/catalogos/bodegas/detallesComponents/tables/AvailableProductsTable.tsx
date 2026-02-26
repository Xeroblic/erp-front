import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { IProduct } from '@/interface/product.interface';

interface AvailableProductsTableProps {
	products: IProduct[];
	loading: boolean;
	onAttachProduct: (product: IProduct) => void;
}

const columnHelper = createColumnHelper<IProduct>();

const AvailableProductsTable: React.FC<AvailableProductsTableProps> = ({
	products,
	loading,
	onAttachProduct,
}) => {
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
			columnHelper.accessor((row) => row.brand?.name ?? 'N/A', {
				id: 'brand',
				header: 'Marca',
				cell: (info) => <span className='text-sm text-gray-600'>{info.getValue()}</span>,
			}),
			columnHelper.accessor('stock', {
				id: 'stock',
				header: 'Stock',
				cell: (info) => <span className='text-sm'>{info.getValue() ?? 0}</span>,
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acción',
				cell: (info) => {
					const product = info.row.original;
					return (
						<div className='flex items-center justify-center gap-2'>
							<Button
								size='sm'
								variant='outline'
								color='blue'
								onClick={() => onAttachProduct(product)}>
								<Icon icon='HeroPlus' className='mr-1 size-4' />
								Asociar
							</Button>
						</div>
					);
				},
			}),
		],
		[onAttachProduct],
	);

	return (
		<DataTable
			columns={columns}
			data={products}
			loading={loading}
			searchPlaceholder='Buscar productos disponibles...'
			emptyMessage='No hay productos disponibles'
		/>
	);
};

export default AvailableProductsTable;
