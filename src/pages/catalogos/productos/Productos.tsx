import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';

// Componentes modulares
import ProductsHeader from './components/ProductsHeader';
import ProductStats from './components/ProductStats';
import CreateEditProductModal from './components/modals/CreateEditProductModal';
import DeleteProductModal from './components/modals/DeleteProductModal';
import { ProductListTab, InventoryTab } from './components/Tabs';
import Tabs, { Tab } from '@/components/ui/Tabs';

// Hooks y tipos
import { useProductos } from './hooks/useProductos';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	selectPersonalizacionUsuario,
	selectIsInitialized as selectPersonalizacionInitialized,
	obtenerPersonalizacionThunk,
} from '@/store/slices/personalizacion/personalizacionSlice';
import type { IProduct } from '@/interface/product.interface';
import { PRODUCT_DEFAULT_FILTERS } from './constants/products.constant';
import { useUserBranches } from './components/modals/hooks/userBranch';

const Productos: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const currentUser = useAppSelector((state) => state.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const personalizacionInitialized = useAppSelector(selectPersonalizacionInitialized);

	const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);
	const [branchId, setBranchId] = useState<number | null>(null);
	const [branchInitialized, setBranchInitialized] = useState(false);
	const [page, setPage] = useState(1);
	const [createOpen, setCreateOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);
	const [activeTab, setActiveTab] = useState('products');

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
		updateProduct,
		deleteProduct,
	} = useProductos({ branchId, filters, page, perPage: 15 });

	const { branches: accessibleBranches } = useUserBranches(
		currentUser?.id || (currentUser as any)?.pk,
		{
			enabled: !!(currentUser?.id || (currentUser as any)?.pk),
		},
	);

	const defaultBranchFromUser = useMemo(() => {
		if (personalizacionUsuario?.sucursal_principal) {
			return personalizacionUsuario.sucursal_principal;
		}
		if (currentUser?.branch?.id) return currentUser.branch.id;
		if (currentUser?.branch_id) return currentUser.branch_id;
		return null;
	}, [
		personalizacionUsuario?.sucursal_principal,
		currentUser?.branch?.id,
		currentUser?.branch_id,
	]);

	const filteredBranches = useMemo(() => {
		if (!accessibleBranches.length) return branches;
		const allowed = new Set(accessibleBranches.map((branch) => branch.id));
		return branches.filter((branch) => allowed.has(branch.id));
	}, [branches, accessibleBranches]);

	const currentBranch = useMemo(() => {
		const targetBranchId = branchId ?? activeBranchId ?? defaultBranchFromUser ?? null;
		if (!targetBranchId) return null;
		const sources = [filteredBranches, branches];
		for (const source of sources) {
			const found = source.find((branch) => branch.id === targetBranchId);
			if (found) return found;
		}
		return null;
	}, [branchId, activeBranchId, defaultBranchFromUser, filteredBranches, branches]);

	const currentBranchName =
		currentBranch?.name ??
		(currentBranch as any)?.branch_name ??
		(currentBranch as any)?.branchName ??
		undefined;

	useEffect(() => {
		if (!personalizacionInitialized) {
			dispatch(obtenerPersonalizacionThunk());
		}
	}, [dispatch, personalizacionInitialized]);

	useEffect(() => {
		if (branchInitialized) return;
		if (!filteredBranches.length) return;

		let fallback: number | null = null;

		if (
			defaultBranchFromUser !== null &&
			defaultBranchFromUser !== undefined &&
			filteredBranches.some((branch) => branch.id === defaultBranchFromUser)
		) {
			fallback = defaultBranchFromUser;
		} else {
			fallback = filteredBranches[0]?.id ?? null;
		}

		if (fallback !== null && fallback !== branchId) {
			setBranchId(fallback);
			setBranchInitialized(true);
		}
	}, [branchInitialized, filteredBranches, defaultBranchFromUser, branchId]);

	useEffect(() => {
		if (!branchInitialized) return;
		if (defaultBranchFromUser === null || defaultBranchFromUser === undefined) return;
		if (branchId === defaultBranchFromUser) return;
		if (!filteredBranches.some((branch) => branch.id === defaultBranchFromUser)) return;
		setBranchId(defaultBranchFromUser);
	}, [defaultBranchFromUser, branchId, branchInitialized, filteredBranches]);

	useEffect(() => {
		const handleExternalBranchChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ branchId: number | null }>;
			const nextBranchId = customEvent.detail?.branchId ?? null;
			if (nextBranchId === null) return;
			if (!filteredBranches.some((branch) => branch.id === nextBranchId)) return;
			setBranchId(nextBranchId);
			setBranchInitialized(true);
			setPage(1);
		};

		window.addEventListener('user-branch-changed', handleExternalBranchChange);
		return () => {
			window.removeEventListener('user-branch-changed', handleExternalBranchChange);
		};
	}, [filteredBranches]);

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

	const handleResetFilters = () => {
		setFilters(PRODUCT_DEFAULT_FILTERS);
		setPage(1);
	};

	const handleShowCriticalInventory = () => {
		setActiveTab('products');
	};

	const handleViewProduct = (product: IProduct) => {
		navigate(`/catalogos/productos/${product.id}`);
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
			console.error('Create product failed', err);
			const message =
				typeof err === 'string' ? err : (err?.message ?? 'No se pudo crear el producto');
			toast.error(message);
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
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo eliminar el producto');
		} finally {
			setDeleteModalOpen(false);
			setProductToDelete(null);
		}
	};

	return (
		<PageWrapper name='catalog-products'>
			<ProductsHeader
				searchValue={filters.search ?? ''}
				onSearchChange={handleSearchChange}
				onCreateClick={() => setCreateOpen(true)}
			/>

			<Container>
				{error && (
					<Card className='mb-4'>
						<CardBody className='text-sm text-red-500'>{error}</CardBody>
					</Card>
				)}

				<ProductStats stats={stats} loading={loading} />

				<Tabs activeTab={activeTab} onTabChange={setActiveTab} className='mt-6'>
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
						/>
					</Tab>
					<Tab id='inventory' text='Inventario' icon='HeroBuildingStorefront'>
						<InventoryTab
							products={products}
							summary={inventory}
							criticalProducts={criticalProducts}
							loading={inventoryLoading || loading}
							branchName={currentBranchName}
							onShowLowStock={handleShowCriticalInventory}
							onViewProduct={handleViewProduct}
						/>
					</Tab>
					{/* <Tab id='analytics' text='Analisis' icon='HeroChartBarSquare'>
						<AnalyticsTab />
					</Tab> */}
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
				defaultBranchId={branchId ?? defaultBranchFromUser ?? activeBranchId ?? null}
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
