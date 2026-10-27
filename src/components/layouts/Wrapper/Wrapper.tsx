import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import useAsideStatus from '../../../hooks/useAsideStatus';
import themeConfig from '../../../config/theme.config';

interface IWrapperProps {
	children: ReactNode;
	className?: string;
}
const Wrapper: FC<IWrapperProps> = (props) => {
	const { children, className, ...rest } = props;

	const { asideStatus } = useAsideStatus();

	return (
		<section
			data-component-name='Wrapper'
			className={classNames(
				'flex flex-auto flex-col md:peer-hover:ltr:pl-80 md:peer-hover:rtl:pr-80',
				themeConfig.transition,
				className,
				{
					'md:peer-[&]:ltr:pl-80 md:peer-[&]:rtl:pr-80': asideStatus,
					// Mobile Design
					'md:peer-[&]:ltr:pl-[6.225em] md:peer-[&]:rtl:pr-[6.225em]': !asideStatus,
				},
			)}
			{...rest}>
			{children}
		</section>
	);
};

export default Wrapper;
