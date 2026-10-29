import React from 'react';

/**
 * Píldora sólida (fondo de color y texto blanco), forma que el `Badge` del
 * Design System no ofrece. `width` es fijo para que las píldoras de una misma
 * columna midan lo mismo; cada llamador lo fija según su etiqueta más larga.
 */
export type TStatusPillColor = 'zinc' | 'blue' | 'violet' | 'emerald' | 'amber' | 'red';

const COLOR_CLASSES: Record<TStatusPillColor, string> = {
	zinc: 'bg-zinc-600 text-white',
	blue: 'bg-blue-600 text-white',
	violet: 'bg-violet-600 text-white',
	emerald: 'bg-emerald-600 text-white',
	amber: 'bg-amber-600 text-white',
	red: 'bg-red-600 text-white',
};

const DEFAULT_WIDTH_REM = 7;

export interface IStatusPillProps {
	color: TStatusPillColor;
	children: React.ReactNode;
	/** Ancho fijo en rem. Todas las píldoras de la misma columna deben pasar el mismo valor. */
	width?: number;
	/** Ignora `width` y se ajusta al contenido, para usos fuera de una columna de tabla. */
	fit?: boolean;
	className?: string;
}

const StatusPill: React.FC<IStatusPillProps> = ({
	color,
	children,
	width = DEFAULT_WIDTH_REM,
	fit = false,
	className,
}) => (
	<span
		style={fit ? undefined : { width: `${width}rem` }}
		className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-center text-sm font-semibold shadow-sm ${fit ? 'w-fit whitespace-nowrap' : 'whitespace-normal'} ${COLOR_CLASSES[color]} ${className ?? ''}`}>
		{children}
	</span>
);

export default StatusPill;
