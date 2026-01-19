import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import themeConfig from '../../config/theme.config';
import useColorIntensity from '../../hooks/useColorIntensity';
import { TBorderWidth } from '../../types/borderWidth.type';
import { TRounded } from '../../types/rounded.type';
import useReactiveThemeConfig from '../../hooks/useReactiveThemeConfig';
import { useTypewriter } from '@/hooks/useTypewriter';

export type TBadgeVariants = 'solid' | 'outline' | 'default';
// const { themeColor, themeColorShade } = useThemeColor();

interface IBadgeProps {
	borderWidth?: TBorderWidth;
	children: ReactNode;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	rounded?: TRounded;
	variant?: TBadgeVariants;
	typewriter?: boolean;
}
// Helper to convert ReactNode to string for typewriter
const reactNodeToString = (node: ReactNode): string => {
	if (typeof node === 'string') return node;
	if (typeof node === 'number') return String(node);
	if (node == null) return '';
	if (Array.isArray(node)) return node.map(reactNodeToString).join('');
	if (typeof node === 'object' && 'props' in node) {
		return reactNodeToString((node as any).props.children);
	}
	return '';
};

const Badge: FC<IBadgeProps> = (props) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	const {
		borderWidth = themeConfig.borderWidth,
		children,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		rounded = themeConfig.rounded,
		variant = 'default',
		typewriter = false,
		...rest
	} = props;

	const { textColor } = useColorIntensity(colorIntensity);

	const childrenAsString = reactNodeToString(children);

	const typewriterResult = useTypewriter(childrenAsString, { 
		loop: true, 
		withDelete: true,
		typingSpeedMs: 12,
		deletingSpeedMs: 12,
		pauseAfterTypedMs: 1500,
		pauseAfterDeletedMs: 1500,
		humanize: true,
	});

	const badgeVariant: { [key in TBadgeVariants]: string } = {
		solid: classNames(
			[`${textColor}`],
			[`bg-${color}-${colorIntensity}`],
			'border-transparent',
		),
		outline: classNames(
			[`border-${color}-${colorIntensity}`],
			[`bg-${color}-${colorIntensity}/10`],
			[`text-${color}-${colorIntensity}`],
		),
		default: classNames([`text-${color}-${colorIntensity}`], 'border-transparent'),
	};
	const badgeVariantClasses = badgeVariant[variant];

	const classes = classNames(
		'inline-flex items-center justify-center',

		[`${borderWidth}`],
		[`${rounded}`],
		badgeVariantClasses,
		className,
	);

	return (
		<span data-component-name='Badge' className={classes} {...rest}>
			{typewriter ? typewriterResult.text : children}
		</span>
	);
};
Badge.displayName = 'Badge';

export default Badge;
