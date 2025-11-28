import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMisSubsidiarias,
	updateSubsidiaria,
} from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
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
import { DeleteSubempresaModal } from './components';
import ButtonGroup from '@/components/ui/ButtonGroup';

export default function SubEmpresaDetalle() {
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const subempresas = useAppSelector((s) => s.subEmpresa.lista);
	const loading = useAppSelector((s) => s.subEmpresa.loading);
	const [subempresa, setSubempresa] = useState<ISubempresa | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState<'basic' | 'commercial'>('basic');
	const [openDelete, setOpenDelete] = useState(false);

	useEffect(() => {
		if (id) {
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
	

	const allowedPaymentOptions = useMemo(
		() => [
			{ value: 'efectivo', label: 'Efectivo' },
			{ value: 'transferencia', label: 'Transferencia' },
			{ value: 'debito', label: 'Débito' },
			{ value: 'credito', label: 'Crédito' },
			{ value: 'a plazo', label: 'A plazo' },
			{ value: 'cheque', label: 'Cheque' },
		],
		[],
	);

	const initialValues = useMemo(
		() => ({
			nombre: subempresa?.name || '',
			rut: subempresa?.rut || '',
			telefono: subempresa?.phone || '',
			email: subempresa?.email || '',
			direccion: subempresa?.address || '',
			region: '',
			provincia: '',
			comuna: (subempresa as any)?.commune_id
				? String((subempresa as any).commune_id)
				: (subempresa as any)?.commune?.id
					? String((subempresa as any).commune.id)
					: '',
			documentsEmail: subempresa?.subsidiary_documents_email || '',
			salesEmail: subempresa?.subsidiary_sales_email || '',
			deliveryTerm: subempresa?.subsidiary_delivery_term || '',
			bankDetails: subempresa?.subsidiary_bank_details || '',
			allowedPaymentMethods: subempresa?.subsidiary_allowed_payment_methods || [],
			quoteValidityText: subempresa?.subsidiary_quote_validity_text || '',
			quoteValidityDays: subempresa?.subsidiary_quote_validity_days || '',
			giro: subempresa?.subsidiary_giro || '',
			commercialTerms: subempresa?.subsidiary_commercial_terms || '',
			defaultPaymentMethod: subempresa?.subsidiary_default_payment_method || '',
		}),
		[subempresa],
	);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues,
		validationSchema: Yup.object({
			nombre: Yup.string().required('El nombre es obligatorio'),
			rut: Yup.string(),
			telefono: Yup.string(),
			email: Yup.string().email('Email inválido'),
			direccion: Yup.string(),
			documentsEmail: Yup.string().email('Email inválido').nullable(),
			salesEmail: Yup.string().email('Email inválido').nullable(),
			allowedPaymentMethods: Yup.array()
				.of(Yup.string().oneOf(allowedPaymentOptions.map((o) => o.value)))
				.default([])
				.optional(),
			defaultPaymentMethod: Yup.string()
				.oneOf([...allowedPaymentOptions.map((o) => o.value), ''])
				.optional()
				.test(
					'default-in-allowed',
					'El método por defecto debe estar en la lista permitida',
					(value, ctx) => {
						if (!value) return true;
						return (ctx.parent.allowedPaymentMethods || []).includes(value);
					},
				),
		}),
		onSubmit: async (values) => {
			if (!subempresa?.id) return;
			const allowedPaymentMethods = (values.allowedPaymentMethods || []).filter(Boolean);
			let defaultPaymentMethod = values.defaultPaymentMethod || '';
			if (defaultPaymentMethod && !allowedPaymentMethods.includes(defaultPaymentMethod)) {
				defaultPaymentMethod = allowedPaymentMethods[0] || '';
			}
			const parsedValidity = Number(values.quoteValidityDays);
			const quoteValidityDays =
				values.quoteValidityDays === '' || Number.isNaN(parsedValidity)
					? undefined
					: parsedValidity;

			try {
				const data = {
					name: values.nombre,
					rut: values.rut || undefined,
					phone: values.telefono || undefined,
					email: values.email || undefined,
					address: values.direccion || undefined,
					subsidiary_documents_email: values.documentsEmail || undefined,
					subsidiary_sales_email: values.salesEmail || undefined,
					subsidiary_delivery_term: values.deliveryTerm || undefined,
					subsidiary_bank_details: values.bankDetails || undefined,
					subsidiary_allowed_payment_methods: allowedPaymentMethods,
					subsidiary_quote_validity_text: values.quoteValidityText || undefined,
					subsidiary_quote_validity_days: quoteValidityDays,
					subsidiary_giro: values.giro || undefined,
					subsidiary_commercial_terms: values.commercialTerms || undefined,
					subsidiary_default_payment_method: defaultPaymentMethod || undefined,
					commune_id: values.comuna ? Number(values.comuna) : undefined,
				};

				await dispatch(
					updateSubsidiaria({
						id: subempresa.id,
						company_id: subempresa.company_id,
						data: data as any,
					}),
				).unwrap();

				toast.success(`${values.nombre} ha sido actualizada correctamente`);
				setIsEditing(false);
				dispatch(fetchMisSubsidiarias());
			} catch (err: any) {
				toast.error('Error al actualizar la subempresa');
			}
		},
	});

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		formik.resetForm();
		setIsEditing(false);
	};

	useEffect(() => {
		if (isEditing) {
			dispatch(listaRegionesThunk());
			dispatch(listaProvinciasThunk());
			dispatch(listaComunasThunk());
		}
	}, [isEditing, dispatch]);

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
					{isEditing ? (
						<>
							<Button
								variant='outline'
								onClick={handleCancelEdit}
								isDisable={formik.isSubmitting}>
								Cancelar
							</Button>
							<Button
								variant='solid'
								icon='HeroCheck'
								onClick={() => formik.handleSubmit()}
								isLoading={formik.isSubmitting}
								isDisable={formik.isSubmitting}>
								Guardar
							</Button>
							
							<Button
								variant='solid'
								onClick={() => setOpenDelete(true)}
								icon='HeroTrash'
								color='red'
							>
								Eliminar
							</Button>
						</>
					) : (
						<>
							<Button variant='outline' icon='HeroPencil' onClick={handleEdit}>
								Editar
							</Button>
							<Button
								variant='solid'
								onClick={() => setOpenDelete(true)}
								icon='HeroTrash'
								color='red'
							>
								Eliminar
							</Button>
						</>
					)}
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card className='mb-4 flex gap-2 border-b border-zinc-200'>
					<ButtonGroup>
						<Button
							variant='outline'
							onClick={() => setActiveTab('basic')}
							icon='DuoInfoCircle'
							className={`px-3 py-2 text-sm font-medium ${activeTab == 'basic' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-zinc-400'}`}
						>
							Información básica
						</Button>
						<Button
							variant='outline'
							onClick={() => setActiveTab('commercial')}
							icon='DuoInfoCircle'
							className={`px-3 py-2 text-sm font-medium ${activeTab == 'commercial' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-zinc-400'}`}
						>
							Datos comerciales
						</Button>
					</ButtonGroup>
				</Card>

				{activeTab === 'basic' && (
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle>Información Básica</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div>
									<Label className='text-lg font-semibold' htmlFor='nombre'>Nombre</Label>
									{isEditing ? (
										<Input
											id='nombre'
											name='nombre'
											placeholder='Ej: Subsidiaria Norte'
											value={formik.values.nombre}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={formik.isSubmitting}
										/>
									) : (
										<div className='text-base font-medium'>{subempresa.name}</div>
									)}
									{formik.touched.nombre && formik.errors.nombre && (
										<p className='mt-1 text-sm text-red-600'>
											{formik.errors.nombre}
										</p>
									)}
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label className='text-lg font-semibold' htmlFor='rut'>RUT</Label>
										{isEditing ? (
											<Input
												id='rut'
												name='rut'
												placeholder='Ej: 12.345.678-9'
												value={formik.values.rut}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div>
												{subempresa.rut ? (
													<span className='font-mono'>{subempresa.rut}</span>
												) : (
													<Badge variant='outline' className='text-zinc-400'>
														Sin RUT
													</Badge>
												)}
											</div>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='telefono'>Teléfono</Label>
										{isEditing ? (
											<Input
												id='telefono'
												name='telefono'
												placeholder='Ej: +56 9 8765 4321'
												value={formik.values.telefono}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : subempresa.phone ? (
											<div className='flex items-center gap-2'>
												<Icon icon='HeroPhone' className='text-sm text-zinc-400' />
												<span>{subempresa.phone}</span>
											</div>
										) : (
											<Badge variant='outline' className='text-zinc-400'>
												Sin teléfono
											</Badge>
										)}
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label className='text-lg font-semibold' htmlFor='email'>Email</Label>
										{isEditing ? (
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
										) : subempresa.email ? (
											<div className='flex items-center gap-2'>
												<Icon icon='HeroEnvelope' className='text-sm text-zinc-400' />
												<a
													href={`mailto:${subempresa.email}`}
													className='text-primary-600 hover:text-primary-800'>
													{subempresa.email}
												</a>
											</div>
										) : (
											<Badge variant='outline' className='text-zinc-400'>
												Sin email
											</Badge>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='direccion'>Dirección</Label>
										{isEditing ? (
											<Input
												id='direccion'
												name='direccion'
												placeholder='Ej: Av. Principal 123, Ciudad'
												value={formik.values.direccion}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : subempresa.address ? (
											<div className='flex items-start gap-2'>
												<Icon icon='HeroMapPin' className='mt-0.5 text-sm text-zinc-400' />
												<span>{subempresa.address}</span>
											</div>
										) : (
											<Badge variant='outline' className='text-zinc-400'>
												Sin dirección
											</Badge>
										)}
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<div>
										<Label className='text-lg font-semibold' htmlFor='region'>Región</Label>
										{isEditing ? (
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
										) : (
											<div className='text-sm text-zinc-700'>No definida</div>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='provincia'>Provincia</Label>
										{isEditing ? (
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
										) : (
											<div className='text-sm text-zinc-700'>No definida</div>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='comuna'>Comuna</Label>
										{isEditing ? (
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
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.commune?.name ? subempresa.commune?.name :'Sin comuna'}
											</div>
										)}
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Estadísticas</CardTitle>
							</CardHeader>
							<CardBody className='space-y-6'>
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
												Total de sucursales activas
											</div>
										</div>
									</div>
									<div className='text-2xl font-bold text-blue-600'>
										{subempresa.branches_count ||
											(subempresa.sucursales?.length ??
												subempresa.branches?.length ??
												0)}
									</div>
								</div>

								<div className='space-y-3'>
									<div className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
										Sucursales registradas
									</div>
									<div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
										{(subempresa.sucursales?.length ||
										subempresa.branches?.length) ? (
											(subempresa.sucursales?.length
												? subempresa.sucursales
												: subempresa.branches || []
											)?.map((sucursal) => (
												<div
													key={sucursal.id}
													className='flex items-start justify-between rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-700'>
													<div className='flex items-start gap-3'>
														<div className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100'>
															<Icon
																icon='HeroBuildingLibrary'
																className='text-emerald-600'
															/>
														</div>
														<div>
															<p className='font-medium text-zinc-900 dark:text-zinc-100'>
																{sucursal.branch_name}
															</p>
															{sucursal.branch_address ? (
																<p className='text-xs text-zinc-500'>
																	{sucursal.branch_address}
																</p>
															) : null}
														</div>
													</div>
													<div className='text-right text-xs text-zinc-500'>
														{sucursal.commune?.name
															? sucursal.commune?.name
															: 'Sin comuna'}
													</div>
												</div>
											))
										) : (
											<div className='rounded-lg border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700'>
												No hay sucursales registradas actualmente.
											</div>
										)}
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				)}

				{activeTab === 'commercial' && (
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
						<Card className='lg:col-span-1'>
							<CardHeader>
								<CardTitle>Datos Comerciales</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label className='text-lg font-semibold' htmlFor='documentsEmail'>Email documentos</Label>
										{isEditing ? (
											<Input
												id='documentsEmail'
												name='documentsEmail'
												type='email'
												placeholder='documentos@acme.cl'
												value={formik.values.documentsEmail}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.subsidiary_documents_email || 'Sin email'}
											</div>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='salesEmail'>Email ventas</Label>
										{isEditing ? (
											<Input
												id='salesEmail'
												name='salesEmail'
												type='email'
												placeholder='ventas@acme.cl'
												value={formik.values.salesEmail}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.subsidiary_sales_email || 'Sin email'}
											</div>
										)}
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label className='text-lg font-semibold' htmlFor='deliveryTerm'>Término de entrega</Label>
										{isEditing ? (
											<Input
												id='deliveryTerm'
												name='deliveryTerm'
												placeholder='Entrega en 5 días hábiles'
												value={formik.values.deliveryTerm}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.subsidiary_delivery_term || 'Sin información'}
											</div>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='giro'>Giro</Label>
										{isEditing ? (
											<Input
												id='giro'
												name='giro'
												placeholder='Servicios tecnológicos'
												value={formik.values.giro}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.subsidiary_giro || 'Sin giro'}
											</div>
										)}
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label className='text-lg font-semibold' htmlFor='quoteValidityText'>Texto validez cotización</Label>
										{isEditing ? (
											<Input
												id='quoteValidityText'
												name='quoteValidityText'
												placeholder='Oferta válida salvo cambios de proveedor'
												value={formik.values.quoteValidityText}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.subsidiary_quote_validity_text ||
													'Sin texto definido'}
											</div>
										)}
									</div>
									<div>
										<Label className='text-lg font-semibold' htmlFor='quoteValidityDays'>Días de validez</Label>
										{isEditing ? (
											<Input
												id='quoteValidityDays'
												name='quoteValidityDays'
												type='number'
												placeholder='7'
												value={formik.values.quoteValidityDays}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={formik.isSubmitting}
											/>
										) : (
											<div className='text-sm text-zinc-700'>
												{subempresa.subsidiary_quote_validity_days ?? 'No definido'}
											</div>
										)}
									</div>
								</div>

								<div>
									<Label className='text-lg font-semibold' htmlFor='commercialTerms'>Términos comerciales</Label>
									{isEditing ? (
										<Input
											id='commercialTerms'
											name='commercialTerms'
											placeholder='Condiciones Comerciales Generales...'
											value={formik.values.commercialTerms}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={formik.isSubmitting}
										/>
									) : (
										<div className='text-sm text-zinc-700'>
											{subempresa.subsidiary_commercial_terms || 'Sin términos'}
										</div>
									)}
								</div>

								<div>
									<Label className='text-lg font-semibold' htmlFor='bankDetails'>Datos bancarios</Label>
									{isEditing ? (
										<Input
											id='bankDetails'
											name='bankDetails'
											placeholder='Banco Estado, CTA 1234567...'
											value={formik.values.bankDetails}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={formik.isSubmitting}
										/>
									) : (
										<div className='text-sm text-zinc-700'>
											{subempresa.subsidiary_bank_details || 'Sin datos bancarios'}
										</div>
									)}
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Métodos de pago</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div>
									<Label className='text-lg font-semibold' htmlFor='allowedPaymentMethods'>Métodos permitidos</Label>
									{isEditing ? (
										<SelectReact
											isMulti
											name='allowedPaymentMethods'
											placeholder='Seleccione métodos'
											value={allowedPaymentOptions.filter((opt) =>
												(formik.values.allowedPaymentMethods || []).includes(opt.value),
											)}
											onChange={(opts) =>
												formik.setFieldValue(
													'allowedPaymentMethods',
													(opts as TSelectOption[] | null)?.map((o) => o.value) || [],
												)
											}
											options={allowedPaymentOptions}
											isDisabled={formik.isSubmitting}
										/>
									) : (
										<div className='flex flex-wrap gap-2'>
											{(subempresa.subsidiary_allowed_payment_methods || []).length ? (
												subempresa.subsidiary_allowed_payment_methods?.map((m) => (
													<Badge key={m} variant='outline' className='bg-zinc-50'>
														{m}
													</Badge>
												))
											) : (
												<span className='text-sm text-zinc-500'>Sin métodos configurados</span>
											)}
										</div>
									)}
								</div>
								<div>
									<Label className='text-lg font-semibold' htmlFor='defaultPaymentMethod'>Método por defecto</Label>
									{isEditing ? (
										<SelectReact
											name='defaultPaymentMethod'
											placeholder='Seleccione método por defecto'
											value={allowedPaymentOptions.find(
												(o) => o.value === formik.values.defaultPaymentMethod,
											) || null}
											onChange={(opt) =>
												formik.setFieldValue(
													'defaultPaymentMethod',
													(opt as TSelectOption | null)?.value || '',
												)
											}
											options={allowedPaymentOptions.filter((opt) =>
												(formik.values.allowedPaymentMethods || []).includes(opt.value),
											)}
											isDisabled={formik.isSubmitting}
										/>
									) : (
										<div className='text-sm text-zinc-700'>
											{subempresa.subsidiary_default_payment_method ||
												'Sin método por defecto'}
										</div>
									)}
									{formik.touched.defaultPaymentMethod &&
										formik.errors.defaultPaymentMethod && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.defaultPaymentMethod as string}
											</p>
										)}
								</div>
							</CardBody>
						</Card>
					</div>
				)}
			</Container>
			
			<DeleteSubempresaModal
				isOpen={openDelete}
				onClose={() => setOpenDelete(false)}
				subempresaId={subempresa.id}
				subempresaName={subempresa.name}
				isNavigate={true}
			/>
			
		</PageWrapper>
	);
}
