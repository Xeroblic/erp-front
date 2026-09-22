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
 * Proveedores, documentos de compra y recepciones corren sólo contra servicios
 * mock (PR #67 del backend: ningún endpoint existe todavía). Comparten la
 * bandera de Inventario y Ajustes y traslados —las recepciones publicadas
 * escriben en ese mismo stock simulado—, así que el módulo se enciende o se
 * apaga entero: nunca queda una pantalla operando con datos ficticios en un
 * entorno donde el stock está deshabilitado.
 */

/** Aviso visible mientras la pantalla opera con datos simulados. */
export const ProcurementMockNotice = () =>
	INVENTORY_STOCK_USE_MOCKS ? (
		<Alert color='amber' title='Datos simulados'>
			Pantalla de demostración. Lo que se registre acá no se guarda en el sistema real.
		</Alert>
	) : null;

export interface IProcurementMockGateProps {
	/** Título de la página cuando la pantalla está deshabilitada. */
	title: string;
	icon: TIcons;
	children: ReactElement;
}

/**
 * Se monta en el `index.tsx` de cada pantalla, antes de la vista: con la
 * bandera apagada no se ejecuta el hook de la página, así que tampoco se
 * siembra ni se persiste el store mock.
 */
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
