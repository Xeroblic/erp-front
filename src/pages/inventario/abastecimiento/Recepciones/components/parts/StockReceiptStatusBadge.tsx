import React from 'react';
import { StatusPill, type TStatusPillColor } from '@/components/procurement';
import type { TStockReceiptStatus } from '@/interface/procurement.interface';
import { STOCK_RECEIPT_STATUS_LABELS } from '../../types';

const COLOR_BY_STATUS: Record<TStockReceiptStatus, TStatusPillColor> = {
	draft: 'zinc',
	queued: 'blue',
	posted: 'emerald',
	failed: 'red',
	reversed: 'amber',
	cancelled: 'zinc',
};

interface IStockReceiptStatusBadgeProps {
	status: TStockReceiptStatus;
}

/**
 * Ciclo de estados de una recepción (sección 7): `draft` → `queued` →
 * `posted`/`failed`, más `cancelled` y `reversed`. `queued` en azul, no en
 * verde ni en rojo: todavía no hay stock, no es un éxito ni un error. Ancho
 * fijo para «Contabilizada», la más larga de esta columna.
 */
const StockReceiptStatusBadge: React.FC<IStockReceiptStatusBadgeProps> = ({ status }) => (
	<StatusPill color={COLOR_BY_STATUS[status]} width={8.5}>
		{STOCK_RECEIPT_STATUS_LABELS[status]}
	</StatusPill>
);

export default StockReceiptStatusBadge;
