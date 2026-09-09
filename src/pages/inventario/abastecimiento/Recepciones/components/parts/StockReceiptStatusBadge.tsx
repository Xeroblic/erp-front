import React from 'react';
import Badge from '@/components/ui/Badge';
import type { TColors } from '@/types/colors.type';
import type { TStockReceiptStatus } from '@/interface/procurement.interface';
import { STOCK_RECEIPT_STATUS_LABELS } from '../../types';

const COLOR_BY_STATUS: Record<TStockReceiptStatus, TColors> = {
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
 * verde ni en rojo: todavía no hay stock, no es un éxito ni un error.
 */
const StockReceiptStatusBadge: React.FC<IStockReceiptStatusBadgeProps> = ({ status }) => (
	<Badge color={COLOR_BY_STATUS[status]} variant='solid'>
		{STOCK_RECEIPT_STATUS_LABELS[status]}
	</Badge>
);

export default StockReceiptStatusBadge;
