import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMisSucursales,
	updateSucursal,
	deleteSucursal,
} from '@/store/slices/sucursales/sucursalesSlice';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
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
import { IBranch, ISucursal } from '@/interface/empresas.interface';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';

export default function SucursalDetalle() {
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const sucursales = useAppSelector((s) => s.sucursales.lista);
	const loading = useAppSelector((s) => s.sucursales.loading);
	const { users, loading: loadingUsers } = useAppSelector((state) => state.usersAdmin);
	const [sucursal, setSucursal] = useState<IBranch | null>(null);
	const [openEdit, setOpenEdit] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);

	// Filtrar usuarios que pertenecen SOLO a esta sucursal
	const branchUsers = useMemo(() => {
		if (!id) return [];
		const branchId = parseInt(id);

		return users.filter((user) => {
			// Verificar si el usuario tiene acceso a esta sucursal específica
			const hasAccessToBranch = user.access?.branches?.some(
				(branch) => branch.id === branchId,
			);
			return hasAccessToBranch;
		});
	}, [users, id]);

	// Contar administradores de esta sucursal específica
	const branchAdmins = useMemo(() => {
		if (!id) return 0;
		const branchId = parseInt(id);

		return branchUsers.filter((user) => {
			// Verificar si tiene rol de admin en esta sucursal específica
			const isBranchAdmin = user.contextual_roles?.some(
				(role) =>
					(role.role === 'branch-admin' ||
						role.role === 'company-admin' ||
						role.role === 'subsidiary-admin') &&
					((role.scope_type === 'branch' && role.scope_id === branchId) ||
						role.scope_type === 'company' ||
						role.scope_type === 'subsidiary'),
			);
			return isBranchAdmin || user.is_super_admin;
		}).length;
	}, [branchUsers, id]);

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
				// Cargar usuarios de esta sucursal
				dispatch(fetchUsers({ branch_id: parseInt(id), status: 'active' }));
			} else {
				toast.error('Sucursal no encontrada');
				navigate('/gestion/sucursal');
			}
		}
	}, [id, sucursales, navigate, dispatch]);

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
		<PageWrapper isProtectedRoute title={`Sucursal: ${sucursal.branch_name}`} name='Detalle Sucursal'>
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
								<h1 className='text-lg font-semibold'>{sucursal.branch_name}</h1>
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
				{/* Cards de estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					{/* Usuarios activos */}
					<Card className='border-l-4 border-l-blue-500'>
						<CardBody className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-zinc-500'>
									Usuarios con Acceso
								</p>
								<p className='mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
									{branchUsers.length}
								</p>
								<p className='mt-1 text-xs text-zinc-400'>
									Activos en esta sucursal
								</p>
							</div>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
								<Icon icon='HeroUsers' className='text-xl text-blue-600' />
							</div>
						</CardBody>
					</Card>

					{/* Administradores */}
					<Card className='border-l-4 border-l-purple-500'>
						<CardBody className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-zinc-500'>Administradores</p>
								<p className='mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
									{branchAdmins}
								</p>
								<p className='mt-1 text-xs text-zinc-400'>
									Con permisos administrativos
								</p>
							</div>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20'>
								<Icon icon='HeroShieldCheck' className='text-xl text-purple-600' />
							</div>
						</CardBody>
					</Card>

					{/* Estado de la sucursal */}
					<Card className='border-l-4 border-l-emerald-500'>
						<CardBody className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-zinc-500'>Estado</p>
								<Badge
									variant='solid'
									color={sucursal.branch_status ? 'emerald' : 'red'}
									className='mt-1'>
									{sucursal.branch_status ? 'Activa' : 'Inactiva'}
								</Badge>
								<p className='mt-1 text-xs text-zinc-400'>
									{sucursal.commune?.name || 'Sin ubicación'}
								</p>
							</div>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20'>
								<Icon icon='HeroCheckCircle' className='text-xl text-emerald-600' />
							</div>
						</CardBody>
					</Card>

					{/* Encargado asignado */}
					<Card className='border-l-4 border-l-amber-500'>
						<CardBody className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-zinc-500'>Encargado</p>
								{sucursal.manager?.name ? (
									<>
										<p className='mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
											{sucursal.manager?.name}
										</p>
										<p className='mt-1 text-xs text-zinc-400'>
											ID: {sucursal.manager?.id}
										</p>
									</>
								) : (
									<Badge variant='outline' className='mt-1 text-zinc-400'>
										Sin asignar
									</Badge>
								)}
							</div>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
								<Icon icon='HeroUserCircle' className='text-xl text-amber-600' />
							</div>
						</CardBody>
					</Card>
				</div>

				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
					{/* Información básica */}
					<div className='lg:col-span-full'>
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
										<div className='text-base font-medium'>{sucursal.branch_name}</div>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-zinc-700'>
											Subsidiaria
										</label>
										<div className='flex items-center gap-2'>
											{sucursal.branch_name ? (
												<>
													<Icon
														icon='HeroBuildingStorefront'
														className='text-sm text-zinc-400'
													/>
													<span>{sucursal.branch_name}</span>
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
											{sucursal.branch_rut ? (
												<span className='font-mono'>{sucursal.branch_rut}</span>
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
											{sucursal.branch_phone ? (
												<div className='flex items-center gap-2'>
													<Icon
														icon='HeroPhone'
														className='text-sm text-zinc-400'
													/>
													<span>{sucursal.branch_phone}</span>
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
										{sucursal.branch_address ? (
											<div className='flex items-start gap-2'>
												<Icon
													icon='HeroMapPin'
													className='mt-0.5 text-sm text-zinc-400'
												/>
												<span>{sucursal.branch_address}</span>
											</div>
										) : (
											<Badge variant='outline' className='text-zinc-400'>
												Sin dirección
											</Badge>
										)}
									</div>
								</div>

								{sucursal.branch_email && (
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
												href={`mailto:${sucursal.branch_email}`}
												className='text-primary-600 hover:text-primary-800'>
												{sucursal.branch_email}
											</a>
										</div>
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					{/* Información del encargado */}
					
				</div>

				{/* Sección de gráficos y estadísticas adicionales */}
				<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
					{/* Información del encargado detallada */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Icon icon='HeroUserCircle' className='text-primary-600' />
								Información del Encargado
							</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							{sucursal.manager ? (
								<>
									<div className='flex items-center gap-4'>
										<div className='dark:bg-primary-900/20 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100'>
											<Icon
												icon='HeroUser'
												className='text-2xl text-primary-600'
											/>
										</div>
										<div>
											<h3 className='font-semibold text-zinc-900 dark:text-zinc-100'>
												{sucursal.manager.name ||
													`${sucursal.manager.first_name} ${sucursal.manager.last_name}` ||
													sucursal.manager?.name}
											</h3>
											<p className='text-sm text-zinc-500'>
												{sucursal.manager.position ||
													'Encargado de Sucursal'}
											</p>
										</div>
									</div>

									<div className='space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700'>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-zinc-500'>Email</span>
											<a
												href={`mailto:${sucursal.manager.email}`}
												className='text-sm font-medium text-primary-600 hover:text-primary-800'>
												{sucursal.manager.email}
											</a>
										</div>

										{(sucursal.manager.phone ||
											sucursal.manager.phone_number) && (
											<div className='flex items-center justify-between'>
												<span className='text-sm text-zinc-500'>
													Teléfono
												</span>
												<span className='text-sm font-medium'>
													{sucursal.manager.phone ||
														sucursal.manager.phone_number}
												</span>
											</div>
										)}

										<div className='flex items-center justify-between'>
											<span className='text-sm text-zinc-500'>
												ID Manager
											</span>
											<Badge variant='outline' className='font-mono'>
												#{sucursal.manager_id}
											</Badge>
										</div>
									</div>
								</>
							) : (
								<div className='py-8 text-center'>
									<div className='mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
										<Icon
											icon='HeroUserCircle'
											className='text-2xl text-zinc-400'
										/>
									</div>
									<p className='mb-2 font-medium text-zinc-700 dark:text-zinc-300'>
										Sin encargado asignado
									</p>
									<p className='text-sm text-zinc-500'>
										Asigna un encargado editando esta sucursal
									</p>
								</div>
							)}
						</CardBody>
					</Card>

					{/* Tabla de información adicional */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Icon icon='HeroInformationCircle' className='text-zinc-600' />
								Información del Sistema
							</CardTitle>
						</CardHeader>
						<CardBody className='space-y-3'>
							<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
								<span className='text-sm text-zinc-500'>ID de Sucursal</span>
								<Badge variant='solid' className='font-mono'>
									#{sucursal.id}
								</Badge>
							</div>

							<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
								<span className='text-sm text-zinc-500'>ID de Subsidiaria</span>
								<Badge variant='outline' className='font-mono'>
									#{sucursal.subsidiary_id || 'N/A'}
								</Badge>
							</div>

							<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
								<span className='text-sm text-zinc-500'>Comuna</span>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium'>
										{sucursal.commune?.name || 'No especificada'}
									</span>
									{sucursal.commune_id && (
										<Badge variant='outline' className='font-mono text-xs'>
											#{sucursal.commune_id}
										</Badge>
									)}
								</div>
							</div>

							<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
								<span className='text-sm text-zinc-500'>Fecha de creación</span>
								<span className='text-sm font-medium'>
									{sucursal.branch_created_at ? new Date(sucursal.branch_created_at).toLocaleDateString('es-CL', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									}) : 'No disponible'}
								</span>
							</div>

							<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
								<span className='text-sm text-zinc-500'>Última actualización</span>
								<span className='text-sm font-medium'>
									{sucursal.branch_updated_at ? new Date(sucursal.branch_updated_at).toLocaleDateString('es-CL', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									}) : 'No disponible'}
								</span>
							</div>

							<div className='flex items-center justify-between'>
								<span className='text-sm text-zinc-500'>Estado del sistema</span>
								<div className='flex items-center gap-2'>
									<div className='h-2 w-2 animate-pulse rounded-full bg-emerald-500'></div>
									<span className='text-sm font-medium text-emerald-600'>
										Operativo
									</span>
								</div>
							</div>
						</CardBody>
					</Card>
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
									¿Eliminar sucursal "{sucursal.branch_name}"?
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
