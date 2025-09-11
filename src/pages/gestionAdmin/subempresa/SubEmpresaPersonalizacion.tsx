import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { ISubempresa } from '@/interface/empresas.interface';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';

// Interfaz para personalización de subempresa
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
	{ value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
	{ value: 'UTC', label: 'UTC (GMT+0)' },
];

const MONEDAS_OPTIONS = [
	{ value: 'CLP', label: 'Peso Chileno (CLP)' },
	{ value: 'USD', label: 'Dólar Estadounidense (USD)' },
	{ value: 'EUR', label: 'Euro (EUR)' },
	{ value: 'ARS', label: 'Peso Argentino (ARS)' },
	{ value: 'BRL', label: 'Real Brasileño (BRL)' },
	{ value: 'PEN', label: 'Sol Peruano (PEN)' },
	{ value: 'COP', label: 'Peso Colombiano (COP)' },
	{ value: 'MXN', label: 'Peso Mexicano (MXN)' },
];

const SEPARADORES_DECIMALES_OPTIONS = [
	{ value: ',', label: 'Coma (,)' },
	{ value: '.', label: 'Punto (.)' },
];

const FORMATOS_FECHA_OPTIONS = [
	{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (día/mes/año)' },
	{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (mes/día/año)' },
	{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (año-mes-día)' },
	{ value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (día-mes-año)' },
];

const columnHelper = createColumnHelper<
	ISubempresa & { personalizacion?: ISubempresaPersonalizacion }
>();

export default function SubEmpresaPersonalizacion() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const user = useAppSelector((s) => s.auth.user);

	const { lista: subempresas = [], loading } = useAppSelector((s) => s.subEmpresa);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [filtroEstado, setFiltroEstado] = useState<
		'todos' | 'con_personalizacion' | 'sin_personalizacion'
	>('todos');
	const [openPersonalizar, setOpenPersonalizar] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [selectedSubempresa, setSelectedSubempresa] = useState<ISubempresa | null>(null);
	const [personalizaciones, setPersonalizaciones] = useState<ISubempresaPersonalizacion[]>([]);
	const [loadingPersonalizaciones, setLoadingPersonalizaciones] = useState(false);

	// Estado para preview de colores
	const [previewColors, setPreviewColors] = useState<{
		principal: string;
		secundario: string;
	} | null>(null);

	useEffect(() => {
		if (user) {
			dispatch(fetchMisSubsidiarias());
			loadPersonalizaciones();
		}
	}, [dispatch, user]);

	// Carga de personalizaciones desde API
	const loadPersonalizaciones = async () => {
		setLoadingPersonalizaciones(true);
		try {
			// TODO: Implementar llamada a API real
			// const response = await api.get('/subempresas/personalizaciones');
			// setPersonalizaciones(response.data);

			// Datos de ejemplo para desarrollo
			const ejemploPersonalizaciones: ISubempresaPersonalizacion[] = [
				{
					id: 1,
					subempresa_id: 1,
					color_principal: '#3B82F6',
					color_secundario: '#1E40AF',
					logo_url: '/logos/subempresa1.png',
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
			];
			setPersonalizaciones(ejemploPersonalizaciones);
		} catch (error) {
			console.error('Error al cargar personalizaciones:', error);
		} finally {
			setLoadingPersonalizaciones(false);
		}
	};

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

	const formik = useFormik({
		initialValues: {
			color_principal: '#3B82F6',
			color_secundario: '#1E40AF',
			logo_file: null as File | null,
			favicon_file: null as File | null,
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
				// Verificar si ya existe personalización
				const personalizacionExistente = personalizaciones.find(
					(p) => p.subempresa_id === selectedSubempresa.id,
				);

				if (personalizacionExistente && !selectedSubempresa.id) {
					toast.error(
						'Esta subempresa ya tiene una personalización. Use la opción de editar.',
					);
					return;
				}

				// Tiempo de procesamiento
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// Guardado exitoso
				toast.success('Personalización guardada correctamente');
				setOpenPersonalizar(false);

				// Actualizar datos locales para demo
				if (personalizacionExistente) {
					// Actualizar personalización existente
					const updatedPersonalizaciones = personalizaciones.map((p) =>
						p.subempresa_id === selectedSubempresa.id
							? {
									...p,
									color_principal: values.color_principal,
									color_secundario: values.color_secundario,
									texto_encabezado: values.texto_encabezado,
									texto_pie_pagina: values.texto_pie_pagina,
									idioma_predeterminado: values.idioma_predeterminado,
									zona_horaria: values.zona_horaria,
									moneda_local: values.moneda_local,
									separador_decimal: values.separador_decimal,
									formato_fecha: values.formato_fecha,
								}
							: p,
					);
					setPersonalizaciones(updatedPersonalizaciones);
				} else {
					// Crear nueva personalización
					const nuevaPersonalizacion: ISubempresaPersonalizacion = {
						id: Date.now(), // ID temporal
						subempresa_id: selectedSubempresa.id,
						color_principal: values.color_principal,
						color_secundario: values.color_secundario,
						texto_encabezado: values.texto_encabezado,
						texto_pie_pagina: values.texto_pie_pagina,
						idioma_predeterminado: values.idioma_predeterminado,
						zona_horaria: values.zona_horaria,
						moneda_local: values.moneda_local,
						separador_decimal: values.separador_decimal,
						formato_fecha: values.formato_fecha,
					};
					setPersonalizaciones([...personalizaciones, nuevaPersonalizacion]);
				}
			} catch (error) {
				toast.error('Error al guardar la personalización');
			}
		},
	});

	// CU017.1 - Crear personalización
	const handleCreatePersonalizacion = (subempresa: ISubempresa) => {
		setSelectedSubempresa(subempresa);
		formik.resetForm();
		setPreviewColors(null);
		setOpenPersonalizar(true);
	};

	// CU017.2 - Editar personalización
	const handleEditPersonalizacion = (subempresa: ISubempresa) => {
		const personalizacion = personalizaciones.find((p) => p.subempresa_id === subempresa.id);
		if (!personalizacion) {
			toast.error('No existe personalización para esta subempresa');
			return;
		}

		setSelectedSubempresa(subempresa);
		formik.setValues({
			color_principal: personalizacion.color_principal,
			color_secundario: personalizacion.color_secundario || '#1E40AF',
			logo_file: null,
			favicon_file: null,
			texto_encabezado: personalizacion.texto_encabezado || '',
			texto_pie_pagina: personalizacion.texto_pie_pagina || '',
			idioma_predeterminado: personalizacion.idioma_predeterminado,
			zona_horaria: personalizacion.zona_horaria,
			moneda_local: personalizacion.moneda_local,
			separador_decimal: personalizacion.separador_decimal,
			formato_fecha: personalizacion.formato_fecha,
		});
		setPreviewColors({
			principal: personalizacion.color_principal,
			secundario: personalizacion.color_secundario || '#1E40AF',
		});
		setOpenPersonalizar(true);
	};

	// CU017.3 - Eliminar/Restablecer personalización
	const handleDeletePersonalizacion = (subempresa: ISubempresa) => {
		const personalizacion = personalizaciones.find((p) => p.subempresa_id === subempresa.id);
		if (!personalizacion) {
			toast.error('No hay personalización que restablecer para esta subempresa');
			return;
		}
		setSelectedSubempresa(subempresa);
		setOpenDelete(true);
	};

	const confirmDelete = async () => {
		if (!selectedSubempresa) return;

		try {
			// Tiempo de procesamiento
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Eliminar personalización de los datos locales
			const updatedPersonalizaciones = personalizaciones.filter(
				(p) => p.subempresa_id !== selectedSubempresa.id,
			);
			setPersonalizaciones(updatedPersonalizaciones);

			toast.success('Personalización restablecida a valores por defecto');
			setOpenDelete(false);
		} catch (error) {
			toast.error('Error al restablecer la personalización');
		}
	};

	// Filtrar subempresas según el estado de personalización
	const subempresasFiltradas = subempresas.filter((subempresa) => {
		const tienePersonalizacion = personalizaciones.some(
			(p) => p.subempresa_id === subempresa.id,
		);

		if (filtroEstado === 'con_personalizacion') return tienePersonalizacion;
		if (filtroEstado === 'sin_personalizacion') return !tienePersonalizacion;
		return true;
	});

	// Actualizar preview de colores
	useEffect(() => {
		if (formik.values.color_principal || formik.values.color_secundario) {
			setPreviewColors({
				principal: formik.values.color_principal,
				secundario: formik.values.color_secundario,
			});
		}
	}, [formik.values.color_principal, formik.values.color_secundario]);

	// CU017.4 - Columnas de la tabla de listado
	const columns = [
		columnHelper.accessor('name', {
			header: 'Subempresa',
			cell: (info) => {
				const personalizacion = personalizaciones.find(
					(p) => p.subempresa_id === info.row.original.id,
				);
				return (
					<div className='flex items-center gap-3'>
						<div
							className='flex h-10 w-10 items-center justify-center rounded-lg'
							style={{
								backgroundColor: personalizacion?.color_principal || '#F3F4F6',
							}}>
							<Icon
								icon='HeroBuildingStorefront'
								className={`text-lg ${personalizacion?.color_principal ? 'text-white' : 'text-gray-600'}`}
							/>
						</div>
						<div>
							<div className='font-medium'>{info.getValue()}</div>
							<div className='text-xs text-gray-500'>ID: {info.row.original.id}</div>
						</div>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'empresa_principal',
			header: 'Empresa Principal',
			cell: () => (
				<div className='text-sm'>
					{/* Empresa principal - datos de ejemplo */}
					EcoTech Solutions
				</div>
			),
		}),
		columnHelper.display({
			id: 'personalizacion',
			header: 'Estado Personalización',
			cell: (info) => {
				const personalizacion = personalizaciones.find(
					(p) => p.subempresa_id === info.row.original.id,
				);
				return personalizacion ? (
					<Badge color='emerald' className='flex items-center gap-1'>
						<Icon icon='HeroCheckCircle' className='h-3 w-3' />
						Personalizada
					</Badge>
				) : (
					<Badge color='gray' className='flex items-center gap-1'>
						<Icon icon='HeroXCircle' className='h-3 w-3' />
						Por defecto
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'configuracion',
			header: 'Configuración',
			cell: (info) => {
				const personalizacion = personalizaciones.find(
					(p) => p.subempresa_id === info.row.original.id,
				);
				return personalizacion ? (
					<div className='space-y-1 text-xs text-gray-600'>
						<div>
							Color:{' '}
							<span className='font-mono'>{personalizacion.color_principal}</span>
						</div>
						<div>
							Idioma:{' '}
							{
								IDIOMAS_OPTIONS.find(
									(i) => i.value === personalizacion.idioma_predeterminado,
								)?.label
							}
						</div>
						<div>Moneda: {personalizacion.moneda_local}</div>
					</div>
				) : (
					<span className='text-xs text-gray-400'>Sin configurar</span>
				);
			},
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: (info) => {
				const personalizacion = personalizaciones.find(
					(p) => p.subempresa_id === info.row.original.id,
				);
				return (
					<div className='flex justify-end gap-2'>
						{personalizacion ? (
							<>
								<Button
									variant='outline'
									size='sm'
									icon='HeroPencil'
									onClick={() => handleEditPersonalizacion(info.row.original)}
									className='p-1'
									title='Editar personalización'
								/>
								<Button
									variant='outline'
									size='sm'
									icon='HeroArrowPath'
									color='amber'
									onClick={() => handleDeletePersonalizacion(info.row.original)}
									className='p-1'
									title='Restablecer a valores por defecto'
								/>
							</>
						) : (
							<Button
								variant='outline'
								size='sm'
								icon='HeroPaintBrush'
								color='blue'
								onClick={() => handleCreatePersonalizacion(info.row.original)}
								className='p-1'
								title='Crear personalización'
							/>
						)}
					</div>
				);
			},
		}),
	];

	const table = useReactTable({
		data: subempresasFiltradas,
		columns,
		state: { sorting, globalFilter },
		onSortingChange: setSorting,
		enableGlobalFilter: true,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
	});

	return (
		<PageWrapper
			isProtectedRoute
			title='Personalización de Subempresas'
			name='Personalización Subempresas'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<Badge className='text-xl'>Personalización de Subempresas</Badge>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-3'>
					{/* Filtros */}
					<SelectReact
						name='filtro-estado'
						options={[
							{ value: 'todos', label: 'Todas las subempresas' },
							{ value: 'con_personalizacion', label: 'Con personalización' },
							{ value: 'sin_personalizacion', label: 'Sin personalización' },
						]}
						value={[
							{ value: 'todos', label: 'Todas las subempresas' },
							{ value: 'con_personalizacion', label: 'Con personalización' },
							{ value: 'sin_personalizacion', label: 'Sin personalización' },
						].find((option) => option.value === filtroEstado)}
						onChange={(option: any) => setFiltroEstado(option?.value || 'todos')}
						placeholder='Filtrar por estado...'
						className='w-48'
					/>
					<Input
						name='busqueda'
						placeholder='Buscar subempresas...'
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className='w-48'
					/>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card>
					<CardBody className='overflow-auto'>
						{loading || loadingPersonalizaciones ? (
							<div className='p-8 text-center'>
								<div className='flex items-center justify-center gap-3'>
									<div className='h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
									<span className='text-gray-600'>Cargando subempresas...</span>
								</div>
							</div>
						) : subempresasFiltradas.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-12 text-center'>
								<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
									<Icon
										icon='HeroPaintBrush'
										className='text-2xl text-gray-400'
									/>
								</div>
								<h3 className='mb-2 font-medium text-gray-900'>
									{filtroEstado === 'sin_personalizacion'
										? 'Todas las subempresas tienen personalización'
										: filtroEstado === 'con_personalizacion'
											? 'No hay subempresas con personalización'
											: 'No hay subempresas registradas'}
								</h3>
								<p className='mb-4 max-w-sm text-sm text-gray-500'>
									{filtroEstado === 'todos' &&
										'Comience agregando subempresas para personalizar su apariencia.'}
								</p>
							</div>
						) : (
							<>
								<Table className='w-full'>
									<THead>
										{table.getHeaderGroups().map((hg) => (
											<Tr key={hg.id}>
												{hg.headers.map((header) => (
													<Th key={header.id} className='text-left'>
														{header.isPlaceholder
															? null
															: flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
													</Th>
												))}
											</Tr>
										))}
									</THead>
									<TBody>
										{table.getRowModel().rows.map((row) => (
											<Tr key={row.id}>
												{row.getVisibleCells().map((cell) => (
													<Td key={cell.id}>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</Td>
												))}
											</Tr>
										))}
									</TBody>
								</Table>
								<div className='mt-4'>
									<TableCardFooterTemplateV2 table={table} />
								</div>
							</>
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal de Personalización (Crear/Editar) */}
			{openPersonalizar && selectedSubempresa && (
				<Modal isOpen={openPersonalizar} setIsOpen={setOpenPersonalizar} size='4xl'>
					<ModalHeader>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
								<Icon icon='HeroPaintBrush' className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h3 className='text-lg font-semibold text-gray-900'>
									Personalizar Subempresa
								</h3>
								<p className='text-sm text-gray-500'>
									{selectedSubempresa.name} - EcoTech Solutions
								</p>
							</div>
						</div>
					</ModalHeader>

					<ModalBody className='max-h-[70vh] overflow-y-auto'>
						<form onSubmit={formik.handleSubmit} className='space-y-6'>
							{/* Vista previa */}
							{previewColors && (
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
											style={{ backgroundColor: previewColors.principal }}>
											<h5 className='font-semibold'>
												Encabezado de la aplicación
											</h5>
											<p className='text-sm opacity-90'>
												{formik.values.texto_encabezado ||
													'Texto de encabezado personalizado'}
											</p>
											<div
												className='mt-2 rounded px-3 py-1 text-sm'
												style={{
													backgroundColor: previewColors.secundario,
												}}>
												Color secundario de ejemplo
											</div>
										</div>
									</CardBody>
								</Card>
							)}

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

							{/* Archivos de Imagen */}
							<Card>
								<CardHeader>
									<h4 className='text-lg font-semibold'>Logotipos</h4>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='logo_file'>Logo de la Subempresa</Label>
										<Input
											id='logo_file'
											name='logo_file'
											type='file'
											accept='image/*'
											onChange={(e) => {
												const file = e.target.files?.[0] || null;
												formik.setFieldValue('logo_file', file);
											}}
											className='file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
										/>
										<p className='mt-1 text-xs text-gray-500'>
											Formatos permitidos: PNG, JPG, SVG. Máximo 2MB.
										</p>
									</div>

									<div>
										<Label htmlFor='favicon_file'>
											Favicon (Ícono del navegador)
										</Label>
										<Input
											id='favicon_file'
											name='favicon_file'
											type='file'
											accept='image/*,.ico'
											onChange={(e) => {
												const file = e.target.files?.[0] || null;
												formik.setFieldValue('favicon_file', file);
											}}
											className='file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
										/>
										<p className='mt-1 text-xs text-gray-500'>
											Formatos permitidos: ICO, PNG. Recomendado: 32x32px.
										</p>
									</div>
								</CardBody>
							</Card>

							{/* Textos Personalizados */}
							<Card>
								<CardHeader>
									<h4 className='text-lg font-semibold'>Textos Personalizados</h4>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='texto_encabezado'>
											Texto en Encabezado
										</Label>
										<Input
											id='texto_encabezado'
											name='texto_encabezado'
											value={formik.values.texto_encabezado}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='Ej: Bienvenido a nuestro sistema'
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
										<Label htmlFor='texto_pie_pagina'>
											Texto en Pie de Página
										</Label>
										<Input
											id='texto_pie_pagina'
											name='texto_pie_pagina'
											value={formik.values.texto_pie_pagina}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='Ej: © 2025 Mi Empresa. Todos los derechos reservados.'
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
									<h4 className='text-lg font-semibold'>
										Configuración Regional
									</h4>
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
												(i) =>
													i.value === formik.values.idioma_predeterminado,
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
										{formik.touched.zona_horaria &&
											formik.errors.zona_horaria && (
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
										{formik.touched.moneda_local &&
											formik.errors.moneda_local && (
												<p className='mt-1 text-sm text-red-600'>
													{formik.errors.moneda_local}
												</p>
											)}
									</div>

									<div>
										<Label htmlFor='separador_decimal'>
											Separador Decimal *
										</Label>
										<SelectReact
											name='separador_decimal'
											options={SEPARADORES_DECIMALES_OPTIONS}
											value={SEPARADORES_DECIMALES_OPTIONS.find(
												(s) => s.value === formik.values.separador_decimal,
											)}
											onChange={(option: any) =>
												formik.setFieldValue(
													'separador_decimal',
													option?.value,
												)
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
								onClick={() => setOpenPersonalizar(false)}
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
								Guardar Personalización
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}

			{/* Modal de Confirmación de Restablecimiento */}
			{openDelete && selectedSubempresa && (
				<Modal isOpen={openDelete} setIsOpen={setOpenDelete} size='lg'>
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
								<p className='text-sm text-gray-500'>{selectedSubempresa.name}</p>
							</div>
						</div>
					</ModalHeader>

					<ModalBody>
						<div className='space-y-4'>
							<p className='text-gray-700'>
								¿Está seguro que desea restablecer la personalización de{' '}
								<strong>{selectedSubempresa.name}</strong> a los valores por
								defecto?
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
											<li>
												Se volverá a la configuración regional por defecto
											</li>
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
							<Button variant='outline' onClick={() => setOpenDelete(false)}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button variant='solid' color='amber' onClick={confirmDelete}>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
								Restablecer a Valores por Defecto
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	);
}
