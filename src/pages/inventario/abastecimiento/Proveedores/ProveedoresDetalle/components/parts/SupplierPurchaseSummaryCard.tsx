import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import PageLinkButton from '@/components/procurement/PageLinkButton';
import { formatDate } from '@/utils/format.utils';
import type { IPageLink } from '@/config/procurementLinks';
import type { IProcurementSupplierPurchaseSummary } from '@/interface/procurement.interface';

/**
 * `purchase_summary` de la ficha (sección 5 del contrato), en el mismo
 * formato de tarjetas KPI que `DeferredPaymentsKpis`
 * (`@/pages/comercial/pagosDiferidos/components/kpis/DeferredPaymentsKpis`):
 * ícono en lozenge + etiqueta + valor. Sin compras, los conteos son `0` y
 * `last_purchase_on` es `null`: se muestran igual como tarjetas con `0`/`—`,
 * nunca como un hueco vacío que parezca un error de carga.
 */

interface ISupplierPurchaseSummaryCardProps {
	summary: IProcurementSupplierPurchaseSummary;
	/**
	 * Listado de documentos de compra filtrado por este proveedor. El botón
	 * sólo aparece si quien mira puede abrir ese listado.
	 */
	documentsLink: IPageLink;
}

const SupplierPurchaseSummaryCard: React.FC<ISupplierPurchaseSummaryCardProps> = ({
	summary,
	documentsLink,
}) => {
	const items = [
		{
			label: 'Última compra',
			value: summary.last_purchase_on ? formatDate(summary.last_purchase_on) : '—',
			icon: 'HeroCalendarDays' as const,
			accent: 'bg-zinc-700 text-white shadow-sm',
		},
		{
			label: 'Unidades recibidas',
			value: summary.received_units.toLocaleString('es-CL'),
			icon: 'HeroCube' as const,
			accent: 'bg-blue-600 text-white shadow-sm',
		},
		{
			label: 'Productos suministrados',
			value: summary.products_supplied_count.toLocaleString('es-CL'),
			icon: 'HeroShoppingBag' as const,
			accent: 'bg-amber-600 text-white shadow-sm',
		},
		{
			label: 'Recepciones',
			value: summary.receipt_count.toLocaleString('es-CL'),
			icon: 'HeroTruck' as const,
			accent: 'bg-emerald-600 text-white shadow-sm',
		},
	];

	return (
		<div className='space-y-3'>
			<div className='flex justify-end'>
				<PageLinkButton
					link={documentsLink}
					variant='outline'
					size='sm'
					icon='HeroDocumentText'>
					Ver documentos
				</PageLinkButton>
			</div>
			<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
				{items.map((item) => (
					<Card
						key={item.label}
						className='h-full border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
						<CardBody className='flex items-center gap-4'>
							<div
								className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${item.accent}`}>
								<Icon icon={item.icon} size='text-3xl' color='white' />
							</div>
							<div className='min-w-0'>
								<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-300'>
									{item.label}
								</p>
								<p className='truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white'>
									{item.value}
								</p>
							</div>
						</CardBody>
					</Card>
				))}
			</div>
		</div>
	);
};

export default SupplierPurchaseSummaryCard;
