import React from 'react';

/**
 * Píldora de estado sólida: mismo estilo que `DeferredStatusPill`/
 * `DaysUntilDueBadge` de pagos diferidos (fondo de color + texto blanco,
 * esquinas completas). El `Badge` genérico del Design System no ofrece esta
 * forma (usa el color como fondo suave, no sólido), así que los estados de
 * abastecimiento la comparten desde acá en vez de repetir el marcado.
 *
 * `width` es fijo en rem, no un rango: todas las píldoras de una misma
 * columna deben medir exactamente lo mismo entre sí (p. ej. las tres
 * variantes de «Cobertura»), pero columnas distintas —con etiquetas más
 * cortas o más largas— pueden y deben usar anchos distintos. Cada llamador
 * fija el suyo según la etiqueta más larga de su propia columna.
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
	className?: string;
}

const StatusPill: React.FC<IStatusPillProps> = ({
	color,
	children,
	width = DEFAULT_WIDTH_REM,
	className,
}) => (
	<span
		style={{ width: `${width}rem` }}
		className={`inline-flex items-center justify-center whitespace-normal rounded-full px-3 py-1.5 text-center text-sm font-semibold shadow-sm ${COLOR_CLASSES[color]} ${className ?? ''}`}>
		{children}
	</span>
);

export default StatusPill;
