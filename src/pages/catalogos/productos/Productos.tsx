import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

import ProductsHeader from './components/ProductsHeader';
import ProductStats from './components/ProductStats';
import CreateEditProductModal from './components/modals/CreateEditProductModal';
import DeleteProductModal from './components/modals/DeleteProductModal';
import { ProductListTab, InventoryTab } from './components/Tabs';
import Tabs, { Tab } from '@/components/ui/Tabs';

import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useAuthorization from '@/hooks/useAuthorization';

import { useProductos } from './hooks/useProductos';
import type { IProduct } from '@/interface/product.interface';
import { PRODUCT_DEFAULT_FILTERS } from './constants/products.constant';
import type { ProductsViewMode } from './hooks/useProductos';
import StockAdminTab from './components/Tabs/AnalyticsTab';
import StockCatalogTab from './components/Tabs/StockCatalogTab';

const Productos: React.FC = () => {
	const navigate = useNavigate();

	const { branchId: currentBranchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const { canAccessBranch } = useAuthorization();

	const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);
	const [page, setPage] = useState(1);
	const [createOpen, setCreateOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);
	const [activeTab, setActiveTab] = useState('products');
	const [viewMode, setViewMode] = useState<ProductsViewMode>('branches');

	const {
		products,
		meta,
		stats,
		inventory,
		criticalProducts,
		loading,
		inventoryLoading,
		error,
		branches,
		activeBranchId,
		brands,
		brandsLoading,
		categories,
		categoriesLoading,
		creating,
		createProduct,
		deleteProduct,
		refresh,
	} = useProductos({
		branchId: currentBranchId,
		subsidiaryId,
		mode: viewMode,
		enabled: true,
		filters,
		page,
		perPage: 15,
	});

	const filteredBranches = useMemo(() => {
		if (!visibleBranches.length) return branches;
		const allowed = new Set(visibleBranches.map((branch) => branch.id));
		return branches.filter((branch) => allowed.has(branch.id));
	}, [branches, visibleBranches]);

	const currentBranch = useMemo(() => {
		const targetBranchId = currentBranchId ?? activeBranchId ?? null;
		if (!targetBranchId) return null;
		const sources = [filteredBranches, branches];
		for (const source of sources) {
			const found = source.find((branch) => branch.id === targetBranchId);
			if (found) return found;
		}
		return null;
	}, [currentBranchId, activeBranchId, filteredBranches, branches]);

	const currentBranchName = useMemo(() => {
		if (!currentBranch) return undefined;
		if (typeof currentBranch.name === 'string' && currentBranch.name.trim().length > 0) {
			return currentBranch.name;
		}
		const branchRecord = currentBranch as unknown as Record<string, unknown>;
		const branchNameSnake = branchRecord.branch_name;
		if (typeof branchNameSnake === 'string' && branchNameSnake.trim().length > 0) {
			return branchNameSnake;
		}
		const branchNameCamel = branchRecord.branchName;
		if (typeof branchNameCamel === 'string' && branchNameCamel.trim().length > 0) {
			return branchNameCamel;
		}
		return undefined;
	}, [currentBranch]);

	useEffect(() => {
		setPage(1);
	}, [currentBranchId]);

	const stockAdminProducts = useMemo(() => {
		const search = filters.search?.trim().toLowerCase() ?? '';
		if (!search) return products;
		return products.filter((product) => {
			const searchable = [product.name, product.sku, product.barcode]
				.filter((value): value is string => typeof value === 'string' && value.length > 0)
				.join(' ')
				.toLowerCase();
			return searchable.includes(search);
		});
	}, [filters.search, products]);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = event.target;
		setFilters((prev) => ({ ...prev, search: value }));
		setPage(1);
	};

	const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const { value } = event.target;
		setFilters((prev) => ({
			...prev,
			is_active: value === '' ? undefined : value === 'active',
		}));
		setPage(1);
	};

	const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const { value } = event.target;
		setFilters((prev) => ({
			...prev,
			brand_id: value ? Number(value) : undefined,
		}));
		setPage(1);
	};

	const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const { value } = event.target;
		setFilters((prev) => ({
			...prev,
			category_id: value ? Number(value) : undefined,
		}));
		setPage(1);
	};

	const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const { value } = event.target;
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

	const handleShowCriticalInventory = () => {
		setActiveTab('products');
	};

	const handleToggleViewMode = () => {
		setViewMode(viewMode === 'subsidiaries' ? 'branches' : 'subsidiaries');
		setPage(1);
	};

	const getErrorMessage = (error: unknown, fallback: string): string => {
		if (typeof error === 'string' && error.trim().length > 0) return error;
		if (error && typeof error === 'object') {
			const maybeMessage = (error as { message?: unknown }).message;
			if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
				return maybeMessage;
			}
		}
		return fallback;
	};

	const handleViewProduct = (product: IProduct) => {
		const resolvedBranchId = currentBranchId ?? activeBranchId ?? currentBranch?.id ?? null;
		const modeToUse: ProductsViewMode = viewMode ?? 'branches';
		const params = new URLSearchParams();
		if (resolvedBranchId) params.set('branchId', String(resolvedBranchId));
		const query = params.toString();
		const search = query ? `?${query}` : '';
		navigate(`/catalogos/productos/${product.id}${search}`, {
			state: {
				branchId: resolvedBranchId,
				viewMode: modeToUse,
				subsidiaryId: modeToUse === 'subsidiaries' ? subsidiaryId : null,
			},
		});
	};

	const handleCreateSubmit = async (payload: {
		data: Partial<IProduct>;
		categoryIds: number[];
	}) => {
		try {
			await createProduct(payload);
			toast.success('Producto creado correctamente');
			setCreateOpen(false);
		} catch (err: unknown) {
			console.error('Create product failed', err);
			toast.error(getErrorMessage(err, 'No se pudo crear el producto'));
		}
	};

	const handleDeleteProduct = async (product: IProduct) => {
		setProductToDelete(product);
		setDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!productToDelete) return;

		try {
			await deleteProduct(productToDelete.id);
			toast.success('Producto eliminado correctamente');
		} catch (err: unknown) {
			toast.error(getErrorMessage(err, 'No se pudo eliminar el producto'));
		} finally {
			setDeleteModalOpen(false);
			setProductToDelete(null);
		}
	};

	const hasBranchAccess = canAccessBranch(currentBranchId);

	return (
		<PageWrapper name='Productos' title='Catalogos Productos'>
			<ProductsHeader
				searchValue={filters.search ?? ''}
				onSearchChange={handleSearchChange}
				onCreateClick={() => setCreateOpen(true)}
				branchId={currentBranchId}
			/>

			<Container>
				<Card className='mb-6 border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 shadow-sm dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800'>
					<CardBody className='flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex items-start gap-3'>
							<span className='mt-0.5 flex size-10 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm dark:bg-zinc-800'>
								<Icon
									icon={
										viewMode === 'subsidiaries'
											? 'HeroBuildingOffice'
											: 'HeroBuildingOffice2'
									}
									className='size-5'
								/>
							</span>
							<div>
								<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
									Modo de visualizacion
								</p>
								<p className='text-xs text-zinc-500 dark:text-zinc-300'>
									{viewMode === 'subsidiaries'
										? 'Consultando productos por subempresa'
										: 'Consultando productos por sucursal'}
								</p>
							</div>
						</div>

						<div className='flex items-center gap-2'>
							<span className='rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-sky-300'>
								{viewMode === 'subsidiaries' ? 'Subempresas' : 'Sucursales'}
							</span>
							<Button
								variant='outline'
								size='sm'
								icon='HeroArrowsRightLeft'
								onClick={handleToggleViewMode}>
								Cambiar vista
							</Button>
						</div>
					</CardBody>
				</Card>

				{viewMode === 'subsidiaries' && !subsidiaryId && (
					<Card className='mb-4'>
						<CardBody className='text-sm text-amber-600'>
							No se pudo resolver la subempresa actual. Verifica la personalizacion que tengas en tus opciones.
						</CardBody>
					</Card>
				)}

				{!hasBranchAccess && currentBranchId && (
					<Card className='mb-4'>
						<CardBody className='flex items-center gap-3 text-sm text-amber-600'>
							<Icon icon='HeroShieldExclamation' className='size-5' />
							<span>
								No tienes acceso de operación a la sucursal seleccionada.
								Los datos se muestran en modo lectura.
							</span>
						</CardBody>
					</Card>
				)}

				{error && (
					<Card className='mb-4'>
						<CardBody className='text-sm text-red-500'>{error}</CardBody>
					</Card>
				)}

				<ProductStats stats={stats} loading={loading} />

				<Tabs
					activeTab={activeTab}
					onTabChange={setActiveTab}
					className='mt-6 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'
					variant='pills'>
					<Tab
						id='products'
						text='Productos'
						icon='HeroCubeTransparent'
						badge={meta.total}>
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
							onDelete={handleDeleteProduct}
							subsidiaryId={subsidiaryId}
							onRefresh={refresh}
						/>
					</Tab>
					<Tab id='inventory' text='Inventario' icon='HeroBuildingStorefront'>
						<InventoryTab
							products={products}
							meta={meta}
							entityParam={viewMode === 'subsidiaries' ? 'subsidiaries' : 'branches'}
							entityId={
								viewMode === 'subsidiaries'
									? subsidiaryId
									: currentBranchId ?? activeBranchId ?? currentBranch?.id ?? null
							}
							summary={inventory}
							criticalProducts={criticalProducts}
							loading={inventoryLoading || loading}
							branchName={currentBranchName}
							onShowLowStock={handleShowCriticalInventory}
							onViewProduct={handleViewProduct}
							subsidiaryId={subsidiaryId}
							selectedBranchId={currentBranchId ?? activeBranchId ?? currentBranch?.id ?? null}
							onRefresh={refresh}
						/>
					</Tab>
					<Tab id='stock-catalog' text='Catálogo de Stock' icon='HeroTableCells'>
						<StockCatalogTab subsidiaryId={subsidiaryId ?? 0} />
					</Tab>
					<Tab id='analytics' text='Administracion de Stock' icon='HeroChartBarSquare'>
						<StockAdminTab
							subsidiaryId={subsidiaryId ?? 0}
							products={stockAdminProducts}
							loading={loading}
							meta={meta}
							refresh={refresh}
						/>
					</Tab>
				</Tabs>
			</Container>

			<CreateEditProductModal
				isOpen={createOpen}
				onClose={() => setCreateOpen(false)}
				onSubmit={handleCreateSubmit}
				brands={brands}
				categories={categories}
				isLoading={creating}
				brandsLoading={brandsLoading}
				defaultBranchId={currentBranchId ?? activeBranchId ?? null}
			/>

			<DeleteProductModal
				isOpen={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setProductToDelete(null);
				}}
				product={productToDelete}
				onConfirm={confirmDelete}
			/>
		</PageWrapper>
	);
};

export default Productos;
