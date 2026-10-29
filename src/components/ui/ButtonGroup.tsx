import React, { Children, cloneElement, FC, HTMLAttributes, ReactElement } from 'react';
import classNames from 'classnames';
import { IButtonProps, TButtonSize, TButtonVariants } from './Button';
import { TBorderWidth } from '../../types/borderWidth.type';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import { TRounded } from '../../types/rounded.type';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';

interface IButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
	borderWidth?: TBorderWidth;
	children: ReactElement<IButtonProps>[];
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	isVertical?: boolean;
	rounded?: TRounded;
	size?: TButtonSize;
	variant?: TButtonVariants;
}
const ButtonGroup: FC<IButtonGroupProps> = (props) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	const {
		borderWidth,
		children,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		isVertical = false,
		rounded,
		size,
		variant,
		...rest
	} = props;

	const classes = classNames('flex flex-wrap', { 'flex-col': isVertical });

	const childClasses = classNames({
		/**
		 * For Horizontal
		 */
		'not-last:ltr:rounded-r-none!': !isVertical,
		'not-last:rtl:rounded-l-none!': !isVertical,
		'not-first:ltr:rounded-l-none!': !isVertical,
		'not-first:rtl:rounded-r-none!': !isVertical,
		/**
		 * For Vertical
		 */
		'not-last:rounded-b-none!': isVertical,
		'not-first:rounded-t-none!': isVertical,
	});

	return (
		<div data-component-name='ButtonGroup' className={classNames(classes, className)} {...rest}>
			{Children.map(children, (child) =>
				cloneElement(child, {
					className: classNames(childClasses, child.props.className),
					borderWidth: borderWidth || child.props.borderWidth,
					color: color || child.props.color,
					colorIntensity: colorIntensity || child.props.colorIntensity,
					rounded: rounded || child.props.rounded,
					size: size || child.props.size,
					variant: variant || child.props.variant,
				}),
			)}
		</div>
	);
};
ButtonGroup.displayName = 'ButtonGroup';

export default ButtonGroup;
