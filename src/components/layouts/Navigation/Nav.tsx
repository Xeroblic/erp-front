import React, { FC, HTMLAttributes, ReactNode, useEffect, useId, useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { TIcons } from '../../../types/icons.type';
import Icon, { IIconProps } from '../../icon/Icon';
import useAsideStatus from '../../../hooks/useAsideStatus';
import themeConfig from '../../../config/theme.config';
import Tooltip from '../../ui/Tooltip';
import Avatar from '../../Avatar';
import { TColors } from '../../../types/colors.type';
import Badge from '@/components/ui/Badge';

import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';
const useNavItemClasses = () => {
	const { themeColor, themeColorShade, darkMode } = useReactiveThemeConfig();

	const tone = darkMode ? 400 : 700;

	return {
		default: classNames(
			'mb-2 p-3',
			'flex items-center',
			'cursor-pointer',
			'overflow-hidden',
			'rounded-xl',
			'border',
			'text-zinc-500',
			'hover:text-zinc-950 dark:hover:text-zinc-100',
			'grow',
			themeConfig.transition,
		),
		inactive: 'border-transparent',
		active: classNames(
			`text-${themeColor}-${tone}`,
			'border-transparent',
			`dark:border-${themeColor}-${themeColorShade}`,
			'nav-active-conic',
		),
		here: `text-${themeColor}-${themeColorShade} border-transparent`,
	};
};

const navItemChildCheck = (children: React.ReactNode | INavButtonProps): boolean => {
	if (!children) return false;

	// Si es array, comprobar si alguno es un elemento React con displayName 'NavButton'
	// Si es array, comprobar si alguno es un elemento React con displayName 'NavButton'
	if (Array.isArray(children)) {
		// children puede ser una mezcla de tipos: filtrar sólo elementos React
		return (children as React.ReactNode[]).some(
			(child) =>
				React.isValidElement(child) && (child.type as any)?.displayName === 'NavButton',
		);
	}

	// Si es un único elemento React
	if (React.isValidElement(children)) {
		return (children.type as any)?.displayName === 'NavButton';
	}

	return false;
};

interface INavItemTextProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
const NavItemText: FC<INavItemTextProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Nav/NavItemText'
			className={classNames('overflow-hidden truncate whitespace-nowrap', className)}
			{...rest}>
			{children}
		</div>
	);
};
NavItemText.displayName = 'NavItemText';

interface INavItemContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
const NavItemContent: FC<INavItemContentProps> = (props) => {
	const { children, className, ...rest } = props;

	const { asideStatus } = useAsideStatus();

	return (
		<div
			data-component-name='Nav/NavItemContent'
			className={classNames(
				'flex w-full items-center justify-between truncate',
				!asideStatus && 'hidden md:group-hover/aside:flex',
				className,
			)}
			{...rest}>
			{children}
		</div>
	);
};
NavItemContent.displayName = 'NavItemContent';

interface INavIconProps extends Partial<IIconProps> {
	icon?: TIcons;
	className?: string;
}
const NavIcon: FC<INavIconProps> = (props) => {
	const { className, icon = 'HeroMinus' } = props;

	const { asideStatus } = useAsideStatus();

	return (
		<Icon
			data-component-name='Nav/NavIcon'
			icon={icon}
			className={classNames(
				'w-6 flex-none text-2xl md:group-hover/aside:me-3',
				{
					'me-3': asideStatus,
				},
				className,
			)}
		/>
	);
};

NavIcon.displayName = 'NavIcon';

interface INavButtonProps extends HTMLAttributes<HTMLButtonElement> {
	className?: string;
	icon: TIcons;
	iconColor?: TColors;
	iconClassName?: string;
	title: string;
}
export const NavButton: FC<INavButtonProps> = (props) => {
	const { icon, iconColor, className, iconClassName, ...rest } = props;

	return (
		<button
			data-component-name='Nav/NavButton'
			type='button'
			className={classNames(className)}
			{...rest}>
			<Icon
				icon={icon}
				color={iconColor}
				size='text-2xl'
				className={classNames(
					{
						'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100': !iconColor,
					},
					themeConfig.transition,
					iconClassName,
				)}
			/>
		</button>
	);
};
NavButton.displayName = 'NavButton';

interface INavItemProps extends HTMLAttributes<HTMLLIElement> {
	children?: ReactNode;
	icon?: TIcons;
	text: string;
	to?: string;
	className?: string;
}
export const NavItem: FC<INavItemProps> = (props) => {
	const navItemClasses = useNavItemClasses();

	const { children, icon, text, to, className, ...rest } = props;

	const { t } = useTranslation('menu');

	const { asideStatus, setAsideStatus } = useAsideStatus();

	const isChildrenNavButton = navItemChildCheck(children);

	const CONTENT = (
		<>
			<NavIcon icon={icon} />
			<NavItemContent>
				<NavItemText>{t(text)}</NavItemText>
				{children && !isChildrenNavButton && <div>{children as ReactNode}</div>}
			</NavItemContent>
		</>
	);

	return (
		<>
			<li
				data-component-name='Nav/NavItem'
				className={classNames(
					'flex list-none items-center overflow-hidden whitespace-nowrap',
					className,
				)}
				{...rest}>
				{to ? (
					<>
						{/* For Desktop */}
						<NavLink
							end
							to={to}
							className={({ isActive }) =>
								isActive
									? classNames(
											navItemClasses.default,
											navItemClasses.active,
											'max-md:hidden',
										)
									: classNames(
											navItemClasses.default,
											navItemClasses.inactive,
											'max-md:hidden',
										)
							}>
							{CONTENT}
						</NavLink>
						{/* For Mobile */}
						<NavLink
							end
							to={to}
							onClick={() => setAsideStatus(false)}
							className={({ isActive }) =>
								isActive
									? classNames(
											navItemClasses.default,
											navItemClasses.active,
											'md:hidden',
										)
									: classNames(
											navItemClasses.default,
											navItemClasses.inactive,
											'md:hidden',
										)
							}>
							{CONTENT}
						</NavLink>
					</>
				) : (
					<>
						{/* For Desktop */}
						<div
							className={classNames(
								navItemClasses.default,
								navItemClasses.inactive,
								'max-md:hidden',
							)}>
							{CONTENT}
						</div>
						{/* For Mobile */}
						<div
							className={classNames(
								navItemClasses.default,
								navItemClasses.inactive,
								'md:hidden',
							)}>
							{CONTENT}
						</div>
					</>
				)}
				{children && isChildrenNavButton && (
					<div
						className={classNames(
							'mb-2 flex items-center gap-3 px-3',
							!asideStatus && 'hidden md:group-hover/aside:flex',
						)}>
						{children as ReactNode}
					</div>
				)}
			</li>
		</>
	);
};
NavItem.displayName = 'NavItem';

interface INavCollapseProps extends HTMLAttributes<HTMLLIElement> {
	children: ReactNode;
	icon?: TIcons;
	text: string;
	to: string;
	className?: string;
	isOpen?: boolean; // Prop opcional para controlar el estado externamente
	onToggle?: () => void; // Callback opcional para manejar cambios
}
export const NavCollapse: FC<INavCollapseProps> = (props) => {
	const navItemClasses = useNavItemClasses();

	const { children, icon, text, className, to, isOpen, onToggle, ...rest } = props;

	const { t } = useTranslation('menu');

	const id = useId();
	// Usar estado interno solo si no se pasa isOpen como prop
	const [internalIsActive, setInternalIsActive] = useState<boolean>(false);

	// Determinar qué estado usar: externo o interno
	const isActive = isOpen !== undefined ? isOpen : internalIsActive;

	const { asideStatus } = useAsideStatus();

	// Ref para detectar el <nav> contenedor y coordinar acordeón por eventos
	const collapseRef = useRef<HTMLLIElement>(null);

	const location = useLocation();
	const here = to !== '/' && location.pathname.includes(to);

	// Solo actualizar estado interno si no se usa control externo
	useEffect(() => {
		if (isOpen === undefined) {
			setInternalIsActive(here);
		}
	}, [here, location.pathname, isOpen]);

	// Disparar evento global cuando este collapse queda abierto
	useEffect(() => {
		if (!isActive) return;
		const navEl = collapseRef.current?.closest('nav');
		const ev = new CustomEvent('nav-collapse-open', {
			detail: { navEl, sourceId: id },
		});
		window.dispatchEvent(ev);
	}, [isActive, id]);

	// Cerrar este collapse si otro del mismo <nav> se abre
	useEffect(() => {
		const handler = (e: any) => {
			const navEl: Element | null | undefined = e?.detail?.navEl as
				| Element
				| null
				| undefined;
			const sourceId: string | undefined = e?.detail?.sourceId as string | undefined;
			const myNav = collapseRef.current?.closest('nav');
			if (!myNav || !navEl || myNav !== navEl) return;
			if (sourceId === id) return; // no cerrarse a sí mismo
			// Solo cerrar si usamos estado interno; cuando es controlado, el padre decide
			if (isOpen === undefined) {
				setInternalIsActive(false);
			}
		};
		window.addEventListener('nav-collapse-open', handler as EventListener);
		return () => window.removeEventListener('nav-collapse-open', handler as EventListener);
	}, [id, isOpen]);

	// Handler para el click
	const handleToggle = () => {
		if (onToggle) {
			onToggle(); // Usar callback externo si existe
		} else {
			setInternalIsActive(!internalIsActive); // Usar estado interno
		}
	};

	return (
		<li
			ref={collapseRef}
			data-component-name='Nav/NavCollapse'
			className={classNames('list-none overflow-hidden', className)}
			{...rest}>
			<Tooltip text={asideStatus ? '' : t(text)} placement='right'>
				<div
					role='presentation'
					className={
						isActive || here
							? classNames(navItemClasses.default, navItemClasses.here)
							: classNames(navItemClasses.default, navItemClasses.inactive)
					}
					onClick={handleToggle}>
					<NavIcon icon={icon} />

					<NavItemContent>
						<NavItemText>{t(text)}</NavItemText>
						<div>
							<Icon
								icon='HeroChevronDown'
								className={classNames(
									'text-2xl',
									{
										'rotate-180': isActive,
									},
									themeConfig.transition,
								)}
							/>
						</div>
					</NavItemContent>
				</div>
			</Tooltip>
			<AnimatePresence>
				{isActive && (
					<motion.ul
						key={id}
						initial='collapsed'
						animate='open'
						exit='collapsed'
						variants={{
							open: { height: 'auto' },
							collapsed: { height: 0 },
						}}
						transition={{ duration: 0.3 }}
						className={classNames(
							'!transition-margin !duration-300 !ease-in-out md:group-hover/aside:ms-4',
							{
								'ms-4': asideStatus,
							},
						)}>
						{children}
					</motion.ul>
				)}
			</AnimatePresence>
		</li>
	);
};
NavCollapse.displayName = 'NavCollapse';

interface INavTitleProps extends HTMLAttributes<HTMLLIElement> {
	children: string;
	className?: string;
}
export const NavTitle: FC<INavTitleProps> = (props) => {
	const { children, className, ...rest } = props;

	const { t } = useTranslation('menu');

	const { asideStatus } = useAsideStatus();

	return (
		<Tooltip text={asideStatus ? '' : t(children)} placement='right'>
			<li
				data-component-name='Nav/NavTitle'
				className={classNames(
					'list-none overflow-hidden truncate whitespace-nowrap px-3 py-1.5 text-sm font-semibold text-zinc-500',
					className,
				)}
				{...rest}>
				<div>
					<span
						className={classNames({
							inline: asideStatus,
							'hidden md:group-hover/aside:inline': !asideStatus,
						})}>
						{children}
					</span>
					<div
						className={classNames(
							'my-1.5 h-2 w-full max-w-[6rem] rounded-full bg-zinc-500',
							{
								hidden: asideStatus,
								'md:group-hover/aside:hidden': !asideStatus,
							},
						)}
					/>
				</div>
			</li>
		</Tooltip>
	);
};
NavTitle.displayName = 'NavTitle';

interface INavUserProps extends HTMLAttributes<HTMLLIElement> {
	children?: ReactNode;
	image?: string;
	text: string;
	to?: string;
	className?: string;
}
export const NavUser: FC<INavUserProps> = (props) => {
	const navItemClasses = useNavItemClasses();

	const { children, image, text, to, className, ...rest } = props;

	const { t } = useTranslation('menu');

	const { asideStatus, setAsideStatus } = useAsideStatus();

	const isChildrenNavButton = navItemChildCheck(children);

	const CONTENT = (
		<>
			<Avatar
				src={image}
				name={text}
				className={classNames('w-6 rounded-full md:group-hover/aside:me-3', {
					'me-3': asideStatus,
				})}
				rounded='rounded'
			/>
			<NavItemContent>
				<NavItemText>{t(text)}</NavItemText>
				{children && !isChildrenNavButton && <div>{children as ReactNode}</div>}
			</NavItemContent>
		</>
	);

	return (
		<Tooltip text={asideStatus ? '' : t(text)} placement='right'>
			<li
				data-component-name='Nav/NavUser'
				className={classNames(
					'flex list-none items-center overflow-hidden whitespace-nowrap',
					className,
				)}
				{...rest}>
				{to ? (
					<>
						{/* For Desktop */}
						<NavLink
							end
							to={to}
							className={({ isActive }) =>
								isActive
									? classNames(
											navItemClasses.default,
											navItemClasses.active,
											'max-md:hidden',
										)
									: classNames(
											navItemClasses.default,
											navItemClasses.inactive,
											'max-md:hidden',
										)
							}>
							{CONTENT}
						</NavLink>
						{/* For Mobile */}
						<NavLink
							end
							to={to}
							onClick={() => setAsideStatus(false)}
							className={({ isActive }) =>
								isActive
									? classNames(
											navItemClasses.default,
											navItemClasses.active,
											'md:hidden',
										)
									: classNames(
											navItemClasses.default,
											navItemClasses.inactive,
											'md:hidden',
										)
							}>
							{CONTENT}
						</NavLink>
					</>
				) : (
					<>
						{/* For Desktop */}
						<div
							className={classNames(
								navItemClasses.default,
								navItemClasses.inactive,
								'max-md:hidden',
							)}>
							{CONTENT}
						</div>
						{/* For Mobile */}
						<div
							className={classNames(
								navItemClasses.default,
								navItemClasses.inactive,
								'md:hidden',
							)}>
							{CONTENT}
						</div>
					</>
				)}
				{children && isChildrenNavButton && (
					<div
						className={classNames(
							'mb-2 flex items-center gap-3 px-3',
							!asideStatus && 'hidden md:group-hover/aside:flex',
						)}>
						{children as ReactNode}
					</div>
				)}
			</li>
		</Tooltip>
	);
};
NavUser.displayName = 'NavUser';

interface INavSeparatorProps extends HTMLAttributes<HTMLLIElement> {
	className?: string;
}
export const NavSeparator: FC<INavSeparatorProps> = (props) => {
	const { className, ...rest } = props;
	return (
		<li
			data-component-name='Nav/NavSeparator'
			className={classNames(
				'mb-2 list-none rounded-full border-b border-zinc-500/25',
				className,
			)}
			{...rest}
		/>
	);
};
NavSeparator.displayName = 'NavSeparator';

interface INavProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
const Nav: FC<INavProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<nav data-component-name='Nav' className={classNames(className)} {...rest}>
			<ul>{children}</ul>
		</nav>
	);
};
Nav.displayName = 'Nav';

export default Nav;
