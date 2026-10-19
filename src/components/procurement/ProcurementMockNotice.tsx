import React from 'react';
import Alert from '@/components/ui/Alert';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';

export interface IProcurementMockNoticeProps {
	/**
	 * Bandera de datos simulados de la pantalla. Por omisión la de Inventario;
	 * Recepciones pasa la suya (`VITE_INVENTORY_RECEIPTS_USE_MOCKS`).
	 */
	isActive?: boolean;
}

/** Aviso visible mientras la pantalla muestre datos simulados. */
export const ProcurementMockNotice = ({
	isActive = INVENTORY_STOCK_USE_MOCKS,
}: IProcurementMockNoticeProps) =>
	isActive ? (
		<Alert color='amber' title='Datos simulados'>
			Pantalla de demostración. Lo que se registre acá no se guarda en el sistema real.
		</Alert>
	) : null;

export default ProcurementMockNotice;
