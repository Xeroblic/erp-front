import React, { FC, TextareaHTMLAttributes } from 'react';
import classNames from 'classnames';
import { IValidationBaseProps } from './Validation';
import { TBorderWidth } from '../../types/borderWidth.type';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import { TRounded } from '../../types/rounded.type';
import themeConfig from '../../config/theme.config';
import { TInputVariants } from './Input';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';
import { resolveTailwindColor } from '@/utils/tailwindColorResolver.util';

export type TTextareaVariants = 'solid';
export type TTextareaDimension = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

interface ITextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement>,
		Partial<IValidationBaseProps> {
	borderWidth?: TBorderWidth;
	className?: string;
	label?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	rounded?: TRounded;
	dimension?: TTextareaDimension;
	value?: string | number | readonly string[] | undefined;
	variant?: TTextareaVariants;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, ITextareaProps>((props, ref) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();
	const {
		borderWidth = themeConfig.borderWidth,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		rounded = themeConfig.rounded,
		dimension = 'default',
		isValid,
		label,
		isTouched,
		invalidFeedback,
		variant = 'solid',
		style,
		...rest
	} = props;

	const resolvedBorderColor = resolveTailwindColor(color, colorIntensity);
	const resolvedBorderHoverColor = resolveTailwindColor(color, colorIntensity);

	const inputVariants: { [key in TInputVariants]: { general: string; validation: string } } = {
		solid: {
			general: classNames(
				// Default
				[`${borderWidth} border-[color:var(--textarea-border)] dark:border-zinc-800`],
				'bg-gray-300 dark:bg-zinc-800',
				// Hover
				'hover:border-[color:var(--textarea-border-hover)]',
				'dark:hover:border-[color:var(--textarea-border-hover)]',
				'disabled:!border-zinc-500',
				// Focus
				'focus:border-zinc-300 dark:focus:border-zinc-800',
				'focus:bg-transparent dark:focus:bg-transparent',
			),
			validation: classNames({
				'!border-red-500 ring-4 ring-red-500/30': !isValid && isTouched && invalidFeedback,
				'!border-green-500 focus:ring-4 focus:ring-green-500/30':
					!isValid && isTouched && !invalidFeedback,
			}),
		},
	};
	const inputVariantClasses = inputVariants[variant as TTextareaVariants].general;
	const inputValidationsClasses = inputVariants[variant as TTextareaVariants].validation;

	/**
	 * Padding & Font Size & Icon Margin
	 */
	const inputDimension: { [key in TTextareaDimension]: { general: string } } = {
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
		<textarea
			data-component-name='Textarea'
			className={classes}
			ref={ref}
			style={
				{
					'--textarea-border': resolvedBorderColor,
					'--textarea-border-hover': resolvedBorderHoverColor,
					...(style as React.CSSProperties),
				} as React.CSSProperties
			}
			{...rest}
		/>
	);
});
Textarea.displayName = 'Textarea';

export default Textarea;
