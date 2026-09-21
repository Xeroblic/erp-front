import React from 'react';
import { StatusPill, type TStatusPillColor } from '@/components/procurement';
import type { IInventoryCriticalStock } from '@/interface/inventoryOverview.interface';
import {
	ESTADO_LABELS,
	estadoVisible,
	type TInventarioEstadoVisible,
} from '@/pages/inventario/Inventario/types';

const ESTADO_COLORS: Record<TInventarioEstadoVisible, TStatusPillColor> = {
	critical: 'amber',
	out: 'red',
	unconfigured: 'zinc',
	healthy: 'emerald',
};

interface IEstadoStockPillProps {
	critical: IInventoryCriticalStock | null;
	/** Ajusta el ancho al texto (cabecera de la ficha) en vez del ancho fijo de columna. */
	fit?: boolean;
}

/** Hay unidades vendibles, pero las reservas se las llevan todas. */
export const todoReservado = (critical: IInventoryCriticalStock | null): boolean =>
	critical !== null &&
	critical.available_quantity <= 0 &&
	critical.held_quantity > 0 &&
	critical.fit_quantity > 0;

/**
 * Estado del stock de un producto en la sucursal. «Sin disponible» gana a los
 * estados del §13: si no queda nada para vender, el umbral ya no es lo
 * importante; cuando es porque todo está reservado se dice «Todo reservado»,
 * así no parece que falte stock. Los productos con serie no tienen umbral y
 * no muestran estado.
 */
const EstadoStockPill: React.FC<IEstadoStockPillProps> = ({ critical, fit = false }) => {
	const estado = estadoVisible(critical);
	if (!estado) return <span className='text-sm text-zinc-500'>—</span>;
	if (todoReservado(critical))
		return (
			<StatusPill color='violet' width={9} fit={fit}>
				Todo reservado
			</StatusPill>
		);
	return (
		<StatusPill color={ESTADO_COLORS[estado]} width={9} fit={fit}>
			{ESTADO_LABELS[estado]}
		</StatusPill>
	);
};

export default EstadoStockPill;
