import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';

import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomerDetailThunk } from '@/store/slices/customerSales/customerSalesSlice';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

import CreateCustomerSaleModal from './components/modals/CreateCustomerSaleModal';

const ClientesVentasDetalle = () => {
	const { clienteId } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { detalle, loading } = useAppSelector((s) => s.customerSales);
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const [isEditOpen, setIsEditOpen] = useState(false);

	useEffect(() => {
		if (clienteId) {
			dispatch(
				fetchCustomerDetailThunk({
					subsidiary: effectiveSubsidiaryId ?? 1,
					id: clienteId,
				} as any),
			);
		}
	}, [clienteId, dispatch, effectiveSubsidiaryId]);

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

	const contacto = detalle.primary_contact ?? {
		name: detalle.contact_name,
		email: detalle.email,
		phone: detalle.phone,
	};

	return (
		<PageWrapper title='Detalle cliente' name='Detalle cliente'>
			{/* HEADER SUPERIOR */}
			<Subheader>
				<SubheaderLeft>
					<div className='flex flex-col space-y-1'>
						<h2 className='text-3xl font-bold tracking-tight'>
							{detalle.billing_company || contacto.name}
						</h2>

						<div className='flex items-center space-x-3'>
							<Badge variant='outline'>ID Cliente: {detalle.id}</Badge>

							<Badge color={detalle.is_active ? 'green' : 'red'} variant='solid'>
								{detalle.is_active ? 'Activo' : 'Inactivo'}
							</Badge>

							<Badge variant='outline' color='blue'>
								{detalle.type === 'company' ? 'Empresa' : 'Persona Natural'}
							</Badge>
						</div>
					</div>
				</SubheaderLeft>

				<SubheaderRight>
					<Button
						variant='outline'
						onClick={() => navigate('/comercial/clientes-ventas')}>
						Volver
					</Button>

					<Button variant='solid' onClick={() => setIsEditOpen(true)}>
						Editar
					</Button>

					{/* <Button variant="outline" color="red">
						Eliminar
					</Button> */}
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card className='border border-zinc-300 shadow-sm dark:border-zinc-700'>
					<CardBody>
						<div className='space-y-10'>
							{/* SECCIÓN: Información básica */}
							<section>
								<h3 className='mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-200'>
									Información General
								</h3>

								<hr />

								<div className='mt-4 grid grid-cols-2 gap-6'>
									<div>
										<p className='text-sm font-medium text-zinc-500'>RUT</p>
										<p className='text-lg'>{detalle.rut}</p>
									</div>

									<div>
										<p className='text-sm font-medium text-zinc-500'>
											Fecha creación
										</p>
										<p>{new Date(detalle.created_at).toLocaleDateString()}</p>
									</div>
								</div>
							</section>

							{/* SECCIÓN: Contacto */}
							<section>
								<h3 className='mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-200'>
									Contacto
								</h3>

								<hr />

								<div className='mt-4 space-y-2'>
									<p>
										<span className='font-medium'>Nombre: </span>
										{contacto.name}
									</p>
									<p>
										<span className='font-medium'>Email: </span>
										{contacto.email}
									</p>
									<p>
										<span className='font-medium'>Teléfono: </span>
										{contacto.phone}
									</p>
								</div>
							</section>

							{/* SECCIÓN: Dirección */}
							{detalle.billing_address_1 && (
								<section>
									<h3 className='mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-200'>
										Dirección
									</h3>

									<hr />

									<div className='mt-4 space-y-1'>
										<p>{detalle.billing_address_1}</p>
										{detalle.billing_city && (
											<p className='text-zinc-500'>{detalle.billing_city}</p>
										)}
										{detalle.commune && (
											<p className='text-zinc-500'>{detalle.commune.name}</p>
										)}
									</div>
								</section>
							)}

							{/* SECCIÓN: Notas */}
							{detalle.notes && (
								<section>
									<h3 className='mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-200'>
										Notas
									</h3>

									<hr />

									<p className='mt-4'>{detalle.notes}</p>
								</section>
							)}
						</div>
					</CardBody>
				</Card>
			</Container>

			{/* MODAL DE EDICIÓN */}
			{detalle && (
				<CreateCustomerSaleModal
					isOpen={isEditOpen}
					setIsOpen={setIsEditOpen}
					subsidiaryId={effectiveSubsidiaryId ?? 1}
					isEdit
					initialData={detalle}
				/>
			)}
		</PageWrapper>
	);
};

export default ClientesVentasDetalle;
