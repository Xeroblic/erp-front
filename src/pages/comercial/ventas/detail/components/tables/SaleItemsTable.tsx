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
					const description = row.original.product?.description?.trim();

					// Extract serials from meta_json
					const meta = row.original.meta_json as any;
					const soldSerials = meta?.reservation?.sold_serials as string[] | undefined;

					return (
						<div className='flex flex-col gap-1'>
							<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{name}
							</span>
							{/* Description from product catalog */}
							{description && description !== detail ? (
								<span className='text-xs text-zinc-500 dark:text-zinc-400'>
									{description}
								</span>
							) : null}

							{/* Custom detail/notes on the item */}
							{detail ? (
								<span className='text-xs italic text-zinc-500 dark:text-zinc-400'>
									{detail}
								</span>
							) : null}

							{/* Sold Serials */}
							{soldSerials && soldSerials.length > 0 && (
								<div className='mt-1 flex flex-wrap gap-1'>
									{soldSerials.map((sn, idx) => (
										<span
											key={idx}
											className='inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
											SN: {sn}
										</span>
									))}
								</div>
							)}
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
				accessorKey: 'unit_price',
				header: 'SubTotal',
				cell: ({ row }) => {
					const unitPrice = Number(row.original.unit_price ?? 0);
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
				accessorKey: 'subtotal',
				header: 'Total',
				cell: ({ row }) => {
					const totalLine = Number(row.original.subtotal);
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
