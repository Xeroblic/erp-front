import React, { FC, ReactNode, SelectHTMLAttributes } from 'react';
import classNames from 'classnames';
import themeConfig from '../../config/theme.config';
import { TRounded } from '../../types/rounded.type';
import { TBorderWidth } from '../../types/borderWidth.type';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import { IValidationBaseProps } from './Validation';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';
import { resolveTailwindColor } from '@/utils/tailwindColorResolver.util';

export type TSelectVariants = 'solid';
export type TSelectDimension = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

interface ISelectProps
	extends SelectHTMLAttributes<HTMLSelectElement>,
		Partial<IValidationBaseProps> {
	borderWidth?: TBorderWidth;
	className?: string;
	children: ReactNode;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	name: string;
	rounded?: TRounded;
	dimension?: TSelectDimension;
	value?: string | number | readonly string[] | undefined;
	variant?: TSelectVariants;
	placeholder?: string;
}
// `appearance-none` quita la flecha nativa; se repone con un chevron neutro (zinc-400)
// legible en tema claro y oscuro.
const SELECT_CHEVRON =
	"url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a1a1aa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")";

const Select: FC<ISelectProps> = (props) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	const {
		borderWidth = themeConfig.borderWidth,
		className,
		children,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		name,
		rounded = themeConfig.rounded,
		dimension = 'default',
		variant = 'solid',
		placeholder,
		isValid,
		isTouched,
		invalidFeedback,
		style,
		...rest
	} = props;

	// Borde neutro en reposo (como Input): el color del tema queda para hover y foco,
	// así el select no parece enfocado sin estarlo.
	const resolvedBorderColor = '#d4d4d8';
	const resolvedBorderHoverColor = resolveTailwindColor(color, colorIntensity);
	const showsChevron = !rest.multiple && !rest.size;

	const selectVariants: {
		[key in TSelectVariants]: { general: string; validation: string };
	} = {
		solid: {
			general: classNames(
				// Default
				[`${borderWidth} border-[color:var(--select-border)] dark:border-zinc-800`],
				'bg-zinc-50 dark:bg-zinc-800',
				// Hover
				'hover:border-[color:var(--select-border-hover)]',
				'dark:hover:border-[color:var(--select-border-hover)]',
				'disabled:!border-zinc-500',
				// Focus
				'focus:border-[color:var(--select-border-hover)] dark:focus:border-[color:var(--select-border-hover)]',
				'focus:bg-white dark:focus:bg-zinc-800',
				'focus:ring-1 focus:ring-[color:var(--select-border-hover)]',
			),
			validation: classNames({
				'!border-red-500 ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'!border-green-500 focus:ring-4 focus:ring-green-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
	};
	const selectVariantClasses = selectVariants[variant as TSelectVariants].general;
	const selectValidationsClasses = selectVariants[variant as TSelectVariants].validation;

	/**
	 * Padding & Font Size & Icon Margin
	 */
	const selectDimension: { [key in TSelectDimension]: { general: string } } = {
		xs: {
			general: classNames('px-1.5', 'py-0.5', 'text-xs'),
		},
		sm: {
			general: classNames('px-1.5', 'py-1', 'text-sm'),
		},
		default: {
			general: classNames('px-1.5', 'py-1.5', 'text-base'),
		},
		lg: {
			general: classNames('px-1.5', 'py-2', 'text-lg'),
		},
		xl: {
			general: classNames('px-1.5', 'py-2.5', 'text-xl'),
		},
	};
	const selectDimensionClasses = selectDimension[dimension].general;

	const classes = classNames(
		'w-full appearance-none outline-0',
		'text-black dark:text-white',
		// La lista nativa no hereda el fondo del select: en modo oscuro las
		// opciones necesitan colores propios. En claro se dejan las del navegador
		// para no romper el resaltado al pasar el mouse (`color-scheme` en index.css).
		'dark:[&_option]:bg-zinc-900 dark:[&_option]:text-zinc-100',
		'disabled:!opacity-25',
		themeConfig.transition,
		selectVariantClasses,
		selectDimensionClasses,
		{ 'bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8': showsChevron },
		rounded,
		selectValidationsClasses,
		className,
	);

	return (
		<select
			data-component-name='select'
			className={classes}
			name={name}
			style={
				{
					'--select-border': resolvedBorderColor,
					'--select-border-hover': resolvedBorderHoverColor,
					...(showsChevron && { backgroundImage: SELECT_CHEVRON }),
					...(style as React.CSSProperties),
				} as React.CSSProperties
			}
			{...rest}>
			{placeholder && !rest?.value && (
				<option value={undefined} hidden>
					{placeholder}
				</option>
			)}
			{children}
		</select>
	);
};

export default Select;
