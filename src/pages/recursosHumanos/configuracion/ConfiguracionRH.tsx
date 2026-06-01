import React from 'react';
import Container from '@/components/layouts/Container/Container';
import SucursalConfigForm from './components/SucursalConfigForm';
import FeriadosManager from './components/FeriadosManager';
import QRCodeDisplay from './components/QRCodeDisplay';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

const ConfiguracionRH: React.FC = () => {
	return (
		<>
		
		<Subheader className='mb-6'>
			<SubheaderLeft className='text-2xl font-bold text-zinc-100'>
				<Icon icon='HeroCog6Tooth' className='text-2xl' />
				<div className='flex flex-col items-start gap-2'>
					<Badge className='text-2xl'>
						Configuración de Recursos Humanos
					</Badge>
					<p className='mt-1 text-sm text-zinc-400'>
						Configura la sucursal, feriados y genera el código QR para el reloj control.
					</p>
				</div>
			</SubheaderLeft>
		</Subheader>
		<Container>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<div className='lg:col-span-2'>
					<div className='flex flex-col gap-6'>
						<SucursalConfigForm />
						<FeriadosManager />
					</div>
				</div>

				<div>
					<QRCodeDisplay />
				</div>
			</div>
		</Container>
	</>
	);
};

export default ConfiguracionRH;
