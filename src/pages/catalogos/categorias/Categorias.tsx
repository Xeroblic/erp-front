/**
 * Sistema de Gestión de Categorías
 * CRUD completo con jerarquías y clasificación
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

// Interfaces para Categorías
interface ICategory {
	id: number;
	company_id: number;
	name: string;
	code: string;
	description: string;
	parent_id?: number;
	level: number;
	path: string;
	is_active: boolean;
	color: string;
	icon?: string;
	sort_order: number;
	products_count: number;
	created_at: string;
	updated_at: string;
	parent?: ICategory;
	children?: ICategory[];
}

interface ICategoryFilters {
	search: string;
	parent_id?: number;
	level?: number;
	is_active?: boolean;
}

interface ICategoryStats {
	total_categories: number;
	active_categories: number;
	inactive_categories: number;
	main_categories: number;
	sub_categories: number;
	products_categorized: number;
}

const Categorias: React.FC = () => {
	// Estados principales
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [loading, setLoading] = useState(false);

	// Estados para filtros
	const [filters, setFilters] = useState<ICategoryFilters>({
		search: '',
		parent_id: undefined,
		level: undefined,
		is_active: undefined,
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<ICategoryStats>({
		total_categories: 0,
		active_categories: 0,
		inactive_categories: 0,
		main_categories: 0,
		sub_categories: 0,
		products_categorized: 0,
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);

	// Opciones para filtros
	const levelOptions: TSelectOptions = [
		{ value: '', label: 'Todos los niveles' },
		{ value: '1', label: 'Nivel 1 - Principal' },
		{ value: '2', label: 'Nivel 2 - Subcategoría' },
		{ value: '3', label: 'Nivel 3 - Sub-subcategoría' },
	];

	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'true', label: 'Activo' },
		{ value: 'false', label: 'Inactivo' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadCategories();
		loadStats();
	}, [filters]);

	const loadCategories = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 600));

			const mockCategories: ICategory[] = [
				{
					id: 1,
					company_id: 1,
					name: 'Equipos de Cómputo',
					code: 'COMP',
					description: 'Categoría principal para equipos de cómputo y tecnología',
					level: 1,
					path: '/comp',
					is_active: true,
					color: '#3B82F6',
					icon: 'HeroComputerDesktop',
					sort_order: 1,
					products_count: 89,
					created_at: '2024-01-10T08:00:00Z',
					updated_at: '2024-01-10T08:00:00Z',
				},
				{
					id: 2,
					company_id: 1,
					name: 'Laptops y Notebooks',
					code: 'LAPTOPS',
					description: 'Equipos portátiles - laptops, notebooks, ultrabooks',
					parent_id: 1,
					level: 2,
					path: '/comp/laptops',
					is_active: true,
					color: '#10B981',
					icon: 'HeroDevicePhoneMobile',
					sort_order: 1,
					products_count: 45,
					created_at: '2024-01-10T08:15:00Z',
					updated_at: '2024-01-10T08:15:00Z',
				},
				{
					id: 3,
					company_id: 1,
					name: 'PCs de Escritorio',
					code: 'DESKTOPS',
					description: 'Computadoras de escritorio y workstations',
					parent_id: 1,
					level: 2,
					path: '/comp/desktops',
					is_active: true,
					color: '#8B5CF6',
					icon: 'HeroComputerDesktop',
					sort_order: 2,
					products_count: 32,
					created_at: '2024-01-10T08:30:00Z',
					updated_at: '2024-01-10T08:30:00Z',
				},
				{
					id: 4,
					company_id: 1,
					name: 'Accesorios y Periféricos',
					code: 'ACCESS',
					description: 'Teclados, ratones, monitores, cables y otros accesorios',
					level: 1,
					path: '/access',
					is_active: true,
					color: '#F59E0B',
					icon: 'HeroCube',
					sort_order: 2,
					products_count: 156,
					created_at: '2024-01-10T09:00:00Z',
					updated_at: '2024-01-10T09:00:00Z',
				},
				{
					id: 5,
					company_id: 1,
					name: 'Teclados',
					code: 'KEYBOARDS',
					description: 'Teclados mecánicos, de membrana, inalámbricos',
					parent_id: 4,
					level: 2,
					path: '/access/keyboards',
					is_active: true,
					color: '#EF4444',
					icon: 'HeroRectangleStack',
					sort_order: 1,
					products_count: 34,
					created_at: '2024-01-10T09:15:00Z',
					updated_at: '2024-01-10T09:15:00Z',
				},
				{
					id: 6,
					company_id: 1,
					name: 'Gaming',
					code: 'GAMING',
					description: 'Equipos y accesorios especializados para gaming',
					parent_id: 5,
					level: 3,
					path: '/access/keyboards/gaming',
					is_active: true,
					color: '#DC2626',
					icon: 'HeroFire',
					sort_order: 1,
					products_count: 12,
					created_at: '2024-01-10T09:30:00Z',
					updated_at: '2024-01-10T09:30:00Z',
				},
			];

			setCategories(mockCategories);
		} catch (error) {
			console.error('Error loading categories:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: ICategoryStats = {
				total_categories: 6,
				active_categories: 6,
				inactive_categories: 0,
				main_categories: 2,
				sub_categories: 4,
				products_categorized: 368,
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof ICategoryFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			parent_id: undefined,
			level: undefined,
			is_active: undefined,
		});
	};

	// Handlers para categorías
	const handleCreateCategory = () => {
		setCreateModalOpen(true);
	};

	const handleEditCategory = (category: ICategory) => {
		setSelectedCategory(category);
		setEditModalOpen(true);
	};

	const handleViewCategory = (category: ICategory) => {
		setSelectedCategory(category);
		setViewModalOpen(true);
	};

	const handleDeleteCategory = (category: ICategory) => {
		setSelectedCategory(category);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedCategory) return;

		try {
			console.log('Deleting category:', selectedCategory.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedCategory(null);
			await Promise.all([loadCategories(), loadStats()]);
		} catch (error) {
			console.error('Error deleting category:', error);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const getLevelBadgeColor = (level: number) => {
		switch (level) {
			case 1:
				return 'sky';
			case 2:
				return 'emerald';
			case 3:
				return 'violet';
			default:
				return 'gray';
		}
	};

	// Tabla de categorías con jerarquía visual
	const CategoriesTable = () => (
		<div className='overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Categoría
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Código
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Nivel
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
							Productos
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
					{categories.map((category) => (
						<tr key={category.id} className='hover:bg-gray-50'>
							<td className='whitespace-nowrap px-6 py-4'>
								<div className='flex items-center'>
									<div
										className='mr-3 h-4 w-4 flex-shrink-0 rounded'
										style={{ backgroundColor: category.color }}
									/>
									<div style={{ paddingLeft: `${(category.level - 1) * 20}px` }}>
										<div className='flex items-center'>
											{category.icon && (
												<Icon
													icon={category.icon as any}
													className='mr-2 h-4 w-4 text-gray-400'
												/>
											)}
											<div>
												<div className='text-sm font-medium text-gray-900'>
													{category.name}
												</div>
												<div className='text-sm text-gray-500'>
													{category.description}
												</div>
											</div>
										</div>
									</div>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900'>
								{category.code}
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={getLevelBadgeColor(category.level)}>
									Nivel {category.level}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
								<div className='flex items-center'>
									<span className='font-medium'>{category.products_count}</span>
									<span className='ml-1 text-gray-500'>productos</span>
								</div>
							</td>
							<td className='whitespace-nowrap px-6 py-4'>
								<Badge color={category.is_active ? 'emerald' : 'red'}>
									{category.is_active ? 'Activo' : 'Inactivo'}
								</Badge>
							</td>
							<td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
								<div className='flex space-x-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleViewCategory(category)}
										className='text-blue-600 hover:text-blue-900'>
										<Icon icon='HeroEye' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleEditCategory(category)}
										className='text-indigo-600 hover:text-indigo-900'>
										<Icon icon='HeroPencilSquare' className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => handleDeleteCategory(category)}
										isDisable={category.products_count > 0}
										className={`${
											category.products_count > 0
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
		<PageWrapper name='categorias-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20'>
							<Icon
								icon='HeroRectangleStack'
								className='h-6 w-6 text-purple-600 dark:text-purple-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Categorías
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Organización jerárquica del catálogo de productos
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='violet' onClick={handleCreateCategory} icon='HeroPlus'>
						Nueva Categoría
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20'>
								<Icon
									icon='HeroRectangleStack'
									className='h-6 w-6 text-purple-600'
								/>
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Categorías
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_categories}
								</p>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
								<Icon icon='HeroQueueList' className='h-6 w-6 text-blue-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Principales
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.main_categories}
									</p>
									<Badge color='blue'>Nivel 1</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
								<Icon icon='HeroCube' className='h-6 w-6 text-green-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Productos Categorizados
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.products_categorized}
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
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar
								</label>
								<Input
									type='text'
									name='search'
									placeholder='Nombre o código...'
									value={filters.search || ''}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Nivel
								</label>
								<SelectReact
									name='level'
									options={levelOptions}
									value={levelOptions.find(
										(option) => option.value === filters.level?.toString(),
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'level',
											option?.value ? parseInt(option.value) : undefined,
										);
									}}
									placeholder='Seleccionar nivel...'
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

				{/* Tabla de Categorías */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Categorías</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{categories.length} categorías
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						{loading ? (
							<div className='flex items-center justify-center py-12'>
								<Icon
									icon='HeroArrowPath'
									className='h-8 w-8 animate-spin text-purple-600'
								/>
								<span className='ml-2 text-gray-600'>Cargando categorías...</span>
							</div>
						) : (
							<CategoriesTable />
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
							<h2 className='text-xl font-bold text-gray-900'>Eliminar Categoría</h2>
							<p className='text-sm text-gray-600'>
								Esta acción no se puede deshacer
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedCategory && (
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
											¿Estás seguro de que quieres eliminar esta categoría?
										</h3>
										<div className='mt-2 text-sm text-red-700'>
											<p>
												Categoría: <strong>{selectedCategory.name}</strong>
											</p>
											<p>
												Código: <strong>{selectedCategory.code}</strong>
											</p>
											{selectedCategory.products_count > 0 && (
												<p className='mt-2 font-medium text-red-800'>
													⚠️ Esta categoría tiene{' '}
													{selectedCategory.products_count} productos
													asociados. No se puede eliminar hasta que todos
													los productos sean reasignados.
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
								setSelectedCategory(null);
							}}>
							Cancelar
						</Button>
						<Button
							color='red'
							onClick={handleConfirmDelete}
							isDisable={
								selectedCategory?.products_count &&
								selectedCategory.products_count > 0
									? true
									: false
							}
							isLoading={loading}>
							Eliminar Categoría
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Vista de Categoría */}
			<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='2xl'>
				<ModalHeader>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
							<Icon icon='HeroEye' className='h-6 w-6 text-purple-600' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-gray-900'>
								Detalles de la Categoría
							</h2>
							<p className='text-sm text-gray-600'>Información completa</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedCategory && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='space-y-4'>
									<div>
										<h3 className='mb-2 flex items-center text-lg font-bold text-gray-900'>
											<div
												className='mr-3 h-4 w-4 rounded'
												style={{ backgroundColor: selectedCategory.color }}
											/>
											{selectedCategory.name}
										</h3>
										<p className='mb-4 text-gray-600'>
											{selectedCategory.description}
										</p>
									</div>

									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='font-medium text-gray-700'>
												Código:
											</span>
											<p className='font-mono text-gray-900'>
												{selectedCategory.code}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>
												Nivel:
											</span>
											<p className='text-gray-900'>
												{selectedCategory.level}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>Ruta:</span>
											<p className='font-mono text-gray-900'>
												{selectedCategory.path}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>
												Productos:
											</span>
											<p className='text-gray-900'>
												{selectedCategory.products_count}
											</p>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<div className='flex flex-wrap gap-2'>
										<Badge color={getLevelBadgeColor(selectedCategory.level)}>
											Nivel {selectedCategory.level}
										</Badge>
										<Badge
											color={selectedCategory.is_active ? 'emerald' : 'red'}>
											{selectedCategory.is_active ? 'Activo' : 'Inactivo'}
										</Badge>
									</div>

									<div className='grid grid-cols-1 gap-4 text-sm'>
										<div>
											<span className='font-medium text-gray-700'>
												Creado:
											</span>
											<p className='text-gray-900'>
												{formatDate(selectedCategory.created_at)}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-700'>
												Actualizado:
											</span>
											<p className='text-gray-900'>
												{formatDate(selectedCategory.updated_at)}
											</p>
										</div>
									</div>

									{selectedCategory.parent_id && (
										<div>
											<span className='text-sm font-medium text-gray-700'>
												Categoría Padre:
											</span>
											<p className='text-gray-900'>
												ID: {selectedCategory.parent_id}
											</p>
										</div>
									)}
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
								setSelectedCategory(null);
							}}>
							Cerrar
						</Button>
						{selectedCategory && (
							<Button
								color='violet'
								onClick={() => {
									setViewModalOpen(false);
									handleEditCategory(selectedCategory);
								}}>
								Editar Categoría
							</Button>
						)}
					</div>
				</ModalFooter>
			</Modal>
		</PageWrapper>
	);
};

export default Categorias;
