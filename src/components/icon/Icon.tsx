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
type TResolvedIcon = { component: TIconComponent; kind: TIconKind };

const svgIconModules = import.meta.glob<{ default: TIconComponent }>('./svg-icons/*.tsx');
const duoToneModules = import.meta.glob<{ default: TIconComponent }>('./duotone/*.tsx');
const heroIconModules = import.meta.glob<{ default: TIconComponent }>('./heroicons/*.tsx');

const iconCache = new Map<string, TResolvedIcon>();
const pendingIconCache = new Map<string, Promise<TResolvedIcon | null>>();
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

const loadIcon = (iconName: string): Promise<TResolvedIcon | null> => {
	if (missingIconCache.has(iconName)) return Promise.resolve(null);
	const cachedIcon = iconCache.get(iconName);
	if (cachedIcon) return Promise.resolve(cachedIcon);
	const pendingIcon = pendingIconCache.get(iconName);
	if (pendingIcon) return pendingIcon;

	const iconToLoad = resolveIconLoader(iconName);
	if (!iconToLoad) {
		missingIconCache.add(iconName);
		return Promise.resolve(null);
	}

	const loadingIcon = iconToLoad
		.loader()
		.then((module) => {
			const resolvedIcon = { component: module.default, kind: iconToLoad.kind };
			iconCache.set(iconName, resolvedIcon);
			return resolvedIcon;
		})
		.finally(() => pendingIconCache.delete(iconName));
	pendingIconCache.set(iconName, loadingIcon);
	return loadingIcon;
};

export const preloadIcons = (icons: readonly TIcons[]): void => {
	icons.forEach((icon) => {
		loadIcon(pascalcase(icon)).catch(() => undefined);
	});
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
	const [resolvedIcon, setResolvedIcon] = useState<{ name: string; icon: TResolvedIcon } | null>(
		() => {
			const cachedIcon = iconCache.get(IconName);
			return cachedIcon ? { name: IconName, icon: cachedIcon } : null;
		},
	);
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
			setResolvedIcon({ name: IconName, icon: cachedIcon });
			return;
		}

		let isMounted = true;
		let retryTimer: ReturnType<typeof setTimeout> | undefined;
		setResolvedIcon(null);

		const load = (attempt: number) => {
			loadIcon(IconName)
				.then((nextIcon) => {
					if (!isMounted) return;
					setResolvedIcon(nextIcon ? { name: IconName, icon: nextIcon } : null);
				})
				.catch(() => {
					if (!isMounted) return;
					// El archivo existe (resolveIconLoader lo encontró), así que un
					// fallo aquí es transitorio (p.ej. chunk 504 en dev). NO lo
					// marcamos como inexistente para no ocultarlo el resto de la
					// sesión; reintentamos con un backoff corto.
					if (attempt < 2) {
						retryTimer = setTimeout(
							() => {
								if (isMounted) load(attempt + 1);
							},
							150 * (attempt + 1),
						);
						return;
					}
					setResolvedIcon(null);
				});
		};

		load(0);

		return () => {
			isMounted = false;
			if (retryTimer) clearTimeout(retryTimer);
		};
	}, [IconName]);

	if (!resolvedIcon || resolvedIcon.name !== IconName) {
		return null;
	}

	const IconComponent = resolvedIcon.icon.component;
	let iconMeta = { componentName: 'Icon-C', name: `Hero--${icon}` };
	if (resolvedIcon.icon.kind === 'svg') {
		iconMeta = { componentName: 'Icon-A', name: `SvgIcon--${IconName}` };
	} else if (resolvedIcon.icon.kind === 'duotone') {
		iconMeta = { componentName: 'Icon-B', name: `Duotone--${icon}` };
	}

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
