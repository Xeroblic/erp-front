import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import React, { useState, useEffect } from 'react';

// Interfaces
interface IBrand {
	id: number;
	company_id: number;
	code: string;
	name: string;
	description: string;
	logo_url: string | null;
	website_url: string | null;
	origin_country: string;
	manufacturer: string;
	quality_rating: number; // 1-5 stars
	market_position: 'PREMIUM' | 'MEDIO' | 'ECONOMICO';
	category_focus: string;
	is_active: boolean;
	is_exclusive: boolean; // exclusive to this store
	margin_percentage: number;
	created_at: string;
	updated_at: string;
	products_count: number;
	total_sales: number;
	avg_price: number;
}

interface IBrandFilters {
	search: string;
	market_position?: string;
	origin_country?: string;
	is_active?: boolean;
	is_exclusive?: boolean;
	quality_rating_min?: number;
}

interface IBrandStats {
	total_brands: number;
	active_brands: number;
	exclusive_brands: number;
	avg_quality_rating: number;
	total_products: number;
	total_sales: number;
}

const Marcas: React.FC = () => {
	// Estados principales
	const [brands, setBrands] = useState<IBrand[]>([]);
	const [loading, setLoading] = useState(false);

	// Estados para filtros
	const [filters, setFilters] = useState<IBrandFilters>({
		search: '',
		market_position: undefined,
		origin_country: undefined,
		is_active: undefined,
		is_exclusive: undefined,
		quality_rating_min: undefined,
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<IBrandStats>({
		total_brands: 0,
		active_brands: 0,
		exclusive_brands: 0,
		avg_quality_rating: 0,
		total_products: 0,
		total_sales: 0,
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedBrand, setSelectedBrand] = useState<IBrand | null>(null);

	// Cargar datos iniciales
	useEffect(() => {
		loadBrands();
		loadStats();
	}, [filters]);

	const loadBrands = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			const mockBrands: IBrand[] = [
				{
					id: 1,
					company_id: 1,
					code: 'BR-SAM-001',
					name: 'Samsung',
					description: 'Líder mundial en tecnología y electrónicos',
					logo_url: '/logos/samsung.png',
					website_url: 'https://www.samsung.com',
					origin_country: 'Corea del Sur',
					manufacturer: 'Samsung Electronics',
					quality_rating: 4.7,
					market_position: 'PREMIUM',
					category_focus: 'Electrónicos, Tecnología',
					is_active: true,
					is_exclusive: false,
					margin_percentage: 35,
					created_at: '2023-01-10T08:00:00Z',
					updated_at: '2024-01-15T14:30:00Z',
					products_count: 45,
					total_sales: 1200000000,
					avg_price: 850000,
				},
				{
					id: 2,
					company_id: 1,
					code: 'BR-APP-002',
					name: 'Apple',
					description: 'Innovación en dispositivos y servicios digitales',
					logo_url: '/logos/apple.png',
					website_url: 'https://www.apple.com',
					origin_country: 'Estados Unidos',
					manufacturer: 'Apple Inc.',
					quality_rating: 4.9,
					market_position: 'PREMIUM',
					category_focus: 'Smartphones, Computadoras, Accesorios',
					is_active: true,
					is_exclusive: true,
					margin_percentage: 42,
					created_at: '2023-01-12T09:15:00Z',
					updated_at: '2024-01-18T11:20:00Z',
					products_count: 28,
					total_sales: 950000000,
					avg_price: 1250000,
				},
				{
					id: 3,
					company_id: 1,
					code: 'BR-SON-003',
					name: 'Sony',
					description: 'Entretenimiento y tecnología de vanguardia',
					logo_url: '/logos/sony.png',
					website_url: 'https://www.sony.com',
					origin_country: 'Japón',
					manufacturer: 'Sony Corporation',
					quality_rating: 4.5,
					market_position: 'PREMIUM',
					category_focus: 'Audio, Video, Gaming',
					is_active: true,
					is_exclusive: false,
					margin_percentage: 38,
					created_at: '2023-02-05T10:30:00Z',
					updated_at: '2024-01-20T16:45:00Z',
					products_count: 32,
					total_sales: 680000000,
					avg_price: 720000,
				},
				{
					id: 4,
					company_id: 1,
					code: 'BR-LEN-004',
					name: 'Lenovo',
					description: 'Soluciones inteligentes para negocios y consumidores',
					logo_url: '/logos/lenovo.png',
					website_url: 'https://www.lenovo.com',
					origin_country: 'China',
					manufacturer: 'Lenovo Group',
					quality_rating: 4.2,
					market_position: 'MEDIO',
					category_focus: 'Computadoras, Servidores',
					is_active: true,
					is_exclusive: false,
					margin_percentage: 28,
					created_at: '2023-02-20T11:45:00Z',
					updated_at: '2024-01-12T09:30:00Z',
					products_count: 38,
					total_sales: 420000000,
					avg_price: 580000,
				},
				{
					id: 5,
					company_id: 1,
					code: 'BR-XIA-005',
					name: 'Xiaomi',
					description: 'Tecnología accesible para todos',
					logo_url: '/logos/xiaomi.png',
					website_url: 'https://www.mi.com',
					origin_country: 'China',
					manufacturer: 'Xiaomi Corporation',
					quality_rating: 4.3,
					market_position: 'MEDIO',
					category_focus: 'Smartphones, Smart Home, Accesorios',
					is_active: true,
					is_exclusive: true,
					margin_percentage: 32,
					created_at: '2023-03-15T13:20:00Z',
					updated_at: '2024-01-08T15:10:00Z',
					products_count: 52,
					total_sales: 380000000,
					avg_price: 320000,
				},
				{
					id: 6,
					company_id: 1,
					code: 'BR-GEN-006',
					name: 'Genérica Plus',
					description: 'Productos de calidad a precios competitivos',
					logo_url: '/logos/generica.png',
					website_url: null,
					origin_country: 'Colombia',
					manufacturer: 'Manufacturas Colombia SAS',
					quality_rating: 3.8,
					market_position: 'ECONOMICO',
					category_focus: 'Accesorios, Cables, Protectores',
					is_active: true,
					is_exclusive: false,
					margin_percentage: 45,
					created_at: '2023-04-10T14:15:00Z',
					updated_at: '2024-01-05T10:20:00Z',
					products_count: 85,
					total_sales: 180000000,
					avg_price: 45000,
				},
				{
					id: 7,
					company_id: 1,
					code: 'BR-OLD-007',
					name: 'TechVintage',
					description: 'Marca descontinuada - solo soporte',
					logo_url: null,
					website_url: null,
					origin_country: 'Estados Unidos',
					manufacturer: 'TechVintage LLC',
					quality_rating: 3.5,
					market_position: 'MEDIO',
					category_focus: 'Equipos Legacy',
					is_active: false,
					is_exclusive: false,
					margin_percentage: 15,
					created_at: '2022-08-20T16:00:00Z',
					updated_at: '2023-12-01T12:00:00Z',
					products_count: 8,
					total_sales: 25000000,
					avg_price: 180000,
				},
			];

			setBrands(mockBrands);
		} catch (error) {
			console.error('Error loading brands:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: IBrandStats = {
				total_brands: 7,
				active_brands: 6,
				exclusive_brands: 2,
				avg_quality_rating: 4.2,
				total_products: 288,
				total_sales: 3885000000,
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof IBrandFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			market_position: undefined,
			origin_country: undefined,
			is_active: undefined,
			is_exclusive: undefined,
			quality_rating_min: undefined,
		});
	};

	// Funciones de utilidad
	const getRatingStars = (rating: number) => {
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;
		const stars = [];

		for (let i = 0; i < fullStars; i++) {
			stars.push(<Icon key={i} icon='HeroStar' className='h-4 w-4 text-yellow-400' />);
		}
		if (hasHalfStar) {
			stars.push(<Icon key='half' icon='HeroStar' className='h-4 w-4 text-yellow-200' />);
		}
		const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
		for (let i = 0; i < remainingStars; i++) {
			stars.push(
				<Icon key={`empty-${i}`} icon='HeroStar' className='h-4 w-4 text-gray-300' />,
			);
		}
		return stars;
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(value);
	};

	// Handlers para marcas
	const handleCreateBrand = () => {
		setCreateModalOpen(true);
	};

	const handleViewBrand = (brand: IBrand) => {
		setSelectedBrand(brand);
		setViewModalOpen(true);
	};

	const handleEditBrand = (brand: IBrand) => {
		setSelectedBrand(brand);
		setEditModalOpen(true);
	};

	const handleDeleteBrand = (brand: IBrand) => {
		setSelectedBrand(brand);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedBrand) return;

		try {
			console.log('Deleting brand:', selectedBrand.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedBrand(null);
			await Promise.all([loadBrands(), loadStats()]);
		} catch (error) {
			console.error('Error deleting brand:', error);
		}
	};

	return (
		<PageWrapper name='marcas-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20'>
							<Icon
								icon='HeroTag'
								className='h-6 w-6 text-violet-600 dark:text-violet-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Marcas
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de marcas y análisis de rendimiento
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='violet' onClick={handleCreateBrand} icon='HeroPlus'>
						Nueva Marca
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20'>
								<Icon icon='HeroTag' className='h-6 w-6 text-violet-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Marcas
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_brands}
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
									Marcas Activas
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.active_brands}
								</p>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
								<Icon icon='HeroStar' className='h-6 w-6 text-amber-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Calidad Promedio
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.avg_quality_rating}/5.0
									</p>
									<div className='flex'>
										{getRatingStars(stats.avg_quality_rating)}
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
									Ventas Totales
								</p>
								<p className='text-lg font-bold text-gray-900 dark:text-white'>
									{formatCurrency(stats.total_sales)}
								</p>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Lista simple de marcas */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Marcas</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{brands.length} marcas
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						{loading ? (
							<div className='flex items-center justify-center py-12'>
								<Icon
									icon='HeroArrowPath'
									className='h-8 w-8 animate-spin text-violet-600'
								/>
								<span className='ml-2 text-gray-600'>Cargando marcas...</span>
							</div>
						) : (
							<div className='grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3'>
								{brands.map((brand) => (
									<div
										key={brand.id}
										className='rounded-lg border p-4 transition-shadow hover:shadow-md'>
										<div className='mb-3 flex items-center space-x-3'>
											{brand.logo_url ? (
												<img
													className='h-12 w-12 rounded-lg border bg-white object-contain'
													src={brand.logo_url}
													alt={brand.name}
												/>
											) : (
												<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200'>
													<Icon
														icon='HeroTag'
														className='h-6 w-6 text-gray-400'
													/>
												</div>
											)}
											<div className='flex-1'>
												<h3 className='font-medium text-gray-900'>
													{brand.name}
												</h3>
												<p className='font-mono text-sm text-gray-500'>
													{brand.code}
												</p>
											</div>
											<Badge color={brand.is_active ? 'emerald' : 'red'}>
												{brand.is_active ? 'Activa' : 'Inactiva'}
											</Badge>
										</div>

										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Origen:</span>
												<span className='font-medium'>
													{brand.origin_country}
												</span>
											</div>
											<div className='flex items-center justify-between'>
												<span className='text-gray-600'>Calidad:</span>
												<div className='flex items-center space-x-1'>
													<div className='flex'>
														{getRatingStars(brand.quality_rating)}
													</div>
													<span className='text-sm'>
														{brand.quality_rating}
													</span>
												</div>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Productos:</span>
												<span className='font-medium'>
													{brand.products_count}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Ventas:</span>
												<span className='font-medium text-green-600'>
													{formatCurrency(brand.total_sales)}
												</span>
											</div>
										</div>

										<div className='mt-4 flex space-x-2'>
											<Button
												size='sm'
												variant='outline'
												onClick={() => handleViewBrand(brand)}
												className='flex-1 text-blue-600 hover:text-blue-900'>
												<Icon icon='HeroEye' className='mr-1 h-4 w-4' />
												Ver
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() => handleEditBrand(brand)}
												className='flex-1 text-blue-600 hover:text-blue-900'>
												<Icon
													icon='HeroPencilSquare'
													className='mr-1 h-4 w-4'
												/>
												Editar
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() => handleDeleteBrand(brand)}
												isDisable={brand.products_count > 0}
												className={`flex-1 ${
													brand.products_count > 0
														? 'cursor-not-allowed text-gray-400'
														: 'text-red-600 hover:text-red-900'
												}`}>
												<Icon icon='HeroTrash' className='mr-1 h-4 w-4' />
												{brand.products_count > 0
													? 'Bloqueado'
													: 'Eliminar'}
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</CardBody>
				</Card>
			</Container>

			{/* Modal de Crear Marca */}
			<Modal isOpen={createModalOpen} setIsOpen={setCreateModalOpen} size='2xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-100'>
							<Icon icon='HeroPlus' className='h-6 w-6 text-violet-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>Nueva Marca</h2>
							<p className='text-sm text-gray-600'>
								Crear una nueva marca en el sistema
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4'>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Código
								</label>
								<input
									type='text'
									placeholder='BR-XXX-001'
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
								/>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Nombre
								</label>
								<input
									type='text'
									placeholder='Nombre de la marca'
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
								/>
							</div>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium text-gray-700'>
								Descripción
							</label>
							<textarea
								rows={3}
								placeholder='Descripción de la marca'
								className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
							/>
						</div>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									País de Origen
								</label>
								<input
									type='text'
									placeholder='Colombia'
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
								/>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Fabricante
								</label>
								<input
									type='text'
									placeholder='Nombre del fabricante'
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Posición de Mercado
								</label>
								<select className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'>
									<option value=''>Seleccionar...</option>
									<option value='PREMIUM'>Premium</option>
									<option value='MEDIO'>Medio</option>
									<option value='ECONOMICO'>Económico</option>
								</select>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Rating de Calidad
								</label>
								<input
									type='number'
									min='1'
									max='5'
									step='0.1'
									placeholder='4.5'
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
								/>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Margen (%)
								</label>
								<input
									type='number'
									min='0'
									max='100'
									placeholder='35'
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none'
								/>
							</div>
						</div>

						<div className='flex items-center space-x-4'>
							<label className='flex items-center'>
								<input type='checkbox' className='mr-2 rounded' />
								<span className='text-sm text-gray-700'>Marca activa</span>
							</label>
							<label className='flex items-center'>
								<input type='checkbox' className='mr-2 rounded' />
								<span className='text-sm text-gray-700'>Marca exclusiva</span>
							</label>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button variant='outline' onClick={() => setCreateModalOpen(false)}>
							Cancelar
						</Button>
						<Button
							color='violet'
							onClick={() => {
								// Aquí iría la lógica de creación
								console.log('Crear nueva marca');
								setCreateModalOpen(false);
							}}>
							Crear Marca
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Editar Marca */}
			<Modal isOpen={editModalOpen} setIsOpen={setEditModalOpen} size='2xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
							<Icon icon='HeroPencilSquare' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>Editar Marca</h2>
							<p className='text-sm text-gray-600'>
								Modificar información de la marca
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedBrand && (
						<div className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Código
									</label>
									<input
										type='text'
										defaultValue={selectedBrand.code}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
									/>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Nombre
									</label>
									<input
										type='text'
										defaultValue={selectedBrand.name}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
									/>
								</div>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Descripción
								</label>
								<textarea
									rows={3}
									defaultValue={selectedBrand.description}
									className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
								/>
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										País de Origen
									</label>
									<input
										type='text'
										defaultValue={selectedBrand.origin_country}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
									/>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Fabricante
									</label>
									<input
										type='text'
										defaultValue={selectedBrand.manufacturer}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Posición de Mercado
									</label>
									<select
										defaultValue={selectedBrand.market_position}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'>
										<option value='PREMIUM'>Premium</option>
										<option value='MEDIO'>Medio</option>
										<option value='ECONOMICO'>Económico</option>
									</select>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Rating de Calidad
									</label>
									<input
										type='number'
										min='1'
										max='5'
										step='0.1'
										defaultValue={selectedBrand.quality_rating}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
									/>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700'>
										Margen (%)
									</label>
									<input
										type='number'
										min='0'
										max='100'
										defaultValue={selectedBrand.margin_percentage}
										className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
									/>
								</div>
							</div>

							<div className='flex items-center space-x-4'>
								<label className='flex items-center'>
									<input
										type='checkbox'
										defaultChecked={selectedBrand.is_active}
										className='mr-2 rounded'
									/>
									<span className='text-sm text-gray-700'>Marca activa</span>
								</label>
								<label className='flex items-center'>
									<input
										type='checkbox'
										defaultChecked={selectedBrand.is_exclusive}
										className='mr-2 rounded'
									/>
									<span className='text-sm text-gray-700'>Marca exclusiva</span>
								</label>
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
								setSelectedBrand(null);
							}}>
							Cancelar
						</Button>
						<Button
							color='blue'
							onClick={() => {
								// Aquí iría la lógica de actualización
								console.log('Actualizar marca:', selectedBrand?.id);
								setEditModalOpen(false);
								setSelectedBrand(null);
							}}>
							Guardar Cambios
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Ver Marca */}
			<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='2xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
							<Icon icon='HeroEye' className='h-6 w-6 text-green-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								Detalles de la Marca
							</h2>
							<p className='text-sm text-gray-600'>Información completa y métricas</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedBrand && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='space-y-4'>
									<div>
										<h3 className='mb-2 text-lg font-bold text-gray-900'>
											{selectedBrand.name}
										</h3>
										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Código:
												</span>
												<span className='font-mono'>
													{selectedBrand.code}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Fabricante:
												</span>
												<span>{selectedBrand.manufacturer}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													País:
												</span>
												<span>{selectedBrand.origin_country}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Posición:
												</span>
												<Badge
													color={
														selectedBrand.market_position === 'PREMIUM'
															? 'violet'
															: selectedBrand.market_position ===
																  'MEDIO'
																? 'blue'
																: 'emerald'
													}>
													{selectedBrand.market_position}
												</Badge>
											</div>
											<div className='flex items-center justify-between'>
												<span className='font-medium text-gray-700'>
													Calidad:
												</span>
												<div className='flex items-center space-x-1'>
													<div className='flex'>
														{getRatingStars(
															selectedBrand.quality_rating,
														)}
													</div>
													<span className='text-sm'>
														{selectedBrand.quality_rating}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<div className='space-y-2'>
										<div className='mb-4 flex flex-wrap gap-2'>
											<Badge
												color={selectedBrand.is_active ? 'emerald' : 'red'}>
												{selectedBrand.is_active ? 'Activa' : 'Inactiva'}
											</Badge>
											{selectedBrand.is_exclusive && (
												<Badge color='amber'>Exclusiva</Badge>
											)}
										</div>

										<div className='space-y-2 text-sm'>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Margen:
												</span>
												<span>{selectedBrand.margin_percentage}%</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Productos:
												</span>
												<span>{selectedBrand.products_count}</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Ventas:
												</span>
												<span>
													{formatCurrency(selectedBrand.total_sales)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Precio Promedio:
												</span>
												<span>
													{formatCurrency(selectedBrand.avg_price)}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='font-medium text-gray-700'>
													Especialidad:
												</span>
												<span className='text-right'>
													{selectedBrand.category_focus}
												</span>
											</div>
											{selectedBrand.website_url && (
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Website:
													</span>
													<a
														href={selectedBrand.website_url}
														target='_blank'
														rel='noopener noreferrer'
														className='text-blue-600 underline hover:text-blue-800'>
														Ver sitio
													</a>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>

							<div className='border-t pt-4'>
								<h4 className='mb-2 font-medium text-gray-700'>Descripción</h4>
								<p className='text-sm text-gray-600'>{selectedBrand.description}</p>
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
								setSelectedBrand(null);
							}}>
							Cerrar
						</Button>
						{selectedBrand && (
							<Button
								color='blue'
								onClick={() => {
									setViewModalOpen(false);
									handleEditBrand(selectedBrand);
								}}>
								Editar Marca
							</Button>
						)}
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Confirmación de Eliminación */}
			<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen}>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
							<Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>Eliminar Marca</h2>
							<p className='text-sm text-gray-600'>
								Esta acción no se puede deshacer
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedBrand && (
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
											¿Estás seguro de que quieres eliminar esta marca?
										</h3>
										<div className='mt-2 text-sm text-red-700'>
											<p>
												<strong>Marca:</strong> {selectedBrand.name}
											</p>
											<p>
												<strong>Código:</strong> {selectedBrand.code}
											</p>
											<p>
												<strong>Fabricante:</strong>{' '}
												{selectedBrand.manufacturer}
											</p>
											{selectedBrand.products_count > 0 && (
												<p className='mt-2 font-medium text-red-800'>
													⚠️ Esta marca tiene{' '}
													{selectedBrand.products_count} productos
													asociados. No se puede eliminar hasta que no
													tenga productos.
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
								setSelectedBrand(null);
							}}>
							Cancelar
						</Button>
						<Button
							color='red'
							onClick={handleConfirmDelete}
							isDisable={selectedBrand?.products_count! > 0}>
							{selectedBrand?.products_count! > 0
								? 'No se puede eliminar'
								: 'Eliminar Marca'}
						</Button>
					</div>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
};

export default Marcas;
