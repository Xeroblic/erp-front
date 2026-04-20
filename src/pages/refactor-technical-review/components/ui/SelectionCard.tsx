/**
 * SelectionCard — Tarjeta de selección reutilizable para opciones de formulario.
 *
 * Uso:
 *   <SelectionCard
 *     label="Buen Estado"
 *     value="good"
 *     isSelected={selected === 'good'}
 *     onClick={() => setSelected('good')}
 *     color="green"
 *   />
 */
import React from 'react';
import Icon from '@/components/icon/Icon';
import type { TIcons } from '@/types/icons.type';

// ─── Types ────────────────────────────────────────────────────────────────────

type SelectionCardColor =
	| 'green'
	| 'red'
	| 'yellow'
	| 'gray'
	| 'blue'
	| 'orange'
	| 'fuchsia'
	| 'emerald';

export interface SelectionCardProps {
	/** Texto visible dentro de la tarjeta */
	label: string;
	/** Valor que representa esta opción (data attribute) */
	value: string;
	/** Si la opción está actualmente seleccionada */
	isSelected: boolean;
	/** Handler de click */
	onClick: () => void;
	/** Esquema de color semántico. Default: 'gray' */
	color?: SelectionCardColor;
	/** Icono HeroIcon opcional */
	icon?: TIcons;
	/** Clases CSS adicionales */
	className?: string;
	/** Variante de visualización. Default: 'default' */
	variant?: 'default' | 'compact';
}

// ─── Color Tokens ─────────────────────────────────────────────────────────────

const COLOR_STYLES: Record<SelectionCardColor, { selected: string; idle: string }> = {
	green: {
		selected:
			'bg-green-100 border-green-500 text-green-800 shadow-md ring-1 ring-green-500 ring-offset-1 dark:bg-green-900/60 dark:border-green-400 dark:text-green-100',
		idle: 'bg-green-50/50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/10 dark:border-green-900/30 dark:text-green-400',
	},
	red: {
		selected:
			'bg-red-100 border-red-500 text-red-800 shadow-md ring-1 ring-red-500 ring-offset-1 dark:bg-red-900/60 dark:border-red-400 dark:text-red-100',
		idle: 'bg-red-50/50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400',
	},
	yellow: {
		selected:
			'bg-yellow-100 border-yellow-500 text-yellow-800 shadow-md ring-1 ring-yellow-500 ring-offset-1 dark:bg-yellow-900/60 dark:border-yellow-400 dark:text-yellow-100',
		idle: 'bg-yellow-50/50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-400',
	},
	blue: {
		selected:
			'bg-blue-100 border-blue-500 text-blue-800 shadow-md ring-1 ring-blue-500 ring-offset-1 dark:bg-blue-900/60 dark:border-blue-400 dark:text-blue-100',
		idle: 'bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-400',
	},
	orange: {
		selected:
			'bg-orange-100 border-orange-500 text-orange-800 shadow-md ring-1 ring-orange-500 ring-offset-1 dark:bg-orange-900/60 dark:border-orange-400 dark:text-orange-100',
		idle: 'bg-orange-50/50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30 dark:text-orange-400',
	},
	gray: {
		selected:
			'bg-blue-100 border-blue-500 text-blue-800 shadow-md ring-1 ring-blue-500 ring-offset-1 dark:bg-blue-900/60 dark:border-blue-400 dark:text-blue-100',
		idle: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
	},
	fuchsia: {
		selected:
			'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-800 shadow-md ring-1 ring-fuchsia-500 ring-offset-1 dark:bg-fuchsia-900/60 dark:border-fuchsia-400 dark:text-fuchsia-100',
		idle: 'bg-fuchsia-50/50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-900/10 dark:border-fuchsia-900/30 dark:text-fuchsia-400',
	},
	emerald: {
		selected:
			'bg-emerald-100 border-emerald-500 text-emerald-800 shadow-md ring-1 ring-emerald-500 ring-offset-1 dark:bg-emerald-900/60 dark:border-emerald-400 dark:text-emerald-100',
		idle: 'bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-400',
	},
};

export const SelectionCard: React.FC<SelectionCardProps> = ({
	label,
	value,
	isSelected,
	onClick,
	color = 'gray',
	icon,
	className = '',
	variant = 'default',
}) => {
	const tokens = COLOR_STYLES[color];
	const stateClass = isSelected ? tokens.selected : tokens.idle;
	const interactionClass = isSelected
		? 'z-0 scale-100'
		: 'z-0 scale-100 hover:-translate-y-[1px]';

	// Base styles based on variant
	const isCompact = variant === 'compact';
	const paddingClass = isCompact ? 'p-2' : 'p-3';
	const minHeightClass = isCompact ? 'min-h-[50px]' : 'min-h-[70px]';
	const iconSizeClass = isCompact ? 'h-5 w-5' : 'h-6 w-6';
	const textSizeClass = isCompact ? 'text-xs' : 'text-sm';
	const gapClass = isCompact ? 'gap-1.5' : 'gap-2';

	return (
		<button
			type='button'
			role='radio'
			aria-checked={isSelected}
			data-value={value}
			onClick={onClick}
			className={`relative cursor-pointer rounded-xl border-2 text-center transition-all duration-200 ${interactionClass} ${stateClass} flex flex-col items-center justify-center ${paddingClass} ${minHeightClass} ${gapClass} ${className}`}>
			{icon && (
				<Icon
					icon={icon}
					className={`${iconSizeClass} ${isSelected ? '' : 'opacity-80'}`}
				/>
			)}
			<span
				className={`${textSizeClass} font-semibold ${isSelected ? 'font-bold' : ''} w-full leading-tight`}>
				{label}
			</span>
		</button>
	);
};
