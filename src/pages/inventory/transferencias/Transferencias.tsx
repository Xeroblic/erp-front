import React from 'react';
import TransferenciasAdmin from '@/pages/comercial/transferencias/TransferenciasAdmin';

const InventoryTransfersPage: React.FC = () => {
	return (
		<TransferenciasAdmin
			title='Transferencias de Inventario'
			subtitle='Consulta y gestiona las transferencias desde el módulo de inventario.'
		/>
	);
};

export default InventoryTransfersPage;
