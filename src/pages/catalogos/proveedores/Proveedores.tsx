/**
 * Sistema de Gestión de Proveedores
 * CRUD completo con datos de contacto y condiciones comerciales
 */
import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardBody, CardTitle, CardFooter } from '../../../components/ui/Card';
import Container from '../../../components/layouts/Container/Container';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../../components/layouts/Subheader/Subheader';
import Icon from '../../../components/icon/Icon';
import Input from '../../../components/form/Input';
import SelectReact from '../../../components/form/SelectReact';
import Select from '../../../components/form/Select';
import Textarea from '../../../components/form/Textarea';
import Checkbox from '../../../components/form/Checkbox';
import Label from '../../../components/form/Label';
import Badge from '../../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../components/ui/Modal';
import { TSelectOption, TSelectOptions } from '../../../components/form/SelectReact';

// Interfaces para Proveedores
interface ISupplier {
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
	payment_terms: number; // días
	credit_limit: number;
	category: string;
	rating: number; // 1-5 estrellas
	is_active: boolean;
	created_at: string;
	updated_at: string;
	products_count: number;
	orders_count: number;
	total_purchases: number;
}

interface ISupplierFilters {
	search: string;
	category?: string;
	city?: string;
	rating?: number;
	is_active?: boolean;
}

interface ISupplierStats {
	total_suppliers: number;
	active_suppliers: number;
	inactive_suppliers: number;
	total_purchases: number;
	avg_rating: number;
	top_category: string;
}

const Proveedores: React.FC = () => {
	// Estados principales
	const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
	const [loading, setLoading] = useState(false);

	// Estados para filtros
	const [filters, setFilters] = useState<ISupplierFilters>({
		search: '',
		category: undefined,
		city: undefined,
		rating: undefined,
		is_active: undefined,
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<ISupplierStats>({
		total_suppliers: 0,
		active_suppliers: 0,
		inactive_suppliers: 0,
		total_purchases: 0,
		avg_rating: 0,
		top_category: '',
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);

	// Opciones para filtros
	const categoryOptions: TSelectOptions = [
		{ value: '', label: 'Todas las categorías' },
		{ value: 'TECNOLOGIA', label: 'Tecnología' },
		{ value: 'OFICINA', label: 'Oficina' },
		{ value: 'SERVICIOS', label: 'Servicios' },
		{ value: 'INSUMOS', label: 'Insumos' },
	];

	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'true', label: 'Activo' },
		{ value: 'false', label: 'Inactivo' },
	];

	const ratingOptions: TSelectOptions = [
		{ value: '', label: 'Todas las calificaciones' },
		{ value: '5', label: '5 Estrellas' },
		{ value: '4', label: '4 Estrellas' },
		{ value: '3', label: '3 Estrellas' },
		{ value: '2', label: '2 Estrellas' },
		{ value: '1', label: '1 Estrella' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadSuppliers();
		loadStats();
	}, [filters]);

	const loadSuppliers = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			const mockSuppliers: ISupplier[] = [
				{
					id: 1,
					company_id: 1,
					name: 'TechDistribution S.A.S',
					code: 'TECH-001',
					document_type: 'NIT',
					document_number: '900123456-3',
					email: 'ventas@techd.com',
					phone: '+57 1 234-5678',
					address: 'Calle 72 #10-34',
					city: 'Bogotá',
					country: 'Colombia',
					website: 'www.techd.com',
					contact_person: 'Carlos Mendoza',
					contact_email: 'carlos.mendoza@techd.com',
					contact_phone: '+57 300 123-4567',
					payment_terms: 30,
					credit_limit: 50000000,
					category: 'TECNOLOGIA',
					rating: 5,
					is_active: true,
					created_at: '2024-01-05T10:00:00Z',
					updated_at: '2024-01-05T10:00:00Z',
					products_count: 89,
					orders_count: 156,
					total_purchases: 125600000,
				},
				{
					id: 2,
					company_id: 1,
					name: 'Office Solutions Ltda',
					code: 'OFF-002',
					document_type: 'NIT',
					document_number: '800987654-1',
					email: 'info@officesolutions.co',
					phone: '+57 1 987-6543',
					address: 'Carrera 15 #93-47',
					city: 'Bogotá',
					country: 'Colombia',
					website: 'www.officesolutions.co',
					contact_person: 'María Rodriguez',
					contact_email: 'maria.rodriguez@officesolutions.co',
					contact_phone: '+57 310 987-6543',
					payment_terms: 15,
					credit_limit: 25000000,
					category: 'OFICINA',
					rating: 4,
					is_active: true,
					created_at: '2024-01-08T14:30:00Z',
					updated_at: '2024-01-08T14:30:00Z',
					products_count: 67,
					orders_count: 98,
					total_purchases: 89400000,
				},
				{
					id: 3,
					company_id: 1,
					name: 'Global Supplies Inc',
					code: 'GLB-003',
					document_type: 'NIT',
					document_number: '900456789-2',
					email: 'sales@globalsupplies.com',
					phone: '+57 1 456-7890',
					address: 'Zona Franca Bogotá',
					city: 'Bogotá',
					country: 'Colombia',
					website: 'www.globalsupplies.com',
					contact_person: 'John Anderson',
					contact_email: 'john.anderson@globalsupplies.com',
					contact_phone: '+57 320 456-7890',
					payment_terms: 45,
					credit_limit: 75000000,
					category: 'INSUMOS',
					rating: 4,
					is_active: true,
					created_at: '2024-01-12T09:15:00Z',
					updated_at: '2024-01-12T09:15:00Z',
					products_count: 234,
					orders_count: 87,
					total_purchases: 198700000,
				},
				{
					id: 4,
					company_id: 1,
					name: 'Servicios Técnicos Pro',
					code: 'SRV-004',
					document_type: 'NIT',
					document_number: '800654321-5',
					email: 'contacto@sertecpro.co',
					phone: '+57 1 654-3210',
					address: 'Calle 127 #19-32',
					city: 'Medellín',
					country: 'Colombia',
					contact_person: 'Luis Gutierrez',
					contact_email: 'luis.gutierrez@sertecpro.co',
					contact_phone: '+57 315 654-3210',
					payment_terms: 20,
					credit_limit: 15000000,
					category: 'SERVICIOS',
					rating: 3,
					is_active: false,
					created_at: '2024-01-20T16:45:00Z',
					updated_at: '2024-01-20T16:45:00Z',
					products_count: 12,
					orders_count: 23,
					total_purchases: 34500000,
				},
				{
					id: 5,
					company_id: 1,
					name: 'Proveedor Eliminable Test',
					code: 'ELIM-005',
					document_type: 'NIT',
					document_number: '900777888-1',
					email: 'test@eliminable.co',
					phone: '+57 1 777-8888',
					address: 'Calle 60 #25-30',
					city: 'Bogotá',
					country: 'Colombia',
					website: 'www.eliminable.co',
					contact_person: 'Pedro Martínez',
					contact_email: 'pedro.martinez@eliminable.co',
					contact_phone: '+57 300 777-8888',
					payment_terms: 30,
					credit_limit: 5000000,
					category: 'OFICINA',
					rating: 4,
					is_active: true,
					created_at: '2024-01-25T12:00:00Z',
					updated_at: '2024-01-25T12:00:00Z',
					products_count: 0,
					orders_count: 0,
					total_purchases: 0,
				},
			];

			setSuppliers(mockSuppliers);
		} catch (error) {
			console.error('Error loading suppliers:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: ISupplierStats = {
				total_suppliers: 5,
				active_suppliers: 4,
				inactive_suppliers: 1,
				total_purchases: 448200000,
				avg_rating: 4.0,
				top_category: 'Tecnología',
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof ISupplierFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			category: undefined,
			city: undefined,
			rating: undefined,
			is_active: undefined,
		});
	};

	// Handlers para proveedores
	const handleCreateSupplier = () => {
		setCreateModalOpen(true);
	};

	const handleEditSupplier = (supplier: ISupplier) => {
		setSelectedSupplier(supplier);
		setEditModalOpen(true);
	};

	const handleViewSupplier = (supplier: ISupplier) => {
		setSelectedSupplier(supplier);
		setViewModalOpen(true);
	};

	const handleDeleteSupplier = (supplier: ISupplier) => {
		setSelectedSupplier(supplier);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedSupplier) return;

		// Validar si el proveedor puede ser eliminado
		if (selectedSupplier.products_count > 0 || selectedSupplier.orders_count > 0) {
			alert(
				`No se puede eliminar el proveedor "${selectedSupplier.name}" porque tiene ${selectedSupplier.products_count} productos y ${selectedSupplier.orders_count} órdenes asociadas.`,
			);
			return;
		}

		try {
			console.log('Deleting supplier:', selectedSupplier.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedSupplier(null);
			await Promise.all([loadSuppliers(), loadStats()]);
		} catch (error) {
			console.error('Error deleting supplier:', error);
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

	const getRatingStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, index) => (
			<Icon
				key={index}
				icon={index < rating ? 'HeroStar' : 'HeroStarOutline'}
				className={`h-4 w-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
			/>
		));
	};

	const getCategoryBadgeColor = (category: string) => {
		switch (category) {
			case 'TECNOLOGIA':
				return 'sky';
			case 'OFICINA':
				return 'emerald';
			case 'SERVICIOS':
				return 'violet';
			case 'INSUMOS':
				return 'amber';
			default:
				return 'gray';
		}
	};

	// Tabla de proveedores
	const SuppliersTable = () => (
		<div className='overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Proveedor
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Contacto
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Categoría
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Rating
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Compras
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
					{suppliers.map((supplier) => (
						<tr key={supplier.id} className='hover:bg-gray-50'>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm font-medium text-gray-900'>
										{supplier.name}
									</div>
									<div className='text-sm text-gray-500'>
										{supplier.code} • {supplier.document_number}
									</div>
									<div className='text-sm text-gray-500'>
										{supplier.city}, {supplier.country}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div>
									<div className='text-sm text-gray-900'>
										{supplier.contact_person}
									</div>
									<div className='text-sm text-gray-500'>
										{supplier.contact_email}
									</div>
									<div className='text-sm text-gray-500'>
										{supplier.contact_phone}
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={getCategoryBadgeColor(supplier.category)}>
									{supplier.category}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<div className='flex items-center space-x-1'>
									{getRatingStars(supplier.rating)}
									<span className='ml-2 text-sm text-gray-500'>
										({supplier.rating}/5)
									</span>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
								<div>
									<div className='font-medium'>
										{formatCurrency(supplier.total_purchases)}
									</div>
									<div className='text-gray-500'>
										{supplier.orders_count} órdenes
									</div>
									<div className='text-gray-500'>
										{supplier.products_count} productos
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={supplier.is_active ? 'emerald' : 'red'}>
									{supplier.is_active ? 'Activo' : 'Inactivo'}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
								<div className='flex space-x-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleViewSupplier(supplier)}
										className='text-blue-600 hover:text-blue-900'>
										<Icon icon='HeroEye' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleEditSupplier(supplier)}
										className='text-indigo-600 hover:text-indigo-900'>
										<Icon icon='HeroPencilSquare' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleDeleteSupplier(supplier)}
										isDisable={supplier.orders_count > 0}
										className={`${
											supplier.orders_count > 0
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
		<PageWrapper name='proveedores-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
							<Icon
								icon='HeroTruck'
								className='h-6 w-6 text-orange-600 dark:text-orange-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Proveedores
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de proveedores y condiciones comerciales
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='amber' onClick={handleCreateSupplier} icon='HeroPlus'>
						Nuevo Proveedor
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
								<Icon icon='HeroTruck' className='h-6 w-6 text-orange-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Proveedores
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_suppliers}
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
										{stats.active_suppliers}
									</p>
									<Badge color='emerald'>
										{Math.round(
											(stats.active_suppliers / stats.total_suppliers) * 100,
										)}
										%
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20'>
								<Icon icon='HeroStar' className='h-6 w-6 text-yellow-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Rating Promedio
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.avg_rating.toFixed(1)}
									</p>
									<div className='flex items-center'>
										{getRatingStars(Math.round(stats.avg_rating))}
									</div>
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
									Compras Totales
								</p>
								<p className='text-lg font-bold text-gray-900 dark:text-white'>
									{formatCurrency(stats.total_purchases)}
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
								<Label htmlFor='filter-search'>Buscar</Label>
								<Input
									id='filter-search'
									name='search'
									placeholder='Nombre, código, documento...'
									value={filters.search || ''}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<Label htmlFor='filter-category'>Categoría</Label>
								<SelectReact
									name='category'
									options={categoryOptions}
									value={categoryOptions.find(
										(option) => option.value === filters.category,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('category', option?.value || undefined);
									}}
									placeholder='Seleccionar categoría...'
								/>
							</div>

							<div>
								<Label htmlFor='filter-rating'>Calificación</Label>
								<SelectReact
									name='rating'
									options={ratingOptions}
									value={ratingOptions.find(
										(option) => option.value === filters.rating?.toString(),
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'rating',
											option?.value ? parseInt(option.value) : undefined,
										);
									}}
									placeholder='Seleccionar rating...'
								/>
							</div>

							<div>
								<Label htmlFor='filter-status'>Estado</Label>
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
					<CardFooter className='flex justify-end'>
						<Button
							variant='outline'
							onClick={clearFilters}
							icon='HeroArrowPath'
							className='w-full md:w-auto'>
							Limpiar filtros
						</Button>
					</CardFooter>
				</Card>

				{/* Tabla de Proveedores */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Proveedores</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{suppliers.length} proveedores
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						{loading ? (
							<div className='flex items-center justify-center py-12'>
								<Icon
									icon='HeroArrowPath'
									className='h-8 w-8 animate-spin text-orange-600'
								/>
								<span className='ml-2 text-gray-600'>Cargando proveedores...</span>
							</div>
						) : (
							<SuppliersTable />
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal para crear proveedor */}
			<Modal isOpen={createModalOpen} setIsOpen={setCreateModalOpen} size='xl'>
				<ModalHeader>
					<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
						Crear Nuevo Proveedor
					</h3>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4'>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='create-name'>Nombre de la Empresa *</Label>
								<Input
									id='create-name'
									name='name'
									placeholder='Nombre de la empresa'
									required
								/>
							</div>
							<div>
								<Label htmlFor='create-code'>Código *</Label>
								<Input
									id='create-code'
									name='code'
									placeholder='Código del proveedor'
									required
								/>
							</div>
						</div>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='create-document-type'>Tipo de Documento *</Label>
								<Select id='create-document-type' name='document_type'>
									<option value='NIT'>NIT</option>
									<option value='CC'>Cédula de Ciudadanía</option>
									<option value='CE'>Cédula de Extranjería</option>
								</Select>
							</div>
							<div>
								<Label htmlFor='create-document-number'>
									Número de Documento *
								</Label>
								<Input
									id='create-document-number'
									name='document_number'
									placeholder='Número de documento'
									required
								/>
							</div>
						</div>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='create-email'>Email *</Label>
								<Input
									id='create-email'
									name='email'
									type='email'
									placeholder='email@empresa.com'
									required
								/>
							</div>
							<div>
								<Label htmlFor='create-phone'>Teléfono *</Label>
								<Input
									id='create-phone'
									name='phone'
									placeholder='+57 1 234-5678'
									required
								/>
							</div>
						</div>
						<div>
							<Label htmlFor='create-address'>Dirección *</Label>
							<Textarea
								id='create-address'
								name='address'
								placeholder='Dirección completa'
								rows={2}
								required
							/>
						</div>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='create-city'>Ciudad *</Label>
								<Input id='create-city' name='city' placeholder='Ciudad' required />
							</div>
							<div>
								<Label htmlFor='create-category'>Categoría *</Label>
								<Select id='create-category' name='category'>
									<option value='TECNOLOGIA'>Tecnología</option>
									<option value='OFICINA'>Oficina</option>
									<option value='SERVICIOS'>Servicios</option>
									<option value='INSUMOS'>Insumos</option>
								</Select>
							</div>
						</div>
						<div>
							<h4 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
								Contacto Principal
							</h4>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								<div>
									<Label htmlFor='create-contact-person' className='text-xs'>
										Nombre *
									</Label>
									<Input
										id='create-contact-person'
										name='contact_person'
										placeholder='Nombre del contacto'
										required
									/>
								</div>
								<div>
									<Label htmlFor='create-contact-email' className='text-xs'>
										Email *
									</Label>
									<Input
										id='create-contact-email'
										name='contact_email'
										type='email'
										placeholder='contacto@empresa.com'
										required
									/>
								</div>
								<div>
									<Label htmlFor='create-contact-phone' className='text-xs'>
										Teléfono *
									</Label>
									<Input
										id='create-contact-phone'
										name='contact_phone'
										placeholder='+57 300 123-4567'
										required
									/>
								</div>
							</div>
						</div>
						<div>
							<Checkbox
								id='create-is-active'
								name='is_active'
								defaultChecked={true}
								label='Proveedor activo'
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button variant='outline' onClick={() => setCreateModalOpen(false)}>
							Cancelar
						</Button>
						<Button
							color='amber'
							onClick={() => {
								alert('Proveedor creado exitosamente (simulado)');
								setCreateModalOpen(false);
							}}>
							Crear Proveedor
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal para editar proveedor */}
			<Modal isOpen={editModalOpen} setIsOpen={setEditModalOpen} size='xl'>
				<ModalHeader>
					<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
						Editar Proveedor
					</h3>
				</ModalHeader>
				<ModalBody>
					{selectedSupplier && (
						<div className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='edit-name'>Nombre de la Empresa *</Label>
									<Input
										id='edit-name'
										name='name'
										defaultValue={selectedSupplier.name}
									/>
								</div>
								<div>
									<Label htmlFor='edit-code'>Código *</Label>
									<Input
										id='edit-code'
										name='code'
										defaultValue={selectedSupplier.code}
									/>
								</div>
							</div>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='edit-email'>Email *</Label>
									<Input
										id='edit-email'
										name='email'
										type='email'
										defaultValue={selectedSupplier.email}
									/>
								</div>
								<div>
									<Label htmlFor='edit-phone'>Teléfono *</Label>
									<Input
										id='edit-phone'
										name='phone'
										defaultValue={selectedSupplier.phone}
									/>
								</div>
							</div>
							<div>
								<Label htmlFor='edit-address'>Dirección *</Label>
								<Textarea
									id='edit-address'
									name='address'
									defaultValue={selectedSupplier.address}
									rows={2}
								/>
							</div>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='edit-city'>Ciudad *</Label>
									<Input
										id='edit-city'
										name='city'
										defaultValue={selectedSupplier.city}
									/>
								</div>
								<div>
									<Label htmlFor='edit-category'>Categoría *</Label>
									<Select
										id='edit-category'
										name='category'
										defaultValue={selectedSupplier.category}>
										<option value='TECNOLOGIA'>Tecnología</option>
										<option value='OFICINA'>Oficina</option>
										<option value='SERVICIOS'>Servicios</option>
										<option value='INSUMOS'>Insumos</option>
									</Select>
								</div>
							</div>
							<div>
								<h4 className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
									Contacto Principal
								</h4>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<div>
										<Label htmlFor='edit-contact-person' className='text-xs'>
											Nombre *
										</Label>
										<Input
											id='edit-contact-person'
											name='contact_person'
											defaultValue={selectedSupplier.contact_person}
										/>
									</div>
									<div>
										<Label htmlFor='edit-contact-email' className='text-xs'>
											Email *
										</Label>
										<Input
											id='edit-contact-email'
											name='contact_email'
											type='email'
											defaultValue={selectedSupplier.contact_email}
										/>
									</div>
									<div>
										<Label htmlFor='edit-contact-phone' className='text-xs'>
											Teléfono *
										</Label>
										<Input
											id='edit-contact-phone'
											name='contact_phone'
											defaultValue={selectedSupplier.contact_phone}
										/>
									</div>
								</div>
							</div>
							<div>
								<Checkbox
									id='edit-is-active'
									name='is_active'
									defaultChecked={selectedSupplier.is_active}
									label='Proveedor activo'
								/>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button
							variant='outline'
							onClick={() => {
								setEditModalOpen(false);
								setSelectedSupplier(null);
							}}>
							Cancelar
						</Button>
						<Button
							color='amber'
							onClick={() => {
								alert('Proveedor actualizado exitosamente (simulado)');
								setEditModalOpen(false);
								setSelectedSupplier(null);
							}}>
							Actualizar Proveedor
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal para ver detalles del proveedor */}
			<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
							<Icon icon='HeroEye' className='h-6 w-6 text-orange-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								Detalles del Proveedor
							</h2>
							<p className='text-sm text-gray-600'>Información completa</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedSupplier && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='space-y-4'>
									<div>
										<h3 className='mb-2 text-lg font-bold text-gray-900'>
											{selectedSupplier.name}
										</h3>
										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Código:
												</span>
												<span className='font-mono'>
													{selectedSupplier.code}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Documento:
												</span>
												<span>
													{selectedSupplier.document_type}{' '}
													{selectedSupplier.document_number}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Email:
												</span>
												<span>{selectedSupplier.email}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Teléfono:
												</span>
												<span>{selectedSupplier.phone}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Dirección:
												</span>
												<span>{selectedSupplier.address}</span>
											</div>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<div className='space-y-2'>
										<div className='flex flex-wrap gap-2'>
											<Badge
												color={getCategoryBadgeColor(
													selectedSupplier.category,
												)}>
												{selectedSupplier.category}
											</Badge>
											<Badge
												color={
													selectedSupplier.is_active ? 'emerald' : 'red'
												}>
												{selectedSupplier.is_active ? 'Activo' : 'Inactivo'}
											</Badge>
										</div>

										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Rating:
												</span>
												<div className='flex items-center space-x-1'>
													{getRatingStars(selectedSupplier.rating)}
													<span>({selectedSupplier.rating}/5)</span>
												</div>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Términos de Pago:
												</span>
												<span>{selectedSupplier.payment_terms} días</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Límite de Crédito:
												</span>
												<span>
													{formatCurrency(selectedSupplier.credit_limit)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Total Compras:
												</span>
												<span>
													{formatCurrency(
														selectedSupplier.total_purchases,
													)}
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
										<p>{selectedSupplier.contact_person}</p>
									</div>
									<div>
										<span className='font-medium text-gray-700'>Email:</span>
										<p>{selectedSupplier.contact_email}</p>
									</div>
									<div>
										<span className='font-medium text-gray-700'>Teléfono:</span>
										<p>{selectedSupplier.contact_phone}</p>
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
								setSelectedSupplier(null);
							}}>
							Cerrar
						</Button>
						{selectedSupplier && (
							<Button
								color='amber'
								onClick={() => {
									setViewModalOpen(false);
									handleEditSupplier(selectedSupplier);
								}}>
								Editar Proveedor
							</Button>
						)}
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal para confirmar eliminación */}
			<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} size='sm'>
				<ModalHeader>
					<h3 className='text-lg font-semibold text-red-600'>Confirmar Eliminación</h3>
				</ModalHeader>
				<ModalBody>
					{selectedSupplier && (
						<div className='space-y-4'>
							<p className='text-gray-700 dark:text-gray-300'>
								¿Estás seguro de que deseas eliminar el proveedor{' '}
								<strong>"{selectedSupplier.name}"</strong>?
							</p>

							{(selectedSupplier.products_count > 0 ||
								selectedSupplier.orders_count > 0) && (
								<div className='rounded-md border border-red-200 bg-red-50 p-3'>
									<div className='flex items-start'>
										<Icon
											icon='HeroExclamationTriangle'
											className='mr-2 mt-0.5 h-5 w-5 text-red-400'
										/>
										<div>
											<h4 className='mb-1 text-sm font-medium text-red-800'>
												No se puede eliminar
											</h4>
											<p className='text-sm text-red-700'>
												Este proveedor tiene{' '}
												<strong>
													{selectedSupplier.products_count} productos
												</strong>{' '}
												y{' '}
												<strong>
													{selectedSupplier.orders_count} órdenes
												</strong>{' '}
												asociadas.
											</p>
										</div>
									</div>
								</div>
							)}

							{selectedSupplier.products_count === 0 &&
								selectedSupplier.orders_count === 0 && (
									<div className='rounded-md border border-yellow-200 bg-yellow-50 p-3'>
										<div className='flex items-start'>
											<Icon
												icon='HeroExclamationTriangle'
												className='mr-2 mt-0.5 h-5 w-5 text-yellow-400'
											/>
											<div>
												<h4 className='mb-1 text-sm font-medium text-yellow-800'>
													Acción irreversible
												</h4>
												<p className='text-sm text-yellow-700'>
													Esta acción no se puede deshacer. El proveedor
													será eliminado permanentemente.
												</p>
											</div>
										</div>
									</div>
								)}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button
							variant='outline'
							onClick={() => {
								setDeleteModalOpen(false);
								setSelectedSupplier(null);
							}}>
							Cancelar
						</Button>
						{selectedSupplier &&
							selectedSupplier.products_count === 0 &&
							selectedSupplier.orders_count === 0 && (
								<Button color='red' onClick={handleConfirmDelete}>
									Eliminar Proveedor
								</Button>
							)}
					</div>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
};

export default Proveedores;
