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
import { getWooProductLinks } from '@/utils/wooProductMeta.util';

// Se cargan todos los productos hasta este tope para poder buscar (incluyendo
// variantes) y filtrar por Woo en el cliente sin depender del backend. Cubre
// catálogos de cientos; si algún día crecen a miles habría que mover el filtro al
// backend (hoy el índice de productos no lo soporta).
const LIST_LOAD_ALL_PER_PAGE = 500;
// Tamaño de página de la vista (paginación client-side sobre lo filtrado).
const LIST_CLIENT_PAGE_SIZE = 12;

// Coincidencia de búsqueda que también mira las variantes (hijos) del producto,
// no solo el padre: por eso un SKU/nombre de grado ahora sí encuentra al producto.
const productMatchesSearch = (product: IProduct, term: string): boolean => {
	if (!term) return true;
	const haystack = (values: Array<string | null | undefined>) =>
		values
			.filter((value): value is string => typeof value === 'string' && value.length > 0)
			.join(' ')
			.toLowerCase();
	if (haystack([product.name, product.sku, product.barcode]).includes(term)) return true;
	return (product.children ?? []).some((child) =>
		haystack([child.name, child.sku]).includes(term),
	);
};

// Publicado en Woo según el vínculo real (marketplace_external_ids), igual que el
// panel WooCommerce del detalle: el padre por sí mismo o alguna de sus variantes.
const isProductWooPublished = (product: IProduct): boolean =>
	getWooProductLinks(product.marketplace_external_ids).length > 0 ||
	(product.children ?? []).some(
		(child) => getWooProductLinks(child.marketplace_external_ids).length > 0,
	);

const Productos: React.FC = () => {
	const navigate = useNavigate();

	const { branchId: currentBranchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const { canAccessBranch } = useAuthorization();

	const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);
	const [page, setPage] = useState(1);
	const [wooOnly, setWooOnly] = useState(false);
	// Rango de fechas de actualización (YYYY-MM-DD), filtrado client-side.
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [createOpen, setCreateOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);
	const [activeTab, setActiveTab] = useState('products');
	const [viewMode, setViewMode] = useState<ProductsViewMode>('branches');

	// La búsqueda se resuelve en el cliente (para poder matchear variantes), así que
	// NO se manda `search` al backend; el resto de filtros sí van server-side.
	const serverFilters = useMemo(() => {
		const clone = { ...filters };
		delete clone.search;
		return clone;
	}, [filters]);

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
		filters: serverFilters,
		// Se trae todo (hasta el tope) en una sola página; la búsqueda/filtro/
		// paginación de la lista se hacen en el cliente.
		page: 1,
		perPage: LIST_LOAD_ALL_PER_PAGE,
	});

	// Lista visible: búsqueda (incluye variantes) + "Solo Woo" + rango de fechas de
	// actualización. Se ordena por fecha de actualización descendente (lo último
	// actualizado/publicado primero).
	const visibleProducts = useMemo(() => {
		const term = filters.search?.trim().toLowerCase() ?? '';
		const filtered = products.filter((product) => {
			if (wooOnly && !isProductWooPublished(product)) return false;
			const updatedDay = (product.updated_at ?? '').slice(0, 10);
			if (dateFrom && (!updatedDay || updatedDay < dateFrom)) return false;
			if (dateTo && (!updatedDay || updatedDay > dateTo)) return false;
			return productMatchesSearch(product, term);
		});
		// ISO strings ordenan cronológicamente con localeCompare.
		return filtered.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
	}, [products, filters.search, wooOnly, dateFrom, dateTo]);

	// Paginación client-side sobre la lista ya filtrada.
	const listMeta = useMemo(() => {
		const total = visibleProducts.length;
		return {
			total,
			current_page: page,
			per_page: LIST_CLIENT_PAGE_SIZE,
			last_page: Math.max(1, Math.ceil(total / LIST_CLIENT_PAGE_SIZE)),
		};
	}, [visibleProducts.length, page]);

	const listPagedProducts = useMemo(() => {
		const start = (page - 1) * LIST_CLIENT_PAGE_SIZE;
		return visibleProducts.slice(start, start + LIST_CLIENT_PAGE_SIZE);
	}, [visibleProducts, page]);

	// Fecha de actualización más antigua del catálogo: límite inferior del calendario
	// (no tiene sentido filtrar antes de que exista el primer producto).
	const oldestProductDate = useMemo(() => {
		let min = '';
		for (const product of products) {
			const day = (product.updated_at ?? '').slice(0, 10);
			if (day && (!min || day < min)) min = day;
		}
		return min ? new Date(`${min}T00:00:00`) : undefined;
	}, [products]);

	// Si el filtrado deja la página actual fuera de rango, vuelve a la primera.
	useEffect(() => {
		if (page > listMeta.last_page) setPage(1);
	}, [page, listMeta.last_page]);

	const handleToggleWooOnly = () => {
		setWooOnly((prev) => !prev);
		setPage(1);
	};

	const handleDateFromChange = (value: string) => {
		setDateFrom(value);
		setPage(1);
	};

	const handleDateToChange = (value: string) => {
		setDateTo(value);
		setPage(1);
	};

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
		if (!currentBranch?.branch_name?.trim()) return undefined;
		return currentBranch.branch_name;
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
		setWooOnly(false);
		setDateFrom('');
		setDateTo('');
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
							No se pudo resolver la subempresa actual. Verifica la personalizacion
							que tengas en tus opciones.
						</CardBody>
					</Card>
				)}

				{!hasBranchAccess && currentBranchId && (
					<Card className='mb-4'>
						<CardBody className='flex items-center gap-3 text-sm text-amber-600'>
							<Icon icon='HeroShieldExclamation' className='size-5' />
							<span>
								No tienes acceso de operación a la sucursal seleccionada. Los datos
								se muestran en modo lectura.
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
						badge={listMeta.total}>
						<ProductListTab
							products={listPagedProducts}
							meta={listMeta}
							loading={loading}
							filters={filters}
							wooOnly={wooOnly}
							onToggleWooOnly={handleToggleWooOnly}
							dateFrom={dateFrom}
							dateTo={dateTo}
							minProductDate={oldestProductDate}
							onDateFromChange={handleDateFromChange}
							onDateToChange={handleDateToChange}
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
									: (currentBranchId ??
										activeBranchId ??
										currentBranch?.id ??
										null)
							}
							summary={inventory}
							criticalProducts={criticalProducts}
							loading={inventoryLoading || loading}
							branchName={currentBranchName}
							onShowLowStock={handleShowCriticalInventory}
							onViewProduct={handleViewProduct}
							subsidiaryId={subsidiaryId}
							selectedBranchId={
								currentBranchId ?? activeBranchId ?? currentBranch?.id ?? null
							}
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
