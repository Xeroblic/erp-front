// Tarjeta de estado de integración y última sincronización
import React from 'react';
const WooCommerceStatusCard: React.FC = () => {
	// TODO: Mostrar estado ON/OFF, última sincronización, modo de operación
	return (
		<div className='mb-4 rounded border bg-blue-50 p-4'>
			<strong>Estado integración:</strong> <span>OFF</span>
			<br />
			<strong>Última sincronización:</strong> <span>-</span>
			<br />
			<strong>Modo de operación:</strong> <span>Lectura</span>
		</div>
	);
};
export default WooCommerceStatusCard;
