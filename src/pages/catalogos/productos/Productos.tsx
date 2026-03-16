import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

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
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import type { IProduct } from '@/interface/product.interface';
import { PRODUCT_DEFAULT_FILTERS } from './constants/products.constant';
import { useUserBranches } from './components/modals/hooks/userBranch';
import type { ProductsViewMode } from './hooks/useProductos';

const Productos: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const currentUser = useAppSelector((state) => state.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const personalizacionInitialized = useAppSelector(selectPersonalizacionInitialized);
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);
	const [branchId, setBranchId] = useState<number | null>(null);
	const [branchInitialized, setBranchInitialized] = useState(false);
	const [page, setPage] = useState(1);
	const [createOpen, setCreateOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);
	const [activeTab, setActiveTab] = useState('products');
	const [viewMode, setViewMode] = useState<ProductsViewMode | null>(null);
	const [viewModeModalOpen, setViewModeModalOpen] = useState(true);

	const userId = useMemo<number | null>(() => {
		if (typeof currentUser?.id === 'number' && Number.isFinite(currentUser.id)) {
			return currentUser.id;
		}
		const candidatePk =
			typeof currentUser === 'object' && currentUser !== null
				? ((currentUser as unknown) as Record<string, unknown>).pk
				: null;
		if (typeof candidatePk === 'number' && Number.isFinite(candidatePk)) {
			return candidatePk;
		}
		return null;
	}, [currentUser]);

	const userIdForBranches = userId ?? undefined;

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
	} = useProductos({
		branchId,
		subsidiaryId: effectiveSubsidiaryId,
		mode: viewMode ?? 'branches',
		enabled: !!viewMode,
		filters,
		page,
		perPage: 15,
	});

	const { branches: accessibleBranches } = useUserBranches(userIdForBranches, {
		enabled: !!userId,
	});

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

	const currentBranchName = useMemo(() => {
		if (!currentBranch) return undefined;
		if (typeof currentBranch.name === 'string' && currentBranch.name.trim().length > 0) {
			return currentBranch.name;
		}
		const branchRecord = (currentBranch as unknown) as Record<string, unknown>;
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

	const handleSelectViewMode = (mode: ProductsViewMode) => {
		setViewMode(mode);
		setViewModeModalOpen(false);
		setPage(1);
	};

	const handleToggleViewMode = () => {
		if (!viewMode) {
			setViewModeModalOpen(true);
			return;
		}
		setViewMode(viewMode === 'subsidiaries' ? 'branches' : 'subsidiaries');
		setViewModeModalOpen(false);
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
		const resolvedBranchId = branchId ?? activeBranchId ?? currentBranch?.id ?? null;
		const modeToUse: ProductsViewMode = viewMode ?? 'branches';
		const params = new URLSearchParams();
		if (resolvedBranchId) params.set('branchId', String(resolvedBranchId));
		params.set('mode', modeToUse);
		if (modeToUse === 'subsidiaries' && effectiveSubsidiaryId) {
			params.set('subsidiaryId', String(effectiveSubsidiaryId));
		}
		const query = params.toString();
		const search = query ? `?${query}` : '';
		navigate(`/catalogos/productos/${product.id}${search}`, {
			state: {
				branchId: resolvedBranchId,
				viewMode: modeToUse,
				subsidiaryId: modeToUse === 'subsidiaries' ? effectiveSubsidiaryId : null,
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

	return (
		<PageWrapper name='catalog-products'>
			<Modal isOpen={viewModeModalOpen} setIsOpen={() => undefined} isStaticBackdrop isCentered={true}>
				<ModalHeader>
					<div className='flex w-full items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100'>
						<Icon icon='HeroEye' className='size-5 text-blue-500' />
						<span>Ver detalle</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='mb-4 text-sm text-zinc-600 dark:text-zinc-300'>
						Selecciona como quieres consultar el catalogo de productos.
					</p>
					<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
						<button
							type='button'
							onClick={() => handleSelectViewMode('branches')}
							className='flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-blue-500'>
							<span className='mb-3 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-500/20'>
								<Icon icon='HeroBuildingOffice2' className='size-6' />
							</span>
							<span className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
								Ver por sucursales
							</span>
							<span className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
								Usa el slice y endpoints legacy por sucursal.
							</span>
						</button>

						<button
							type='button'
							onClick={() => handleSelectViewMode('subsidiaries')}
							className='flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-emerald-500'>
							<span className='mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20'>
								<Icon icon='HeroBuildingOffice' className='size-6' />
							</span>
							<span className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
								Ver por subempresas
							</span>
							<span className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
								Usa el nuevo slice y endpoints por subsidiaria.
							</span>
						</button>
					</div>
				</ModalBody>
			</Modal>

			<ProductsHeader
				searchValue={filters.search ?? ''}
				onSearchChange={handleSearchChange}
				onCreateClick={() => setCreateOpen(true)}
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

				{viewMode === 'subsidiaries' && !effectiveSubsidiaryId && (
					<Card className='mb-4'>
						<CardBody className='text-sm text-amber-600'>
							No se pudo resolver la subempresa actual. Verifica la personalizacion
							del usuario.
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
