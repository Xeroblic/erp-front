// src/pages/recursosHumanos/configuracion/ConfiguracionRH.tsx
import React from 'react';
import Container from '@/components/layouts/Container/Container';
import SucursalConfigForm from './components/SucursalConfigForm';
import FeriadosManager from './components/FeriadosManager';
import QRCodeDisplay from './components/QRCodeDisplay';

const ConfiguracionRH: React.FC = () => {
	return (
		<Container>
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-zinc-100'>
					Configuración de Recursos Humanos
				</h1>
				<p className='mt-1 text-sm text-zinc-400'>
					Configura la sucursal, feriados y genera el código QR para el reloj control.
				</p>
			</div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* Configuración de sucursal (2 columnas) */}
				<div className='lg:col-span-2'>
					<div className='flex flex-col gap-6'>
						<SucursalConfigForm />
						<FeriadosManager />
					</div>
				</div>

				{/* QR Code (1 columna) */}
				<div>
					<QRCodeDisplay />
				</div>
			</div>
		</Container>
	);
};

export default ConfiguracionRH;
