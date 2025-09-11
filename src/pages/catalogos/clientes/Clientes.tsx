/**
 * Sistema de Gestión de Clientes
 * CRUD completo con segmentación y analytics comerciales
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

// Interfaces para Clientes
interface ICustomer {
	id: number;
	company_id: number;
	name: string;
	code: string;
	document_type: 'NIT' | 'CC' | 'CE' | 'PASSPORT';
	document_number: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	country: string;
	website?: string;
	contact_person: string;
	contact_email: string;
	contact_phone: string;
	credit_limit: number;
	payment_terms: number; // días
	segment: 'CORPORATIVO' | 'PYME' | 'PERSONA_NATURAL';
	industry: string;
	customer_since: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	orders_count: number;
	total_sales: number;
	last_order_date?: string;
	loyalty_score: number; // 1-100
}

interface ICustomerFilters {
	search: string;
	segment?: string;
	industry?: string;
	city?: string;
	loyalty_score?: number;
	is_active?: boolean;
}

interface ICustomerStats {
	total_customers: number;
	active_customers: number;
	inactive_customers: number;
	total_sales: number;
	avg_loyalty_score: number;
	top_segment: string;
	new_this_month: number;
}

const Clientes: React.FC = () => {
	// Estados principales
	const [customers, setCustomers] = useState<ICustomer[]>([]);
	const [loading, setLoading] = useState(false);

	// Estados para filtros
	const [filters, setFilters] = useState<ICustomerFilters>({
		search: '',
		segment: undefined,
		industry: undefined,
		city: undefined,
		loyalty_score: undefined,
		is_active: undefined,
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<ICustomerStats>({
		total_customers: 0,
		active_customers: 0,
		inactive_customers: 0,
		total_sales: 0,
		avg_loyalty_score: 0,
		top_segment: '',
		new_this_month: 0,
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);

	// Opciones para filtros
	const segmentOptions: TSelectOptions = [
		{ value: '', label: 'Todos los segmentos' },
		{ value: 'CORPORATIVO', label: 'Corporativo' },
		{ value: 'PYME', label: 'PYME' },
		{ value: 'PERSONA_NATURAL', label: 'Persona Natural' },
	];

	const industryOptions: TSelectOptions = [
		{ value: '', label: 'Todas las industrias' },
		{ value: 'TECNOLOGIA', label: 'Tecnología' },
		{ value: 'EDUCACION', label: 'Educación' },
		{ value: 'SALUD', label: 'Salud' },
		{ value: 'COMERCIO', label: 'Comercio' },
		{ value: 'MANUFACTURA', label: 'Manufactura' },
		{ value: 'SERVICIOS', label: 'Servicios' },
	];

	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'true', label: 'Activo' },
		{ value: 'false', label: 'Inactivo' },
	];

	const loyaltyOptions: TSelectOptions = [
		{ value: '', label: 'Todos los niveles' },
		{ value: '80', label: 'Excelente (80-100)' },
		{ value: '60', label: 'Muy Bueno (60-79)' },
		{ value: '40', label: 'Bueno (40-59)' },
		{ value: '20', label: 'Regular (20-39)' },
		{ value: '1', label: 'Bajo (1-19)' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadCustomers();
		loadStats();
	}, [filters]);

	const loadCustomers = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			const mockCustomers: ICustomer[] = [
				{
					id: 1,
					company_id: 1,
					name: 'Corporación TechCorp S.A.',
					code: 'CORP-001',
					document_type: 'NIT',
					document_number: '900123456-1',
					email: 'compras@techcorp.com',
					phone: '+57 1 234-5678',
					address: 'Torre Empresarial Norte, Piso 25',
					city: 'Bogotá',
					country: 'Colombia',
					website: 'www.techcorp.com',
					contact_person: 'Ana García',
					contact_email: 'ana.garcia@techcorp.com',
					contact_phone: '+57 300 123-4567',
					credit_limit: 100000000,
					payment_terms: 60,
					segment: 'CORPORATIVO',
					industry: 'TECNOLOGIA',
					customer_since: '2022-03-15',
					is_active: true,
					created_at: '2022-03-15T10:00:00Z',
					updated_at: '2024-01-15T16:30:00Z',
					orders_count: 87,
					total_sales: 289600000,
					last_order_date: '2024-01-10',
					loyalty_score: 95,
				},
				{
					id: 2,
					company_id: 1,
					name: 'Universidad Nacional',
					code: 'EDU-002',
					document_type: 'NIT',
					document_number: '800098765-4',
					email: 'adquisiciones@unal.edu.co',
					phone: '+57 1 987-6543',
					address: 'Ciudad Universitaria',
					city: 'Bogotá',
					country: 'Colombia',
					website: 'www.unal.edu.co',
					contact_person: 'Dr. Carlos Ruiz',
					contact_email: 'cruiz@unal.edu.co',
					contact_phone: '+57 310 987-6543',
					credit_limit: 50000000,
					payment_terms: 30,
					segment: 'CORPORATIVO',
					industry: 'EDUCACION',
					customer_since: '2021-08-20',
					is_active: true,
					created_at: '2021-08-20T14:15:00Z',
					updated_at: '2024-01-08T11:45:00Z',
					orders_count: 156,
					total_sales: 194700000,
					last_order_date: '2024-01-05',
					loyalty_score: 88,
				},
				{
					id: 3,
					company_id: 1,
					name: 'Inversiones Médicas Ltda',
					code: 'MED-003',
					document_type: 'NIT',
					document_number: '800456789-2',
					email: 'contacto@invmedicas.com',
					phone: '+57 1 456-7890',
					address: 'Centro Médico El Nogal',
					city: 'Bogotá',
					country: 'Colombia',
					contact_person: 'Dra. Patricia Morales',
					contact_email: 'pmorales@invmedicas.com',
					contact_phone: '+57 320 456-7890',
					credit_limit: 25000000,
					payment_terms: 45,
					segment: 'PYME',
					industry: 'SALUD',
					customer_since: '2023-01-12',
					is_active: true,
					created_at: '2023-01-12T09:30:00Z',
					updated_at: '2024-01-12T08:20:00Z',
					orders_count: 34,
					total_sales: 87400000,
					last_order_date: '2023-12-28',
					loyalty_score: 72,
				},
				{
					id: 4,
					company_id: 1,
					name: 'Juan Carlos Pérez',
					code: 'PER-004',
					document_type: 'CC',
					document_number: '12345678',
					email: 'jcperez@gmail.com',
					phone: '+57 300 111-2222',
					address: 'Calle 85 #12-34',
					city: 'Medellín',
					country: 'Colombia',
					contact_person: 'Juan Carlos Pérez',
					contact_email: 'jcperez@gmail.com',
					contact_phone: '+57 300 111-2222',
					credit_limit: 5000000,
					payment_terms: 15,
					segment: 'PERSONA_NATURAL',
					industry: 'SERVICIOS',
					customer_since: '2023-11-08',
					is_active: true,
					created_at: '2023-11-08T16:45:00Z',
					updated_at: '2024-01-20T12:15:00Z',
					orders_count: 12,
					total_sales: 23800000,
					last_order_date: '2024-01-18',
					loyalty_score: 61,
				},
				{
					id: 5,
					company_id: 1,
					name: 'Distribuidora Comercial ABC',
					code: 'COM-005',
					document_type: 'NIT',
					document_number: '800789456-3',
					email: 'ventas@distrabccom',
					phone: '+57 1 789-4561',
					address: 'Zona Industrial Sur',
					city: 'Cali',
					country: 'Colombia',
					contact_person: 'María Elena Vargas',
					contact_email: 'mvargas@distrabc.com',
					contact_phone: '+57 315 789-4561',
					credit_limit: 15000000,
					payment_terms: 30,
					segment: 'PYME',
					industry: 'COMERCIO',
					customer_since: '2022-06-30',
					is_active: false,
					created_at: '2022-06-30T11:00:00Z',
					updated_at: '2023-12-01T09:30:00Z',
					orders_count: 78,
					total_sales: 156800000,
					last_order_date: '2023-11-25',
					loyalty_score: 45,
				},
			];

			setCustomers(mockCustomers);
		} catch (error) {
			console.error('Error loading customers:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: ICustomerStats = {
				total_customers: 5,
				active_customers: 4,
				inactive_customers: 1,
				total_sales: 752300000,
				avg_loyalty_score: 72.2,
				top_segment: 'Corporativo',
				new_this_month: 2,
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof ICustomerFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			segment: undefined,
			industry: undefined,
			city: undefined,
			loyalty_score: undefined,
			is_active: undefined,
		});
	};

	// Handlers para clientes
	const handleCreateCustomer = () => {
		setCreateModalOpen(true);
	};

	const handleEditCustomer = (customer: ICustomer) => {
		setSelectedCustomer(customer);
		setEditModalOpen(true);
	};

	const handleViewCustomer = (customer: ICustomer) => {
		setSelectedCustomer(customer);
		setViewModalOpen(true);
	};

	const handleDeleteCustomer = (customer: ICustomer) => {
		setSelectedCustomer(customer);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedCustomer) return;

		try {
			console.log('Deleting customer:', selectedCustomer.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedCustomer(null);
			await Promise.all([loadCustomers(), loadStats()]);
		} catch (error) {
			console.error('Error deleting customer:', error);
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

	const getLoyaltyColor = (score: number) => {
		if (score >= 80) return 'emerald';
		if (score >= 60) return 'sky';
		if (score >= 40) return 'amber';
		if (score >= 20) return 'amber';
		return 'red';
	};

	const getLoyaltyLevel = (score: number) => {
		if (score >= 80) return 'Excelente';
		if (score >= 60) return 'Muy Bueno';
		if (score >= 40) return 'Bueno';
		if (score >= 20) return 'Regular';
		return 'Bajo';
	};

	const getSegmentColor = (segment: string) => {
		switch (segment) {
			case 'CORPORATIVO':
				return 'violet';
			case 'PYME':
				return 'sky';
			case 'PERSONA_NATURAL':
				return 'emerald';
			default:
				return 'gray';
		}
	};

	const getIndustryColor = (industry: string) => {
		switch (industry) {
			case 'TECNOLOGIA':
				return 'blue';
			case 'EDUCACION':
				return 'violet';
			case 'SALUD':
				return 'emerald';
			case 'COMERCIO':
				return 'amber';
			case 'MANUFACTURA':
				return 'zinc';
			case 'SERVICIOS':
				return 'sky';
			default:
				return 'gray';
		}
	};

	// Tabla de clientes
	const CustomersTable = () => (
		<div className='overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Cliente
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Contacto
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Segmento
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Fidelidad
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Ventas
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
					{customers.map((customer) => (
						<tr key={customer.id} className='hover:bg-gray-50'>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm font-medium text-gray-900'>
										{customer.name}
									</div>
									<div className='text-sm text-gray-500'>
										{customer.code} • {customer.document_number}
									</div>
									<div className='text-sm text-gray-500'>
										{customer.city}, {customer.country}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm text-gray-900'>
										{customer.contact_person}
									</div>
									<div className='text-sm text-gray-500'>
										{customer.contact_email}
									</div>
									<div className='text-sm text-gray-500'>
										{customer.contact_phone}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div className='space-y-1'>
									<Badge color={getSegmentColor(customer.segment)}>
										{customer.segment}
									</Badge>
									<div>
                                        <Badge
                                            color={getIndustryColor(customer.industry)}
                                            variant='outline'
                                            >
                                            {customer.industry}
                                        </Badge>
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div className='flex items-center space-x-2'>
									<div className='text-sm'>
										<div className='font-semibold text-gray-900'>
											{customer.loyalty_score}/100
										</div>
										<Badge
											color={getLoyaltyColor(customer.loyalty_score)}
											>
											{getLoyaltyLevel(customer.loyalty_score)}
										</Badge>
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
								<div>
									<div className='font-medium'>
										{formatCurrency(customer.total_sales)}
									</div>
									<div className='text-gray-500'>
										{customer.orders_count} órdenes
									</div>
									<div className='text-gray-500'>
										Desde {formatDate(customer.customer_since)}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={customer.is_active ? 'emerald' : 'red'}>
									{customer.is_active ? 'Activo' : 'Inactivo'}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
								<div className='flex space-x-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleViewCustomer(customer)}
										className='text-blue-600 hover:text-blue-900'>
										<Icon icon='HeroEye' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleEditCustomer(customer)}
										className='text-indigo-600 hover:text-indigo-900'>
										<Icon icon='HeroPencilSquare' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleDeleteCustomer(customer)}
										isDisable={customer.orders_count > 0}
										className={`${
											customer.orders_count > 0
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
		<PageWrapper name='clientes-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
							<Icon
								icon='HeroUserGroup'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Clientes
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de clientes y análisis comercial
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' onClick={handleCreateCustomer} icon='HeroPlus'>
						Nuevo Cliente
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
								<Icon icon='HeroUserGroup' className='h-6 w-6 text-blue-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Clientes
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_customers}
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
									Activos
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.active_customers}
									</p>
									<Badge color='emerald'>
										{Math.round(
											(stats.active_customers / stats.total_customers) * 100,
										)}
										%
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20'>
								<Icon icon='HeroHeart' className='h-6 w-6 text-violet-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Fidelidad Promedio
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.avg_loyalty_score.toFixed(1)}
									</p>
									<Badge color={getLoyaltyColor(stats.avg_loyalty_score)}>
										{getLoyaltyLevel(stats.avg_loyalty_score)}
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
									Ventas Totales
								</p>
								<p className='text-lg font-bold text-gray-900 dark:text-white'>
									{formatCurrency(stats.total_sales)}
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
									placeholder='Nombre, código, documento...'
									value={filters.search || ''}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Segmento
								</label>
								<SelectReact
									name='segment'
									options={segmentOptions}
									value={segmentOptions.find(
										(option) => option.value === filters.segment,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('segment', option?.value || undefined);
									}}
									placeholder='Seleccionar segmento...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Industria
								</label>
								<SelectReact
									name='industry'
									options={industryOptions}
									value={industryOptions.find(
										(option) => option.value === filters.industry,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('industry', option?.value || undefined);
									}}
									placeholder='Seleccionar industria...'
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

				{/* Tabla de Clientes */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Clientes</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{customers.length} clientes
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						{loading ? (
							<div className='flex items-center justify-center py-12'>
								<Icon
									icon='HeroArrowPath'
									className='h-8 w-8 animate-spin text-blue-600'
								/>
								<span className='ml-2 text-gray-600'>Cargando clientes...</span>
							</div>
						) : (
							<CustomersTable />
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal de Vista de Cliente */}
			<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='2xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
							<Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								Detalles del Cliente
							</h2>
							<p className='text-sm text-gray-600'>Información completa y métricas</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedCustomer && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='space-y-4'>
									<div>
										<h3 className='mb-2 text-lg font-bold text-gray-900'>
											{selectedCustomer.name}
										</h3>
										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Código:
												</span>
												<span className='font-mono'>
													{selectedCustomer.code}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Documento:
												</span>
												<span>
													{selectedCustomer.document_type}{' '}
													{selectedCustomer.document_number}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Email:
												</span>
												<span>{selectedCustomer.email}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Teléfono:
												</span>
												<span>{selectedCustomer.phone}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Dirección:
												</span>
												<span>{selectedCustomer.address}</span>
											</div>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<div className='space-y-2'>
										<div className='flex flex-wrap gap-2'>
											<Badge
												color={getSegmentColor(selectedCustomer.segment)}>
												{selectedCustomer.segment}
											</Badge>
											<Badge
												color={getIndustryColor(selectedCustomer.industry)}>
												{selectedCustomer.industry}
											</Badge>
											<Badge
												color={
													selectedCustomer.is_active ? 'emerald' : 'red'
												}>
												{selectedCustomer.is_active ? 'Activo' : 'Inactivo'}
											</Badge>
											<Badge
												color={getLoyaltyColor(
													selectedCustomer.loyalty_score,
												)}>
												Fidelidad: {selectedCustomer.loyalty_score}/100
											</Badge>
										</div>

										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Términos de Pago:
												</span>
												<span>{selectedCustomer.payment_terms} días</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Límite de Crédito:
												</span>
												<span>
													{formatCurrency(selectedCustomer.credit_limit)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Total Ventas:
												</span>
												<span>
													{formatCurrency(selectedCustomer.total_sales)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Cliente Desde:
												</span>
												<span>
													{formatDate(selectedCustomer.customer_since)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className='border-t pt-4'>
								<h4 className='mb-2 font-medium text-gray-700'>
									Contacto Principal
								</h4>
								<div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
									<div>
										<span className='font-medium text-gray-700'>Nombre:</span>
										<p>{selectedCustomer.contact_person}</p>
									</div>
									<div>
										<span className='font-medium text-gray-700'>Email:</span>
										<p>{selectedCustomer.contact_email}</p>
									</div>
									<div>
										<span className='font-medium text-gray-700'>Teléfono:</span>
										<p>{selectedCustomer.contact_phone}</p>
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
								setViewModalOpen(false);
								setSelectedCustomer(null);
							}}>
							Cerrar
						</Button>
						{selectedCustomer && (
							<Button
								color='blue'
								onClick={() => {
									setViewModalOpen(false);
									handleEditCustomer(selectedCustomer);
								}}>
								Editar Cliente
							</Button>
						)}
					</div>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
};

export default Clientes;
