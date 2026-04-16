import React, { forwardRef, HTMLAttributes, memo, ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import pascalcase from 'pascalcase';
import { TIcons } from '../../types/icons.type';
import { TColors } from '../../types/colors.type';
import { TColorIntensity } from '../../types/colorIntensities.type';
import { textColor } from '../../utils/textColor.util';
import { TFontSizes } from '../../types/fontSizes.type';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';

type TIconKind = 'svg' | 'duotone' | 'hero';
type TIconComponent = React.ComponentType<Record<string, unknown>>;
type TIconLoader = () => Promise<{ default: TIconComponent }>;

const svgIconModules = import.meta.glob<{ default: TIconComponent }>('./svg-icons/*.tsx');
const duoToneModules = import.meta.glob<{ default: TIconComponent }>('./duotone/*.tsx');
const heroIconModules = import.meta.glob<{ default: TIconComponent }>('./heroicons/*.tsx');

const iconCache = new Map<string, { component: TIconComponent; kind: TIconKind }>();
const missingIconCache = new Set<string>();

const resolveIconLoader = (iconName: string): { loader: TIconLoader; kind: TIconKind } | null => {
	const svgLoader = svgIconModules[`./svg-icons/${iconName}.tsx`];
	if (svgLoader) {
		return { loader: svgLoader as TIconLoader, kind: 'svg' };
	}

	if (iconName.startsWith('Duo')) {
		const duoLoader = duoToneModules[`./duotone/${iconName.slice(3)}.tsx`];
		if (duoLoader) {
			return { loader: duoLoader as TIconLoader, kind: 'duotone' };
		}
	}

	if (iconName.startsWith('Hero')) {
		const heroLoader = heroIconModules[`./heroicons/${iconName.slice(4)}.tsx`];
		if (heroLoader) {
			return { loader: heroLoader as TIconLoader, kind: 'hero' };
		}
	}

	return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IRefWrapperProps extends Record<string, any> {
	children: ReactNode;
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

const RefWrapper = forwardRef<HTMLSpanElement, IRefWrapperProps>(({ children }, ref) => {
	if (ref) {
		return (
			<span ref={ref} data-only-ref='true'>
				{children}
			</span>
		);
	}
	return children;
});
RefWrapper.displayName = 'RefWrapper';

type TColorObject = {
	base: TColors;
	hover?: string;
};

export interface IIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
	icon: TIcons;
	className?: string;
	color?: TColors | TColorObject;
	colorIntensity?: TColorIntensity;
	size?: TFontSizes;
}

const Icon = forwardRef<HTMLSpanElement, IIconProps>((props, ref) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();

	const {
		icon,
		className,
		color = reactiveThemeColor,
		colorIntensity = reactiveThemeColorShade,
		size,
		...rest
	} = props;
	const IconName = pascalcase(icon);
	const [resolvedIcon, setResolvedIcon] = useState<{
		component: TIconComponent;
		kind: TIconKind;
	} | null>(null);
	// logica para soportar 2 colores
	const isColorObject = typeof color === 'object' && color !== null;

	const baseColorArg = isColorObject ? (color as TColorObject).base : (color as TColors);

	// En tu Icon.tsx, cambia la lógica del hoverClass a esto:
	const hoverClass =
		isColorObject && (color as TColorObject).hover
			? (color as TColorObject).hover // <-- Pasamos el string crudo
			: '';

	const CLASS_NAMES = classNames(
		'svg-icon',
		{ [`${size as TFontSizes}`]: typeof size !== 'undefined' },
		textColor(baseColorArg, colorIntensity),
		hoverClass,
		className,
	);

	useEffect(() => {
		if (missingIconCache.has(IconName)) {
			setResolvedIcon(null);
			return;
		}

		const cachedIcon = iconCache.get(IconName);
		if (cachedIcon) {
			setResolvedIcon(cachedIcon);
			return;
		}

		const iconToLoad = resolveIconLoader(IconName);
		if (!iconToLoad) {
			missingIconCache.add(IconName);
			setResolvedIcon(null);
			return;
		}

		let isMounted = true;
		setResolvedIcon(null);

		iconToLoad
			.loader()
			.then((module) => {
				if (!isMounted) return;

				const nextIcon = {
					component: module.default,
					kind: iconToLoad.kind,
				};

				iconCache.set(IconName, nextIcon);
				setResolvedIcon(nextIcon);
			})
			.catch(() => {
				if (!isMounted) return;
				missingIconCache.add(IconName);
				setResolvedIcon(null);
			});

		return () => {
			isMounted = false;
		};
	}, [IconName]);

	if (!resolvedIcon) {
		return null;
	}

	const IconComponent = resolvedIcon.component;
	const iconMeta =
		resolvedIcon.kind === 'svg'
			? { componentName: 'Icon-A', name: `SvgIcon--${IconName}` }
			: resolvedIcon.kind === 'duotone'
				? { componentName: 'Icon-B', name: `Duotone--${icon}` }
				: { componentName: 'Icon-C', name: `Hero--${icon}` };

	return (
		<RefWrapper ref={ref}>
			<IconComponent
				data-component-name={iconMeta.componentName}
				data-name={iconMeta.name}
				className={CLASS_NAMES}
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...rest}
			/>
		</RefWrapper>
	);
});
Icon.displayName = 'Icon';

export default memo(Icon);
