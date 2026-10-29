import React, { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import useAsideStatus from '../../../hooks/useAsideStatus';
import themeConfig from '../../../config/theme.config';

interface IAsideHeadProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
export const AsideHead: FC<IAsideHeadProps> = ({ children, className, ...rest }) => (
	<div
		data-component-name='Aside/AsideHead'
		className={classNames(
			'flex items-center justify-between px-6 pb-6 max-md:flex-row-reverse',
			className,
		)}
		{...rest}>
		{children}
	</div>
);

interface IAsideBodyProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}
export const AsideBody: FC<IAsideBodyProps> = ({ children, className, ...rest }) => (
	<div
		data-component-name='Aside/AsideBody'
		className={classNames('no-scrollbar h-full overflow-x-scroll px-4', className)}
		{...rest}>
		{children}
	</div>
);

interface IAsideFooterProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}

export const AsideFooter: FC<IAsideFooterProps> = ({ children, className, ...rest }) => (
	<div
		data-component-name='Aside/AsideFooter'
		className={classNames('px-6', className)}
		{...rest}>
		{children}
	</div>
);

interface IAsideProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}

const Aside: FC<IAsideProps> = ({ children, className, ...rest }) => {
	const { asideStatus } = useAsideStatus();

	return (
		<aside
			data-component-name='Aside'
			className={classNames(
				'group/aside peer fixed top-0 bottom-0 z-30 flex flex-col border-zinc-600/20 bg-[#ffffff] py-6 md:z-20 ltr:border-r rtl:border-l dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-white',
				themeConfig.transition,
				className,
				// Mobile layout
				'max-md:w-[20rem] max-md:shadow-2xl max-md:ltr:-left-80 max-md:rtl:-right-80',
				asideStatus ? 'md:w-[20rem]' : 'md:w-[6.225em] md:hover:w-[20rem]',
				{
					'max-md:ltr:-left-80 max-md:rtl:-right-80': !asideStatus,
					'max-md:ltr:left-0 max-md:rtl:right-0': asideStatus,
				},
			)}
			{...rest}>
			{children}
		</aside>
	);
};

export default Aside;
