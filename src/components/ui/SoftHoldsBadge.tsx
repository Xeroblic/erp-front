import React from 'react';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import type { IProductSoftHolds } from '@/interface/product.interface';

interface SoftHoldsBadgeProps {
	softHolds?: IProductSoftHolds | null;
	availableStock?: number | null;
	className?: string;
}

const HELD_STYLE =
	'border-amber-400 bg-amber-400/20 text-amber-700 dark:border-amber-400/60 dark:bg-amber-400/15 dark:text-amber-200';
const ALL_HELD_STYLE =
	'border-red-400 bg-red-500/15 text-red-600 dark:border-red-500/60 dark:bg-red-500/20 dark:text-red-300';

const SoftHoldsBadge: React.FC<SoftHoldsBadgeProps> = ({
	softHolds,
	availableStock,
	className,
}) => {
	if (!softHolds || softHolds.quantity <= 0) return null;

	const { quantity, web, manual, pending_sales_count: pendingSalesCount } = softHolds;
	const unidades = quantity === 1 ? 'unidad apartada' : 'unidades apartadas';
	const allHeld = availableStock !== null && availableStock !== undefined && availableStock <= 0;

	const detalle = [
		web > 0 ? `${web} web` : null,
		manual > 0 ? `${manual} manual` : null,
		pendingSalesCount > 0
			? `${pendingSalesCount} ${pendingSalesCount === 1 ? 'venta' : 'ventas'} en proceso`
			: null,
	]
		.filter(Boolean)
		.join(' · ');

	const baseText = detalle ? `${quantity} ${unidades} (${detalle})` : `${quantity} ${unidades}`;
	const tooltipText = allHeld
		? `No disponible: todo el stock está apartado. ${baseText}`
		: baseText;

	const label = allHeld
		? `No disponible · ${quantity}/u apartad${quantity === 1 ? 'a' : 'as'}`
		: `${quantity} apartad${quantity === 1 ? 'a' : 'as'}`;

	return (
		<Tooltip text={tooltipText} placement='top'>
			<span
				className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${
					allHeld ? ALL_HELD_STYLE : HELD_STYLE
				} ${className ?? ''}`}>
				<Icon
					icon={allHeld ? 'HeroExclamationTriangle' : 'HeroLockClosed'}
					className='h-3.5 w-3.5'
				/>
				<span>{label}</span>
			</span>
		</Tooltip>
	);
};

SoftHoldsBadge.displayName = 'SoftHoldsBadge';

export default SoftHoldsBadge;
