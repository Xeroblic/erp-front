import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import { TRounded } from '../../types/rounded.type';
import themeConfig from '../../config/theme.config';
import useColorIntensity from '../../hooks/useColorIntensity';
import { TIcons } from '../../types/icons.type';
import Icon from '../icon/Icon';
import { TBorderWidth } from '../../types/borderWidth.type';
import useReactiveThemeConfig from '../../hooks/useReactiveThemeConfig';
import { textColor as getTextColor } from '../../utils/textColor.util';

export type TButtonVariants = 'solid' | 'outline' | 'default';
export type TButtonSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

export interface IButtonProps
	extends Omit<HTMLAttributes<HTMLButtonElement>, 'disabled' | 'color'> {
	borderWidth?: TBorderWidth;
	children?: ReactNode;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	icon?: TIcons;
	isActive?: boolean;
	isDisable?: boolean;
	isLoading?: boolean;
	rightIcon?: TIcons;
	iconColor?: string;
	iconClassName?: string;
	rightIconColor?: string;
	rounded?: TRounded;
	size?: TButtonSize;
	variant?: TButtonVariants;
	type?: 'button' | 'submit' | 'reset';
	disabled?: boolean;
	inMouseEnter?: () => void;
	inMouseLeave?: () => void;
}

const Button = forwardRef<HTMLButtonElement, IButtonProps>((props, ref) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	const {
		borderWidth = themeConfig.borderWidth,
		children,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		icon,
		isActive = false,
		isDisable = false,
		isLoading = false,
		rightIcon,
		iconColor,
		iconClassName,
		rightIconColor,
		rounded = themeConfig.rounded,
		size = 'default',
		variant = 'default',
		type = 'button',
		disabled = false,
		...rest
	} = props;

	const { textColor: contrastTextColor, shadeColorIntensity } = useColorIntensity(colorIntensity);

	const isSolid = variant === 'solid';
	const effectiveTextColor = isSolid ? 'text-white' : contrastTextColor;
	const HAS_CHILDREN = typeof children !== 'undefined';
	const accentTextColor = getTextColor(color, colorIntensity);
	const iconComputedColor =
		iconColor ?? (isSolid ? 'text-white' : accentTextColor ?? contrastTextColor);
	const rightIconComputedColor =
		rightIconColor ?? (isSolid ? 'text-white' : accentTextColor ?? contrastTextColor);

	const btnVariants: { [key in TButtonVariants]: string } = {
		solid: classNames(
			{ [`bg-${color}-${colorIntensity}`]: !isActive },
			[effectiveTextColor],
			[`${borderWidth} border-${color}-${colorIntensity}`],
			[`${contrastTextColor}`],
			[`hover:bg-${color}-${shadeColorIntensity as TColorIntensity}`],
			[`hover:border-${color}-${shadeColorIntensity as TColorIntensity}`],
			[`active:bg-${color}-${shadeColorIntensity as TColorIntensity}`],
			[`active:border-${color}-${shadeColorIntensity as TColorIntensity}`],
			{
				[`bg-${color}-${shadeColorIntensity as TColorIntensity}`]: isActive,
				[`border-${color}-${shadeColorIntensity as TColorIntensity}`]: isActive,
			},
		),
		outline: classNames(
			'bg-transparent',
			[`${borderWidth}`],
			{
				[`border-${color}-${colorIntensity}/50`]: !isActive,
			},
			'text-black dark:text-white',
			[`hover:border-${color}-${colorIntensity}`],
			[`active:border-${color}-${colorIntensity}`],
			{
				[`border-${color}-${colorIntensity}`]: isActive,
			},
			
		),
		default: classNames(
			'bg-transparent',
			{ 'text-zinc-600 dark:text-zinc-400': !isActive },
			[`${borderWidth}`],
			'border-transparent',
			[`hover:text-${color}-${colorIntensity} dark:hover:text-${color}-${colorIntensity}`],
			[`active:text-${color}-${colorIntensity}`],
			{
				[`text-${color}-${colorIntensity}`]: isActive,
			},
		),
	};
	const btnVariantClasses = btnVariants[variant];

	const btnSizes: {
		[key in TButtonSize]: { general: string; icon: string; rightIcon: string };
	} = {
		xs: {
			general: classNames(
				{ 'px-3': HAS_CHILDREN, 'px-0.5': !HAS_CHILDREN },
				'py-0.5',
				'text-xs',
			),
			icon: classNames({ 'ltr:mr-1 rtl:ml-1': HAS_CHILDREN }, 'text-[1.125rem]' , iconClassName),
			rightIcon: classNames('ltr:ml-1', 'rtl:mr-1', 'text-[1.125rem]'),
		},
		sm: {
			general: classNames({ 'px-4': HAS_CHILDREN, 'px-1': !HAS_CHILDREN }, 'py-1', 'text-sm'),
			icon: classNames({ 'ltr:mr-1 rtl:ml-1': HAS_CHILDREN }, 'text-[1.25rem]' , iconClassName),
			rightIcon: classNames('ltr:ml-1', 'rtl:mr-1', 'text-[1.25rem]'),
		},
		default: {
			general: classNames(
				{ 'px-5': HAS_CHILDREN, 'px-1.5': !HAS_CHILDREN },
				'py-1.5',
				'text-base',
			),
			icon: classNames({ 'ltr:mr-1.5 rtl:ml-1.5': HAS_CHILDREN }, 'text-[1.5rem]' , iconClassName),
			rightIcon: classNames('ltr:ml-1.5', 'rtl:mr-1.5', 'text-[1.5rem]'),
		},
		lg: {
			general: classNames({ 'px-6': HAS_CHILDREN, 'px-2': !HAS_CHILDREN }, 'py-2', 'text-lg'),
			icon: classNames({ 'ltr:mr-2 rtl:ml-2': HAS_CHILDREN }, 'text-[1.75rem]' , iconClassName),
			rightIcon: classNames('ltr:ml-2', 'rtl:mr-2', 'text-[1.75rem]'),
		},
		xl: {
			general: classNames(
				{ 'px-7': HAS_CHILDREN, 'px-2.5': !HAS_CHILDREN },
				'py-2.5',
				'text-xl',
			),
			icon: classNames({ 'ltr:mr-2.5 rtl:ml-2.5': HAS_CHILDREN }, 'text-[1.75rem]' , iconClassName),
			rightIcon: classNames('ltr:ml-2.5', 'rtl:mr-2.5'),
		},
	};
	const btnSizeClasses = btnSizes[size].general;
	const btnIconClasses = btnSizes[size].icon;
	const btnRightIconClasses = HAS_CHILDREN ? btnSizes[size].rightIcon : undefined;

	const btnDisabledClasses = 'opacity-50 pointer-events-none';
	const isButtonDisabled = isDisable || isLoading || disabled;

	const classes = classNames(
		'inline-flex items-center justify-center',
		btnVariantClasses,
		btnSizeClasses,
		rounded,
		themeConfig.transition,
		{ [`${btnDisabledClasses}`]: isButtonDisabled },
		className,
	);

	return (
		<button
			ref={ref}
			data-component-name='Button'
			type={type}
			className={classes}
			disabled={isButtonDisabled}
			{...rest}>
			{(!!icon || isLoading) && (
				<Icon
					icon={isLoading ? 'DuoLoading' : (icon as TIcons)}
					className={classNames(
						{ 'animate-spin': isLoading },
						btnIconClasses,
						iconComputedColor,
					)}
				/>
			)}
			{children}
			{!!rightIcon && (
				<Icon
					icon={rightIcon}
					className={classNames(btnRightIconClasses, rightIconComputedColor)}
				/>
			)}
		</button>
	);
});

Button.displayName = 'Button';

export default Button;
