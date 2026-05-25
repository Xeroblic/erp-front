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
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
	resolveTailwindColor,
	resolveTailwindColorAlpha,
} from '@/utils/tailwindColorResolver.util';

export type TBadgeVariants = 'solid' | 'outline' | 'default';
// const { themeColor, themeColorShade } = useThemeColor();

interface IBadgeProps {
	borderWidth?: TBorderWidth;
	children: ReactNode;
	className?: string;
	color?: TColors | string;
	colorIntensity?: TColorIntensity | number;
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

	const badgeRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (badgeRef.current) {
			gsap.fromTo(
				badgeRef.current,
				{ scale: 0.8, opacity: 0 },
				{ scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' },
			);
		}
	}, []);

	const parsedIntensity = String(colorIntensity) as TColorIntensity;
	const parsedColor = String(color) as TColors;

	const { textColor } = useColorIntensity(parsedIntensity);
	const resolvedTextColor = resolveTailwindColor(parsedColor, parsedIntensity);
	const resolvedBgColor = resolveTailwindColor(parsedColor, parsedIntensity);
	const resolvedSoftBgColor = resolveTailwindColorAlpha(parsedColor, parsedIntensity, 0.1);
	const resolvedBorderColor = resolveTailwindColor(parsedColor, parsedIntensity);

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
		solid: classNames([`${textColor}`], 'bg-[color:var(--badge-bg)]', 'border-transparent'),
		outline: classNames(
			'border-[color:var(--badge-border)]',
			'bg-[color:var(--badge-bg-soft)]',
			'text-[color:var(--badge-text)]',
		),
		default: classNames('text-[color:var(--badge-text)]', 'border-transparent'),
	};
	const badgeVariantClasses = badgeVariant[variant];

	const classes = classNames(
		'inline-flex items-center justify-center px-2',

		[`${borderWidth}`],
		[`${rounded}`],
		badgeVariantClasses,
		className,
	);

	return (
		<span
			ref={badgeRef}
			data-component-name='Badge'
			className={classes}
			style={
				{
					'--badge-text': resolvedTextColor,
					'--badge-bg': resolvedBgColor,
					'--badge-bg-soft': resolvedSoftBgColor,
					'--badge-border': resolvedBorderColor,
				} as React.CSSProperties
			}
			{...rest}>
			{typewriter ? typewriterResult.text : children}
		</span>
	);
};
Badge.displayName = 'Badge';

export default Badge;
