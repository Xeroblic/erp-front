import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import React from 'react';

const ClientesVentas = () => {

	

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<h2 className='text-2xl font-semibold'>Clientes Ventas</h2>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='outline'
						onClick={() => {
							// Acción al hacer clic en el botón
						}}>
						Nueva Venta
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container>
				<Card className='border border-zinc-200 dark:border-zinc-700'>
					<CardBody>
						<div className='p-4 text-zinc-500'>Contenido de Clientes Ventas</div>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default ClientesVentas;
