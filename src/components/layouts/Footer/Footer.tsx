import React, { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface IFooterLeftProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
export const FooterLeft: FC<IFooterLeftProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Footer/FooterLeft'
			className={classNames(
				'flex items-center gap-4',
				'md:ltr:mr-auto md:rtl:ml-auto',
				className,
			)}
			{...rest}>
			{children}
		</div>
	);
};
FooterLeft.displayName = 'FooterLeft';

interface IFooterRightProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
export const FooterRight: FC<IFooterRightProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Footer/FooterRight'
			className={classNames(
				'flex flex-wrap items-center gap-4',
				'md:ltr:ml-auto md:rtl:mr-auto',
				className,
			)}
			{...rest}>
			{children}
		</div>
	);
};
FooterRight.displayName = 'FooterRight';

interface IFooterProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
const Footer: FC<IFooterProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<footer
			data-component-name='Footer'
			className={classNames(
				'flex flex-wrap justify-between gap-4 bg-[#ffffff] p-6 text-sm dark:bg-[#18181b]',
				className,
			)}
			{...rest}>
			{children}
		</footer>
	);
};
Footer.displayName = 'Footer';

export default Footer;
