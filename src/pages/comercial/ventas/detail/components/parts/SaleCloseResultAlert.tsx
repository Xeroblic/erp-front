import React, { useMemo } from 'react';
import Alert from '@/components/ui/Alert';
import type { ISaleCloseResult, ISaleItem } from '@/interface/sales.interface';
import { describeLocation } from '../../utils/locationAllocation';

interface ISaleCloseResultAlertProps {
	result: ISaleCloseResult;
	items: ISaleItem[];
	/** Nombres de bodega de la vista previa; una bodega desconocida se nombra por su id. */
	locationNames: ReadonlyMap<number, string>;
	className?: string;
}

const describeItem = (item: ISaleItem | undefined, saleItemId: number): string => {
	if (!item) return `Ítem #${saleItemId}`;
	const sku = item.sku || item.product?.sku;
	const name = item.product?.name || item.name || 'Producto sin nombre';
	return sku ? `${sku} — ${name}` : name;
};

/** Etapa 2: de qué ubicaciones salió cada ítem sin serie, según `fulfilled_items`. */
const SaleCloseResultAlert: React.FC<ISaleCloseResultAlertProps> = ({
	result,
	items,
	locationNames,
	className,
}) => {
	const itemsById = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
	const located = result.fulfilled_items.filter(
		(fulfilled) => (fulfilled.allocations?.length ?? 0) > 0,
	);
	if (located.length === 0) return null;

	return (
		<Alert
			color='emerald'
			colorIntensity='500'
			variant='outline'
			icon='HeroCheckCircle'
			className={className}>
			<div className='space-y-2 text-sm'>
				<p className='font-semibold'>Venta cerrada. El stock salió de:</p>
				<ul className='space-y-1' aria-label='Ubicaciones de salida del cierre'>
					{located.map((fulfilled) => (
						<li
							key={fulfilled.sale_item_id}
							className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5'>
							<span className='min-w-0 break-words font-medium'>
								{describeItem(
									itemsById.get(fulfilled.sale_item_id),
									fulfilled.sale_item_id,
								)}
							</span>
							<span className='text-zinc-700 dark:text-zinc-300'>
								{(fulfilled.allocations ?? [])
									.map(
										(allocation) =>
											`${allocation.quantity} de «${describeLocation(allocation.warehouse_id, locationNames)}»`,
									)
									.join(' · ')}
							</span>
						</li>
					))}
				</ul>
			</div>
		</Alert>
	);
};

export default SaleCloseResultAlert;
