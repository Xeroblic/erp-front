import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import { ISubempresa } from '@/interface/empresas.interface';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';

// CU017 - Interfaces y tipos
interface ISubempresaPersonalizacion {
	id?: number;
	subempresa_id: number;
	color_principal: string;
	color_secundario?: string;
	logo_url?: string;
	favicon_url?: string;
	texto_encabezado?: string;
	texto_pie_pagina?: string;
	idioma_predeterminado: string;
	zona_horaria: string;
	moneda_local: string;
	separador_decimal: string;
	formato_fecha: string;
	created_at?: string;
	updated_at?: string;
}

// Opciones de configuración
const IDIOMAS_OPTIONS = [
	{ value: 'es', label: 'Español' },
	{ value: 'en', label: 'English' },
	{ value: 'pt', label: 'Português' },
	{ value: 'fr', label: 'Français' },
];

const ZONAS_HORARIAS_OPTIONS = [
	{ value: 'America/Santiago', label: 'Santiago (GMT-3)' },
	{ value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
	{ value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
	{ value: 'America/Lima', label: 'Lima (GMT-5)' },
	{ value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
	{ value: 'UTC', label: 'UTC (GMT+0)' },
];

const MONEDAS_OPTIONS = [
	{ value: 'CLP', label: 'Peso Chileno (CLP)' },
	{ value: 'USD', label: 'Dólar Estadounidense (USD)' },
	{ value: 'EUR', label: 'Euro (EUR)' },
	{ value: 'ARS', label: 'Peso Argentino (ARS)' },
	{ value: 'BRL', label: 'Real Brasileño (BRL)' },
];

const SEPARADORES_DECIMALES_OPTIONS = [
	{ value: ',', label: 'Coma (,)' },
	{ value: '.', label: 'Punto (.)' },
];

const FORMATOS_FECHA_OPTIONS = [
	{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (día/mes/año)' },
	{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (mes/día/año)' },
	{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (año-mes-día)' },
];

export default function SubEmpresaPersonalizacion() {
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);
	const { lista: subempresas = [], loading } = useAppSelector((s) => s.subEmpresa);

	// Estados principales
	const [filtroEstado, setFiltroEstado] = useState<
		'todos' | 'con_personalizacion' | 'sin_personalizacion'
	>('todos');
	const [filtroTexto, setFiltroTexto] = useState('');

	// Estados de modales
	const [modalPersonalizar, setModalPersonalizar] = useState(false);
	const [modalEliminar, setModalEliminar] = useState(false);
	const [selectedSubempresa, setSelectedSubempresa] = useState<ISubempresa | null>(null);
	const [modoEdicion, setModoEdicion] = useState(false);

	// Estado para personalizaciones
	const [personalizaciones, setPersonalizaciones] = useState<ISubempresaPersonalizacion[]>([
		{
			id: 1,
			subempresa_id: 1,
			color_principal: '#3B82F6',
			color_secundario: '#1E40AF',
			texto_encabezado: 'Bienvenido a Sede Norte',
			texto_pie_pagina: '© 2025 Sede Norte - Todos los derechos reservados',
			idioma_predeterminado: 'es',
			zona_horaria: 'America/Santiago',
			moneda_local: 'CLP',
			separador_decimal: ',',
			formato_fecha: 'DD/MM/YYYY',
		},
		{
			id: 2,
			subempresa_id: 2,
			color_principal: '#10B981',
			color_secundario: '#059669',
			texto_encabezado: 'Sucursal Centro - Innovación y Tecnología',
			idioma_predeterminado: 'es',
			zona_horaria: 'America/Santiago',
			moneda_local: 'USD',
			separador_decimal: '.',
			formato_fecha: 'MM/DD/YYYY',
		},
	]);

	// Cargar datos iniciales
	useEffect(() => {
		if (user) {
			dispatch(fetchMisSubsidiarias());
		}
	}, [dispatch, user]);

	// Validación del formulario
	const validationSchema = Yup.object({
		color_principal: Yup.string()
			.required('El color principal es obligatorio')
			.matches(/^#[0-9A-F]{6}$/i, 'Debe ser un color hexadecimal válido'),
		color_secundario: Yup.string().matches(
			/^#[0-9A-F]{6}$/i,
			'Debe ser un color hexadecimal válido',
		),
		texto_encabezado: Yup.string().max(100, 'Máximo 100 caracteres'),
		texto_pie_pagina: Yup.string().max(100, 'Máximo 100 caracteres'),
		idioma_predeterminado: Yup.string().required('El idioma es obligatorio'),
		zona_horaria: Yup.string().required('La zona horaria es obligatoria'),
		moneda_local: Yup.string().required('La moneda es obligatoria'),
		separador_decimal: Yup.string().required('El separador decimal es obligatorio'),
		formato_fecha: Yup.string().required('El formato de fecha es obligatorio'),
	});

	// Formulario con Formik
	const formik = useFormik({
		initialValues: {
			color_principal: '#3B82F6',
			color_secundario: '#1E40AF',
			texto_encabezado: '',
			texto_pie_pagina: '',
			idioma_predeterminado: 'es',
			zona_horaria: 'America/Santiago',
			moneda_local: 'CLP',
			separador_decimal: ',',
			formato_fecha: 'DD/MM/YYYY',
		},
		validationSchema,
		onSubmit: async (values) => {
			if (!selectedSubempresa) return;

			try {
				// Simular llamada a API
				await new Promise((resolve) => setTimeout(resolve, 1500));

				const personalizacionExistente = personalizaciones.find(
					(p) => p.subempresa_id === selectedSubempresa.id,
				);

				if (modoEdicion && personalizacionExistente) {
					// CU017.2 - Editar personalización existente
					const updatedPersonalizaciones = personalizaciones.map((p) =>
						p.subempresa_id === selectedSubempresa.id
							? { ...p, ...values, updated_at: new Date().toISOString() }
							: p,
					);
					setPersonalizaciones(updatedPersonalizaciones);
					toast.success('Personalización actualizada correctamente');
				} else if (!personalizacionExistente) {
					// CU017.1 - Crear nueva personalización
					const nuevaPersonalizacion: ISubempresaPersonalizacion = {
						id: Date.now(),
						subempresa_id: selectedSubempresa.id,
						...values,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					};
					setPersonalizaciones([...personalizaciones, nuevaPersonalizacion]);
					toast.success('Personalización creada correctamente');
				} else {
					toast.error(
						'Esta subempresa ya tiene una personalización. Use la opción de editar.',
					);
					return;
				}

				setModalPersonalizar(false);
				formik.resetForm();
			} catch (error) {
				toast.error('Error al guardar la personalización');
			}
		},
	});

	// CU017.1 - Crear personalización
	const handleCrearPersonalizacion = (subempresa: ISubempresa) => {
		const existe = personalizaciones.find((p) => p.subempresa_id === subempresa.id);
		if (existe) {
			toast.error('Esta subempresa ya tiene una personalización. Use la opción de editar.');
			return;
		}

		setSelectedSubempresa(subempresa);
		setModoEdicion(false);
		formik.resetForm();
		setModalPersonalizar(true);
	};

	// CU017.2 - Editar personalización
	const handleEditarPersonalizacion = (subempresa: ISubempresa) => {
		const personalizacion = personalizaciones.find((p) => p.subempresa_id === subempresa.id);
		if (!personalizacion) {
			toast.error('No existe personalización para esta subempresa');
			return;
		}

		setSelectedSubempresa(subempresa);
		setModoEdicion(true);
		formik.setValues({
			color_principal: personalizacion.color_principal,
			color_secundario: personalizacion.color_secundario || '#1E40AF',
			texto_encabezado: personalizacion.texto_encabezado || '',
			texto_pie_pagina: personalizacion.texto_pie_pagina || '',
			idioma_predeterminado: personalizacion.idioma_predeterminado,
			zona_horaria: personalizacion.zona_horaria,
			moneda_local: personalizacion.moneda_local,
			separador_decimal: personalizacion.separador_decimal,
			formato_fecha: personalizacion.formato_fecha,
		});
		setModalPersonalizar(true);
	};

	// CU017.3 - Eliminar/Restablecer personalización
	const handleEliminarPersonalizacion = (subempresa: ISubempresa) => {
		const personalizacion = personalizaciones.find((p) => p.subempresa_id === subempresa.id);
		if (!personalizacion) {
			toast.error('No hay personalización que restablecer para esta subempresa');
			return;
		}
		setSelectedSubempresa(subempresa);
		setModalEliminar(true);
	};

	const confirmarEliminacion = async () => {
		if (!selectedSubempresa) return;

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const updatedPersonalizaciones = personalizaciones.filter(
				(p) => p.subempresa_id !== selectedSubempresa.id,
			);
			setPersonalizaciones(updatedPersonalizaciones);

			toast.success('Personalización restablecida a valores por defecto');
			setModalEliminar(false);
		} catch (error) {
			toast.error('Error al restablecer la personalización');
		}
	};

	// CU017.4 - Filtrar subempresas
	const subempresasFiltradas = subempresas.filter((subempresa) => {
		// Filtro por texto
		if (filtroTexto) {
			const coincideTexto = subempresa.name.toLowerCase().includes(filtroTexto.toLowerCase());
			if (!coincideTexto) return false;
		}

		// Filtro por estado de personalización
		const tienePersonalizacion = personalizaciones.some(
			(p) => p.subempresa_id === subempresa.id,
		);

		if (filtroEstado === 'con_personalizacion') return tienePersonalizacion;
		if (filtroEstado === 'sin_personalizacion') return !tienePersonalizacion;
		return true;
	});

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroPaintBrush' className='mr-2 h-6 w-6' />
					<span className='text-lg font-semibold'>Personalización de Sub-empresas</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' variant='outline' onClick={() => window.location.reload()}>
						<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
						Actualizar
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card>
					<CardHeader>
						<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
							<div>
								<h3 className='text-lg font-semibold'>
									Gestión de Personalizaciones
								</h3>
								<p className='text-sm text-gray-600'>
									Configure la apariencia y parámetros visuales de cada subempresa
								</p>
							</div>

							{/* Filtros */}
							<div className='flex flex-col gap-3 md:flex-row md:items-center'>
								<Input
									name='filtroTexto'
									placeholder='Buscar subempresa...'
									value={filtroTexto}
									onChange={(e) => setFiltroTexto(e.target.value)}
									className='w-full md:w-64'
								/>

								<SelectReact
									name='filtroEstado'
									options={[
										{ value: 'todos', label: 'Todas' },
										{
											value: 'con_personalizacion',
											label: 'Con personalización',
										},
										{
											value: 'sin_personalizacion',
											label: 'Sin personalización',
										},
									]}
									value={{
										value: filtroEstado,
										label:
											filtroEstado === 'todos'
												? 'Todas'
												: filtroEstado === 'con_personalizacion'
													? 'Con personalización'
													: 'Sin personalización',
									}}
									onChange={(option: any) =>
										setFiltroEstado(option?.value || 'todos')
									}
									placeholder='Filtrar por estado...'
									className='w-full md:w-48'
								/>
							</div>
						</div>
					</CardHeader>

					<CardBody>
						{/* Estadísticas */}
						<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
							<div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-sm font-medium text-gray-600'>
											Total Subempresas
										</p>
										<p className='text-2xl font-bold text-gray-900'>
											{subempresas.length}
										</p>
									</div>
									<Icon
										icon='HeroBuildingStorefront'
										className='h-8 w-8 text-gray-400'
									/>
								</div>
							</div>

							<div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-sm font-medium text-emerald-600'>
											Con Personalización
										</p>
										<p className='text-2xl font-bold text-emerald-900'>
											{personalizaciones.length}
										</p>
									</div>
									<Icon
										icon='HeroCheckCircle'
										className='h-8 w-8 text-emerald-400'
									/>
								</div>
							</div>

							<div className='rounded-lg border border-amber-200 bg-amber-50 p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-sm font-medium text-amber-600'>
											Sin Personalización
										</p>
										<p className='text-2xl font-bold text-amber-900'>
											{subempresas.length - personalizaciones.length}
										</p>
									</div>
									<Icon icon='HeroXCircle' className='h-8 w-8 text-amber-400' />
								</div>
							</div>
						</div>

						{/* Tabla de subempresas */}
						<div className='overflow-hidden rounded-lg border border-gray-200'>
							<div className='overflow-x-auto'>
								<table className='min-w-full divide-y divide-gray-200'>
									<thead className='bg-gray-50'>
										<tr>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Subempresa
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Estado
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Configuración
											</th>
											<th className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
												Acciones
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 bg-white'>
										{subempresasFiltradas.map((subempresa) => {
											const personalizacion = personalizaciones.find(
												(p) => p.subempresa_id === subempresa.id,
											);

											return (
												<tr
													key={subempresa.id}
													className='hover:bg-gray-50'>
													<td className='whitespace-nowrap px-6 py-4'>
														<div className='flex items-center'>
															<div
																className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg'
																style={{
																	backgroundColor:
																		personalizacion?.color_principal ||
																		'#F3F4F6',
																}}>
																<Icon
																	icon='HeroBuildingStorefront'
																	className={`h-5 w-5 ${
																		personalizacion?.color_principal
																			? 'text-white'
																			: 'text-gray-600'
																	}`}
																/>
															</div>
															<div>
																<div className='text-sm font-medium text-gray-900'>
																	{subempresa.name}
																</div>
																<div className='text-sm text-gray-500'>
																	ID: {subempresa.id}
																</div>
															</div>
														</div>
													</td>

													<td className='whitespace-nowrap px-6 py-4'>
														{personalizacion ? (
															<Badge
																color='emerald'
																className='flex items-center gap-1'>
																<Icon
																	icon='HeroCheckCircle'
																	className='h-3 w-3'
																/>
																Personalizada
															</Badge>
														) : (
															<Badge
																color='gray'
																className='flex items-center gap-1'>
																<Icon
																	icon='HeroXCircle'
																	className='h-3 w-3'
																/>
																Por defecto
															</Badge>
														)}
													</td>

													<td className='whitespace-nowrap px-6 py-4'>
														{personalizacion ? (
															<div className='space-y-1 text-xs text-gray-600'>
																<div className='flex items-center gap-2'>
																	<div
																		className='h-3 w-3 rounded-full border'
																		style={{
																			backgroundColor:
																				personalizacion.color_principal,
																		}}
																	/>
																	<span className='font-mono'>
																		{
																			personalizacion.color_principal
																		}
																	</span>
																</div>
																<div>
																	Idioma:{' '}
																	{
																		IDIOMAS_OPTIONS.find(
																			(i) =>
																				i.value ===
																				personalizacion.idioma_predeterminado,
																		)?.label
																	}
																</div>
																<div>
																	Moneda:{' '}
																	{personalizacion.moneda_local}
																</div>
															</div>
														) : (
															<span className='text-xs text-gray-400'>
																Sin configurar
															</span>
														)}
													</td>

													<td className='whitespace-nowrap px-6 py-4 text-right'>
														<div className='flex justify-end gap-2'>
															{personalizacion ? (
																<>
																	<Button
																		variant='outline'
																		size='sm'
																		onClick={() =>
																			handleEditarPersonalizacion(
																				subempresa,
																			)
																		}
																		title='Editar personalización'>
																		<Icon
																			icon='HeroPencil'
																			className='h-4 w-4'
																		/>
																	</Button>
																	<Button
																		variant='outline'
																		size='sm'
																		color='amber'
																		onClick={() =>
																			handleEliminarPersonalizacion(
																				subempresa,
																			)
																		}
																		title='Restablecer a valores por defecto'>
																		<Icon
																			icon='HeroArrowPath'
																			className='h-4 w-4'
																		/>
																	</Button>
																</>
															) : (
																<Button
																	variant='outline'
																	size='sm'
																	color='blue'
																	onClick={() =>
																		handleCrearPersonalizacion(
																			subempresa,
																		)
																	}
																	title='Crear personalización'>
																	<Icon
																		icon='HeroPaintBrush'
																		className='h-4 w-4'
																	/>
																</Button>
															)}
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							{subempresasFiltradas.length === 0 && (
								<div className='py-12 text-center'>
									<Icon
										icon='HeroMagnifyingGlass'
										className='mx-auto h-12 w-12 text-gray-400'
									/>
									<h3 className='mt-2 text-sm font-medium text-gray-900'>
										No se encontraron subempresas
									</h3>
									<p className='mt-1 text-sm text-gray-500'>
										Ajusta los filtros de búsqueda para ver más resultados.
									</p>
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			</Container>

			{/* Modal Crear/Editar Personalización */}
			<Modal isOpen={modalPersonalizar} setIsOpen={setModalPersonalizar} size='4xl'>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
							<Icon icon='HeroPaintBrush' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								{modoEdicion ? 'Editar' : 'Crear'} Personalización
							</h3>
							<p className='text-sm text-gray-500'>
								{selectedSubempresa?.name} - EcoTech Solutions
							</p>
						</div>
					</div>
				</ModalHeader>

				<ModalBody className='max-h-[70vh] overflow-y-auto'>
					<form onSubmit={formik.handleSubmit} className='space-y-6'>
						{/* Vista previa */}
						<Card>
							<CardHeader>
								<h4 className='flex items-center gap-2 text-lg font-semibold'>
									<Icon icon='HeroEye' className='h-5 w-5' />
									Vista Previa
								</h4>
							</CardHeader>
							<CardBody>
								<div
									className='rounded-lg p-4 text-white'
									style={{ backgroundColor: formik.values.color_principal }}>
									<h5 className='font-semibold'>Encabezado de la aplicación</h5>
									<p className='text-sm opacity-90'>
										{formik.values.texto_encabezado ||
											'Texto de encabezado personalizado'}
									</p>
									<div
										className='mt-2 inline-block rounded px-3 py-1 text-sm'
										style={{ backgroundColor: formik.values.color_secundario }}>
										Color secundario
									</div>
								</div>
								{formik.values.texto_pie_pagina && (
									<div className='mt-2 rounded-lg bg-gray-100 p-2 text-center text-sm text-gray-600'>
										{formik.values.texto_pie_pagina}
									</div>
								)}
							</CardBody>
						</Card>

						{/* Configuración de Colores */}
						<Card>
							<CardHeader>
								<h4 className='text-lg font-semibold'>Colores del Tema</h4>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='color_principal'>Color Principal *</Label>
									<div className='flex items-center gap-3'>
										<Input
											id='color_principal'
											name='color_principal'
											type='color'
											value={formik.values.color_principal}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											className='h-12 w-20'
										/>
										<Input
											name='color_principal'
											value={formik.values.color_principal}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='#3B82F6'
											className='flex-1 font-mono'
										/>
									</div>
									{formik.touched.color_principal &&
										formik.errors.color_principal && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.color_principal}
											</p>
										)}
								</div>

								<div>
									<Label htmlFor='color_secundario'>Color Secundario</Label>
									<div className='flex items-center gap-3'>
										<Input
											id='color_secundario'
											name='color_secundario'
											type='color'
											value={formik.values.color_secundario}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											className='h-12 w-20'
										/>
										<Input
											name='color_secundario'
											value={formik.values.color_secundario}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='#1E40AF'
											className='flex-1 font-mono'
										/>
									</div>
									{formik.touched.color_secundario &&
										formik.errors.color_secundario && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.color_secundario}
											</p>
										)}
								</div>
							</CardBody>
						</Card>

						{/* Textos Personalizados */}
						<Card>
							<CardHeader>
								<h4 className='text-lg font-semibold'>Textos Personalizados</h4>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div>
									<Label htmlFor='texto_encabezado'>Texto en Encabezado</Label>
									<Input
										id='texto_encabezado'
										name='texto_encabezado'
										value={formik.values.texto_encabezado}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										placeholder='Ej: Bienvenido a Sede Norte'
										maxLength={100}
									/>
									<p className='mt-1 text-xs text-gray-500'>
										{formik.values.texto_encabezado.length}/100 caracteres
									</p>
									{formik.touched.texto_encabezado &&
										formik.errors.texto_encabezado && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.texto_encabezado}
											</p>
										)}
								</div>

								<div>
									<Label htmlFor='texto_pie_pagina'>Texto en Pie de Página</Label>
									<Input
										id='texto_pie_pagina'
										name='texto_pie_pagina'
										value={formik.values.texto_pie_pagina}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										placeholder='Ej: © 2025 Sede Norte - Todos los derechos reservados'
										maxLength={100}
									/>
									<p className='mt-1 text-xs text-gray-500'>
										{formik.values.texto_pie_pagina.length}/100 caracteres
									</p>
									{formik.touched.texto_pie_pagina &&
										formik.errors.texto_pie_pagina && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.texto_pie_pagina}
											</p>
										)}
								</div>
							</CardBody>
						</Card>

						{/* Configuración Regional */}
						<Card>
							<CardHeader>
								<h4 className='text-lg font-semibold'>Configuración Regional</h4>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='idioma_predeterminado'>
										Idioma Predeterminado *
									</Label>
									<SelectReact
										name='idioma_predeterminado'
										options={IDIOMAS_OPTIONS}
										value={IDIOMAS_OPTIONS.find(
											(i) => i.value === formik.values.idioma_predeterminado,
										)}
										onChange={(option: any) =>
											formik.setFieldValue(
												'idioma_predeterminado',
												option?.value,
											)
										}
										placeholder='Seleccionar idioma...'
									/>
									{formik.touched.idioma_predeterminado &&
										formik.errors.idioma_predeterminado && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.idioma_predeterminado}
											</p>
										)}
								</div>

								<div>
									<Label htmlFor='zona_horaria'>Zona Horaria *</Label>
									<SelectReact
										name='zona_horaria'
										options={ZONAS_HORARIAS_OPTIONS}
										value={ZONAS_HORARIAS_OPTIONS.find(
											(z) => z.value === formik.values.zona_horaria,
										)}
										onChange={(option: any) =>
											formik.setFieldValue('zona_horaria', option?.value)
										}
										placeholder='Seleccionar zona horaria...'
									/>
									{formik.touched.zona_horaria && formik.errors.zona_horaria && (
										<p className='mt-1 text-sm text-red-600'>
											{formik.errors.zona_horaria}
										</p>
									)}
								</div>

								<div>
									<Label htmlFor='moneda_local'>Moneda Local *</Label>
									<SelectReact
										name='moneda_local'
										options={MONEDAS_OPTIONS}
										value={MONEDAS_OPTIONS.find(
											(m) => m.value === formik.values.moneda_local,
										)}
										onChange={(option: any) =>
											formik.setFieldValue('moneda_local', option?.value)
										}
										placeholder='Seleccionar moneda...'
									/>
									{formik.touched.moneda_local && formik.errors.moneda_local && (
										<p className='mt-1 text-sm text-red-600'>
											{formik.errors.moneda_local}
										</p>
									)}
								</div>

								<div>
									<Label htmlFor='separador_decimal'>Separador Decimal *</Label>
									<SelectReact
										name='separador_decimal'
										options={SEPARADORES_DECIMALES_OPTIONS}
										value={SEPARADORES_DECIMALES_OPTIONS.find(
											(s) => s.value === formik.values.separador_decimal,
										)}
										onChange={(option: any) =>
											formik.setFieldValue('separador_decimal', option?.value)
										}
										placeholder='Seleccionar separador...'
									/>
									{formik.touched.separador_decimal &&
										formik.errors.separador_decimal && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.separador_decimal}
											</p>
										)}
								</div>

								<div className='md:col-span-2'>
									<Label htmlFor='formato_fecha'>Formato de Fecha *</Label>
									<SelectReact
										name='formato_fecha'
										options={FORMATOS_FECHA_OPTIONS}
										value={FORMATOS_FECHA_OPTIONS.find(
											(f) => f.value === formik.values.formato_fecha,
										)}
										onChange={(option: any) =>
											formik.setFieldValue('formato_fecha', option?.value)
										}
										placeholder='Seleccionar formato de fecha...'
									/>
									{formik.touched.formato_fecha &&
										formik.errors.formato_fecha && (
											<p className='mt-1 text-sm text-red-600'>
												{formik.errors.formato_fecha}
											</p>
										)}
								</div>
							</CardBody>
						</Card>
					</form>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							onClick={() => setModalPersonalizar(false)}
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
							{modoEdicion ? 'Actualizar' : 'Crear'} Personalización
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			{/* Modal Eliminar/Restablecer */}
			<Modal isOpen={modalEliminar} setIsOpen={setModalEliminar} size='lg'>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
							<Icon
								icon='HeroExclamationTriangle'
								className='h-6 w-6 text-amber-600'
							/>
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Restablecer Personalización
							</h3>
							<p className='text-sm text-gray-500'>{selectedSubempresa?.name}</p>
						</div>
					</div>
				</ModalHeader>

				<ModalBody>
					<div className='space-y-4'>
						<p className='text-gray-700'>
							¿Está seguro que desea restablecer la personalización de{' '}
							<strong>{selectedSubempresa?.name}</strong> a los valores por defecto?
						</p>

						<div className='rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4'>
							<div className='flex items-start gap-3'>
								<Icon
									icon='HeroInformationCircle'
									className='mt-0.5 h-5 w-5 text-amber-600'
								/>
								<div>
									<h4 className='font-medium text-amber-800'>
										Impacto de esta acción:
									</h4>
									<ul className='mt-2 list-inside list-disc space-y-1 text-sm text-amber-700'>
										<li>Se eliminarán todos los colores personalizados</li>
										<li>
											Se restablecerán los textos de encabezado y pie de
											página
										</li>
										<li>Se volverá a la configuración regional por defecto</li>
										<li>Los logos personalizados se eliminarán</li>
										<li>Esta acción no se puede deshacer</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={() => setModalEliminar(false)}>
							Cancelar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button variant='solid' color='amber' onClick={confirmarEliminacion}>
							<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
							Restablecer a Valores por Defecto
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
}
