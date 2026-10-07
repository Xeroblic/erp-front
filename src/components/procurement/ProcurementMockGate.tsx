import React from 'react';
import type { ReactElement } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Alert from '@/components/ui/Alert';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import type { TIcons } from '@/types/icons.type';

/**
 * Comparte la bandera de Inventario porque las recepciones escriben en ese mismo
 * stock simulado: el módulo se enciende o se apaga entero.
 */
export const ProcurementMockNotice = () =>
	INVENTORY_STOCK_USE_MOCKS ? (
		<Alert color='amber' title='Datos simulados'>
			Pantalla de demostración. Lo que se registre acá no se guarda en el sistema real.
		</Alert>
	) : null;

export interface IProcurementMockGateProps {
	title: string;
	icon: TIcons;
	children: ReactElement;
}

/** Va en el `index.tsx`, antes de la vista: apagado, no se siembra ni persiste el store mock. */
const ProcurementMockGate = ({ title, icon, children }: IProcurementMockGateProps) => {
	if (INVENTORY_STOCK_USE_MOCKS) return children;

	return (
		<PageWrapper isProtectedRoute title={title}>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle icon={icon} title={title} />
				</SubheaderLeft>
			</Subheader>
			<Container>
				<Alert title='Pantalla no habilitada'>
					Esta pantalla aún no está habilitada en este entorno.
				</Alert>
			</Container>
		</PageWrapper>
	);
};

export default ProcurementMockGate;
