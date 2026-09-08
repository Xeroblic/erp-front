import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import type { IWarehouseCompact } from '@/interface/procurement.interface';

/**
 * Texto que el contrato asigna a `warehouse_id: null`. No es «sin datos» ni un
 * error de carga: es una ubicación válida dentro de la sucursal, vendible y
 * trasladable, donde vive el stock inicial reconciliado.
 */
export const UNLOCATED_WAREHOUSE_LABEL = 'Sin ubicación';

export interface IWarehouseLabelProps {
	/** Bodega compacta del contrato. `null` se presenta como «Sin ubicación». */
	warehouse: IWarehouseCompact | null;
	/** Oculta el icono cuando el contexto ya lo aporta (una celda de tabla densa). */
	withIcon?: boolean;
	className?: string;
}

/**
 * Etiqueta de ubicación del módulo de abastecimiento.
 *
 * Se usa en todas las cards que muestran bodega para que «Sin ubicación» se lea
 * igual en stock, recepciones, traslados y ajustes, en vez de aparecer como un
 * guion en una pantalla y como «—» en otra.
 */
const WarehouseLabel: FC<IWarehouseLabelProps> = ({ warehouse, withIcon = true, className }) => {
	const isUnlocated = warehouse === null;

	return (
		<span
			data-component-name='Procurement/WarehouseLabel'
			data-unlocated={isUnlocated ? 'true' : 'false'}
			className={classNames('inline-flex items-center gap-1', className)}>
			{withIcon && (
				<Icon
					icon={isUnlocated ? 'HeroQuestionMarkCircle' : 'HeroBuildingStorefront'}
					className={classNames(
						'h-4 w-4 shrink-0',
						isUnlocated ? 'text-zinc-400' : 'text-zinc-500',
					)}
				/>
			)}
			<span className={classNames(isUnlocated && 'italic text-zinc-500 dark:text-zinc-400')}>
				{isUnlocated ? UNLOCATED_WAREHOUSE_LABEL : warehouse.name}
			</span>
		</span>
	);
};

export default WarehouseLabel;
