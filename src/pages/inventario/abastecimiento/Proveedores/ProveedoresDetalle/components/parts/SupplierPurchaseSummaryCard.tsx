import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { formatDate } from '@/utils/format.utils';
import type { IProcurementSupplierPurchaseSummary } from '@/interface/procurement.interface';

/**
 * `purchase_summary` de la ficha (sección 5 del contrato). Sin compras, los
 * conteos son `0` y `last_purchase_on` es `null`: se muestra como «sin
 * compras», nunca como un hueco vacío que parezca un error de carga.
 */

interface ISupplierPurchaseSummaryCardProps {
	summary: IProcurementSupplierPurchaseSummary;
}

const SupplierPurchaseSummaryCard: React.FC<ISupplierPurchaseSummaryCardProps> = ({ summary }) => {
	const hasPurchases = summary.receipt_count > 0;

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroShoppingBag' size='text-xl' />
					<CardTitle className='text-lg'>Resumen de compras</CardTitle>
				</div>
			</CardHeader>
			<CardBody>
				{!hasPurchases ? (
					<p className='text-sm italic text-zinc-500 dark:text-zinc-400'>
						Sin compras registradas todavía.
					</p>
				) : (
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
						<div>
							<p className='text-xs uppercase text-zinc-500'>Última compra</p>
							<p className='text-lg font-semibold'>
								{summary.last_purchase_on
									? formatDate(summary.last_purchase_on)
									: '—'}
							</p>
						</div>
						<div>
							<p className='text-xs uppercase text-zinc-500'>Unidades recibidas</p>
							<p className='text-lg font-semibold'>
								{summary.received_units.toLocaleString('es-CL')}
							</p>
						</div>
						<div>
							<p className='text-xs uppercase text-zinc-500'>
								Productos suministrados
							</p>
							<p className='text-lg font-semibold'>
								{summary.products_supplied_count}
							</p>
						</div>
						<div>
							<p className='text-xs uppercase text-zinc-500'>Recepciones</p>
							<p className='text-lg font-semibold'>{summary.receipt_count}</p>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default SupplierPurchaseSummaryCard;
