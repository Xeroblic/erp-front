import React from 'react';
import { Link } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Pages from '@/config/pages.config';
import useCan from '@/hooks/useCan';

/**
 * Aviso del alta de producto por filial: el producto de filial no tiene
 * sucursal y el stock siempre vive en una, así que se ingresa después en la
 * sucursal donde está. Ambas rutas exigen `view-product`; sin él, el texto
 * queda sin enlaces para no mandar al usuario a una pantalla que le rebota.
 */
const SubsidiaryStockNotice: React.FC = () => {
	const { has } = useCan();
	const canOpenStockScreens = has('view-product');

	return (
		<Alert
			color='blue'
			variant='outline'
			icon='HeroInformationCircle'
			title='El stock se ingresa en la sucursal'>
			Este producto se crea sin stock. Después, regístralo en la sucursal donde está con una{' '}
			{canOpenStockScreens ? (
				<>
					<Link
						className='font-semibold underline'
						to={Pages.inventory.subPages.recepciones.to}>
						recepción
					</Link>{' '}
					o un{' '}
					<Link
						className='font-semibold underline'
						to={`${Pages.inventory.subPages.ajustesTraslados.to}?tab=ajuste`}>
						ajuste de inventario
					</Link>
				</>
			) : (
				'recepción o un ajuste de inventario'
			)}
			.
		</Alert>
	);
};

export default SubsidiaryStockNotice;
