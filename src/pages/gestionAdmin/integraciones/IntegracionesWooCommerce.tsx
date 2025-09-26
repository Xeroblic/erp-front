import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
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
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
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

// CU018 - Interfaces para WooCommerce
interface IWooCommerceIntegracion {
	id?: number;
	estado_integracion: boolean;
	url_tienda: string;
	consumer_key: string;
	consumer_secret: string;
	modo_operacion: 'sandbox' | 'production';
	ultima_sincronizacion_exitosa?: string;
	log_errores_recientes?: string;
	created_at?: string;
	updated_at?: string;
}

// Opciones de configuración
const MODOS_OPERACION_OPTIONS = [
	{ value: 'sandbox', label: 'Sandbox (Pruebas)' },
	{ value: 'production', label: 'Producción' },
];

const ESTADOS_INTEGRACION_OPTIONS = [
	{ value: 'true', label: 'Activa' },
	{ value: 'false', label: 'Inactiva' },
];

const columnHelper = createColumnHelper<IWooCommerceIntegracion>();

export default function IntegracionesWooCommerce() {
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);

	// Estados principales
	const [loading, setLoading] = useState(false);
	const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activas' | 'inactivas'>('todos');
	const [filtroModo, setFiltroModo] = useState<'todos' | 'sandbox' | 'production'>('todos');
	const [filtroTexto, setFiltroTexto] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');

	// Estados de modales
	const [modalConfiguracion, setModalConfiguracion] = useState(false);
	const [modalEliminar, setModalEliminar] = useState(false);
	const [modalLogErrores, setModalLogErrores] = useState(false);
	const [selectedIntegracion, setSelectedIntegracion] = useState<IWooCommerceIntegracion | null>(
		null,
	);
	const [modoEdicion, setModoEdicion] = useState(false);
	const [probandoConexion, setProbandoConexion] = useState(false);

	// Estado para integraciones mock
	const [integraciones, setIntegraciones] = useState<IWooCommerceIntegracion[]>([
		{
			id: 1,
			estado_integracion: true,
			url_tienda: 'https://tienda-demo.woocommerce.com',
			consumer_key: 'ck_12345abcdef67890',
			consumer_secret: 'cs_67890fedcba54321',
			modo_operacion: 'production',
			ultima_sincronizacion_exitosa: '2025-01-15T10:30:00Z',
			log_errores_recientes: '',
			created_at: '2025-01-10T08:00:00Z',
			updated_at: '2025-01-15T10:30:00Z',
		},
		{
			id: 2,
			estado_integracion: false,
			url_tienda: 'https://sandbox-store.example.com',
			consumer_key: 'ck_sandbox123456',
			consumer_secret: 'cs_sandbox654321',
			modo_operacion: 'sandbox',
			ultima_sincronizacion_exitosa: '2025-01-12T14:20:00Z',
			log_errores_recientes:
				'Error de conexión: Timeout después de 30 segundos. Última verificación: 2025-01-15T09:45:00Z',
			created_at: '2025-01-08T12:15:00Z',
			updated_at: '2025-01-12T14:20:00Z',
		},
		{
			id: 3,
			estado_integracion: true,
			url_tienda: 'https://mi-tienda-online.com',
			consumer_key: 'ck_prod789012345',
			consumer_secret: 'cs_prod543210987',
			modo_operacion: 'production',
			ultima_sincronizacion_exitosa: '2025-01-15T11:15:00Z',
			log_errores_recientes: '',
			created_at: '2025-01-05T16:30:00Z',
			updated_at: '2025-01-15T11:15:00Z',
		},
	]);

	// Validación del formulario
	const validationSchema = Yup.object({
		url_tienda: Yup.string()
			.required('La URL de la tienda es obligatoria')
			.url('Debe ser una URL válida')
			.matches(/^https:\/\//, 'La URL debe usar HTTPS'),
		consumer_key: Yup.string()
			.required('El Consumer Key es obligatorio')
			.min(10, 'Consumer Key debe tener al menos 10 caracteres'),
		consumer_secret: Yup.string()
			.required('El Consumer Secret es obligatorio')
			.min(10, 'Consumer Secret debe tener al menos 10 caracteres'),
		modo_operacion: Yup.string()
			.required('El modo de operación es obligatorio')
			.oneOf(['sandbox', 'production'], 'Modo de operación inválido'),
		estado_integracion: Yup.boolean().required('El estado es obligatorio'),
	});

	// Formulario con Formik
	const formik = useFormik({
		initialValues: {
			url_tienda: '',
			consumer_key: '',
			consumer_secret: '',
			modo_operacion: 'sandbox' as 'sandbox' | 'production',
			estado_integracion: true,
		},
		validationSchema,
		onSubmit: async (values) => {
			try {
				setLoading(true);
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// Validar duplicidad por URL
				const integracionExistente = integraciones.find(
					(i) =>
						i.url_tienda === values.url_tienda &&
						(!modoEdicion || i.id !== selectedIntegracion?.id),
				);

				if (integracionExistente) {
					toast.error('Ya existe una integración configurada para esta URL de tienda');
					setLoading(false);
					return;
				}

				if (modoEdicion && selectedIntegracion) {
					// CU018.2 - Editar integración existente
					const updatedIntegraciones = integraciones.map((i) =>
						i.id === selectedIntegracion.id
							? {
									...i,
									...values,
									updated_at: new Date().toISOString(),
									log_errores_recientes: values.estado_integracion
										? ''
										: i.log_errores_recientes,
								}
							: i,
					);
					setIntegraciones(updatedIntegraciones);
					toast.success('Integración actualizada correctamente');
				} else {
					// CU018.1 - Crear nueva integración
					const nuevaIntegracion: IWooCommerceIntegracion = {
						id: Date.now(),
						...values,
						ultima_sincronizacion_exitosa: undefined,
						log_errores_recientes: '',
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					};
					setIntegraciones([...integraciones, nuevaIntegracion]);
					toast.success('Integración creada correctamente');
				}

				setModalConfiguracion(false);
				formik.resetForm();
			} catch (error) {
				toast.error('Error al guardar la integración');
			} finally {
				setLoading(false);
			}
		},
	});

	// CU018.1 - Crear integración
	const handleCrearIntegracion = () => {
		setSelectedIntegracion(null);
		setModoEdicion(false);
		formik.resetForm();
		setModalConfiguracion(true);
	};

	// CU018.2 - Editar integración
	const handleEditarIntegracion = (integracion: IWooCommerceIntegracion) => {
		setSelectedIntegracion(integracion);
		setModoEdicion(true);
		formik.setValues({
			url_tienda: integracion.url_tienda,
			consumer_key: integracion.consumer_key,
			consumer_secret: integracion.consumer_secret,
			modo_operacion: integracion.modo_operacion,
			estado_integracion: integracion.estado_integracion,
		});
		setModalConfiguracion(true);
	};

	// CU018.3 - Eliminar integración
	const handleEliminarIntegracion = (integracion: IWooCommerceIntegracion) => {
		setSelectedIntegracion(integracion);
		setModalEliminar(true);
	};

	const confirmarEliminacion = async () => {
		if (!selectedIntegracion) return;

		try {
			setLoading(true);
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const updatedIntegraciones = integraciones.filter(
				(i) => i.id !== selectedIntegracion.id,
			);
			setIntegraciones(updatedIntegraciones);

			toast.success('Integración eliminada correctamente');
			setModalEliminar(false);
		} catch (error) {
			toast.error('Error al eliminar la integración');
		} finally {
			setLoading(false);
		}
	};

	// CU018.5 - Probar conexión
	const handleProbarConexion = async (integracion: IWooCommerceIntegracion) => {
		if (!integracion.url_tienda || !integracion.consumer_key || !integracion.consumer_secret) {
			toast.error('Faltan credenciales necesarias para la prueba de conexión');
			return;
		}

		try {
			setProbandoConexion(true);
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Simular prueba de conexión (80% éxito)
			const exito = Math.random() > 0.2;

			if (exito) {
				const updatedIntegraciones = integraciones.map((i) =>
					i.id === integracion.id
						? {
								...i,
								log_errores_recientes: '',
								ultima_sincronizacion_exitosa: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							}
						: i,
				);
				setIntegraciones(updatedIntegraciones);
				toast.success('Conexión exitosa con WooCommerce');
			} else {
				const errorMessage = `Error de autenticación: Credenciales inválidas. Verificado: ${new Date().toLocaleString()}`;
				const updatedIntegraciones = integraciones.map((i) =>
					i.id === integracion.id
						? {
								...i,
								log_errores_recientes: errorMessage,
								updated_at: new Date().toISOString(),
							}
						: i,
				);
				setIntegraciones(updatedIntegraciones);
				toast.error('Error en la conexión con WooCommerce');
			}
		} catch (error) {
			toast.error('Error al probar la conexión');
		} finally {
			setProbandoConexion(false);
		}
	};

	// Ver log de errores
	const handleVerLogErrores = (integracion: IWooCommerceIntegracion) => {
		setSelectedIntegracion(integracion);
		setModalLogErrores(true);
	};

	// Definición de columnas
	const columns = useMemo(
		() => [
			columnHelper.accessor('url_tienda', {
				header: 'Tienda WooCommerce',
				cell: (info) => {
					const integracion = info.row.original;
					return (
						<div className='flex items-center'>
							<div
								className={`mr-3 flex h-10 w-10 items-center justify-center rounded-lg border ${
									integracion.estado_integracion
										? 'border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20'
										: 'border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700'
								}`}>
								<Icon
									icon='HeroGlobeAlt'
									className={`h-5 w-5 ${
										integracion.estado_integracion
											? 'text-emerald-600 dark:text-emerald-400'
											: 'text-gray-400 dark:text-gray-500'
									}`}
								/>
							</div>
							<div>
								<div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
									{info.getValue()}
								</div>
								<div className='text-sm text-gray-500 dark:text-gray-400'>
									ID: {integracion.id}
								</div>
							</div>
						</div>
					);
				},
			}),
			columnHelper.accessor('estado_integracion', {
				header: 'Estado',
				cell: (info) => {
					const estado = info.getValue();
					return estado ? (
						<Badge color='emerald' className='flex items-center gap-1'>
							<Icon icon='HeroCheckCircle' className='h-3 w-3' />
							Activa
						</Badge>
					) : (
						<Badge color='red' className='flex items-center gap-1'>
							<Icon icon='HeroXCircle' className='h-3 w-3' />
							Inactiva
						</Badge>
					);
				},
			}),
			columnHelper.accessor('modo_operacion', {
				header: 'Modo',
				cell: (info) => {
					const modo = info.getValue();
					return modo === 'production' ? (
						<Badge color='blue' className='flex items-center gap-1'>
							<Icon icon='HeroRocketLaunch' className='h-3 w-3' />
							Producción
						</Badge>
					) : (
						<Badge color='amber' className='flex items-center gap-1'>
							<Icon icon='HeroWrenchScrewdriver' className='h-3 w-3' />
							Sandbox
						</Badge>
					);
				},
			}),
			columnHelper.accessor('ultima_sincronizacion_exitosa', {
				header: 'Última Sincronización',
				cell: (info) => {
					const fecha = info.getValue();
					return fecha ? (
						<div className='text-xs text-gray-600 dark:text-gray-400'>
							<div>{new Date(fecha).toLocaleDateString()}</div>
							<div>{new Date(fecha).toLocaleTimeString()}</div>
						</div>
					) : (
						<span className='text-xs text-gray-400 dark:text-gray-500'>
							Sin sincronizar
						</span>
					);
				},
			}),
			columnHelper.display({
				id: 'errores',
				header: 'Errores',
				cell: (info) => {
					const integracion = info.row.original;
					return integracion.log_errores_recientes ? (
						<Button
							variant='outline'
							size='sm'
							color='red'
							onClick={() => handleVerLogErrores(integracion)}
							title='Ver errores recientes'>
							<Icon icon='HeroExclamationTriangle' className='h-4 w-4' />
						</Button>
					) : (
						<span className='text-xs text-emerald-600 dark:text-emerald-400'>
							Sin errores
						</span>
					);
				},
			}),
			columnHelper.display({
				id: 'acciones',
				header: 'Acciones',
				cell: (info) => {
					const integracion = info.row.original;
					return (
						<div className='flex justify-end gap-2'>
							<Button
								variant='outline'
								size='sm'
								color='blue'
								onClick={() => handleProbarConexion(integracion)}
								isLoading={probandoConexion}
								title='Probar conexión'>
								<Icon icon='HeroSignal' className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => handleEditarIntegracion(integracion)}
								title='Editar integración'>
								<Icon icon='HeroPencil' className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								color='red'
								onClick={() => handleEliminarIntegracion(integracion)}
								title='Eliminar integración'>
								<Icon icon='HeroTrash' className='h-4 w-4' />
							</Button>
						</div>
					);
				},
			}),
		],
		[integraciones, probandoConexion],
	);

	// CU018.4 - Filtrar integraciones
	const integracionesFiltradas = useMemo(() => {
		return integraciones.filter((integracion) => {
			// Filtro por texto
			if (filtroTexto) {
				const coincideTexto = integracion.url_tienda
					.toLowerCase()
					.includes(filtroTexto.toLowerCase());
				if (!coincideTexto) return false;
			}

			// Filtro por estado
			if (filtroEstado === 'activas') return integracion.estado_integracion;
			if (filtroEstado === 'inactivas') return !integracion.estado_integracion;

			// Filtro por modo
			if (filtroModo === 'sandbox') return integracion.modo_operacion === 'sandbox';
			if (filtroModo === 'production') return integracion.modo_operacion === 'production';

			return true;
		});
	}, [integraciones, filtroTexto, filtroEstado, filtroModo]);

	// Configuración de la tabla
	const table = useReactTable({
		data: integracionesFiltradas,
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
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<Icon
						icon='HeroGlobeAlt'
						className='mr-2 h-6 w-6 text-gray-700 dark:text-gray-300'
					/>
					<span className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
						Integraciones WooCommerce
					</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' onClick={handleCrearIntegracion} className='mr-2'>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Nueva Integración
					</Button>
					<Button color='blue' variant='outline' onClick={() => window.location.reload()}>
						<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
						Actualizar
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				{/* Tarjetas de resumen */}
				<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4'>
					<Card className='border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Total Integraciones
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{integraciones.length}
									</p>
								</div>
								<div className='rounded-lg bg-gray-100 p-3 dark:bg-gray-700'>
									<Icon
										icon='HeroGlobeAlt'
										className='h-6 w-6 text-gray-600 dark:text-gray-400'
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card className='border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
										Activas
									</p>
									<p className='text-2xl font-bold text-emerald-900 dark:text-emerald-100'>
										{integraciones.filter((i) => i.estado_integracion).length}
									</p>
								</div>
								<div className='rounded-lg bg-emerald-100 p-3 dark:bg-emerald-800/50'>
									<Icon
										icon='HeroCheckCircle'
										className='h-6 w-6 text-emerald-600 dark:text-emerald-400'
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card className='border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-900/20'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-blue-700 dark:text-blue-400'>
										Producción
									</p>
									<p className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
										{
											integraciones.filter(
												(i) => i.modo_operacion === 'production',
											).length
										}
									</p>
								</div>
								<div className='rounded-lg bg-blue-100 p-3 dark:bg-blue-800/50'>
									<Icon
										icon='HeroRocketLaunch'
										className='h-6 w-6 text-blue-600 dark:text-blue-400'
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card className='border-red-200 bg-red-50 shadow-sm dark:border-red-800 dark:bg-red-900/20'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-red-700 dark:text-red-400'>
										Con Errores
									</p>
									<p className='text-2xl font-bold text-red-900 dark:text-red-100'>
										{
											integraciones.filter((i) => i.log_errores_recientes)
												.length
										}
									</p>
								</div>
								<div className='rounded-lg bg-red-100 p-3 dark:bg-red-800/50'>
									<Icon
										icon='HeroExclamationTriangle'
										className='h-6 w-6 text-red-600 dark:text-red-400'
									/>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
							<div>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
									Gestión de Integraciones
								</h3>
								<p className='text-sm text-gray-600 dark:text-gray-400'>
									Configure y administre las integraciones con WooCommerce
								</p>
							</div>

							{/* Filtros */}
							<div className='flex flex-col gap-3 md:flex-row md:items-center'>
								<Input
									name='filtroTexto'
									placeholder='Buscar por URL...'
									value={globalFilter}
									onChange={(e) => setGlobalFilter(e.target.value)}
									className='w-full md:w-64'
								/>

								<SelectReact
									name='filtroEstado'
									options={[
										{ value: 'todos', label: 'Todos los estados' },
										{ value: 'activas', label: 'Activas' },
										{ value: 'inactivas', label: 'Inactivas' },
									]}
									value={{
										value: filtroEstado,
										label:
											filtroEstado === 'todos'
												? 'Todos los estados'
												: filtroEstado === 'activas'
													? 'Activas'
													: 'Inactivas',
									}}
									onChange={(option: any) =>
										setFiltroEstado(option?.value || 'todos')
									}
									placeholder='Filtrar por estado...'
									className='w-full md:w-48'
								/>

								<SelectReact
									name='filtroModo'
									options={[
										{ value: 'todos', label: 'Todos los modos' },
										{ value: 'sandbox', label: 'Sandbox' },
										{ value: 'production', label: 'Producción' },
									]}
									value={{
										value: filtroModo,
										label:
											filtroModo === 'todos'
												? 'Todos los modos'
												: filtroModo === 'sandbox'
													? 'Sandbox'
													: 'Producción',
									}}
									onChange={(option: any) =>
										setFiltroModo(option?.value || 'todos')
									}
									placeholder='Filtrar por modo...'
									className='w-full md:w-48'
								/>
							</div>
						</div>
					</CardHeader>

					<CardBody>
						{loading ? (
							<div className='py-12 text-center'>
								<div className='flex items-center justify-center gap-3'>
									<div className='h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
									<span className='text-gray-600 dark:text-gray-400'>
										Cargando integraciones...
									</span>
								</div>
							</div>
						) : integracionesFiltradas.length === 0 ? (
							<div className='py-12 text-center'>
								<Icon
									icon='HeroMagnifyingGlass'
									className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500'
								/>
								<h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-gray-100'>
									No se encontraron integraciones
								</h3>
								<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
									Ajusta los filtros de búsqueda o crea una nueva integración.
								</p>
								<Button
									color='blue'
									onClick={handleCrearIntegracion}
									className='mt-4'>
									<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
									Nueva Integración
								</Button>
							</div>
						) : (
							<>
								<div className='overflow-x-auto'>
									<table className='w-full'>
										<thead>
											{table.getHeaderGroups().map((headerGroup) => (
												<tr key={headerGroup.id}>
													{headerGroup.headers.map((header) => (
														<th
															key={header.id}
															className={`border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${
																header.id === 'acciones'
																	? 'text-right'
																	: ''
															}`}>
															{header.isPlaceholder
																? null
																: flexRender(
																		header.column.columnDef
																			.header,
																		header.getContext(),
																	)}
														</th>
													))}
												</tr>
											))}
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
											{table.getRowModel().rows.map((row) => (
												<tr
													key={row.id}
													className='hover:bg-gray-50 dark:hover:bg-gray-800'>
													{row.getVisibleCells().map((cell) => (
														<td
															key={cell.id}
															className={`whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${
																cell.column.id === 'acciones'
																	? 'text-right'
																	: ''
															}`}>
															{flexRender(
																cell.column.columnDef.cell,
																cell.getContext(),
															)}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Footer con paginación */}
								<div className='mt-4'>
									<TableCardFooterTemplateV2 table={table} />
								</div>
							</>
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal Crear/Editar Integración */}
			<Modal isOpen={modalConfiguracion} setIsOpen={setModalConfiguracion} size='xl'>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
							<Icon icon='HeroGlobeAlt' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								{modoEdicion ? 'Editar' : 'Configurar'} Integración WooCommerce
							</h3>
							<p className='text-sm text-gray-500'>
								{modoEdicion
									? 'Actualizar configuración existente'
									: 'Registrar nueva integración'}
							</p>
						</div>
					</div>
				</ModalHeader>

				<ModalBody className='max-h-[70vh] overflow-y-auto'>
					<form onSubmit={formik.handleSubmit} className='space-y-6'>
						{/* Estado de la integración */}
						<Card>
							<CardHeader>
								<h4 className='text-lg font-semibold'>Estado de la Integración</h4>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='estado_integracion'>Estado *</Label>
										<SelectReact
											name='estado_integracion'
											options={ESTADOS_INTEGRACION_OPTIONS}
											value={ESTADOS_INTEGRACION_OPTIONS.find(
												(e) => e.value === String(formik.values.estado_integracion),
											)}
											onChange={(option: any) =>
												formik.setFieldValue(
													'estado_integracion',
													option?.value === 'true'
														? true
														: false,
												)
											}
											placeholder='Seleccionar estado...'
										/>
										{formik.touched.estado_integracion &&
											formik.errors.estado_integracion && (
												<p className='mt-1 text-sm text-red-600'>
													{formik.errors.estado_integracion}
												</p>
											)}
									</div>

									<div>
										<Label htmlFor='modo_operacion'>Modo de Operación *</Label>
										<SelectReact
											name='modo_operacion'
											options={MODOS_OPERACION_OPTIONS}
											value={MODOS_OPERACION_OPTIONS.find(
												(m) => m.value === formik.values.modo_operacion,
											)}
											onChange={(option: any) =>
												formik.setFieldValue(
													'modo_operacion',
													option?.value,
												)
											}
											placeholder='Seleccionar modo...'
										/>
										{formik.touched.modo_operacion &&
											formik.errors.modo_operacion && (
												<p className='mt-1 text-sm text-red-600'>
													{formik.errors.modo_operacion}
												</p>
											)}
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Configuración de conexión */}
						<Card>
							<CardHeader>
								<h4 className='text-lg font-semibold'>Configuración de Conexión</h4>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div>
									<Label htmlFor='url_tienda'>
										URL de la Tienda WooCommerce *
									</Label>
									<Input
										id='url_tienda'
										name='url_tienda'
										type='url'
										value={formik.values.url_tienda}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										placeholder='https://mi-tienda.com'
										className='font-mono'
									/>
									{formik.touched.url_tienda && formik.errors.url_tienda && (
										<p className='mt-1 text-sm text-red-600'>
											{formik.errors.url_tienda}
										</p>
									)}
									<p className='mt-1 text-xs text-gray-500'>
										La URL debe usar HTTPS para garantizar la seguridad
									</p>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='consumer_key'>Consumer Key *</Label>
										<Input
											id='consumer_key'
											name='consumer_key'
											type='text'
											value={formik.values.consumer_key}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='ck_xxxxxxxxxxxxxxxxxx'
											className='font-mono'
										/>
										{formik.touched.consumer_key &&
											formik.errors.consumer_key && (
												<p className='mt-1 text-sm text-red-600'>
													{formik.errors.consumer_key}
												</p>
											)}
									</div>

									<div>
										<Label htmlFor='consumer_secret'>Consumer Secret *</Label>
										<Input
											id='consumer_secret'
											name='consumer_secret'
											type='password'
											value={formik.values.consumer_secret}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='cs_xxxxxxxxxxxxxxxxxx'
											className='font-mono'
										/>
										{formik.touched.consumer_secret &&
											formik.errors.consumer_secret && (
												<p className='mt-1 text-sm text-red-600'>
													{formik.errors.consumer_secret}
												</p>
											)}
									</div>
								</div>

								<div className='rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-900/20'>
									<div className='flex items-start gap-3'>
										<Icon
											icon='HeroInformationCircle'
											className='mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400'
										/>
										<div>
											<h4 className='font-medium text-blue-800 dark:text-blue-200'>
												Información sobre las credenciales:
											</h4>
											<ul className='mt-2 list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300'>
												<li>
													Genere las claves API desde WooCommerce →
													Configuración → Avanzado → Claves API
												</li>
												<li>
													Asegúrese de que los permisos sean de
													"Lectura/Escritura"
												</li>
												<li>
													Las claves son sensibles y deben mantenerse
													seguras
												</li>
											</ul>
										</div>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Información de solo lectura (solo en modo edición) */}
						{modoEdicion && selectedIntegracion && (
							<Card>
								<CardHeader>
									<h4 className='text-lg font-semibold'>
										Información del Sistema
									</h4>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<Label htmlFor='ultima_sincronizacion_exitosa'>Última Sincronización Exitosa</Label>
											<Input
												name='ultima_sincronizacion_exitosa'
												value={
													selectedIntegracion.ultima_sincronizacion_exitosa
														? new Date(
																selectedIntegracion.ultima_sincronizacion_exitosa,
															).toLocaleString()
														: 'Sin sincronizaciones'
												}
												readOnly
												className='bg-gray-50 dark:bg-gray-800'
											/>
										</div>

										<div>
											<Label htmlFor='created_at'>Creada</Label>
											<Input
												name='created_at'
												value={
													selectedIntegracion.created_at
														? new Date(
																selectedIntegracion.created_at,
															).toLocaleString()
														: 'N/A'
												}
												readOnly
												className='bg-gray-50 dark:bg-gray-800'
											/>
										</div>
									</div>

									{selectedIntegracion.log_errores_recientes && (
										<div>
											<Label htmlFor='log_errores_recientes'>Log de Errores Recientes</Label>
											<Textarea
												value={selectedIntegracion.log_errores_recientes}
												readOnly
												rows={3}
												className='bg-gray-50 font-mono text-xs dark:bg-gray-800'
											/>
										</div>
									)}
								</CardBody>
							</Card>
						)}
					</form>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							onClick={() => setModalConfiguracion(false)}
							isDisable={loading}>
							Cancelar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='blue'
							onClick={() => {
								if (
									formik.values.url_tienda &&
									formik.values.consumer_key &&
									formik.values.consumer_secret
								) {
									handleProbarConexion({
										...formik.values,
										id: Date.now(),
										ultima_sincronizacion_exitosa: undefined,
										log_errores_recientes: '',
									} as IWooCommerceIntegracion);
								} else {
									toast.error(
										'Complete todos los campos obligatorios antes de probar la conexión',
									);
								}
							}}
							isLoading={probandoConexion}
							isDisable={loading || probandoConexion}>
							<Icon icon='HeroSignal' className='mr-2 h-4 w-4' />
							Probar Conexión
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button
							variant='solid'
							onClick={() => formik.handleSubmit()}
							isLoading={loading}
							isDisable={loading || probandoConexion}>
							{modoEdicion ? 'Guardar Cambios' : 'Crear Integración'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			{/* Modal Eliminar Integración */}
			<Modal isOpen={modalEliminar} setIsOpen={setModalEliminar} size='lg'>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
							<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Eliminar Integración
							</h3>
							<p className='text-sm text-gray-500'>
								{selectedIntegracion?.url_tienda}
							</p>
						</div>
					</div>
				</ModalHeader>

				<ModalBody>
					<div className='space-y-4'>
						<p className='text-gray-700'>
							¿Está seguro que desea eliminar la integración con{' '}
							<strong>{selectedIntegracion?.url_tienda}</strong>?
						</p>

						<div className='rounded-lg border-l-4 border-red-400 bg-red-50 p-4'>
							<div className='flex items-start gap-3'>
								<Icon
									icon='HeroExclamationTriangle'
									className='mt-0.5 h-5 w-5 text-red-600'
								/>
								<div>
									<h4 className='font-medium text-red-800'>
										Esta acción no se puede deshacer:
									</h4>
									<ul className='mt-2 list-inside list-disc space-y-1 text-sm text-red-700'>
										<li>
											Se eliminará toda la configuración de la integración
										</li>
										<li>Se detendrán todas las sincronizaciones automáticas</li>
										<li>Los datos históricos de sincronización se perderán</li>
										<li>
											Será necesario reconfigurar completamente si desea
											restaurarla
										</li>
									</ul>
								</div>
							</div>
						</div>

						{selectedIntegracion?.log_errores_recientes && (
							<div>
								<Label htmlFor='log_errores_recientes'>Log de Errores (Referencia)</Label>
								<Textarea
									value={selectedIntegracion.log_errores_recientes}
									readOnly
									rows={3}
									className='bg-gray-50 font-mono text-xs dark:bg-gray-800'
								/>
							</div>
						)}
					</div>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							onClick={() => setModalEliminar(false)}
							isDisable={loading}>
							Cancelar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button
							variant='solid'
							color='red'
							onClick={confirmarEliminacion}
							isLoading={loading}
							isDisable={loading}>
							<Icon icon='HeroTrash' className='mr-2 h-4 w-4' />
							Eliminar Integración
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			{/* Modal Ver Log de Errores */}
			<Modal isOpen={modalLogErrores} setIsOpen={setModalLogErrores} size='lg'>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-100'>
							<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Log de Errores Recientes
							</h3>
							<p className='text-sm text-gray-500'>
								{selectedIntegracion?.url_tienda}
							</p>
						</div>
					</div>
				</ModalHeader>

				<ModalBody>
					<div className='space-y-4'>
						<div>
							<Label htmlFor='log_errores_recientes'>Detalles del Error</Label>
							<Textarea
								value={
									selectedIntegracion?.log_errores_recientes ||
									'Sin errores registrados'
								}
								readOnly
								rows={8}
								className='bg-gray-50 font-mono text-sm dark:bg-gray-800'
							/>
						</div>

						<div className='rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4'>
							<div className='flex items-start gap-3'>
								<Icon
									icon='HeroInformationCircle'
									className='mt-0.5 h-5 w-5 text-amber-600'
								/>
								<div>
									<h4 className='font-medium text-amber-800'>
										Recomendaciones para resolver errores:
									</h4>
									<ul className='mt-2 list-inside list-disc space-y-1 text-sm text-amber-700'>
										<li>Verifique que las credenciales API sean correctas</li>
										<li>Confirme que la URL de la tienda esté activa</li>
										<li>Asegúrese de que WooCommerce esté actualizado</li>
										<li>Revise la configuración de permisos en WooCommerce</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={() => setModalLogErrores(false)}>
							Cerrar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button
							variant='solid'
							color='blue'
							onClick={() => {
								if (selectedIntegracion) {
									setModalLogErrores(false);
									handleProbarConexion(selectedIntegracion);
								}
							}}>
							<Icon icon='HeroSignal' className='mr-2 h-4 w-4' />
							Probar Conexión Nuevamente
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
}
