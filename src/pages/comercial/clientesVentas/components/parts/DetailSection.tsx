import React, { PropsWithChildren, useId } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import type { TIcons } from '@/types/icons.type';

interface DetailSectionProps extends PropsWithChildren {
	title: string;
	description?: string;
	icon?: TIcons;
	contenRight?: React.ReactNode;
	contentClassName?: string;
}

const DetailSection: React.FC<DetailSectionProps> = ({
	title,
	description,
	icon,
	contenRight,
	contentClassName,
	children,
}) => {
	const titleId = useId();

	return (
		<section className='space-y-4' aria-labelledby={titleId}>
			<div className='flex flex-row items-start justify-between'>
				<div className='flex min-w-0 items-start gap-3'>
					{icon ? (
						<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white'>
							<Icon icon={icon} color='white' size='text-lg' />
						</div>
					) : null}
					<div className='min-w-0'>
						<h2
							id={titleId}
							className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
							{title}
						</h2>
						{description ? (
							<p className='text-sm text-zinc-500 dark:text-zinc-400'>
								{description}
							</p>
						) : null}
					</div>
				</div>
				{contenRight && <div className='self-start'>{contenRight}</div>}
			</div>
			<div className={classNames('grid grid-cols-1 gap-4 md:grid-cols-2', contentClassName)}>
				{children}
			</div>
		</section>
	);
};

export default DetailSection;
