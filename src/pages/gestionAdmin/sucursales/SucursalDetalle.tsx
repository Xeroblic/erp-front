import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMisSucursales,
	updateSucursal,
	deleteSucursal,
} from '@/store/slices/sucursales/sucursalesSlice';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import SucursalModal from './components/SucursalModal';
import { ISucursal } from '@/interface/empresas.interface';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';

export default function SucursalDetalle() {
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const sucursales = useAppSelector((s) => s.sucursales.lista);
	const loading = useAppSelector((s) => s.sucursales.loading);
	const [sucursal, setSucursal] = useState<ISucursal | null>(null);
	const [openEdit, setOpenEdit] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);

	useEffect(() => {
		if (id) {
			// Cargar sucursales si no están cargadas
			if (sucursales.length === 0) {
				dispatch(fetchMisSucursales());
			}

			// Cargar subsidiarias para mostrar el nombre
			dispatch(fetchMisSubsidiarias());
		}
	}, [dispatch, id, sucursales.length]);

	useEffect(() => {
		if (id && sucursales.length > 0) {
			const foundSucursal = sucursales.find((s) => s.id === parseInt(id));
			if (foundSucursal) {
				setSucursal(foundSucursal);
			} else {
				toast.error('Sucursal no encontrada');
				navigate('/gestion/sucursal');
			}
		}
	}, [id, sucursales, navigate]);

	const handleEdit = () => {
		setOpenEdit(true);
	};

	const handleCloseEdit = () => {
		setOpenEdit(false);
	};

	const handleSuccessEdit = () => {
		handleCloseEdit();
		dispatch(fetchMisSucursales());
	};

	const confirmDelete = async () => {
		if (!sucursal?.id) return;
		try {
			await dispatch(deleteSucursal(sucursal.id)).unwrap();
			toast.success('Sucursal eliminada correctamente');
			navigate('/gestion/sucursal');
		} catch {
			toast.error('Error al eliminar sucursal');
		} finally {
			setOpenDelete(false);
		}
	};

	if (loading) {
		return (
			<PageWrapper isProtectedRoute title='Cargando...' name='Sucursal'>
				<Container className='pt-4'>
					<div className='flex items-center justify-center py-12'>
						<div className='flex items-center gap-3'>
							<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
							<span className='text-zinc-600'>Cargando sucursal...</span>
						</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (!sucursal) {
		return (
			<PageWrapper isProtectedRoute title='Sucursal no encontrada' name='Sucursal'>
				<Container className='pt-4'>
					<div className='flex flex-col items-center justify-center py-12 text-center'>
						<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-800/20'>
							<Icon
								icon='HeroExclamationTriangle'
								className='text-2xl text-red-600'
							/>
						</div>
						<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
							Sucursal no encontrada
						</h3>
						<p className='mb-4 max-w-sm text-sm text-zinc-500'>
							La sucursal que buscas no existe o no tienes permisos para verla.
						</p>
						<Button
							variant='solid'
							onClick={() => navigate('/gestion/sucursal')}
							size='sm'>
							Volver a Sucursales
						</Button>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper isProtectedRoute title={`Sucursal: ${sucursal.name}`} name='Detalle Sucursal'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<Button
							variant='outline'
							size='sm'
							icon='HeroArrowLeft'
							onClick={() => navigate('/gestion/sucursal')}>
							Volver
						</Button>
						<div className='flex items-center gap-2'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
								<Icon
									icon='HeroBuildingOffice'
									className='text-lg text-primary-600'
								/>
							</div>
							<div>
								<h1 className='text-lg font-semibold'>{sucursal.name}</h1>
								<p className='text-sm text-zinc-500'>ID: {sucursal.id}</p>
							</div>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-2'>
					<Button variant='outline' icon='HeroPencil' onClick={handleEdit}>
						Editar
					</Button>
					<Button
						variant='solid'
						color='red'
						icon='HeroTrash'
						onClick={() => setOpenDelete(true)}>
						Eliminar
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
					{/* Información básica */}
					<div className='lg:col-span-2'>
						<Card>
							<CardHeader>
								<CardTitle>Información Básica</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<label className='mb-1 block text-sm font-medium text-zinc-700'>
											Nombre
										</label>
										<div className='text-base font-medium'>{sucursal.name}</div>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-zinc-700'>
											Subsidiaria
										</label>
										<div className='flex items-center gap-2'>
											{sucursal.subsidiary_name ? (
												<>
													<Icon
														icon='HeroBuildingStorefront'
														className='text-sm text-zinc-400'
													/>
													<span>{sucursal.subsidiary_name}</span>
												</>
											) : (
												<Badge variant='outline' className='text-zinc-400'>
													Sin subsidiaria
												</Badge>
											)}
										</div>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-zinc-700'>
											RUT
										</label>
										<div>
											{sucursal.rut ? (
												<span className='font-mono'>{sucursal.rut}</span>
											) : (
												<Badge variant='outline' className='text-zinc-400'>
													Sin RUT
												</Badge>
											)}
										</div>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-zinc-700'>
											Teléfono
										</label>
										<div>
											{sucursal.phone ? (
												<div className='flex items-center gap-2'>
													<Icon
														icon='HeroPhone'
														className='text-sm text-zinc-400'
													/>
													<span>{sucursal.phone}</span>
												</div>
											) : (
												<Badge variant='outline' className='text-zinc-400'>
													Sin teléfono
												</Badge>
											)}
										</div>
									</div>
								</div>

								<div>
									<label className='mb-1 block text-sm font-medium text-zinc-700'>
										Dirección
									</label>
									<div>
										{sucursal.address ? (
											<div className='flex items-start gap-2'>
												<Icon
													icon='HeroMapPin'
													className='mt-0.5 text-sm text-zinc-400'
												/>
												<span>{sucursal.address}</span>
											</div>
										) : (
											<Badge variant='outline' className='text-zinc-400'>
												Sin dirección
											</Badge>
										)}
									</div>
								</div>

								{sucursal.email && (
									<div>
										<label className='mb-1 block text-sm font-medium text-zinc-700'>
											Email
										</label>
										<div className='flex items-center gap-2'>
											<Icon
												icon='HeroEnvelope'
												className='text-sm text-zinc-400'
											/>
											<a
												href={`mailto:${sucursal.email}`}
												className='text-primary-600 hover:text-primary-800'>
												{sucursal.email}
											</a>
										</div>
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					{/* Información del encargado */}
					<div>
						<Card>
							<CardHeader>
								<CardTitle>Encargado</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								{sucursal.manager_name ? (
									<>
										<div>
											<label className='mb-1 block text-sm font-medium text-zinc-700'>
												Nombre
											</label>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroUser'
													className='text-sm text-zinc-400'
												/>
												<span>{sucursal.manager_name}</span>
											</div>
										</div>

										{sucursal.manager_phone && (
											<div>
												<label className='mb-1 block text-sm font-medium text-zinc-700'>
													Teléfono
												</label>
												<div className='flex items-center gap-2'>
													<Icon
														icon='HeroPhone'
														className='text-sm text-zinc-400'
													/>
													<span>{sucursal.manager_phone}</span>
												</div>
											</div>
										)}

										{sucursal.manager_email && (
											<div>
												<label className='mb-1 block text-sm font-medium text-zinc-700'>
													Email
												</label>
												<div className='flex items-center gap-2'>
													<Icon
														icon='HeroEnvelope'
														className='text-sm text-zinc-400'
													/>
													<a
														href={`mailto:${sucursal.manager_email}`}
														className='text-sm text-primary-600 hover:text-primary-800'>
														{sucursal.manager_email}
													</a>
												</div>
											</div>
										)}
									</>
								) : (
									<div className='py-8 text-center'>
										<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
											<Icon
												icon='HeroUser'
												className='text-xl text-zinc-400'
											/>
										</div>
										<p className='text-sm text-zinc-500'>
											Sin encargado asignado
										</p>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>
			</Container>

			{/* Modal de edición */}
			<SucursalModal
				isOpen={openEdit}
				onClose={handleCloseEdit}
				sucursal={sucursal}
				onSuccess={handleSuccessEdit}
			/>

			{/* Modal de confirmación de borrado */}
			{openDelete && (
				<Modal isOpen={openDelete} setIsOpen={setOpenDelete}>
					<ModalHeader>Eliminar Sucursal</ModalHeader>
					<ModalBody>
						<div className='mb-4 flex items-center gap-3'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='text-xl text-red-600'
								/>
							</div>
							<div>
								<h3 className='font-medium text-zinc-900'>
									¿Eliminar sucursal "{sucursal.name}"?
								</h3>
								<p className='text-sm text-zinc-500'>
									Esta acción no se puede deshacer.
								</p>
							</div>
						</div>
						<p className='text-zinc-700'>
							¿Estás seguro de que deseas eliminar esta sucursal? Todos los datos
							asociados se perderán permanentemente.
						</p>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button variant='outline' onClick={() => setOpenDelete(false)}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button variant='solid' color='red' onClick={confirmDelete}>
								Eliminar Sucursal
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	);
}
