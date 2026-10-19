import React, { FC, ReactNode } from 'react';

interface ICatalogSampleProps {
	title: string;
	description: string;
	children: ReactNode;
}

/** Un estado concreto dentro de una sección del catálogo. */
const CatalogSample: FC<ICatalogSampleProps> = ({ title, description, children }) => (
	<figure className='m-0 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
		<figcaption className='mb-2'>
			<span className='block text-sm font-semibold'>{title}</span>
			<span className='block text-xs text-zinc-500 dark:text-zinc-400'>{description}</span>
		</figcaption>
		{children}
	</figure>
);

export default CatalogSample;
