import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable';
import { ISaleItem } from '@/interface/sales.interface';
import { formatCLP } from '../../../utils';

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
						row.original.product_name ||
						row.original.product?.name ||
						(row.original as { name?: string })?.name ||
						'Producto sin nombre';

					return (
						<div className='flex flex-col gap-1'>
							<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{name}
							</span>
							{row.original.attributes_description && (
								<span className='text-xs leading-tight text-zinc-500 dark:text-zinc-500'>
									{row.original.attributes_description}
								</span>
							)}
							{row.original.serial_numbers &&
								row.original.serial_numbers.length > 0 && (
									<div className='mt-1 flex flex-wrap gap-1'>
										{row.original.serial_numbers.map((sn) => (
											<span
												key={sn}
												className='rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
												{sn}
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
				accessorKey: 'price',
				header: 'Precio Unit.',
				cell: ({ row }) => {
					const unitPrice = Number(
						row.original.unit_price ??
							row.original.unit_price_net ??
							row.original.price ??
							0,
					);
					return (
						<span className='text-sm text-zinc-700 dark:text-zinc-300'>
							{formatCLP(unitPrice)}
						</span>
					);
				},
				meta: { align: 'right' },
				size: 120,
			},
			{
				accessorKey: 'total',
				header: 'Total',
				cell: ({ row }) => {
					const unitPrice = Number(
						row.original.unit_price ??
							row.original.unit_price_net ??
							row.original.price ??
							0,
					);
					const totalLine = Number(
						row.original.total ??
							row.original.line_total ??
							row.original.subtotal ??
							row.original.line_net ??
							row.original.quantity * unitPrice,
					);
					return (
						<span className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
							{formatCLP(totalLine)}
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
