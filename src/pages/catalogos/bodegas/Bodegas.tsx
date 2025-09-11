/**
 * Sistema de Gestión de Bodegas
 * CRUD completo con control de inventario y ubicaciones
 */
import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardBody, CardTitle } from '../../../components/ui/Card';
import Container from '../../../components/layouts/Container/Container';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../../components/layouts/Subheader/Subheader';
import Icon from '../../../components/icon/Icon';
import Input from '../../../components/form/Input';
import SelectReact from '../../../components/form/SelectReact';
import Badge from '../../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../components/ui/Modal';
import { TSelectOption, TSelectOptions } from '../../../components/form/SelectReact';

// Interfaces para Bodegas
interface IWarehouse {
	id: number;
	company_id: number;
	code: string;
	name: string;
	description: string;
	address: string;
	city: string;
	country: string;
	postal_code: string;
	phone: string;
	email: string;
	manager_name: string;
	manager_phone: string;
	warehouse_type: 'CENTRAL' | 'SUCURSAL' | 'DISTRIBUCION' | 'TEMPORAL';
	max_capacity: number;
	current_capacity: number;
	is_active: boolean;
	has_climate_control: boolean;
	has_security_system: boolean;
	operating_hours: string;
	created_at: string;
	updated_at: string;
	products_count: number;
	total_value: number;
}

interface IWarehouseFilters {
	search: string;
	warehouse_type?: string;
	city?: string;
	is_active?: boolean;
	has_climate_control?: boolean;
}

interface IWarehouseStats {
	total_warehouses: number;
	active_warehouses: number;
	total_capacity: number;
	used_capacity: number;
	total_products: number;
	total_value: number;
}

const Bodegas: React.FC = () => {
	// Estados principales
	const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
	const [loading, setLoading] = useState(false);

	// Estados para filtros
	const [filters, setFilters] = useState<IWarehouseFilters>({
		search: '',
		warehouse_type: undefined,
		city: undefined,
		is_active: undefined,
		has_climate_control: undefined,
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<IWarehouseStats>({
		total_warehouses: 0,
		active_warehouses: 0,
		total_capacity: 0,
		used_capacity: 0,
		total_products: 0,
		total_value: 0,
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<IWarehouse | null>(null);

	// Opciones para filtros
	const typeOptions: TSelectOptions = [
		{ value: '', label: 'Todos los tipos' },
		{ value: 'CENTRAL', label: 'Central' },
		{ value: 'SUCURSAL', label: 'Sucursal' },
		{ value: 'DISTRIBUCION', label: 'Distribución' },
		{ value: 'TEMPORAL', label: 'Temporal' },
	];

	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'true', label: 'Activo' },
		{ value: 'false', label: 'Inactivo' },
	];

	const climateOptions: TSelectOptions = [
		{ value: '', label: 'Todos' },
		{ value: 'true', label: 'Con clima controlado' },
		{ value: 'false', label: 'Sin clima controlado' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadWarehouses();
		loadStats();
	}, [filters]);

	const loadWarehouses = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			const mockWarehouses: IWarehouse[] = [
				{
					id: 1,
					company_id: 1,
					code: 'WH-BOG-001',
					name: 'Almacén Central Bogotá',
					description: 'Bodega principal para distribución nacional',
					address: 'Zona Industrial La Pradera, Manzana 5 Lote 3',
					city: 'Bogotá',
					country: 'Colombia',
					postal_code: '111321',
					phone: '+57 1 234-5678',
					email: 'bodega.bogota@empresa.com',
					manager_name: 'Carlos Rodríguez',
					manager_phone: '+57 300 123-4567',
					warehouse_type: 'CENTRAL',
					max_capacity: 10000,
					current_capacity: 7500,
					is_active: true,
					has_climate_control: true,
					has_security_system: true,
					operating_hours: '6:00 AM - 10:00 PM',
					created_at: '2023-01-15T08:00:00Z',
					updated_at: '2024-01-20T16:30:00Z',
					products_count: 189,
					total_value: 450000000,
				},
				{
					id: 2,
					company_id: 1,
					code: 'WH-MED-002',
					name: 'Sucursal Norte Medellín',
					description: 'Bodega regional para atención zona norte',
					address: 'Parque Industrial del Norte, Bodega 15',
					city: 'Medellín',
					country: 'Colombia',
					postal_code: '050026',
					phone: '+57 4 987-6543',
					email: 'bodega.medellin@empresa.com',
					manager_name: 'Ana María Gómez',
					manager_phone: '+57 310 987-6543',
					warehouse_type: 'SUCURSAL',
					max_capacity: 5000,
					current_capacity: 3200,
					is_active: true,
					has_climate_control: false,
					has_security_system: true,
					operating_hours: '7:00 AM - 7:00 PM',
					created_at: '2023-03-20T10:15:00Z',
					updated_at: '2024-01-18T11:45:00Z',
					products_count: 95,
					total_value: 180000000,
				},
				{
					id: 3,
					company_id: 1,
					code: 'WH-CAL-003',
					name: 'Sucursal Sur Cali',
					description: 'Bodega regional para atención zona pacífico',
					address: 'Centro Logístico del Sur, Módulo C',
					city: 'Cali',
					country: 'Colombia',
					postal_code: '760001',
					phone: '+57 2 456-7890',
					email: 'bodega.cali@empresa.com',
					manager_name: 'Diego Martínez',
					manager_phone: '+57 320 456-7890',
					warehouse_type: 'SUCURSAL',
					max_capacity: 3000,
					current_capacity: 2100,
					is_active: true,
					has_climate_control: true,
					has_security_system: true,
					operating_hours: '6:30 AM - 8:00 PM',
					created_at: '2023-05-10T14:30:00Z',
					updated_at: '2024-01-15T09:20:00Z',
					products_count: 67,
					total_value: 125000000,
				},
				{
					id: 4,
					company_id: 1,
					code: 'WH-BUC-004',
					name: 'Sucursal Oriente Bucaramanga',
					description: 'Bodega regional para atención zona oriental',
					address: 'Zona Franca Permanente, Nave 8',
					city: 'Bucaramanga',
					country: 'Colombia',
					postal_code: '680001',
					phone: '+57 7 789-0123',
					email: 'bodega.bucaramanga@empresa.com',
					manager_name: 'Laura Sánchez',
					manager_phone: '+57 315 789-0123',
					warehouse_type: 'SUCURSAL',
					max_capacity: 2000,
					current_capacity: 800,
					is_active: true,
					has_climate_control: false,
					has_security_system: true,
					operating_hours: '7:00 AM - 6:00 PM',
					created_at: '2023-08-05T11:00:00Z',
					updated_at: '2024-01-10T15:15:00Z',
					products_count: 31,
					total_value: 65000000,
				},
				{
					id: 5,
					company_id: 1,
					code: 'WH-TMP-005',
					name: 'Bodega Temporal Expo',
					description: 'Almacén temporal para eventos y exposiciones',
					address: 'Centro de Convenciones, Pabellón 3',
					city: 'Bogotá',
					country: 'Colombia',
					postal_code: '111711',
					phone: '+57 1 555-0123',
					email: 'bodega.temporal@empresa.com',
					manager_name: 'Roberto Vargas',
					manager_phone: '+57 325 555-0123',
					warehouse_type: 'TEMPORAL',
					max_capacity: 500,
					current_capacity: 0,
					is_active: false,
					has_climate_control: false,
					has_security_system: false,
					operating_hours: 'Variable según evento',
					created_at: '2023-11-15T16:00:00Z',
					updated_at: '2023-12-20T10:00:00Z',
					products_count: 0,
					total_value: 0,
				},
			];

			setWarehouses(mockWarehouses);
		} catch (error) {
			console.error('Error loading warehouses:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: IWarehouseStats = {
				total_warehouses: 5,
				active_warehouses: 4,
				total_capacity: 20500,
				used_capacity: 13600,
				total_products: 382,
				total_value: 820000000,
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof IWarehouseFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			warehouse_type: undefined,
			city: undefined,
			is_active: undefined,
			has_climate_control: undefined,
		});
	};

	// Handlers para bodegas
	const handleCreateWarehouse = () => {
		setCreateModalOpen(true);
	};

	const handleEditWarehouse = (warehouse: IWarehouse) => {
		setSelectedWarehouse(warehouse);
		setEditModalOpen(true);
	};

	const handleViewWarehouse = (warehouse: IWarehouse) => {
		setSelectedWarehouse(warehouse);
		setViewModalOpen(true);
	};

	const handleDeleteWarehouse = (warehouse: IWarehouse) => {
		setSelectedWarehouse(warehouse);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedWarehouse) return;

		try {
			console.log('Deleting warehouse:', selectedWarehouse.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedWarehouse(null);
			await Promise.all([loadWarehouses(), loadStats()]);
		} catch (error) {
			console.error('Error deleting warehouse:', error);
		}
	};

	// Funciones de utilidad
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'CENTRAL':
				return 'violet';
			case 'SUCURSAL':
				return 'sky';
			case 'DISTRIBUCION':
				return 'emerald';
			case 'TEMPORAL':
				return 'amber';
			default:
				return 'gray';
		}
	};

	const getCapacityColor = (current: number, max: number) => {
		const percentage = (current / max) * 100;
		if (percentage >= 90) return 'red';
		if (percentage >= 75) return 'amber';
		if (percentage >= 50) return 'sky';
		return 'emerald';
	};

	const getCapacityPercentage = (current: number, max: number) => {
		return Math.round((current / max) * 100);
	};

	// Tabla de bodegas
	const WarehousesTable = () => (
		<div className='overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Bodega
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Ubicación
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Tipo
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Capacidad
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Inventario
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Estado
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Acciones
						</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-200 bg-white'>
					{warehouses.map((warehouse) => (
						<tr key={warehouse.id} className='hover:bg-gray-50'>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm font-medium text-gray-900'>
										{warehouse.name}
									</div>
									<div className='text-sm text-gray-500'>{warehouse.code}</div>
									<div className='text-sm text-gray-500'>
										Gerente: {warehouse.manager_name}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm text-gray-900'>{warehouse.address}</div>
									<div className='text-sm text-gray-500'>
										{warehouse.city}, {warehouse.country}
									</div>
									<div className='text-sm text-gray-500'>
										{warehouse.postal_code}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div className='space-y-1'>
									<Badge color={getTypeColor(warehouse.warehouse_type)}>
										{warehouse.warehouse_type}
									</Badge>
									<div className='flex space-x-1'>
										{warehouse.has_climate_control && (
											<Badge color='sky' variant='outline'>
												<Icon
													icon='HeroSnowflake'
													className='mr-1 h-3 w-3'
												/>
												Clima
											</Badge>
										)}
										{warehouse.has_security_system && (
											<Badge color='emerald' variant='outline'>
												<Icon
													icon='HeroShieldCheck'
													className='mr-1 h-3 w-3'
												/>
												Seguridad
											</Badge>
										)}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm font-medium text-gray-900'>
										{warehouse.current_capacity.toLocaleString()} /{' '}
										{warehouse.max_capacity.toLocaleString()}
									</div>
									<div className='mt-1 h-2 w-full rounded-full bg-gray-200'>
										<div
											className={`h-2 rounded-full bg-${getCapacityColor(warehouse.current_capacity, warehouse.max_capacity)}-500`}
											style={{
												width: `${getCapacityPercentage(warehouse.current_capacity, warehouse.max_capacity)}%`,
											}}></div>
									</div>
									<div className='mt-1 text-xs text-gray-500'>
										{getCapacityPercentage(
											warehouse.current_capacity,
											warehouse.max_capacity,
										)}
										% usado
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
								<div>
									<div className='font-medium'>
										{warehouse.products_count} productos
									</div>
									<div className='text-gray-500'>
										{formatCurrency(warehouse.total_value)}
									</div>
									<div className='text-xs text-gray-500'>
										{warehouse.operating_hours}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={warehouse.is_active ? 'emerald' : 'red'}>
									{warehouse.is_active ? 'Activo' : 'Inactivo'}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
								<div className='flex space-x-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleViewWarehouse(warehouse)}
										className='text-blue-600 hover:text-blue-900'>
										<Icon icon='HeroEye' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleEditWarehouse(warehouse)}
										className='text-indigo-600 hover:text-indigo-900'>
										<Icon icon='HeroPencilSquare' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleDeleteWarehouse(warehouse)}
										isDisable={warehouse.products_count > 0}
										className={`${
											warehouse.products_count > 0
												? 'cursor-not-allowed text-gray-400'
												: 'text-red-600 hover:text-red-900'
										}`}>
										<Icon icon='HeroTrash' className='h-4 w-4' />
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);

	return (
		<PageWrapper name='bodegas-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20'>
							<Icon
								icon='HeroHomeModern'
								className='h-6 w-6 text-indigo-600 dark:text-indigo-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Bodegas
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de bodegas y control de inventario
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' onClick={handleCreateWarehouse} icon='HeroPlus'>
						Nueva Bodega
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20'>
								<Icon icon='HeroHomeModern' className='h-6 w-6 text-indigo-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Bodegas
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_warehouses}
								</p>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20'>
								<Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Bodegas Activas
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.active_warehouses}
								</p>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
								<Icon icon='HeroCube' className='h-6 w-6 text-amber-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Capacidad Utilizada
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{Math.round(
											(stats.used_capacity / stats.total_capacity) * 100,
										)}
										%
									</p>
									<Badge color='amber'>
										{stats.used_capacity.toLocaleString()}/
										{stats.total_capacity.toLocaleString()}
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
								<Icon
									icon='HeroCurrencyDollar'
									className='h-6 w-6 text-green-600'
								/>
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Valor Total Inventario
								</p>
								<p className='text-lg font-bold text-gray-900 dark:text-white'>
									{formatCurrency(stats.total_value)}
								</p>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Filtros */}
				<Card className='mb-6'>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Filtros de Búsqueda</CardTitle>
							<Button variant='outline' size='sm' onClick={clearFilters}>
								<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
								Limpiar Filtros
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar
								</label>
								<Input
									type='text'
									name='search'
									placeholder='Nombre, código, ciudad...'
									value={filters.search || ''}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Tipo
								</label>
								<SelectReact
									name='warehouse_type'
									options={typeOptions}
									value={typeOptions.find(
										(option) => option.value === filters.warehouse_type,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'warehouse_type',
											option?.value || undefined,
										);
									}}
									placeholder='Seleccionar tipo...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Clima Controlado
								</label>
								<SelectReact
									name='climate'
									options={climateOptions}
									value={climateOptions.find(
										(option) =>
											option.value ===
											filters.has_climate_control?.toString(),
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'has_climate_control',
											option?.value === 'true'
												? true
												: option?.value === 'false'
													? false
													: undefined,
										);
									}}
									placeholder='Seleccionar...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Estado
								</label>
								<SelectReact
									name='status'
									options={statusOptions}
									value={statusOptions.find(
										(option) => option.value === filters.is_active?.toString(),
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'is_active',
											option?.value === 'true'
												? true
												: option?.value === 'false'
													? false
													: undefined,
										);
									}}
									placeholder='Seleccionar estado...'
								/>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Tabla de Bodegas */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Bodegas</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{warehouses.length} bodegas
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						{loading ? (
							<div className='flex items-center justify-center py-12'>
								<Icon
									icon='HeroArrowPath'
									className='h-8 w-8 animate-spin text-indigo-600'
								/>
								<span className='ml-2 text-gray-600'>Cargando bodegas...</span>
							</div>
						) : (
							<WarehousesTable />
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal de Confirmación de Eliminación */}
			<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen}>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
							<Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>Eliminar Bodega</h2>
							<p className='text-sm text-gray-600'>
								Esta acción no se puede deshacer
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedWarehouse && (
						<div className='space-y-4'>
							<div className='rounded-lg bg-red-50 p-4'>
								<div className='flex'>
									<div className='flex-shrink-0'>
										<Icon
											icon='HeroExclamationTriangle'
											className='h-5 w-5 text-red-400'
										/>
									</div>
									<div className='ml-3'>
										<h3 className='text-sm font-medium text-red-800'>
											¿Estás seguro de que quieres eliminar esta bodega?
										</h3>
										<div className='mt-2 text-sm text-red-700'>
											<p>
												<strong>Bodega:</strong> {selectedWarehouse.name}
											</p>
											<p>
												<strong>Código:</strong> {selectedWarehouse.code}
											</p>
											<p>
												<strong>Ubicación:</strong> {selectedWarehouse.city}
											</p>
											{selectedWarehouse.products_count > 0 && (
												<p className='mt-2 font-medium text-red-800'>
													⚠️ Esta bodega tiene{' '}
													{selectedWarehouse.products_count} productos. No
													se puede eliminar hasta que esté vacía.
												</p>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button
							variant='outline'
							onClick={() => {
								setDeleteModalOpen(false);
								setSelectedWarehouse(null);
							}}>
							Cancelar
						</Button>
						<Button
							color='red'
							onClick={handleConfirmDelete}
							isDisable={selectedWarehouse?.products_count! > 0}>
							{selectedWarehouse?.products_count! > 0
								? 'No se puede eliminar'
								: 'Eliminar Bodega'}
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Vista de Bodega */}
			<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='2xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100'>
							<Icon icon='HeroEye' className='h-6 w-6 text-indigo-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								Detalles de la Bodega
							</h2>
							<p className='text-sm text-gray-600'>Información completa y métricas</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedWarehouse && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='space-y-4'>
									<div>
										<h3 className='mb-2 text-lg font-bold text-gray-900'>
											{selectedWarehouse.name}
										</h3>
										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Código:
												</span>
												<span className='font-mono'>
													{selectedWarehouse.code}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Tipo:
												</span>
												<Badge
													color={getTypeColor(
														selectedWarehouse.warehouse_type,
													)}>
													{selectedWarehouse.warehouse_type}
												</Badge>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Dirección:
												</span>
												<span className='text-right'>
													{selectedWarehouse.address}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Ciudad:
												</span>
												<span>
													{selectedWarehouse.city},{' '}
													{selectedWarehouse.country}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Teléfono:
												</span>
												<span>{selectedWarehouse.phone}</span>
											</div>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<div className='space-y-2'>
										<div className='mb-4 flex flex-wrap gap-2'>
											<Badge
												color={
													selectedWarehouse.is_active ? 'emerald' : 'red'
												}>
												{selectedWarehouse.is_active
													? 'Activo'
													: 'Inactivo'}
											</Badge>
											{selectedWarehouse.has_climate_control && (
												<Badge color='sky'>Clima Controlado</Badge>
											)}
											{selectedWarehouse.has_security_system && (
												<Badge color='emerald'>Sistema de Seguridad</Badge>
											)}
										</div>

										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Gerente:
												</span>
												<span>{selectedWarehouse.manager_name}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Horario:
												</span>
												<span>{selectedWarehouse.operating_hours}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Capacidad:
												</span>
												<span>
													{selectedWarehouse.current_capacity.toLocaleString()}{' '}
													/{' '}
													{selectedWarehouse.max_capacity.toLocaleString()}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Productos:
												</span>
												<span>{selectedWarehouse.products_count}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Valor Total:
												</span>
												<span>
													{formatCurrency(selectedWarehouse.total_value)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className='border-t pt-4'>
								<h4 className='mb-2 font-medium text-gray-700'>Descripción</h4>
								<p className='text-sm text-gray-600'>
									{selectedWarehouse.description}
								</p>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button
							variant='outline'
							onClick={() => {
								setViewModalOpen(false);
								setSelectedWarehouse(null);
							}}>
							Cerrar
						</Button>
						{selectedWarehouse && (
							<Button
								color='blue'
								onClick={() => {
									setViewModalOpen(false);
									handleEditWarehouse(selectedWarehouse);
								}}>
								Editar Bodega
							</Button>
						)}
					</div>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
};

export default Bodegas;
