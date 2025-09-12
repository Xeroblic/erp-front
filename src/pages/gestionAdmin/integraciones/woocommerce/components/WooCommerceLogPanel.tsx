// Panel de log de errores y sincronizaciones
import React from 'react';
const WooCommerceLogPanel: React.FC = () => {
	// TODO: Mostrar historial de eventos y errores recientes
	return (
		<div className='rounded border bg-gray-50 p-4'>
			<h3 className='mb-2 font-semibold'>Log de errores recientes</h3>
			<ul>
				<li>Sin eventos aún.</li>
			</ul>
		</div>
	);
};
export default WooCommerceLogPanel;
