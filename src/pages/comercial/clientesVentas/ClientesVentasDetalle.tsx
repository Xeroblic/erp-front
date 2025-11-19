import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomerDetailThunk } from '@/store/slices/customerSales/customerSalesSlice';

const ClientesVentasDetalle = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { detalle, loading } = useAppSelector((s) => s.customerSales);

	useEffect(() => {
		if (id) {
			dispatch(
				fetchCustomerDetailThunk({
					subsidiary: 1, // cambia según corresponda
					id,
				})
			);
		}
	}, [id, dispatch]);

	// LOADING
	if (loading || !detalle) {
		return (
			<PageWrapper>
				<Container>
					<div className='p-10 text-center text-zinc-500'>
						Cargando información del cliente...
					</div>
				</Container>
			</PageWrapper>
		);
	}

	// Nombre visible
	const nombre = detalle.billing_company || detalle.contact_name || 'Cliente sin nombre';

	const contacto = detalle.primary_contact || {
		name: detalle.contact_name,
		email: detalle.email,
		phone: detalle.phone,
	};

	return (
		<PageWrapper>
			{/* SUBHEADER */}
			<Subheader>
				<SubheaderLeft>
					<h2 className='text-2xl font-semibold'>{nombre}</h2>
					<p className='text-zinc-500 text-sm'>Cliente #{detalle.id}</p>
				</SubheaderLeft>

				<SubheaderRight>
					<Button variant='outline' onClick={() => navigate('/clientes-ventas')}>
						Volver
					</Button>
					<Button variant='solid'>Editar</Button>
					<Button variant='danger'>Eliminar</Button>
				</SubheaderRight>
			</Subheader>

			{/* CONTENIDO */}
			<Container>
				<Card className='border border-zinc-200 dark:border-zinc-700'>
					<CardBody>
						<div className='space-y-8'>

							{/* RUT Y ESTADO */}
							<div className='grid grid-cols-2 gap-6'>
								<div>
									<h3 className='text-sm font-semibold text-zinc-500'>RUT</h3>
									<p className='text-lg'>{detalle.rut}</p>
								</div>

								<div>
									<h3 className='text-sm font-semibold text-zinc-500'>Estado</h3>
									<Badge
										variant='solid'
										color={detalle.is_active ? 'green' : 'red'}>
										{detalle.is_active ? 'Activo' : 'Inactivo'}
									</Badge>
								</div>
							</div>

							{/* DATOS DE CONTACTO */}
							<div className='space-y-2'>
								<h3 className='text-sm font-semibold text-zinc-500'>Datos de contacto</h3>
								<div className='grid grid-cols-2 gap-6'>
									<div>
										<p className='font-medium'>Email</p>
										<p>{detalle.email}</p>
									</div>

									<div>
										<p className='font-medium'>Teléfono</p>
										<p>{detalle.phone}</p>
									</div>

									<div>
										<p className='font-medium'>Contacto Principal</p>
										<p>{contacto.name}</p>
									</div>

									<div>
										<p className='font-medium'>Correo Contacto</p>
										<p>{contacto.email}</p>
									</div>

									<div>
										<p className='font-medium'>Teléfono Contacto</p>
										<p>{contacto.phone}</p>
									</div>
								</div>
							</div>

							{/* DIRECCIÓN (solo si existe algo) */}
							{(detalle.billing_address_1 ||
								detalle.billing_city ||
								detalle.commune?.name) && (
								<div className='space-y-2'>
									<h3 className='text-sm font-semibold text-zinc-500'>Dirección</h3>
									<div className='space-y-1'>
										{detalle.billing_address_1 && <p>{detalle.billing_address_1}</p>}
										{detalle.billing_city && (
											<p className='text-zinc-500'>{detalle.billing_city}</p>
										)}
										{detalle.commune && (
											<p className='text-zinc-500'>{detalle.commune.name}</p>
										)}
									</div>
								</div>
							)}

							{/* NOTAS (solo si hay) */}
							{detalle.notes && (
								<div className='space-y-2'>
									<h3 className='text-sm font-semibold text-zinc-500'>Notas</h3>
									<p className='text-zinc-700 dark:text-zinc-300'>{detalle.notes}</p>
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default ClientesVentasDetalle;
