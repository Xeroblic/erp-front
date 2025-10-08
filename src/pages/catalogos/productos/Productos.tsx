import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/Badge';
import ProductsTable from './components/tables/ProductsTable';
import ProductStats from './components/ProductStats';
import CreateEditProductModal from './components/modals/CreateEditProductModal';
import { useProductos } from './hooks/useProductos';
import type { IProduct } from '@/interface/product.interface';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import {
	PRODUCT_DEFAULT_FILTERS,
	PRODUCT_STATUS_FILTER_OPTIONS,
	PRODUCT_TYPE_FILTER_OPTIONS,
} from './constants/products.constant';

const Productos: React.FC = () => {
	const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);
	const [branchId, setBranchId] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

	const {
		products,
		meta,
		stats,
		loading,
		error,
		branches,
		brands,
		brandsLoading,
		categories,
		categoriesLoading,
		creating,
		updating,
		createProduct,
		updateProduct,
		deleteProduct,
	} = useProductos({ branchId, filters, page, perPage: 15 });

	const branchOptions = useMemo(
		() => branches.map((branch) => ({ value: String(branch.id), label: branch.name ?? `Sucursal ${branch.id}` })),
		[branches],
	);

	const brandOptions = useMemo(
		() => brands.map((brand: IBrand) => ({ value: String(brand.id), label: brand.name })),
		[brands],
	);

	const categoryOptions = useMemo(
		() => categories.map((category: ICategory) => ({ value: category.id, label: category.name })),
		[categories],
	);

	const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setBranchId(value ? Number(value) : null);
		setPage(1);
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({ ...prev, search: value }));
		setPage(1);
	};

	const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({
			...prev,
			is_active: value === '' ? undefined : value === 'active',
		}));
		setPage(1);
	};

	const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({
			...prev,
			brand_id: value ? Number(value) : undefined,
		}));
		setPage(1);
	};

	const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({
			...prev,
			category_id: value ? Number(value) : undefined,
		}));
		setPage(1);
	};

	const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({
			...prev,
			product_type: value || undefined,
		}));
		setPage(1);
	};

	const handleCreateSubmit = async (payload: { data: Partial<IProduct>; categoryIds: number[] }) => {
		try {
			await createProduct(payload);
			toast.success('Producto creado correctamente');
			setCreateOpen(false);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo crear el producto');
		}
	};

	const handleUpdateSubmit = async (payload: { data: Partial<IProduct>; categoryIds: number[] }) => {
		if (!selectedProduct) return;
		try {
			await updateProduct(selectedProduct.id, payload);
			toast.success('Producto actualizado correctamente');
			setEditOpen(false);
			setSelectedProduct(null);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo actualizar el producto');
		}
	};

	const handleDeleteProduct = async (product: IProduct) => {
		const confirmed = window.confirm(`Eliminar el producto "${product.name}"?`);
		if (!confirmed) return;

		try {
			await deleteProduct(product.id);
			toast.success('Producto eliminado');
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo eliminar el producto');
		}
	};

	const handleResetFilters = () => {
		setFilters(PRODUCT_DEFAULT_FILTERS);
		setPage(1);
	};

	const totalPages = Math.max(1, meta.last_page);

	const hasFiltersApplied =
		(filters.search && filters.search.trim().length > 0) ||
		typeof filters.is_active === 'boolean' ||
		filters.brand_id ||
		filters.category_id ||
		filters.product_type;

	return (
		<PageWrapper name='catalog-products'>
				<Subheader>
					<SubheaderLeft>
						<div className='flex items-center gap-3'>
							<div className='flex h-11 w-11 items-center justify-center rounded-xl border'>
								<Icon icon='HeroCubeTransparent' className='h-5 w-5' />
							</div>
							<div>
								<h1 className='text-2xl font-semibold'>Productos</h1>
								<p className='text-sm'>
									Administra tu catalogo y sincroniza con la base de datos central.
								</p>
							</div>
						</div>
					</SubheaderLeft>
					<SubheaderRight>
						<div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
							<Input
								name='search'
								placeholder='Buscar por nombre, SKU o codigo'
								value={filters.search ?? ''}
								onChange={handleSearchChange}
								className='w-full sm:w-72'
							/>
							<Select
								name='branch'
								value={branchId ? String(branchId) : ''}
								onChange={handleBranchChange}
								className='w-full sm:w-60'>
								<option value=''>Todas las sucursales</option>
								{branchOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
							<Button color='blue' icon='HeroPlus' onClick={() => setCreateOpen(true)}>
								Nuevo producto
							</Button>
						</div>
					</SubheaderRight>
				</Subheader>

			<Container>
				{error && (
					<Card className='mb-4'>
						<CardBody className='text-sm text-red-500'>{error}</CardBody>
					</Card>
				)}

				<ProductStats stats={stats} loading={loading} />

				<Card className='mb-6'>
					<CardHeader className='pb-3'>
						<div className='flex flex-wrap items-center justify-between gap-2'>
							<CardTitle className='flex items-center gap-2 text-base font-semibold'>
								<Icon icon='HeroFunnel' className='h-5 w-5' />
								Filtros avanzados
							</CardTitle>
							<div className='flex items-center gap-2'>
								<Badge variant='outline' color='blue'>
									{meta.total.toLocaleString('es-CO')} registros
								</Badge>
								<Button variant='outline' size='sm' icon='HeroArrowPath' onClick={handleResetFilters} isDisable={loading}>
									Limpiar filtros
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardBody className='grid gap-4 lg:grid-cols-4'>
						<div className='space-y-2 lg:col-span-2'>
							<label className='flex items-center gap-2 text-sm font-medium'>
								<Icon icon='HeroMagnifyingGlass' className='h-4 w-4' />
								Busqueda
							</label>
							<Input
								name='searchInline'
								placeholder='Buscar por nombre, SKU o codigo'
								value={filters.search ?? ''}
								onChange={handleSearchChange}
							/>
						</div>
						<div className='space-y-2'>
							<label className='flex items-center gap-2 text-sm font-medium'>
								<Icon icon='HeroAdjustmentsHorizontal' className='h-4 w-4' />
								Estado
							</label>
							<Select
								name='status'
								value={filters.is_active === undefined ? '' : filters.is_active ? 'active' : 'inactive'}
								onChange={handleStatusChange}>
								{PRODUCT_STATUS_FILTER_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
						<div className='space-y-2'>
							<label className='flex items-center gap-2 text-sm font-medium'>
								<Icon icon='HeroBuildingStorefront' className='h-4 w-4' />
								Marca
							</label>
							<Select
								name='brand'
								value={filters.brand_id ? String(filters.brand_id) : ''}
								onChange={handleBrandChange}
								disabled={brandsLoading || !brands.length}>
								<option value=''>Todas las marcas</option>
								{brandOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
						<div className='space-y-2'>
							<label className='flex items-center gap-2 text-sm font-medium'>
								<Icon icon='HeroSquares2X2' className='h-4 w-4' />
								Categoria
							</label>
							<Select
								name='category'
								value={filters.category_id ? String(filters.category_id) : ''}
								onChange={handleCategoryChange}
								disabled={categoriesLoading || !categories.length}>
								<option value=''>Todas las categorias</option>
								{categoryOptions.map((option) => (
									<option key={option.value} value={String(option.value)}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
						<div className='space-y-2'>
							<label className='flex items-center gap-2 text-sm font-medium'>
								<Icon icon='HeroCube' className='h-4 w-4' />
								Tipo de producto
							</label>
							<Select
								name='product_type'
								value={filters.product_type ? String(filters.product_type) : ''}
								onChange={handleTypeChange}>
								{PRODUCT_TYPE_FILTER_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
					</CardBody>
				</Card>

				{hasFiltersApplied && (
					<div className='mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide'>
						<span className='flex items-center gap-1'>
							<Icon icon='HeroSparkles' className='h-4 w-4' />
							Filtros activos
						</span>
						{filters.search && (
							<Badge variant='outline' color='violet'>
								Busqueda: "{filters.search}"
							</Badge>
						)}
						{typeof filters.is_active === 'boolean' && (
							<Badge variant='outline' color='emerald'>
								Estado: {filters.is_active ? 'Activo' : 'Inactivo'}
							</Badge>
						)}
						{filters.brand_id && (
							<Badge variant='outline' color='blue'>
								Marca #{filters.brand_id}
							</Badge>
						)}
						{filters.category_id && (
							<Badge variant='outline' color='amber'>
								Categoria #{filters.category_id}
							</Badge>
						)}
						{filters.product_type && (
							<Badge variant='outline' color='violet'>
								Tipo: {filters.product_type}
							</Badge>
						)}
					</div>
				)}

				<ProductsTable
					products={products}
					meta={meta}
					loading={loading}
					onEdit={(product) => {
						setSelectedProduct(product);
						setEditOpen(true);
					}}
					onDelete={handleDeleteProduct}
				/>

				<div className='mt-6 flex items-center justify-between'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setPage((prev) => Math.max(1, prev - 1))}
						isDisable={loading || page <= 1}
						icon='HeroChevronLeft'>
						Anterior
					</Button>
					<div className='text-sm text-neutral-500'>
						Pagina {page} de {totalPages}
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
						isDisable={loading || page >= totalPages}
						rightIcon='HeroChevronRight'>
						Siguiente
					</Button>
				</div>
			</Container>

			<CreateEditProductModal
				isOpen={createOpen}
				onClose={() => setCreateOpen(false)}
				onSubmit={handleCreateSubmit}
				brands={brands}
				categories={categories}
				isLoading={creating}
			/>

			<CreateEditProductModal
				isOpen={editOpen}
				onClose={() => {
					setEditOpen(false);
					setSelectedProduct(null);
				}}
				onSubmit={handleUpdateSubmit}
				product={selectedProduct ?? undefined}
				brands={brands}
				categories={categories}
				isLoading={updating}
			/>
		</PageWrapper>
	);
};

export default Productos;
