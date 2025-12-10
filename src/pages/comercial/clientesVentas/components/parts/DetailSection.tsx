import React, { PropsWithChildren } from 'react';
import classNames from 'classnames';
import Badge from '@/components/ui/Badge';

interface DetailSectionProps extends PropsWithChildren {
	title: string;
	description?: string;
	contenRight?: React.ReactNode;
	contentClassName?: string;
}

const DetailSection: React.FC<DetailSectionProps> = ({
	title,
	description,
	contenRight,
	contentClassName,
	children,
}) => {
	return (
		<section className='space-y-4'>
			<div className='flex flex-row items-start justify-between'>
				<div>
					<Badge className='text-base font-semibold'>{title}</Badge>
					{description ? (
						<p className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</p>
					) : null}
				</div>
				{contenRight && (
					<div className='self-start'>
						<h1>{contenRight}</h1>
					</div>
				)}
			</div>
			<div
				className={classNames(
					'grid grid-cols-1 gap-4 md:grid-cols-2',
					contentClassName,
				)}>
				{children}
			</div>
		</section>
	);
};

export default DetailSection;
