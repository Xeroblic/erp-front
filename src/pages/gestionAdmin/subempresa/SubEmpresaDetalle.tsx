import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMisSubsidiarias,
	updateSubsidiaria,
	deleteSubsidiaria,
} from '@/store/slices/subempresa/subEmpresaSlice';
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
import { ISubempresa } from '@/interface/empresas.interface';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';

export default function SubEmpresaDetalle() {
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const subempresas = useAppSelector((s) => s.subEmpresa.lista);
	const loading = useAppSelector((s) => s.subEmpresa.loading);
	const [subempresa, setSubempresa] = useState<ISubempresa | null>(null);
	const [openEdit, setOpenEdit] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);

	useEffect(() => {
		if (id) {
			// Cargar subempresas si no están cargadas
			if (subempresas.length === 0) {
				dispatch(fetchMisSubsidiarias());
			}
		}
	}, [dispatch, id, subempresas.length]);

	useEffect(() => {
		if (id && subempresas.length > 0) {
			const foundSubempresa = subempresas.find((s) => s.id === parseInt(id));
			if (foundSubempresa) {
				setSubempresa(foundSubempresa);
			} else {
				toast.error('Subempresa no encontrada');
				navigate('/gestion/subempresa');
			}
		}
	}, [id, subempresas, navigate]);
	

	const formik = useFormik({
		initialValues: {
			nombre: '',
			rut: '',
			telefono: '',
			email: '',
			direccion: '',
			region: '',
			provincia: '',
			comuna: '',
		},
		validationSchema: Yup.object({
			nombre: Yup.string().required('El nombre es obligatorio'),
			rut: Yup.string(),
			telefono: Yup.string(),
			email: Yup.string().email('Email inválido'),
			direccion: Yup.string(),
		}),
		onSubmit: async (values) => {
			if (!subempresa?.id) return;
			try {
				const data = {
					name: values.nombre,
					rut: values.rut || undefined,
					phone: values.telefono || undefined,
					email: values.email || undefined,
					address: values.direccion || undefined,
				};

				await dispatch(
					updateSubsidiaria({
						id: subempresa.id,
						data: data as any,
					}),
				).unwrap();

				toast.success(`${values.nombre} ha sido actualizada correctamente`);
				setOpenEdit(false);
				dispatch(fetchMisSubsidiarias());
			} catch (err: any) {
				toast.error('Error al actualizar la subempresa');
			}
		},
	});

	const handleEdit = () => {
		if (subempresa) {
			formik.setValues({
				nombre: subempresa.name || '',
				rut: subempresa.rut || '',
				telefono: subempresa.phone || '',
				email: subempresa.email || '',
				direccion: subempresa.address || '',
				region: '',
				provincia: '',
				comuna: (subempresa as any)?.commune_id
					? String((subempresa as any).commune_id)
					: (subempresa as any)?.commune?.id
						? String((subempresa as any).commune.id)
						: '',
			});
		}
		setOpenEdit(true);
	};

	// Load geo lists when opening edit modal
	useEffect(() => {
		if (openEdit) {
			dispatch(listaRegionesThunk());
			dispatch(listaProvinciasThunk());
			dispatch(listaComunasThunk());
		}
	}, [openEdit, dispatch]);

	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const { optionsRegion, optionsProvincia, optionsComuna } = useGeoSelector(
		formik as any,
		{
			regiones: listaRegiones as any,
			provincias: listaProvincias as any,
			comunas: listaComunas as any,
		},
		{ fieldRegion: 'region', fieldProvincia: 'provincia', fieldComuna: 'comuna' },
	);

	const handleCloseEdit = () => {
		setOpenEdit(false);
		formik.resetForm();
	};


	const confirmDelete = async () => {
		if (!subempresa?.id) return;
		try {
			await dispatch(deleteSubsidiaria(subempresa.id)).unwrap();
			toast.success('Subempresa eliminada correctamente');
			navigate('/gestion/subempresa');
		} catch {
			toast.error('Error al eliminar subempresa');
		} finally {
			setOpenDelete(false);
		}
	};

	if (loading) {
		return (
			<PageWrapper isProtectedRoute title='Cargando...' name='Subempresa'>
				<Container className='pt-4'>
					<div className='flex items-center justify-center py-12'>
						<div className='flex items-center gap-3'>
							<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
							<span className='text-zinc-600'>Cargando subempresa...</span>
						</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (!subempresa) {
		return (
			<PageWrapper isProtectedRoute title='Subempresa no encontrada' name='Subempresa'>
				<Container className='pt-4'>
					<div className='flex flex-col items-center justify-center py-12 text-center'>
						<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-800/20'>
							<Icon
								icon='HeroExclamationTriangle'
								className='text-2xl text-red-600'
							/>
						</div>
						<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
							Subempresa no encontrada
						</h3>
						<p className='mb-4 max-w-sm text-sm text-zinc-500'>
							La subempresa que buscas no existe o no tienes permisos para verla.
						</p>
						<Button
							variant='solid'
							onClick={() => navigate('/gestion/subempresa')}
							size='sm'
							>
							Volver a Subempresas

						</Button>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			isProtectedRoute
			title={`Subempresa: ${subempresa.name}`}
			name='Detalle Subempresa'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<Button
							variant='outline'
							size='sm'
							icon='HeroArrowLeft'
							onClick={() => navigate('/gestion/subempresa')}>
							Volver
						</Button>
						<div className='flex items-center gap-2'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
								<Icon
									icon='HeroBuildingStorefront'
									className='text-lg text-primary-600'
								/>
							</div>
							<div>
								<h1 className='text-lg font-semibold'>{subempresa.name}</h1>
								<p className='text-sm text-zinc-500'>ID: {subempresa.id}</p>
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
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					{/* Información básica */}
					<Card>
						<CardHeader>
							<CardTitle>Información Básica</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div>
								<label className='mb-1 block text-sm font-medium text-zinc-700'>
									Nombre
								</label>
								<div className='text-base font-medium'>{subempresa.name}</div>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-zinc-700'>
									RUT
								</label>
								<div>
									{subempresa.rut ? (
										<span className='font-mono'>{subempresa.rut}</span>
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
									{subempresa.phone ? (
										<div className='flex items-center gap-2'>
											<Icon
												icon='HeroPhone'
												className='text-sm text-zinc-400'
											/>
											<span>{subempresa.phone}</span>
										</div>
									) : (
										<Badge variant='outline' className='text-zinc-400'>
											Sin teléfono
										</Badge>
									)}
								</div>
							</div>

							{subempresa.email && (
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
											href={`mailto:${subempresa.email}`}
											className='text-primary-600 hover:text-primary-800'>
											{subempresa.email}
										</a>
									</div>
								</div>
							)}

							{subempresa.address && (
								<div>
									<label className='mb-1 block text-sm font-medium text-zinc-700'>
										Dirección
									</label>
									<div className='flex items-start gap-2'>
										<Icon
											icon='HeroMapPin'
											className='mt-0.5 text-sm text-zinc-400'
										/>
										<span>{subempresa.address}</span>
									</div>
								</div>
							)}
						</CardBody>
					</Card>

					{/* Estadísticas */}
					<Card>
						<CardHeader>
							<CardTitle>Estadísticas</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='flex items-center justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
										<Icon
											icon='HeroBuildingOffice'
											className='text-lg text-blue-600'
										/>
									</div>
									<div>
										<div className='font-medium'>Sucursales</div>
										<div className='text-sm text-zinc-500'>
											Total de sucursales
										</div>
									</div>
								</div>
								<div className='text-2xl font-bold text-blue-600'>
									{subempresa.branches_count ||
										subempresa.sucursales?.length ||
										0}
								</div>
							</div>

							<div className='py-8 text-center'>
								<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
									<Icon
										icon='HeroChartBarSquare'
										className='text-xl text-zinc-400'
									/>
								</div>
								<p className='text-sm text-zinc-500'>
									Más estadísticas próximamente
								</p>
							</div>
						</CardBody>
					</Card>
				</div>
			</Container>

			{/* Modal de edición */}
			{openEdit && (
				<Modal isOpen={openEdit} setIsOpen={setOpenEdit}>
					<ModalHeader>Editar Subempresa</ModalHeader>
					<ModalBody>
						<form onSubmit={formik.handleSubmit} className='space-y-4'>
							<div>
								<Label htmlFor='nombre'>Nombre *</Label>
								<Input
									id='nombre'
									name='nombre'
									placeholder='Ej: Subsidiaria Norte'
									value={formik.values.nombre}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.nombre && formik.errors.nombre && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.nombre}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='rut'>RUT</Label>
								<Input
									id='rut'
									name='rut'
									placeholder='Ej: 12.345.678-9'
									value={formik.values.rut}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.rut && formik.errors.rut && (
									<p className='mt-1 text-sm text-red-600'>{formik.errors.rut}</p>
								)}
							</div>
							<div>
								<Label htmlFor='telefono'>Teléfono</Label>
								<Input
									id='telefono'
									name='telefono'
									placeholder='Ej: +56 9 8765 4321'
									value={formik.values.telefono}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.telefono && formik.errors.telefono && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.telefono}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									name='email'
									type='email'
									placeholder='Ej: contacto@subsidiaria.com'
									value={formik.values.email}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.email && formik.errors.email && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.email}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='direccion'>Dirección</Label>
								<Input
									id='direccion'
									name='direccion'
									placeholder='Ej: Av. Principal 123, Ciudad'
									value={formik.values.direccion}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.direccion && formik.errors.direccion && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.direccion}
									</p>
								)}
							</div>

							{/* Región / Provincia / Comuna */}
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								<div>
									<Label htmlFor='region'>Región</Label>
									<SelectReact
										name='region'
										placeholder='Seleccione región'
										value={
											optionsRegion.find(
												(o) => o.value === String(formik.values.region),
											) || null
										}
										onChange={(opt) =>
											formik.setFieldValue(
												'region',
												(opt as TSelectOption | null)?.value || '',
											)
										}
										options={optionsRegion}
									/>
								</div>
								<div>
									<Label htmlFor='provincia'>Provincia</Label>
									<SelectReact
										name='provincia'
										placeholder='Seleccione provincia'
										value={
											optionsProvincia.find(
												(o) => o.value === String(formik.values.provincia),
											) || null
										}
										onChange={(opt) =>
											formik.setFieldValue(
												'provincia',
												(opt as TSelectOption | null)?.value || '',
											)
										}
										options={optionsProvincia}
									/>
								</div>
								<div>
									<Label htmlFor='comuna'>Comuna</Label>
									<SelectReact
										name='comuna'
										placeholder='Seleccione comuna'
										value={
											optionsComuna.find(
												(o) => o.value === String(formik.values.comuna),
											) ||
											(formik.values.comuna
												? {
														value: String(formik.values.comuna),
														label: 'Cargando…',
													}
												: null)
										}
										onChange={(opt) =>
											formik.setFieldValue(
												'comuna',
												(opt as TSelectOption | null)?.value || '',
											)
										}
										options={optionsComuna}
									/>
								</div>
							</div>
						</form>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button
								variant='outline'
								onClick={handleCloseEdit}
								isDisable={formik.isSubmitting}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button
								variant='solid'
								onClick={() => formik.handleSubmit()}
								isLoading={formik.isSubmitting}
								isDisable={formik.isSubmitting}>
								Actualizar Subempresa
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}

			{/* Modal de confirmación de borrado */}
			{openDelete && (
				<Modal isOpen={openDelete} setIsOpen={setOpenDelete}>
					<ModalHeader>Eliminar Subempresa</ModalHeader>
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
									¿Eliminar subempresa "{subempresa.name}"?
								</h3>
								<p className='text-sm text-zinc-500'>
									Esta acción no se puede deshacer.
								</p>
							</div>
						</div>
						<p className='text-zinc-700'>
							¿Estás seguro de que deseas eliminar esta subempresa? Todos los datos
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
								Eliminar Subempresa
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	);
}
