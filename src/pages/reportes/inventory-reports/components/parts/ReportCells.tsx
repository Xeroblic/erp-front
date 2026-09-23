import React from 'react';

export const formatUnits = (value: number): string =>
	value.toLocaleString('es-CL', { maximumFractionDigits: 2 });

/** Fecha ISO (`2026-09-10` o con hora) como `10-09-2026`, sin correrse por zona horaria. */
export const formatReportDate = (iso: string): string => {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	return match ? `${match[3]}-${match[2]}-${match[1]}` : iso;
};

export const EmptyCell = () => <span className='text-sm text-zinc-500'>—</span>;

/**
 * Nombre con el SKU debajo, como `ProductCard` compacto en Inventario. El tope
 * va dentro de la celda: con `truncate` sin ancho máximo, el layout automático
 * de la tabla fija la columna al nombre completo y empuja las demás fuera.
 */
export const ProductCell: React.FC<{ name: string; sku: string }> = ({ name, sku }) => (
	<div className='min-w-0 max-w-[280px] py-1'>
		<p className='line-clamp-2 break-words text-sm font-semibold' title={name}>
			{name}
		</p>
		<p className='mt-0.5 break-words font-mono text-xs text-zinc-500 dark:text-zinc-400'>
			{sku}
		</p>
	</div>
);

/** Cifra principal de la fila: grande, y en rojo cuando no queda nada. */
export const UnitsCell: React.FC<{ value: number; emphasis?: boolean }> = ({
	value,
	emphasis = false,
}) => {
	if (!emphasis) return <span className='tabular-nums'>{formatUnits(value)}</span>;
	return (
		<span
			className={
				value <= 0
					? 'text-lg font-semibold tabular-nums text-red-700 dark:text-red-300'
					: 'text-lg font-semibold tabular-nums'
			}>
			{formatUnits(value)}
		</span>
	);
};
