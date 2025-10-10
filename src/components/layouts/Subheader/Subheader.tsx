import React, { FC, HTMLAttributes, ReactNode, useRef } from 'react';
import classNames from 'classnames';
import useDomRect from '../../../hooks/useDomRect';

interface ISubheaderLeftProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
export const SubheaderLeft: FC<ISubheaderLeftProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Subheader/SubheaderLeft'
			className={classNames(
				'flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4',
				'md:me-auto',
				className,
			)}
			{...rest}>
			{children}
		</div>
	);
};
SubheaderLeft.displayName = 'SubheaderLeft';

interface ISubheaderRightProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}
export const SubheaderRight: FC<ISubheaderRightProps> = (props) => {
	const { children, className, ...rest } = props;

	return (
		<div
			data-component-name='Subheader/SubheaderRight'
			className={classNames(
				'flex w-full flex-wrap items-center gap-3 sm:gap-4 md:ms-auto md:w-auto md:flex-shrink-0',
				className,
			)}
			{...rest}>
			{children}
		</div>
	);
};
SubheaderRight.displayName = 'SubheaderRight';

type ISubheaderSeparatorProps = HTMLAttributes<HTMLDivElement>;
export const SubheaderSeparator: FC<ISubheaderSeparatorProps> = (props) => {
	const { className, ...rest } = props;

	return (
		<div
			data-component-name='Subheader/SubheaderSeparator'
			className={classNames(
				'h-full border-e border-zinc-300/25 dark:border-zinc-800/50',
				className,
			)}
			{...rest}
		/>
	);
};
SubheaderSeparator.displayName = 'SubheaderSeparator';

interface ISubheaderProps {
	children: ReactNode;
	className?: string;
}
const Subheader: FC<ISubheaderProps> = (props) => {
	const { children, className, ...rest } = props;

	const divRef = useRef<HTMLDivElement>(null);
	const [domRect] = useDomRect(divRef);

	return (
		<>
			<style>{`:root {--subheader-height: ${domRect?.height || 0}px}`}</style>
			<div
				data-component-name='Subheader'
				ref={divRef}
				className={classNames(
					'sticky top-[var(--header-height)] z-[9]',
					'flex flex-wrap items-start justify-between gap-3 sm:gap-4',
					'border-b border-zinc-300/25 bg-white/75',
					'px-4 py-3 sm:px-6 sm:py-4',
					'backdrop-blur-md',
					'dark:border-zinc-800/50 dark:bg-zinc-900/75 dark:text-white',
					className,
				)}
				{...rest}>
				{children}
			</div>
		</>
	);
};
Subheader.displayName = 'Subheader';

export default Subheader;
