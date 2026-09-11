import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import type { TIcons } from '@/types/icons.type';
import type { IPurchaseDocumentRelatedCounts } from '@/interface/procurement.interface';

/**
 * `related_counts` del detalle (sección 6): recepciones, asignaciones de
 * stock inicial y adjuntos. Resumen numérico rápido; las listas completas
 * paginadas de recepciones y asignaciones viven en `RelatedListCard`, y la
 * de adjuntos —con subida y baja— en `DocumentAttachmentsCard`, todas justo
 * debajo en el detalle.
 *
 * Mismo formato de caja+ícono que `DeferredPaymentsKpis`/`StockSummaryKpis`
 * (pagos diferidos y stock por ubicación): sin ese formato, tres números
 * sueltos no decían por sí mismos a qué lista completa apuntaba cada uno.
 */

interface IRelatedCountsCardProps {
	relatedCounts: IPurchaseDocumentRelatedCounts;
}

interface IRelatedCountKpiItem {
	key: keyof IPurchaseDocumentRelatedCounts;
	label: string;
	detail: string;
	icon: TIcons;
	accent: string;
}

const KPI_ITEMS: IRelatedCountKpiItem[] = [
	{
		key: 'stock_receipts',
		label: 'Recepciones',
		detail: 'Mercadería recibida contra este documento',
		icon: 'HeroTruck',
		accent: 'bg-blue-600',
	},
	{
		key: 'initial_stock_allocations',
		label: 'Asig. stock inicial',
		detail: 'Stock documentado sin movimiento físico',
		icon: 'HeroArchiveBoxArrowDown',
		accent: 'bg-violet-600',
	},
	{
		key: 'attachments',
		label: 'Adjuntos',
		detail: 'Archivos privados del documento',
		icon: 'HeroPaperClip',
		accent: 'bg-emerald-600',
	},
];

const RelatedCountsCard: React.FC<IRelatedCountsCardProps> = ({ relatedCounts }) => (
	<div className='grid gap-4 sm:grid-cols-3'>
		{KPI_ITEMS.map((item) => (
			<Card
				key={item.key}
				className='h-full border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
				<CardBody className='flex items-center gap-4'>
					<div
						className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${item.accent}`}>
						<Icon icon={item.icon} size='text-3xl' color='white' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-300'>
							{item.label}
						</p>
						<p className='truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white'>
							{relatedCounts[item.key]}
						</p>
						<p className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
							{item.detail}
						</p>
					</div>
				</CardBody>
			</Card>
		))}
	</div>
);

export default RelatedCountsCard;
