import React, {
	CSSProperties,
	forwardRef,
	HTMLAttributes,
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
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
import useAuthorization from '@/hooks/useAuthorization';
import {
	resolveTailwindColor,
	resolveTailwindColorAlpha,
} from '@/utils/tailwindColorResolver.util';

export type TButtonVariants = 'solid' | 'outline' | 'default' | 'ghost';
export type TButtonSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

/** Tiempo mínimo de bloqueo anti-doble-click (ms) */
const MIN_CLICK_GUARD_MS = 400;

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
	if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
		return false;
	}

	return typeof (value as { then?: unknown }).then === 'function';
};

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
	/**
	 * Permiso(s) requerido(s) para mostrar el botón.
	 * Si el usuario no tiene el permiso, el botón NO se renderiza.
	 * Super-admin siempre tiene acceso.
	 * @example permission="edit-sale"
	 * @example permission={['edit-sale', 'manage-sales']}
	 */
	permission?: string | string[];
}

/**
 * Hook interno: previene doble-click bloqueando el botón mientras
 * el onClick anterior está en vuelo (si devuelve una Promise) o
 * al menos MIN_CLICK_GUARD_MS ms.
 */
function useClickGuard(onClick: IButtonProps['onClick']) {
	const busyRef = useRef(false);
	const mountedRef = useRef(false);
	const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [clickGuardActive, setClickGuardActive] = useState(false);

	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
			busyRef.current = false;

			if (releaseTimerRef.current !== null) {
				clearTimeout(releaseTimerRef.current);
				releaseTimerRef.current = null;
			}
		};
	}, []);

	const releaseGuard = useCallback(() => {
		releaseTimerRef.current = null;
		busyRef.current = false;

		if (mountedRef.current) {
			setClickGuardActive(false);
		}
	}, []);

	const releaseAfterMinimum = useCallback(
		(startedAt: number) => {
			if (!mountedRef.current) {
				busyRef.current = false;
				return;
			}

			const remainingMs = Math.max(0, MIN_CLICK_GUARD_MS - (Date.now() - startedAt));
			if (remainingMs === 0) {
				releaseGuard();
				return;
			}

			releaseTimerRef.current = setTimeout(releaseGuard, remainingMs);
		},
		[releaseGuard],
	);

	const guardedOnClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (!onClick) return;
			if (busyRef.current) return; // ya hay un click en vuelo

			busyRef.current = true;
			setClickGuardActive(true);
			const startedAt = Date.now();

			try {
				const result: unknown = onClick(e);

				// Si el handler devuelve una Promise, esperamos a que termine
				if (isPromiseLike(result)) {
					void Promise.resolve(result).then(
						() => releaseAfterMinimum(startedAt),
						() => releaseAfterMinimum(startedAt),
					);
				} else {
					// Handler síncrono: bloqueamos solo el tiempo mínimo
					releaseAfterMinimum(startedAt);
				}
			} catch {
				// Si el handler lanza síncronamente, liberar el guard
				releaseAfterMinimum(startedAt);
			}
		},
		[onClick, releaseAfterMinimum],
	);

	return { guardedOnClick: onClick ? guardedOnClick : undefined, clickGuardActive };
}

const Button = forwardRef<HTMLButtonElement, IButtonProps>((props, ref) => {
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();
	const { hasAnyPermission, isSuperAdmin } = useAuthorization();

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
		permission,
		onClick,
		style,
		...rest
	} = props;

	// === ANTI DOBLE-CLICK (se ejecuta siempre, antes de early returns) ===
	const { guardedOnClick, clickGuardActive } = useClickGuard(onClick);

	// === PERMISSION CHECK (early return antes de cualquier lógica pesada) ===
	// Si se especifica permission y el usuario NO tiene el permiso, no renderizar
	if (permission && !isSuperAdmin) {
		const permList = Array.isArray(permission) ? permission : [permission];
		if (!hasAnyPermission(permList)) {
			return null;
		}
	}

	const { textColor: contrastTextColor, shadeColorIntensity } = useColorIntensity(colorIntensity);
	const hoverShade = (shadeColorIntensity as TColorIntensity) || colorIntensity;

	const isSolid = variant === 'solid';
	const effectiveTextColor = isSolid ? 'text-white' : contrastTextColor;
	const HAS_CHILDREN = typeof children !== 'undefined';
	const accentTextColor = getTextColor(color, colorIntensity);
	const resolvedTextColor = resolveTailwindColor(color, colorIntensity);
	const resolvedBgColor = resolveTailwindColor(color, colorIntensity);
	const resolvedBorderColor = resolveTailwindColor(color, colorIntensity);
	const resolvedHoverColor = resolveTailwindColor(color, hoverShade);
	const resolvedBorderColorHalf = resolveTailwindColorAlpha(color, colorIntensity, 0.5);

	const colorVars: CSSProperties = {
		'--btn-text': resolvedTextColor,
		'--btn-bg': resolvedBgColor,
		'--btn-border': resolvedBorderColor,
		'--btn-bg-hover': resolvedHoverColor,
		'--btn-border-hover': resolvedHoverColor,
		'--btn-border-50': resolvedBorderColorHalf,
		'--btn-bg-ghost-hover': resolveTailwindColorAlpha(color, colorIntensity, 0.1),
		'--btn-bg-ghost-active': resolveTailwindColorAlpha(color, colorIntensity, 0.2),
	} as CSSProperties;

	const iconComputedColor =
		iconColor ??
		(isSolid
			? 'text-white'
			: resolvedTextColor
				? 'text-[color:var(--btn-text)]'
				: (accentTextColor ?? contrastTextColor));
	const rightIconComputedColor =
		rightIconColor ??
		(isSolid
			? 'text-white'
			: resolvedTextColor
				? 'text-[color:var(--btn-text)]'
				: (accentTextColor ?? contrastTextColor));

	const btnVariants: { [key in TButtonVariants]: string } = {
		solid: classNames(
			{ 'bg-[var(--btn-bg)]': !isActive },
			[effectiveTextColor],
			[`${borderWidth} border-[color:var(--btn-border)]`],
			[`${contrastTextColor}`],
			'hover:bg-[var(--btn-bg-hover)]',
			'hover:border-[color:var(--btn-border-hover)]',
			'active:bg-[var(--btn-bg-hover)]',
			'active:border-[color:var(--btn-border-hover)]',
			{
				'bg-[var(--btn-bg-hover)]': isActive,
				'border-[color:var(--btn-border-hover)]': isActive,
			},
		),
		outline: classNames(
			'bg-transparent',
			[`${borderWidth}`],
			{
				'border-[color:var(--btn-border-50)]': !isActive,
			},
			'text-black dark:text-white',
			'hover:border-[color:var(--btn-border)]',
			'active:border-[color:var(--btn-border)]',
			{
				'border-[color:var(--btn-border)]': isActive,
			},
		),
		default: classNames(
			'bg-transparent',
			{ 'text-zinc-600 dark:text-zinc-400': !isActive },
			[`${borderWidth}`],
			'border-transparent',
			'hover:text-[color:var(--btn-text)] dark:hover:text-[color:var(--btn-text)]',
			'active:text-[color:var(--btn-text)]',
			{
				'text-[color:var(--btn-text)]': isActive,
			},
		),
		ghost: classNames(
			'bg-transparent',
			{ 'text-zinc-600 dark:text-zinc-400': color === 'zinc' && !isActive },
			{ 'text-[color:var(--btn-text)]': color !== 'zinc' && !isActive },
			'border-transparent',
			'hover:bg-[var(--btn-bg-ghost-hover)] hover:text-[color:var(--btn-text)]',
			'active:bg-[var(--btn-bg-ghost-active)]',
			{
				'bg-[var(--btn-bg-ghost-active)] text-[color:var(--btn-text)]': isActive,
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
			icon: classNames(
				{ 'ltr:mr-1 rtl:ml-1': HAS_CHILDREN },
				'text-[1.125rem]',
				iconClassName,
			),
			rightIcon: classNames('ltr:ml-1', 'rtl:mr-1', 'text-[1.125rem]'),
		},
		sm: {
			general: classNames({ 'px-4': HAS_CHILDREN, 'px-1': !HAS_CHILDREN }, 'py-1', 'text-sm'),
			icon: classNames(
				{ 'ltr:mr-1 rtl:ml-1': HAS_CHILDREN },
				'text-[1.25rem]',
				iconClassName,
			),
			rightIcon: classNames('ltr:ml-1', 'rtl:mr-1', 'text-[1.25rem]'),
		},
		default: {
			general: classNames(
				{ 'px-5': HAS_CHILDREN, 'px-1.5': !HAS_CHILDREN },
				'py-1.5',
				'text-base',
			),
			icon: classNames(
				{ 'ltr:mr-1.5 rtl:ml-1.5': HAS_CHILDREN },
				'text-[1.5rem]',
				iconClassName,
			),
			rightIcon: classNames('ltr:ml-1.5', 'rtl:mr-1.5', 'text-[1.5rem]'),
		},
		lg: {
			general: classNames({ 'px-6': HAS_CHILDREN, 'px-2': !HAS_CHILDREN }, 'py-2', 'text-lg'),
			icon: classNames(
				{ 'ltr:mr-2 rtl:ml-2': HAS_CHILDREN },
				'text-[1.75rem]',
				iconClassName,
			),
			rightIcon: classNames('ltr:ml-2', 'rtl:mr-2', 'text-[1.75rem]'),
		},
		xl: {
			general: classNames(
				{ 'px-7': HAS_CHILDREN, 'px-2.5': !HAS_CHILDREN },
				'py-2.5',
				'text-xl',
			),
			icon: classNames(
				{ 'ltr:mr-2.5 rtl:ml-2.5': HAS_CHILDREN },
				'text-[1.75rem]',
				iconClassName,
			),
			rightIcon: classNames('ltr:ml-2.5', 'rtl:mr-2.5'),
		},
	};
	const btnSizeClasses = btnSizes[size].general;
	const btnIconClasses = btnSizes[size].icon;
	const btnRightIconClasses = HAS_CHILDREN ? btnSizes[size].rightIcon : undefined;

	const btnDisabledClasses = 'opacity-50 pointer-events-none';
	const isButtonDisabled = isDisable || isLoading || disabled || clickGuardActive;

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
			style={{ ...colorVars, ...style }}
			disabled={isButtonDisabled}
			onClick={guardedOnClick}
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
