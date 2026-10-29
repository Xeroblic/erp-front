import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { IProduct } from '@/interface/product.interface';
import ProductCell from './cells/ProductCell';
import PriceCell from './cells/PriceCell';
import WooCell from './cells/WooCell';
import BrandCell from './cells/BrandCell';
import StatusCell from './cells/StatusCell';
import PublicationCell from './cells/PublicationCell';
import CategoriesCell from './cells/CategoriesCell';
import ActionsCell from './cells/ActionsCell';

interface UseProductColumnsParams {
	isAdmin: boolean;
	subsidiaryId?: number | null;
	isUpdating: boolean;
	onToggleStatus: (product: IProduct) => void;
	onView?: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
}

export const useProductColumns = ({
	isAdmin,
	subsidiaryId,
	isUpdating,
	onToggleStatus,
	onView,
	onDelete,
}: UseProductColumnsParams): ColumnDef<IProduct>[] =>
	useMemo(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => <ProductCell product={row.original} />,
			},
			{
				id: 'price',
				header: 'Precio',
				cell: ({ row }) => <PriceCell product={row.original} />,
			},
			{
				id: 'woo',
				header: 'Woo',
				cell: ({ row }) => <WooCell product={row.original} />,
			},
			{
				id: 'brand',
				header: 'Marca',
				cell: ({ row }) => <BrandCell product={row.original} />,
			},
			{
				id: 'status',
				header: 'Estado',
				cell: ({ row }) => <StatusCell product={row.original} />,
			},
			{
				id: 'publication',
				header: 'Estado publicación',
				cell: ({ row }) => <PublicationCell product={row.original} />,
			},
			{
				id: 'categories',
				header: 'Categorías',
				cell: ({ row }) => <CategoriesCell product={row.original} />,
			},
			{
				id: 'actions',
				header: () => <div className='text-right'>Acciones</div>,
				cell: ({ row }) => (
					<ActionsCell
						product={row.original}
						isAdmin={isAdmin}
						subsidiaryId={subsidiaryId}
						isUpdating={isUpdating}
						onToggleStatus={onToggleStatus}
						onView={onView}
						onDelete={onDelete}
					/>
				),
			},
		],
		[isAdmin, subsidiaryId, isUpdating, onToggleStatus, onView, onDelete],
	);

export default useProductColumns;
