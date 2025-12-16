import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable';
import { ISaleItem } from '@/interface/sales.interface';
import { formatCLP } from '../../../utils';
import { priceFormatWhitDecimals } from '@/utils/priceFormat.util';

interface SaleItemsTableProps {
	items: ISaleItem[];
}

const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ items }) => {
	const columns = useMemo<ColumnDef<ISaleItem>[]>(
		() => [
			{
				accessorKey: 'sku',
				header: 'SKU',
				cell: ({ row }) => (
					<span className='text-xs text-zinc-600 dark:text-zinc-400'>
						{row.original.sku || 'S/N'}
					</span>
				),
				size: 120,
			},
			{
				accessorKey: 'product_name',
				header: 'Producto / Detalles',
				cell: ({ row }) => {
					const name =
						row.original.product?.name || row.original.name || 'Producto sin nombre';
					const detail = row.original.product_detail?.trim();

					return (
						<div className='flex flex-col gap-1'>
							<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{name}
							</span>
							{detail ? (
								<span className='text-xs text-zinc-500 dark:text-zinc-400'>
									{detail}
								</span>
							) : null}
						</div>
					);
				},
				size: 320,
			},
			{
				accessorKey: 'quantity',
				header: 'Cant.',
				cell: ({ row }) => (
					<span className='text-sm text-zinc-700 dark:text-zinc-300'>
						{row.original.quantity}
					</span>
				),
				meta: { align: 'center' },
				size: 80,
			},
			{
				accessorKey: 'subtotal',
				header: 'SubTotal',
				cell: ({ row }) => {
					const unitPrice = Number(
						row.original.subtotal  ?? 0,
					);
					return (
						<span className='text-sm text-zinc-700 dark:text-zinc-300'>
							{priceFormatWhitDecimals(unitPrice)}
						</span>
					);
				},
				meta: { align: 'right' },
				size: 120,
			},
			// {
			// 	accessorKey: 'tax_amount',
			// 	header: 'IVA',
			// 	cell: ({ row }) => {
			// 		const taxAmount = Number(
			// 			row.original.tax_amount ??
			// 				0,
			// 		);
			// 		return (
			// 			<span className='text-sm text-zinc-700 dark:text-zinc-300'>
			// 				{priceFormatWhitDecimals(taxAmount)}
			// 			</span>
			// 		);
			// 	}

			// },
			{
				accessorKey: 'total',
				header: 'Total',
				cell: ({ row }) => {
					const unitPrice = Number(
						row.original.unit_price ?? row.original.unit_price_gross ?? 0,
					);
					const totalLine = Number(
						row.original.total ?? row.original.subtotal ?? row.original.quantity * unitPrice,
					);
					return (
						<span className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
							{priceFormatWhitDecimals(totalLine)}
						</span>
					);
				},
				meta: { align: 'right' },
				size: 120,
			},
		],
		[],
	);

	return (
		<div className=''>
			<DataTable<ISaleItem>
				columns={columns}
				data={items}
				pageSize={10}
				emptyMessage='No hay items registrados en esta venta.'
			/>
		</div>
	);
};

export default SaleItemsTable;
