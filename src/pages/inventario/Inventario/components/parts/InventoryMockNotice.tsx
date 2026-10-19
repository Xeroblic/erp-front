import React from 'react';
import Alert from '@/components/ui/Alert';
import INVENTORY_OPERATIONS_USE_MOCKS from '@/config/inventoryOperations.config';
import INVENTORY_OVERVIEW_USE_MOCKS from '@/config/inventoryOverview.config';

interface IInventoryMockNoticeProps {
	/** La pantalla muestra trazabilidad (pestaña o sección): su bandera también cuenta. */
	withTraceability: boolean;
}

/**
 * Aviso de datos simulados de las pantallas de Inventario. Cada fuente tiene
 * su bandera: con Inventario real y la trazabilidad simulada, el historial
 * ficticio también se advierte, en vez de quedar junto a saldos reales sin aviso.
 */
const InventoryMockNotice: React.FC<IInventoryMockNoticeProps> = ({ withTraceability }) => {
	if (INVENTORY_OVERVIEW_USE_MOCKS)
		return (
			<Alert color='amber' title='Datos simulados'>
				Consulta de demostración. Las cantidades no representan el inventario real.
			</Alert>
		);
	if (withTraceability && INVENTORY_OPERATIONS_USE_MOCKS)
		return (
			<Alert color='amber' title='Datos simulados'>
				La trazabilidad es de demostración: sus operaciones no representan movimientos
				reales. Las cantidades del inventario sí son reales.
			</Alert>
		);
	return null;
};

export default InventoryMockNotice;
