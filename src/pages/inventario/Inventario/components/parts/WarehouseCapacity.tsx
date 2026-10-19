import React from 'react';
import type { IInventoryWarehouseAggregate } from '@/interface/inventoryOverview.interface';

/**
 * Capacidad usada de una bodega; «Sin definir» si no tiene máximo configurado.
 * Sin unidades de la ubicación (la API real no las suma) sólo se informa el
 * máximo: un porcentaje calculado sobre otra cifra no sería el uso real.
 */
const WarehouseCapacity: React.FC<{ aggregate: IInventoryWarehouseAggregate }> = ({
	aggregate,
}) => {
	const max = aggregate.maximum_capacity;
	const used = aggregate.physical_quantity;
	if (!max) return <span className='text-sm text-zinc-500'>Sin definir</span>;
	if (used === null)
		return (
			<span className='text-sm text-zinc-600 dark:text-zinc-300'>
				Máximo {max.toLocaleString('es-CL')}
			</span>
		);
	const percent = Math.min(100, Math.round((used / max) * 100));
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
				{used} de {max} ({percent}%)
			</p>
		</div>
	);
};

export default WarehouseCapacity;
