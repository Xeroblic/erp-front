import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface ErrorStateProps {
	title: string;
	description: string;
	actions?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title, description, actions }) => (
	<PageWrapper title={title} name='Detalle de producto'>
		<Container>
			<Card>
				<CardBody className='space-y-3 text-center'>
					<Icon
						icon='HeroExclamationTriangle'
						className='mx-auto h-10 w-10 text-red-500'
					/>
					<p className='text-lg font-semibold text-neutral-700'>{title}</p>
					<p className='text-sm text-neutral-500'>{description}</p>
					{actions}
				</CardBody>
			</Card>
		</Container>
	</PageWrapper>
);

export const InvalidProductError: React.FC = () => {
	const navigate = useNavigate();

	return (
		<ErrorState
			title='Producto no válido'
			description='El identificador del producto no es válido. Regresa al listado para seleccionar un producto.'
			actions={
				<Button
					icon='HeroArrowLeft'
					variant='outline'
					onClick={() => navigate('/catalogos/productos')}>
					Volver al listado
				</Button>
			}
		/>
	);
};

export const ProductNotFoundError: React.FC = () => {
	const navigate = useNavigate();

	return (
		<ErrorState
			title='No se encontró el producto'
			description='No pudimos obtener la información del producto. Verifica la sucursal seleccionada o intenta nuevamente.'
			actions={
				<div className='flex justify-center gap-3'>
					<Button
						variant='outline'
						icon='HeroListBullet'
						onClick={() => navigate('/catalogos/productos')}>
						Ver listado
					</Button>
					<Button
						variant='outline'
						icon='HeroArrowPath'
						onClick={() => window.location.reload()}>
						Reintentar
					</Button>
				</div>
			}
		/>
	);
};

export const LoadingState: React.FC = () => (
	<PageWrapper title='Cargando producto' name='Detalle de producto'>
		<Container>
			<Card>
				<CardBody className='flex items-center gap-3 text-sm text-neutral-500'>
					<div className='h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent' />
					Cargando información del producto…
				</CardBody>
			</Card>
		</Container>
	</PageWrapper>
);
