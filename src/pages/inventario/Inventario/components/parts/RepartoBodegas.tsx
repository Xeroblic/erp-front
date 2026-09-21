import React from 'react';
import classNames from 'classnames';
import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import type { IInventoryWarehouseBreakdown } from '@/interface/inventoryOverview.interface';

interface IRepartoBodegasProps {
	warehouses: IInventoryWarehouseBreakdown[];
	/** Bodega filtrada (`null` = Sin ubicación, `undefined` = ninguna): se resalta. */
	highlighted?: number | null;
}

/**
 * «Dónde está» un producto: una pastilla por ubicación con sus unidades, en
 * el orden de A1 (Sin ubicación primero). Responde de un vistazo lo que antes
 * obligaba a filtrar bodega por bodega.
 */
const RepartoBodegas: React.FC<IRepartoBodegasProps> = ({ warehouses, highlighted }) => {
	if (warehouses.length === 0) return <span className='text-sm text-zinc-500'>—</span>;
	return (
		<ul className='flex flex-wrap gap-1.5' aria-label='Unidades por ubicación'>
			{warehouses.map((location) => {
				const id = location.warehouse?.id ?? null;
				const isHighlighted = highlighted !== undefined && highlighted === id;
				return (
					<li
						key={id ?? 'unlocated'}
						className={classNames(
							'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm',
							isHighlighted
								? 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-100'
								: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200',
						)}>
						<span>{location.warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL}</span>
						<span className='font-semibold tabular-nums'>
							{location.physical_quantity}
						</span>
					</li>
				);
			})}
		</ul>
	);
};

export default RepartoBodegas;
