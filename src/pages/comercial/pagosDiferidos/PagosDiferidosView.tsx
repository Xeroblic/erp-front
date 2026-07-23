import React from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

const PagosDiferidosView: React.FC = () => (
	<PageWrapper isProtectedRoute title='Pagos diferidos'>
		<Subheader>
			<SubheaderLeft>
				<Icon icon='HeroBanknotes' />
				<span>Comercial / Pagos diferidos</span>
			</SubheaderLeft>
		</Subheader>
		<Container>
			<Card>
				<CardHeader>
					<CardTitle>Dashboard de cuentas por cobrar</CardTitle>
				</CardHeader>
				<CardBody>
					<p className='text-sm text-zinc-500'>
						La visualización de indicadores y documentos se habilitará en el siguiente
						paso.
					</p>
				</CardBody>
			</Card>
		</Container>
	</PageWrapper>
);

export default PagosDiferidosView;
