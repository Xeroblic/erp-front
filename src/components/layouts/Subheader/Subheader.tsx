import React, { FC, HTMLAttributes, ReactNode, useRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import useDomRect from '../../../hooks/useDomRect';
import Icon from '@/components/icon/Icon';

/* ======================================================
   SUBHEADER LEFT
====================================================== */
interface ISubheaderLeftProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
export const SubheaderLeft: FC<ISubheaderLeftProps> = ({ children, className, ...rest }) => {
    return (
        <div
            data-component-name='Subheader/SubheaderLeft'
            className={classNames(
                'flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4',
                'md:me-auto',
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
};
SubheaderLeft.displayName = 'SubheaderLeft';

/* ======================================================
   SUBHEADER RIGHT
====================================================== */
interface ISubheaderRightProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
export const SubheaderRight: FC<ISubheaderRightProps> = ({ children, className, ...rest }) => {
    return (
        <div
            data-component-name='Subheader/SubheaderRight'
            className={classNames(
                'flex w-full flex-wrap items-center gap-3 sm:gap-4 md:ms-auto md:w-auto md:flex-shrink-0',
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
};
SubheaderRight.displayName = 'SubheaderRight';

/* ======================================================
   SUBHEADER SEPARATOR
====================================================== */
export const SubheaderSeparator: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => {
    return (
        <div
            data-component-name='Subheader/SubheaderSeparator'
            className={classNames('h-full border-e border-zinc-300/25 dark:border-zinc-800/50', className)}
            {...rest}
        />
    );
};
SubheaderSeparator.displayName = 'SubheaderSeparator';

/* ======================================================
   SUBHEADER ROOT
====================================================== */
interface ISubheaderProps {
    children: ReactNode;
    className?: string;
}

const Subheader: FC<ISubheaderProps> = ({ children, className, ...rest }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [domRect] = useDomRect(divRef);

    const [isMobile, setIsMobile] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const handleToggle = () => setOpen(prev => !prev);

    const firstChild = React.Children.toArray(children)[0];
    const restChildren = React.Children.toArray(children).slice(1);

    return (
        <>
            <style>{`:root {--subheader-height: ${domRect?.height || 0}px}`}</style>

            <div
                data-component-name='Subheader'
                ref={divRef}
                className={classNames(
                    'sticky top-[var(--header-height)] z-[9]',
                    'flex flex-col gap-3',
                    'border-b border-zinc-300/25 bg-white/75',
                    'px-4 py-3 sm:px-6 sm:py-4',
                    'backdrop-blur-md',
                    'dark:border-zinc-800/50 dark:bg-zinc-900/75 dark:text-white',
                    className
                )}
                {...rest}
            >
                <div className="flex w-full items-center justify-between">
                    {firstChild}

                    {isMobile && (
                        <button
                            onClick={handleToggle}
                            className="text-zinc-700 dark:text-zinc-200 p-2"
                        >
                            <Icon
                                icon={open ? 'DuoArrowUp' : 'DuoArrowDown'}
                                className="text-2xl"
                            />
                        </button>
                    )}
                </div>

                <div
                    className={classNames(
                        'transition-all duration-300 overflow-hidden',
                        isMobile ? (open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0') : 'opacity-100 max-h-none'
                    )}
                >
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start gap-3 sm:gap-4">
                        {restChildren}
                    </div>
                </div>
            </div>
        </>
    );
};

Subheader.displayName = 'Subheader';
export default Subheader;
