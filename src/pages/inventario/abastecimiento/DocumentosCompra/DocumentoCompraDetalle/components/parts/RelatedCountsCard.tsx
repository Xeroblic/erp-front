import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IPurchaseDocumentRelatedCounts } from '@/interface/procurement.interface';

/**
 * `related_counts` del detalle (sección 6): recepciones, asignaciones de
 * stock inicial y adjuntos. Las listas completas paginan aparte — cards 04
 * y 05 — así que acá sólo se cuenta, nunca se incrusta historia ilimitada.
 */

interface IRelatedCountsCardProps {
	relatedCounts: IPurchaseDocumentRelatedCounts;
}

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
	<div className='flex flex-col items-center rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800'>
		<span className='text-2xl font-semibold tabular-nums'>{value}</span>
		<span className='text-xs text-zinc-500 dark:text-zinc-400'>{label}</span>
	</div>
);

const RelatedCountsCard: React.FC<IRelatedCountsCardProps> = ({ relatedCounts }) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Relacionados</CardTitle>
		</CardHeader>
		<CardBody className='grid grid-cols-3 gap-3'>
			<Stat label='Recepciones' value={relatedCounts.stock_receipts} />
			<Stat label='Asig. stock inicial' value={relatedCounts.initial_stock_allocations} />
			<Stat label='Adjuntos' value={relatedCounts.attachments} />
		</CardBody>
	</Card>
);

export default RelatedCountsCard;
