/**
 * Página Principal de Gestión de Productos
 * Sistema completo CRUD con campos condicionales por tipo
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
import Checkbox from '../../../components/form/Checkbox';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../components/ui/Modal';
import CreateEditProductModal from './components/modals/CreateEditProductModal';
import {
	IProduct,
	IProductFilters,
	IProductStats,
	ProductType,
	ProductCategory,
	ProductCondition,
} from './types/products.types';
import { TSelectOption, TSelectOptions } from '../../../components/form/SelectReact';

const ProductsTable = React.lazy(() => import('./components/tables/ProductsTable'));

const ProductosMain: React.FC = () => {
	// Estados principales
	const [products, setProducts] = useState<IProduct[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);

	// Estados para filtros
	const [filters, setFilters] = useState<IProductFilters>({
		search: '',
		type: undefined,
		category: undefined,
		brand_id: undefined,
		supplier_id: undefined,
		warehouse_id: undefined,
		status: undefined,
		condition: undefined,
		low_stock: false,
		out_of_stock: false,
		serial_tracking: undefined,
		batch_tracking: undefined,
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<IProductStats>({
		total_products: 0,
		active_products: 0,
		inactive_products: 0,
		discontinued_products: 0,
		low_stock_products: 0,
		out_of_stock_products: 0,
		total_inventory_value: 0,
		notebooks_count: 0,
		desktops_count: 0,
		general_products_count: 0,
		categories_distribution: [],
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

	// Mock data para filtros
	const typeOptions: TSelectOptions = [
		{ value: '', label: 'Todos los tipos' },
		{ value: 'NOTEBOOK', label: 'Notebook/Laptop' },
		{ value: 'DESKTOP', label: 'PC Escritorio' },
		{ value: 'GENERAL', label: 'Producto General' },
	];

	const categoryOptions: TSelectOptions = [
		{ value: '', label: 'Todas las categorías' },
		{ value: 'A', label: 'Categoría A - Alta rotación' },
		{ value: 'B', label: 'Categoría B - Media rotación' },
		{ value: 'C', label: 'Categoría C - Baja rotación' },
		{ value: 'M', label: 'Categoría M - Especializada' },
	];

	const conditionOptions: TSelectOptions = [
		{ value: '', label: 'Todas las condiciones' },
		{ value: 'NEW', label: 'Nuevo' },
		{ value: 'USED', label: 'Usado' },
		{ value: 'REFURBISHED', label: 'Reacondicionado' },
		{ value: 'DAMAGED', label: 'Dañado' },
	];

	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'ACTIVE', label: 'Activo' },
		{ value: 'INACTIVE', label: 'Inactivo' },
		{ value: 'DISCONTINUED', label: 'Descontinuado' },
	];

	const brandOptions: TSelectOptions = [
		{ value: '', label: 'Todas las marcas' },
		{ value: '1', label: 'ASUS' },
		{ value: '2', label: 'HP' },
		{ value: '3', label: 'Dell' },
		{ value: '4', label: 'Lenovo' },
		{ value: '5', label: 'Acer' },
		{ value: '6', label: 'MSI' },
		{ value: '7', label: 'Apple' },
		{ value: '8', label: 'Samsung' },
	];

	const warehouseOptions: TSelectOptions = [
		{ value: '', label: 'Todas las bodegas' },
		{ value: '1', label: 'Almacén Central - Bogotá' },
		{ value: '2', label: 'Sucursal Norte - Medellín' },
		{ value: '3', label: 'Sucursal Sur - Cali' },
		{ value: '4', label: 'Sucursal Oriente - Bucaramanga' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadProducts();
		loadStats();
	}, [filters, currentPage]);

	const loadProducts = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			const mockProducts: IProduct[] = [
				{
					id: 1,
					company_id: 1,
					sku: 'NB-ASUS-001',
					name: 'ASUS VivoBook 15 X515EA',
					description:
						'Laptop ASUS VivoBook 15 con procesador Intel Core i5, 8GB RAM, 256GB SSD',
					type: 'NOTEBOOK' as ProductType,
					category: 'A' as ProductCategory,
					brand_id: 1,
					supplier_id: 1,
					warehouse_id: 1,
					location: 'A-3-2',
					unit_price: 2850000,
					cost_price: 2280000,
					min_stock: 5,
					max_stock: 50,
					current_stock: 25,
					reserved_stock: 2,
					available_stock: 23,
					warranty_months: 12,
					status: 'ACTIVE',
					condition: 'NEW' as ProductCondition,
					weight: 1.8,
					dimensions: '35.9 x 23.3 x 1.99 cm',
					barcode: '4711081334453',
					serial_tracking: true,
					batch_tracking: false,
					image_url: 'https://via.placeholder.com/150x150/0A8A7C/ffffff?text=ASUS',
					tags: ['laptop', 'asus', 'vivobook', 'intel'],
					created_at: '2024-01-15T10:00:00Z',
					updated_at: '2024-01-15T10:00:00Z',
					brand: {
						id: 1,
						name: 'ASUS',
						code: 'ASUS',
						description: '',
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					warehouse: {
						id: 1,
						name: 'Almacén Central',
						code: 'AC',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					notebook_specs: {
						id: 1,
						product_id: 1,
						processor: 'Intel Core i5-1135G7',
						ram: '8 GB DDR4',
						storage: '256 GB SSD',
						screen_size: '15.6"',
						graphics_card: 'Intel Iris Xe',
						operating_system: 'Windows 11 Home',
						battery_life: '8 horas',
						weight_kg: 1.8,
						color: 'Gris Transparente',
						keyboard_layout: 'QWERTY ES',
						touchscreen: false,
						webcam: true,
						wifi_standard: 'Wi-Fi 6',
						bluetooth_version: '5.0',
						usb_ports: 3,
						hdmi_ports: 1,
						sd_card_slot: true,
						created_at: '2024-01-15T10:00:00Z',
						updated_at: '2024-01-15T10:00:00Z',
					},
				},
				{
					id: 2,
					company_id: 1,
					sku: 'PC-DELL-001',
					name: 'Dell OptiPlex 3090 MT',
					description:
						'PC de escritorio Dell OptiPlex con procesador Intel Core i7, 16GB RAM, 512GB SSD',
					type: 'DESKTOP' as ProductType,
					category: 'B' as ProductCategory,
					brand_id: 3,
					supplier_id: 2,
					warehouse_id: 1,
					location: 'B-1-1',
					unit_price: 3200000,
					cost_price: 2560000,
					min_stock: 3,
					max_stock: 30,
					current_stock: 12,
					reserved_stock: 1,
					available_stock: 11,
					warranty_months: 24,
					status: 'ACTIVE',
					condition: 'NEW' as ProductCondition,
					weight: 6.2,
					dimensions: '36.8 x 17.9 x 29.2 cm',
					barcode: '884116448563',
					serial_tracking: true,
					batch_tracking: false,
					image_url: 'https://via.placeholder.com/150x150/336791/ffffff?text=DELL',
					tags: ['desktop', 'dell', 'optiplex', 'intel'],
					created_at: '2024-01-14T08:30:00Z',
					updated_at: '2024-01-14T08:30:00Z',
					brand: {
						id: 3,
						name: 'Dell',
						code: 'DELL',
						description: '',
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					warehouse: {
						id: 1,
						name: 'Almacén Central',
						code: 'AC',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					desktop_specs: {
						id: 1,
						product_id: 2,
						processor: 'Intel Core i7-11700',
						ram: '16 GB DDR4',
						storage: '512 GB SSD',
						graphics_card: 'Intel UHD Graphics 750',
						motherboard: 'Dell Custom',
						power_supply: '180W',
						case_type: 'Mini Tower',
						operating_system: 'Windows 11 Pro',
						optical_drive: false,
						wifi_included: true,
						bluetooth_included: true,
						usb_ports: 8,
						audio_ports: 3,
						ethernet_ports: 1,
						expansion_slots: 2,
						created_at: '2024-01-14T08:30:00Z',
						updated_at: '2024-01-14T08:30:00Z',
					},
				},
				{
					id: 3,
					company_id: 1,
					sku: 'ACC-KB-001',
					name: 'Teclado Mecánico RGB',
					description:
						'Teclado mecánico gaming con retroiluminación RGB y switches mecánicos',
					type: 'GENERAL' as ProductType,
					category: 'C' as ProductCategory,
					brand_id: undefined,
					supplier_id: 3,
					warehouse_id: 2,
					location: 'C-2-3',
					unit_price: 180000,
					cost_price: 120000,
					min_stock: 10,
					max_stock: 100,
					current_stock: 0,
					reserved_stock: 0,
					available_stock: 0,
					warranty_months: 6,
					status: 'ACTIVE',
					condition: 'NEW' as ProductCondition,
					weight: 0.9,
					dimensions: '44 x 13.5 x 3.5 cm',
					barcode: '7894561230123',
					serial_tracking: false,
					batch_tracking: true,
					image_url: 'https://via.placeholder.com/150x150/8B5CF6/ffffff?text=KB',
					tags: ['teclado', 'mecanico', 'gaming', 'rgb'],
					created_at: '2024-01-13T14:15:00Z',
					updated_at: '2024-01-13T14:15:00Z',
					warehouse: {
						id: 2,
						name: 'Sucursal Norte',
						code: 'SN',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					general_specs: {
						id: 1,
						product_id: 3,
						material: 'Aluminio y plástico ABS',
						color: 'Negro',
						size: 'Tamaño completo',
						compatibility: 'Windows, MacOS, Linux',
						power_consumption: '5W',
						operating_temperature: '0°C - 50°C',
						certifications: 'CE, FCC, RoHS',
						included_accessories: ['Cable USB', 'Extractor de teclas', 'Manual'],
						created_at: '2024-01-13T14:15:00Z',
						updated_at: '2024-01-13T14:15:00Z',
					},
				},
			];

			setProducts(mockProducts);
			setTotalItems(mockProducts.length);
		} catch (error) {
			console.error('Error loading products:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: IProductStats = {
				total_products: 156,
				active_products: 142,
				inactive_products: 12,
				discontinued_products: 2,
				low_stock_products: 8,
				out_of_stock_products: 3,
				total_inventory_value: 485600000,
				notebooks_count: 45,
				desktops_count: 32,
				general_products_count: 79,
				categories_distribution: [
					{ category: 'A', count: 65, percentage: 41.7 },
					{ category: 'B', count: 48, percentage: 30.8 },
					{ category: 'C', count: 32, percentage: 20.5 },
					{ category: 'M', count: 11, percentage: 7.0 },
				],
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof IProductFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			type: undefined,
			category: undefined,
			brand_id: undefined,
			supplier_id: undefined,
			warehouse_id: undefined,
			status: undefined,
			condition: undefined,
			low_stock: false,
			out_of_stock: false,
			serial_tracking: undefined,
			batch_tracking: undefined,
		});
		setCurrentPage(1);
	};

	// Handlers para productos
	const handleCreateProduct = () => {
		setCreateModalOpen(true);
	};

	const handleEditProduct = (product: IProduct) => {
		setSelectedProduct(product);
		setEditModalOpen(true);
	};

	const handleViewProduct = (product: IProduct) => {
		setSelectedProduct(product);
		setViewModalOpen(true);
	};

	const handleDeleteProduct = (product: IProduct) => {
		setSelectedProduct(product);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedProduct) return;

		try {
			console.log('Deleting product:', selectedProduct.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedProduct(null);
			await Promise.all([loadProducts(), loadStats()]);
		} catch (error) {
			console.error('Error deleting product:', error);
		}
	};

	const handleCreateSubmit = async (productData: any) => {
		try {
			console.log('Creating product:', productData);
			// TODO: Llamar API de creación
			// await createProduct(productData);

			// Recargar productos después de crear
			await loadProducts();
			setCreateModalOpen(false);
		} catch (error) {
			console.error('Error creating product:', error);
			throw error;
		}
	};

	const handleEditSubmit = async (productData: any) => {
		try {
			console.log('Updating product:', selectedProduct?.id, productData);
			// TODO: Llamar API de actualización
			// await updateProduct(selectedProduct.id, productData);

			// Recargar productos después de actualizar
			await loadProducts();
			setEditModalOpen(false);
			setSelectedProduct(null);
		} catch (error) {
			console.error('Error updating product:', error);
			throw error;
		}
	};

	const handleDuplicateProduct = async (product: IProduct) => {
		try {
			console.log('Duplicating product:', product.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await Promise.all([loadProducts(), loadStats()]);
		} catch (error) {
			console.error('Error duplicating product:', error);
		}
	};

	// Helper functions
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const getProgressColor = (count: number, total: number) => {
		const percentage = total > 0 ? (count / total) * 100 : 0;
		if (percentage >= 80) return 'emerald';
		if (percentage >= 50) return 'amber';
		return 'red';
	};

	const getTypeColor = (type: ProductType) => {
		switch (type) {
			case 'NOTEBOOK':
				return 'blue';
			case 'DESKTOP':
				return 'emerald';
			case 'GENERAL':
				return 'violet';
			default:
				return 'zinc';
		}
	};

	const getCategoryColor = (category: ProductCategory) => {
		switch (category) {
			case 'A':
				return 'emerald';
			case 'B':
				return 'amber';
			case 'C':
				return 'red';
			case 'M':
				return 'red';
			default:
				return 'zinc';
		}
	};

	const getConditionColor = (condition: ProductCondition) => {
		switch (condition) {
			case 'NEW':
				return 'emerald';
			case 'USED':
				return 'amber';
			case 'REFURBISHED':
				return 'blue';
			case 'DAMAGED':
				return 'red';
			default:
				return 'zinc';
		}
	};

	const getTypeLabel = (type: ProductType) => {
		switch (type) {
			case 'NOTEBOOK':
				return 'Notebook';
			case 'DESKTOP':
				return 'Desktop';
			case 'GENERAL':
				return 'General';
			default:
				return type;
		}
	};

	const getConditionLabel = (condition: ProductCondition) => {
		switch (condition) {
			case 'NEW':
				return 'Nuevo';
			case 'USED':
				return 'Usado';
			case 'REFURBISHED':
				return 'Reacondicionado';
			case 'DAMAGED':
				return 'Dañado';
			default:
				return condition;
		}
	};

	// Simple table component
	const SimpleProductsTable = () => (
		<div className='overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Producto
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Tipo
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Precio
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Stock
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Acciones
						</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-200 bg-white'>
					{products.map((product) => (
						<tr key={product.id} className='hover:bg-gray-50'>
							<td className='whitespace-nowrap px-6 py-4'>
								<div className='flex items-center'>
									<img
										src={product.image_url}
										alt={product.name}
										className='mr-3 h-10 w-10 rounded object-cover'
									/>
									<div>
										<div className='text-sm font-medium text-gray-900'>
											{product.name}
										</div>
										<div className='text-sm text-gray-500'>{product.sku}</div>
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={getTypeColor(product.type)}>
									{getTypeLabel(product.type)}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
								{formatCurrency(product.unit_price)}
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<span
									className={`text-sm font-medium ${
										product.available_stock <= product.min_stock
											? 'text-red-600'
											: 'text-green-600'
									}`}>
									{product.available_stock}
								</span>
								<span className='text-sm text-gray-500'>
									{' / ' + product.current_stock}
								</span>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
								<div className='flex space-x-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleViewProduct(product)}
										className='text-blue-600 hover:text-blue-900'>
										<Icon icon='HeroEye' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleEditProduct(product)}
										className='text-indigo-600 hover:text-indigo-900'>
										<Icon icon='HeroPencilSquare' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleDuplicateProduct(product)}
										className='text-green-600 hover:text-green-900'>
										<Icon icon='HeroDocumentDuplicate' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleDeleteProduct(product)}
										isDisable={product.available_stock > 0}
										className={`${
											product.available_stock > 0
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
		<PageWrapper name='productos-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
							<Icon
								icon='HeroCube'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Productos
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión completa del catálogo de productos
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' icon='HeroPlus' onClick={handleCreateProduct}>
						Nuevo Producto
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
								<Icon icon='HeroCube' className='h-6 w-6 text-blue-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Productos
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_products.toLocaleString('es-CO')}
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
										{stats.active_products.toLocaleString('es-CO')}
									</p>
									<Badge
										color={getProgressColor(
											stats.active_products,
											stats.total_products,
										)}>
										{stats.total_products > 0
											? Math.round(
													(stats.active_products / stats.total_products) *
														100,
												)
											: 0}
										%
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-6 w-6 text-amber-600'
								/>
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Stock Bajo
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.low_stock_products.toLocaleString('es-CO')}
									</p>
									<Badge color='amber'>
										{stats.total_products > 0
											? Math.round(
													(stats.low_stock_products /
														stats.total_products) *
														100,
												)
											: 0}
										%
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
									Valor Inventario
								</p>
								<p className='text-xl font-bold text-gray-900 dark:text-white'>
									{formatCurrency(stats.total_inventory_value)}
								</p>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Distribución por Tipos */}
				<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
					<Card>
						<CardBody className='text-center'>
							<Icon
								icon='HeroDevicePhoneMobile'
								className='mx-auto mb-2 h-8 w-8 text-blue-600'
							/>
							<p className='text-2xl font-bold text-gray-900 dark:text-white'>
								{stats.notebooks_count}
							</p>
							<p className='text-sm text-gray-600 dark:text-gray-400'>Notebooks</p>
						</CardBody>
					</Card>
					<Card>
						<CardBody className='text-center'>
							<Icon
								icon='HeroComputerDesktop'
								className='mx-auto mb-2 h-8 w-8 text-green-600'
							/>
							<p className='text-2xl font-bold text-gray-900 dark:text-white'>
								{stats.desktops_count}
							</p>
							<p className='text-sm text-gray-600 dark:text-gray-400'>Desktops</p>
						</CardBody>
					</Card>
					<Card>
						<CardBody className='text-center'>
							<Icon
								icon='HeroCube'
								className='mx-auto mb-2 h-8 w-8 text-purple-600'
							/>
							<p className='text-2xl font-bold text-gray-900 dark:text-white'>
								{stats.general_products_count}
							</p>
							<p className='text-sm text-gray-600 dark:text-gray-400'>Generales</p>
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
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar
								</label>
								<Input
									type='text'
									name='search'
									placeholder='SKU, nombre, descripción...'
									value={filters.search || ''}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Tipo
								</label>
								<SelectReact
									name='type'
									options={typeOptions}
									value={typeOptions.find(
										(option) => option.value === filters.type,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('type', option?.value || '');
									}}
									placeholder='Seleccionar tipo...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Categoría
								</label>
								<SelectReact
									name='category'
									options={categoryOptions}
									value={categoryOptions.find(
										(option) => option.value === filters.category,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('category', option?.value || '');
									}}
									placeholder='Seleccionar categoría...'
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
										(option) => option.value === filters.status,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('status', option?.value || '');
									}}
									placeholder='Seleccionar estado...'
								/>
							</div>
						</div>

						<div className='mt-4 flex flex-wrap gap-4'>
							<Checkbox
								name='low_stock'
								label='Solo stock bajo'
								checked={filters.low_stock || false}
								onChange={(e) => handleFilterChange('low_stock', e.target.checked)}
							/>
							<Checkbox
								name='out_of_stock'
								label='Solo sin stock'
								checked={filters.out_of_stock || false}
								onChange={(e) =>
									handleFilterChange('out_of_stock', e.target.checked)
								}
							/>
						</div>
					</CardBody>
				</Card>

				{/* Tabla de Productos */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Productos</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{products.length} de {totalItems} productos
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
								<span className='ml-2 text-gray-600'>Cargando productos...</span>
							</div>
						) : (
							<SimpleProductsTable />
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
							<h2 className='text-xl font-bold text-gray-900'>Eliminar Producto</h2>
							<p className='text-sm text-gray-600'>
								Esta acción no se puede deshacer
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedProduct && (
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
											¿Estás seguro de que quieres eliminar este producto?
										</h3>
										<div className='mt-2 text-sm text-red-700'>
											<p>
												Producto: <strong>{selectedProduct.name}</strong>
											</p>
											<p>
												SKU: <strong>{selectedProduct.sku}</strong>
											</p>
											{selectedProduct.available_stock > 0 && (
												<p className='mt-2 font-medium text-red-800'>
													⚠️ Este producto tiene stock disponible (
													{selectedProduct.available_stock} unidades). No
													se puede eliminar hasta que el stock sea 0.
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
								setSelectedProduct(null);
							}}>
							Cancelar
						</Button>
						<Button
							color='red'
							onClick={handleConfirmDelete}
							isDisable={Boolean(
								selectedProduct?.available_stock &&
									selectedProduct.available_stock > 0,
							)}
							isLoading={loading}>
							Eliminar Producto
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Vista de Producto */}
			<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='4xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
							<Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								Detalles del Producto
							</h2>
							<p className='text-sm text-gray-600'>Información completa</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedProduct && (
						<div className='space-y-6'>
							{/* Información básica */}
							<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
								<div>
									{selectedProduct.image_url && (
										<img
											src={selectedProduct.image_url}
											alt={selectedProduct.name}
											className='mb-4 w-full rounded-lg object-cover'
											style={{ maxHeight: '200px' }}
										/>
									)}
									<h3 className='mb-2 text-lg font-bold text-gray-900'>
										{selectedProduct.name}
									</h3>
									<p className='mb-4 text-gray-600'>
										{selectedProduct.description}
									</p>
									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='font-medium text-gray-700'>SKU:</span>
											<p className='text-gray-900'>{selectedProduct.sku}</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>
												Precio:
											</span>
											<p className='text-gray-900'>
												{formatCurrency(selectedProduct.unit_price)}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>
												Stock:
											</span>
											<p className='text-gray-900'>
												{selectedProduct.available_stock} /{' '}
												{selectedProduct.current_stock}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>
												Ubicación:
											</span>
											<p className='text-gray-900'>
												{selectedProduct.location || 'No asignada'}
											</p>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<div className='flex flex-wrap gap-2'>
										<Badge color={getTypeColor(selectedProduct.type)}>
											{getTypeLabel(selectedProduct.type)}
										</Badge>
										<Badge color={getCategoryColor(selectedProduct.category)}>
											Categoría {selectedProduct.category}
										</Badge>
										<Badge color={getConditionColor(selectedProduct.condition)}>
											{getConditionLabel(selectedProduct.condition)}
										</Badge>
									</div>

									{selectedProduct.tags && selectedProduct.tags.length > 0 && (
										<div>
											<span className='text-sm font-medium text-gray-700'>
												Etiquetas:
											</span>
											<div className='mt-1 flex flex-wrap gap-1'>
												{selectedProduct.tags.map((tag, index) => (
													<span
														key={index}
														className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
														{tag}
													</span>
												))}
											</div>
										</div>
									)}

									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='font-medium text-gray-700'>
												Garantía:
											</span>
											<p className='text-gray-900'>
												{selectedProduct.warranty_months || 0} meses
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>Peso:</span>
											<p className='text-gray-900'>
												{selectedProduct.weight || 'N/A'} kg
											</p>
										</div>
									</div>

									{selectedProduct.dimensions && (
										<div>
											<span className='text-sm font-medium text-gray-700'>
												Dimensiones:
											</span>
											<p className='text-gray-900'>
												{selectedProduct.dimensions}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Especificaciones específicas por tipo */}
							{selectedProduct.type === 'NOTEBOOK' &&
								selectedProduct.notebook_specs && (
									<Card>
										<CardHeader>
											<CardTitle>Especificaciones de Notebook</CardTitle>
										</CardHeader>
										<CardBody>
											<div className='grid grid-cols-2 gap-4 text-sm'>
												<div>
													<span className='font-medium text-gray-700'>
														Procesador:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.notebook_specs.processor}
													</p>
												</div>
												<div>
													<span className='font-medium text-gray-700'>
														RAM:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.notebook_specs.ram}
													</p>
												</div>
												<div>
													<span className='font-medium text-gray-700'>
														Almacenamiento:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.notebook_specs.storage}
													</p>
												</div>
												<div>
													<span className='font-medium text-gray-700'>
														Pantalla:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.notebook_specs.screen_size}
													</p>
												</div>
												{selectedProduct.notebook_specs.graphics_card && (
													<div>
														<span className='font-medium text-gray-700'>
															Gráfica:
														</span>
														<p className='text-gray-900'>
															{
																selectedProduct.notebook_specs
																	.graphics_card
															}
														</p>
													</div>
												)}
												{selectedProduct.notebook_specs
													.operating_system && (
													<div>
														<span className='font-medium text-gray-700'>
															SO:
														</span>
														<p className='text-gray-900'>
															{
																selectedProduct.notebook_specs
																	.operating_system
															}
														</p>
													</div>
												)}
											</div>
										</CardBody>
									</Card>
								)}

							{selectedProduct.type === 'DESKTOP' &&
								selectedProduct.desktop_specs && (
									<Card>
										<CardHeader>
											<CardTitle>Especificaciones de Desktop</CardTitle>
										</CardHeader>
										<CardBody>
											<div className='grid grid-cols-2 gap-4 text-sm'>
												<div>
													<span className='font-medium text-gray-700'>
														Procesador:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.desktop_specs.processor}
													</p>
												</div>
												<div>
													<span className='font-medium text-gray-700'>
														RAM:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.desktop_specs.ram}
													</p>
												</div>
												<div>
													<span className='font-medium text-gray-700'>
														Almacenamiento:
													</span>
													<p className='text-gray-900'>
														{selectedProduct.desktop_specs.storage}
													</p>
												</div>
												{selectedProduct.desktop_specs.graphics_card && (
													<div>
														<span className='font-medium text-gray-700'>
															Gráfica:
														</span>
														<p className='text-gray-900'>
															{
																selectedProduct.desktop_specs
																	.graphics_card
															}
														</p>
													</div>
												)}
											</div>
										</CardBody>
									</Card>
								)}

							{selectedProduct.type === 'GENERAL' &&
								selectedProduct.general_specs && (
									<Card>
										<CardHeader>
											<CardTitle>Especificaciones Generales</CardTitle>
										</CardHeader>
										<CardBody>
											<div className='grid grid-cols-2 gap-4 text-sm'>
												{selectedProduct.general_specs.material && (
													<div>
														<span className='font-medium text-gray-700'>
															Material:
														</span>
														<p className='text-gray-900'>
															{selectedProduct.general_specs.material}
														</p>
													</div>
												)}
												{selectedProduct.general_specs.color && (
													<div>
														<span className='font-medium text-gray-700'>
															Color:
														</span>
														<p className='text-gray-900'>
															{selectedProduct.general_specs.color}
														</p>
													</div>
												)}
												{selectedProduct.general_specs.compatibility && (
													<div className='col-span-2'>
														<span className='font-medium text-gray-700'>
															Compatibilidad:
														</span>
														<p className='text-gray-900'>
															{
																selectedProduct.general_specs
																	.compatibility
															}
														</p>
													</div>
												)}
											</div>
										</CardBody>
									</Card>
								)}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button
							variant='outline'
							onClick={() => {
								setViewModalOpen(false);
								setSelectedProduct(null);
							}}>
							Cerrar
						</Button>
						{selectedProduct && (
							<Button
								color='blue'
								onClick={() => {
									setViewModalOpen(false);
									handleEditProduct(selectedProduct);
								}}>
								Editar Producto
							</Button>
						)}
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Crear Producto */}
			<CreateEditProductModal
				isOpen={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSubmit={handleCreateSubmit}
				product={null}
			/>

			{/* Modal de Editar Producto */}
			<CreateEditProductModal
				isOpen={editModalOpen}
				onClose={() => {
					setEditModalOpen(false);
					setSelectedProduct(null);
				}}
				onSubmit={handleEditSubmit}
				product={selectedProduct}
			/>
		</PageWrapper>
	);
};

export default ProductosMain;
