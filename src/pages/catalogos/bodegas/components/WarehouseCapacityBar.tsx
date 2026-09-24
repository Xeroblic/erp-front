import React from 'react';

interface WarehouseCapacityBarProps {
	current: number;
	maximum: number | null;
}

/**
 * Capacidad usada de una bodega, con el mismo formato que `CapacidadBodega`
 * de Inventario; «Sin definir» si no tiene máximo configurado.
 */
const WarehouseCapacityBar: React.FC<WarehouseCapacityBarProps> = ({ current, maximum }) => {
	if (!maximum) return <span className='text-sm text-zinc-500'>Sin definir</span>;
	const percent = Math.min(100, Math.round((current / maximum) * 100));
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
				{current} de {maximum} ({percent}%)
			</p>
		</div>
	);
};

export default WarehouseCapacityBar;
