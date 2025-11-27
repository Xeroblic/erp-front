import React, { FC, HTMLAttributes, ReactNode, useEffect, useId, useState, useRef, ComponentProps } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, Variants } from 'framer-motion'; // Importamos Variants
import { TIcons } from '../../../types/icons.type';
import Icon, { IIconProps } from '../../icon/Icon';
import useAsideStatus from '../../../hooks/useAsideStatus';
import themeConfig from '../../../config/theme.config';
import Tooltip from '../../ui/Tooltip';
import Avatar from '../../Avatar';
import { TColors } from '../../../types/colors.type';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';

// --- CONFIGURACIÓN DE ANIMACIONES ---
// Variantes para el contenedor padre (el acordeón)
const collapseVariants: Variants = {
    collapsed: { 
        height: 0, 
        opacity: 0,
        transition: { 
            height: { duration: 0.3, ease: "easeInOut" },
            opacity: { duration: 0.2 } // Desaparece rápido
        }
    },
    open: { 
        height: 'auto', 
        opacity: 1,
        transition: { 
            height: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.3 },
            // Esto hace la magia: ordena a los hijos que se animen uno tras otro
            staggerChildren: 0.05, 
            delayChildren: 0.1 
        }
    },
};

// Variantes para los items hijos dentro del acordeón
const collapseItemVariants: Variants = {
    collapsed: { x: -10, opacity: 0 },
    open: { x: 0, opacity: 1, transition: { duration: 0.3 } }
};

// Variantes para los items normales (hover y tap)
const navItemMotion = {
    whileHover: { x: 5, transition: { type: 'spring', stiffness: 400, damping: 20 } },
    whileTap: { scale: 0.96 }
};
// -------------------------------------

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
            'nav-active-conic', // Asumo que esto es un gradiente o estilo especial tuyo
            'shadow-sm' // Agregué una sombra sutil al activo
        ),
        here: `text-${themeColor}-${themeColorShade} border-transparent`,
    };
};

const navItemChildCheck = (children: React.ReactNode | INavButtonProps): boolean => {
    if (!children) return false;
    if (Array.isArray(children)) {
        return (children as React.ReactNode[]).some(
            (child) =>
                React.isValidElement(child) && (child.type as any)?.displayName === 'NavButton',
        );
    }
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
    const { themeColor, themeColorShade } = useReactiveThemeConfig();

    return (
        <div
            data-component-name='Nav/NavItemText'
            className={classNames(
                'overflow-hidden truncate whitespace-nowrap text-zinc-600 dark:text-zinc-300',
                `hover:text-${themeColor}-${themeColorShade} dark:hover:text-${themeColor}-${themeColorShade}`,
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
};
NavItemText.displayName = 'NavItemText';

type MotionDivProps = Omit<ComponentProps<typeof motion.div>, 'ref'>;
type MotionButtonProps = Omit<ComponentProps<typeof motion.button>, 'ref'>;

interface INavItemContentProps extends MotionDivProps {
    children: ReactNode;
    className?: string;
}
const NavItemContent: FC<INavItemContentProps> = (props) => {
    const { children, className, ...rest } = props;
    const { asideStatus } = useAsideStatus();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-component-name='Nav/NavItemContent'
            className={classNames(
                'flex w-full items-center justify-between truncate',
                !asideStatus && 'hidden md:group-hover/aside:flex',
                className,
            )}
            {...rest}>
            {children}
        </motion.div>
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
        <span
            className={classNames(
                'flex h-7 w-7 flex-none items-center justify-center rounded-full border transition-all duration-300 md:group-hover/aside:me-3',
                'bg-gray-200  dark:bg-zinc-800 dark:border-none',
                { 'me-3': asideStatus },
            )}>
            <Icon
                data-component-name='Nav/NavIcon'
                icon={icon}
                className={classNames('text-2xl', className)}
            />
        </span>
    );
};
NavIcon.displayName = 'NavIcon';

interface INavButtonProps extends MotionButtonProps {
    className?: string;
    icon: TIcons;
    iconColor?: TColors;
    iconClassName?: string;
    title: string;
}
export const NavButton: FC<INavButtonProps> = (props) => {
    const { icon, iconColor, className, iconClassName, ...rest } = props;

    return (
        <motion.button
			
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-component-name='Nav/NavButton'
            type='button'
            className={classNames(className)}
            {...rest}>
            <Icon
                icon={icon}
                color={iconColor}
                size='text-2xl'
                className={classNames(
                    { 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100': !iconColor },
                    themeConfig.transition,
                    iconClassName,
                )}
            />
        </motion.button>
    );
};
NavButton.displayName = 'NavButton';

interface INavItemProps extends HTMLAttributes<HTMLLIElement> {
    children?: ReactNode;
    icon?: TIcons;
    text: string;
    to?: string;
    className?: string;
    // Propiedad interna para saber si es hijo de un collapse y animarlo
    isChildItem?: boolean; 
}
export const NavItem: FC<INavItemProps> = (props) => {
    const navItemClasses = useNavItemClasses();
    const { children, icon, text, to, className, isChildItem, ...rest } = props; // isChildItem detecta si debe animar entrada
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

    // Wrapper animado condicional: Si es hijo de un Collapse usa las variantes de cascada
    const MotionWrapper = isChildItem ? motion.li : motion.li;
    const variants = isChildItem ? collapseItemVariants : {};

    return (
        <MotionWrapper
            variants={variants} // Solo aplica si es hijo de collapse
            data-component-name='Nav/NavItem'
            className={classNames(
                'flex list-none items-center overflow-hidden whitespace-nowrap',
                className,
            )}
            {...navItemMotion} // Aplica Hover y Tap a todos
            {...rest as any} // Cast para evitar error de tipos con motion
            >
            {to ? (
                <>
                    {/* For Desktop */}
                    <NavLink
                        end
                        to={to}
                        className={({ isActive }) =>
                            classNames(
                                navItemClasses.default,
                                isActive ? navItemClasses.active : navItemClasses.inactive,
                                'max-md:hidden w-full'
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
                            classNames(
                                navItemClasses.default,
                                isActive ? navItemClasses.active : navItemClasses.inactive,
                                'md:hidden w-full'
                            )
                        }>
                        {CONTENT}
                    </NavLink>
                </>
            ) : (
                <div className={classNames(navItemClasses.default, navItemClasses.inactive, 'w-full')}>
                     {CONTENT}
                </div>
            )}
            
            {children && isChildrenNavButton && (
                <div className={classNames('mb-2 flex items-center gap-3 px-3', !asideStatus && 'hidden md:group-hover/aside:flex')}>
                    {children as ReactNode}
                </div>
            )}
        </MotionWrapper>
    );
};
NavItem.displayName = 'NavItem';

interface INavCollapseProps extends HTMLAttributes<HTMLLIElement> {
    children: ReactNode;
    icon?: TIcons;
    text: string;
    to: string;
    className?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}
export const NavCollapse: FC<INavCollapseProps> = (props) => {
    const navItemClasses = useNavItemClasses();
    const { children, icon, text, className, to, isOpen, onToggle, ...rest } = props;
    const { t } = useTranslation('menu');
    const id = useId();
    const [internalIsActive, setInternalIsActive] = useState<boolean>(false);
    const isActive = isOpen !== undefined ? isOpen : internalIsActive;
    const { asideStatus } = useAsideStatus();
    const collapseRef = useRef<HTMLLIElement>(null);
    const location = useLocation();
    const here = to !== '/' && location.pathname.includes(to);

    useEffect(() => {
        if (isOpen === undefined) setInternalIsActive(here);
    }, [here, location.pathname, isOpen]);

    useEffect(() => {
        if (!isActive) return;
        const navEl = collapseRef.current?.closest('nav');
        const ev = new CustomEvent('nav-collapse-open', { detail: { navEl, sourceId: id } });
        window.dispatchEvent(ev);
    }, [isActive, id]);

    useEffect(() => {
        const handler = (e: any) => {
            const navEl = e?.detail?.navEl;
            const sourceId = e?.detail?.sourceId;
            const myNav = collapseRef.current?.closest('nav');
            if (!myNav || !navEl || myNav !== navEl) return;
            if (sourceId === id) return;
            if (isOpen === undefined) setInternalIsActive(false);
        };
        window.addEventListener('nav-collapse-open', handler as EventListener);
        return () => window.removeEventListener('nav-collapse-open', handler as EventListener);
    }, [id, isOpen]);

    const handleToggle = () => {
        if (onToggle) onToggle();
        else setInternalIsActive(!internalIsActive);
    };

    return (
        <li
            ref={collapseRef}
            data-component-name='Nav/NavCollapse'
            className={classNames('list-none overflow-hidden', className)}
            {...rest}>
            <Tooltip text={asideStatus ? '' : t(text)} placement='right'>
                <motion.div
                    // Efecto click en el header del acordeon
                    whileTap={{ scale: 0.98 }} 
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
                        <motion.div
                            animate={{ rotate: isActive ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Icon
                                icon='HeroChevronDown'
                                className={classNames('text-2xl', themeConfig.transition)}
                            />
                        </motion.div>
                    </NavItemContent>
                </motion.div>
            </Tooltip>
            
            <AnimatePresence>
                {isActive && (
                    <motion.ul
                        key={id}
                        // Usamos las variantes definidas arriba para el efecto cascada
                        variants={collapseVariants}
                        initial='collapsed'
                        animate='open'
                        exit='collapsed'
                        className={classNames(
                            '!transition-margin !duration-300 !ease-in-out md:group-hover/aside:ms-4',
                            { 'ms-4': asideStatus },
                        )}>
                        {/* Truco: Pasamos una prop extra a los hijos para que sepan que deben animarse.
                            Esto requiere que 'children' sean componentes NavItem. 
                        */}
                        {React.Children.map(children, (child) => {
                             if (React.isValidElement(child)) {
                                 // @ts-ignore - Inyectamos la prop para activar la animación hija
                                 return React.cloneElement(child, { isChildItem: true });
                             }
                             return child;
                        })}
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
                    'list-none overflow-hidden truncate whitespace-nowrap px-3 py-1.5 text-sm font-semibold uppercase text-zinc-700 dark:text-zinc-100 mt-4', // Agregué un margen top para respirar
                    className,
                )}
                {...rest}>
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className={classNames({
                        inline: asideStatus,
                        'hidden md:group-hover/aside:inline': !asideStatus,
                    })}>
                        {children}
                    </span>
                    <div className={classNames(
                        'my-1.5 h-2 w-full max-w-[6rem] rounded-full bg-zinc-500',
                        { hidden: asideStatus, 'md:group-hover/aside:hidden': !asideStatus },
                    )} />
                </motion.div>
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
            <motion.li
                 // Animación simple de hover para el usuario
                whileHover={{ scale: 1.02 }}
                data-component-name='Nav/NavUser'
                className={classNames(
                    'flex list-none items-center overflow-hidden whitespace-nowrap mt-auto', // mt-auto por si quieres que vaya al fondo
                    className,
                )}
                {...rest as any}>
                {to ? (
                    <NavLink
                        end
                        to={to}
                        className={({ isActive }) =>
                            classNames(
                                navItemClasses.default,
                                isActive ? navItemClasses.active : navItemClasses.inactive,
                                'w-full'
                            )
                        }>
                        {CONTENT}
                    </NavLink>
                ) : (
                    <div className={classNames(navItemClasses.default, navItemClasses.inactive, 'w-full')}>
                        {CONTENT}
                    </div>
                )}
            </motion.li>
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
