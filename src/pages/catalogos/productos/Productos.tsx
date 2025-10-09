import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';

// Componentes modulares
import ProductsHeader from './components/ProductsHeader';
import ProductStats from './components/ProductStats';
import CreateEditProductModal from './components/modals/CreateEditProductModal';
import { Tabs, ProductListTab, InventoryTab, AnalyticsTab, type TabItem } from './components/Tabs';

// Hooks y tipos
import { useProductos } from './hooks/useProductos';
import type { IProduct } from '@/interface/product.interface';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import { PRODUCT_DEFAULT_FILTERS } from './constants/products.constant';

const Productos: React.FC = () => {
	const navigate = useNavigate();
	const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);
	const [branchId, setBranchId] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
	const [activeTab, setActiveTab] = useState('products');

	const {
		products,
		meta,
		stats,
		loading,
		error,
		branches,
		activeBranchId,
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

	// Handlers para filtros
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({ ...prev, search: value }));
		setPage(1);
	};

	const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setBranchId(value ? Number(value) : null);
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

	const handleResetFilters = () => {
		setFilters(PRODUCT_DEFAULT_FILTERS);
		setPage(1);
	};

	// Handlers para productos
	const handleViewProduct = (product: IProduct) => {
		const targetBranchId = branchId ?? activeBranchId ?? product.branch_id ?? null;
		const search = targetBranchId ? `?branchId=${targetBranchId}` : '';
		navigate(`/catalogos/productos/${product.id}${search}`);
	};

	const handleCreateSubmit = async (payload: {
		data: Partial<IProduct>;
		categoryIds: number[];
	}) => {
		try {
			await createProduct(payload);
			toast.success('Producto creado correctamente');
			setCreateOpen(false);
		} catch (err: any) {
			const message =
				typeof err === 'string' ? err : err?.message ?? 'No se pudo crear el producto';
			toast.error(message);
		}
	};

	const handleUpdateSubmit = async (payload: {
		data: Partial<IProduct>;
		categoryIds: number[];
	}) => {
		if (!selectedProduct) return;
		try {
			await updateProduct(selectedProduct.id, payload);
			toast.success('Producto actualizado correctamente');
			setEditOpen(false);
			setSelectedProduct(null);
		} catch (err: any) {
			const message =
				typeof err === 'string' ? err : err?.message ?? 'No se pudo actualizar el producto';
			toast.error(message);
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

	// Configuración de tabs
	const tabs: TabItem[] = [
		{
			id: 'products',
			label: 'Productos',
			icon: 'HeroCubeTransparent',
			badge: meta.total,
			content: (
				<ProductListTab
					products={products}
					meta={meta}
					loading={loading}
					filters={filters}
					onSearchChange={handleSearchChange}
					onStatusChange={handleStatusChange}
					onBrandChange={handleBrandChange}
					onCategoryChange={handleCategoryChange}
					onTypeChange={handleTypeChange}
					onResetFilters={handleResetFilters}
					brands={brands}
					categories={categories}
					brandsLoading={brandsLoading}
					categoriesLoading={categoriesLoading}
					page={page}
					onPageChange={setPage}
					onView={handleViewProduct}
					onEdit={(product) => {
						setSelectedProduct(product);
						setEditOpen(true);
					}}
					onDelete={handleDeleteProduct}
				/>
			),
		},
		{
			id: 'inventory',
			label: 'Inventario',
			icon: 'HeroCubeTransparent',
			content: <InventoryTab />,
		},
		{
			id: 'analytics',
			label: 'Análisis',
			icon: 'HeroChartBarSquare',
			content: <AnalyticsTab />,
		},
	];

	return (
		<PageWrapper name='catalog-products'>
			<ProductsHeader
				searchValue={filters.search ?? ''}
				onSearchChange={handleSearchChange}
				branchId={branchId}
				onBranchChange={handleBranchChange}
				branches={branches}
				onCreateClick={() => setCreateOpen(true)}
			/>

			<Container>
				{error && (
					<Card className='mb-4'>
						<CardBody className='text-sm text-red-500'>{error}</CardBody>
					</Card>
				)}

				<ProductStats stats={stats} loading={loading} />

				<Tabs
					tabs={tabs}
					activeTab={activeTab}
					onTabChange={setActiveTab}
					className='mt-6'
				/>
			</Container>

			{/* Modales */}
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
