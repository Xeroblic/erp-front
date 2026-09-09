import React, { FC, ReactNode } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';

interface ICatalogSectionProps {
	id: string;
	title: string;
	/** Regla del contrato que la sección ilustra. */
	summary: string;
	children: ReactNode;
}

/** Bloque de la pantalla de catálogo: un componente compartido y sus estados. */
const CatalogSection: FC<ICatalogSectionProps> = ({ id, title, summary, children }) => (
	<Card>
		<CardHeader>
			<CardHeaderChild className='flex-col !items-start gap-1'>
				<CardTitle id={id} className='!text-xl'>
					{title}
				</CardTitle>
				<p className='text-sm text-zinc-500 dark:text-zinc-400'>{summary}</p>
			</CardHeaderChild>
		</CardHeader>
		<CardBody>{children}</CardBody>
	</Card>
);

export default CatalogSection;
