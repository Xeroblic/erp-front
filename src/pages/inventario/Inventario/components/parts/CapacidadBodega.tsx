import React from 'react';
import type { IInventoryWarehouseAggregate } from '@/interface/inventoryOverview.interface';

/** Capacidad usada de una bodega; «Sin definir» si no tiene máximo configurado. */
const CapacidadBodega: React.FC<{ aggregate: IInventoryWarehouseAggregate }> = ({ aggregate }) => {
	const max = aggregate.maximum_capacity;
	if (!max) return <span className='text-sm text-zinc-500'>Sin definir</span>;
	const percent = Math.min(100, Math.round((aggregate.physical_quantity / max) * 100));
	return (
		<div className='min-w-[8rem] space-y-1'>
			<div
				className='h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700'
				role='progressbar'
				aria-valuenow={percent}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`Capacidad usada ${percent}%`}>
				<div
					className={percent >= 90 ? 'h-full bg-amber-500' : 'h-full bg-blue-500'}
					style={{ width: `${percent}%` }}
				/>
			</div>
			<p className='text-xs text-zinc-500'>
				{aggregate.physical_quantity} de {max} ({percent}%)
			</p>
		</div>
	);
};

export default CapacidadBodega;
