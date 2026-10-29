import React, { forwardRef, InputHTMLAttributes } from 'react';
import classNames from 'classnames';
import { TInputTypes } from '../../types/input.type';
import themeConfig from '../../config/theme.config';
import { TRounded } from '../../types/rounded.type';
import { TBorderWidth } from '../../types/borderWidth.type';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import { IValidationBaseProps } from './Validation';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';
import { resolveTailwindColor } from '@/utils/tailwindColorResolver.util';

export type TInputVariants = 'solid';
export type TInputDimension = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

interface IInputProps extends InputHTMLAttributes<HTMLInputElement>, Partial<IValidationBaseProps> {
	borderWidth?: TBorderWidth;
	label?: string;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	name: string;
	rounded?: TRounded;
	dimension?: TInputDimension;
	type?: TInputTypes;
	value?: string | number | readonly string[] | undefined;
	variant?: TInputVariants;
}
const Input = forwardRef<HTMLInputElement, IInputProps>((props, ref) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	// Extraer props personalizados para no pasarlos al input nativo
	const {
		borderWidth = themeConfig.borderWidth,
		label,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		name,
		rounded = themeConfig.rounded,
		dimension = 'default',
		variant = 'solid',
		isValid,
		isTouched,
		invalidFeedback,
		validFeedback, // props personalizados
		isValidMessage, // props personalizados
		children, // Excluir children explícitamente
		style,
		...rest
	} = props;

	const resolvedBorderColor = '#d4d4d8';
	const resolvedBorderHoverColor = resolveTailwindColor(color, colorIntensity);

	// Eliminar props personalizados del objeto rest
	const inputProps = { ...rest };
	delete (inputProps as any).validFeedback;
	delete (inputProps as any).isValidMessage;
	delete (inputProps as any).invalidFeedback;
	delete (inputProps as any).isValid;
	delete (inputProps as any).isTouched;
	delete (inputProps as any).children;

	const inputVariants: { [key in TInputVariants]: { general: string; validation: string } } = {
		solid: {
			general: classNames(
				// Default
				[`${borderWidth} border-zinc-300 dark:border-zinc-700`],
				'bg-zinc-50 dark:bg-zinc-900',
				// Hover
				'hover:border-[color:var(--input-border-hover)]',
				'dark:hover:border-[color:var(--input-border-hover)]',
				'disabled:opacity-50 disabled:!border-zinc-300',
				// Focus
				'focus:border-[color:var(--input-border-hover)] dark:focus:border-[color:var(--input-border-hover)]',
				'focus:bg-white dark:focus:bg-zinc-800',
				'focus:ring-1 focus:ring-[color:var(--input-border-hover)]',
			),
			validation: classNames({
				'!border-red-500 ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'!border-green-500 focus:ring-4 focus:ring-green-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
	};
	const inputVariantClasses = inputVariants[variant as TInputVariants].general;
	const inputValidationsClasses = inputVariants[variant as TInputVariants].validation;

	/**
	 * Padding & Font Size & Icon Margin
	 */
	const inputDimension: { [key in TInputDimension]: { general: string } } = {
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
	const inputDimensionClasses = inputDimension[dimension].general;

	const classes = classNames(
		'w-full appearance-none outline-0',
		'text-black dark:text-white',
		'disabled:bg-zinc-100 disabled:text-zinc-600 dark:disabled:bg-zinc-800/50 dark:disabled:text-zinc-400 disabled:border-zinc-200 dark:disabled:border-zinc-700 disabled:cursor-not-allowed',
		themeConfig.transition,
		inputVariantClasses,
		inputDimensionClasses,
		rounded,
		inputValidationsClasses,
		className,
	);

	return (
		<input
			ref={ref}
			data-component-name='Input'
			className={classes}
			style={
				{
					'--input-border': resolvedBorderColor,
					'--input-border-hover': resolvedBorderHoverColor,
					...(style as React.CSSProperties),
				} as React.CSSProperties
			}
			name={name}
			{...inputProps}
		/>
	);
});
Input.displayName = 'Input';

export default Input;
