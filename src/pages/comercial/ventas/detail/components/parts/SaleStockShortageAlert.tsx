import React, { useMemo } from 'react';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import type { ISaleItem, ISaleStockShortageItem } from '@/interface/sales.interface';

interface ISaleStockShortageAlertProps {
	message: string;
	shortages: ISaleStockShortageItem[];
	/** Ítems de la venta para nombrar cada línea; una línea sin match se nombra por su id. */
	items: ISaleItem[];
	className?: string;
}

export const formatShortageQuantities = (shortage: ISaleStockShortageItem): string =>
	`Pedido ${shortage.requested} · Disponible ${shortage.available}`;

const describeItem = (item: ISaleItem | undefined, shortage: ISaleStockShortageItem): string => {
	if (!item) return `Ítem #${shortage.sale_item_id} · Producto #${shortage.product_id}`;
	const sku = item.sku || item.product?.sku;
	const name = item.product?.name || item.name || 'Producto sin nombre';
	return sku ? `${sku} — ${name}` : name;
};

const SaleStockShortageAlert: React.FC<ISaleStockShortageAlertProps> = ({
	message,
	shortages,
	items,
	className,
}) => {
	const itemsById = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

	// El backend suma la demanda de las líneas del mismo producto: se avisa para que
	// «Pedido» no parezca un error cuando supera la cantidad de la línea.
	const linesByProduct = useMemo(() => {
		const counts = new Map<number, number>();
		shortages.forEach((s) => counts.set(s.product_id, (counts.get(s.product_id) ?? 0) + 1));
		return counts;
	}, [shortages]);

	return (
		<Alert
			color='red'
			colorIntensity='500'
			variant='outline'
			icon='HeroExclamationTriangle'
			className={className}
			role='alert'>
			<div className='space-y-3 text-sm'>
				<p className='font-semibold'>{message}</p>

				<ul className='space-y-2' aria-label='Ítems sin stock suficiente'>
					{shortages.map((shortage) => {
						const sharedLines = linesByProduct.get(shortage.product_id) ?? 1;
						return (
							<li
								key={shortage.sale_item_id}
								className='rounded-md border border-red-200 bg-white/70 px-3 py-2 text-zinc-800 dark:border-red-900/60 dark:bg-zinc-900/60 dark:text-zinc-100'>
								<div className='flex flex-wrap items-center justify-between gap-2'>
									<span className='min-w-0 font-medium wrap-break-word'>
										{describeItem(
											itemsById.get(shortage.sale_item_id),
											shortage,
										)}
									</span>
									<Badge
										variant='solid'
										color='red'
										className='shrink-0 px-2 text-xs text-white'>
										{formatShortageQuantities(shortage)}
									</Badge>
								</div>
								{sharedLines > 1 && (
									<p className='mt-1 text-xs text-zinc-600 dark:text-zinc-400'>
										Se suma la demanda de las {sharedLines} líneas de este
										producto.
									</p>
								)}
								{shortage.branch_id === null && (
									<p className='mt-1 text-xs text-zinc-600 dark:text-zinc-400'>
										Ni la venta ni el producto tienen sucursal: no hay de dónde
										descontar el stock.
									</p>
								)}
							</li>
						);
					})}
				</ul>

				<div className='text-zinc-700 dark:text-zinc-300'>
					<p className='flex items-center gap-1 font-semibold'>
						<Icon icon='HeroLightBulb' className='h-4 w-4' />
						Cómo resolverlo
					</p>
					<ul className='mt-1 list-disc space-y-1 pl-5'>
						<li>Corrige la venta: ajusta o quita las cantidades que no alcanzan.</li>
						<li>Traslada stock desde otra sucursal de la filial a la de la venta.</li>
						<li>Registra la entrada que falta si el stock llegó y no se ingresó.</li>
					</ul>
					<p className='mt-2 text-xs text-zinc-600 dark:text-zinc-400'>
						La venta sigue abierta y no se descontó stock. Vuelve a cerrarla cuando el
						stock esté disponible.
					</p>
				</div>
			</div>
		</Alert>
	);
};

export default SaleStockShortageAlert;
