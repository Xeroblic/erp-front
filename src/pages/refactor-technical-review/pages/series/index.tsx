import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchItems, selectItemsLoading, selectItemsError } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import ItemList from '@/pages/technical-reviews/components/items/ItemList';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import ApiService from '@/services/ApiService';
import type { IItem } from '@/interface/technicalReviews.interface';
import { COMMERCIAL_STATUS_FILTER_OPTIONS } from '@/pages/technical-reviews/constants';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const buildItemsUrl = (branchId: number, suffix = '') =>
	join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${suffix}`);

const EQUIPMENT_FILTER_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Todos los tipos' },
	{ value: 'notebook', label: 'Notebook' },
	{ value: 'desktop', label: 'Desktop' },
	{ value: 'aio', label: 'All-in-One' },
	{ value: 'docking', label: 'Docking' },
	{ value: 'monitor', label: 'Monitor' },
];

const REVIEW_STATUS_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Todos los estados' },
	{ value: 'pending', label: 'Pendiente' },
	{ value: 'in_review', label: 'En revisión' },
	{ value: 'reviewed', label: 'Revisado' },
	{ value: 'approved', label: 'Aprobado' },
];

const CURRENT_STATUS_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Todos los estados' },
	...COMMERCIAL_STATUS_FILTER_OPTIONS.map((option) => ({
		value: option.value,
		label: option.label,
	})),
];

const GRADE_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Todos los grados' },
	{ value: 'A', label: 'A' },
	{ value: 'B', label: 'B' },
	{ value: 'C', label: 'C' },
	{ value: 'M', label: 'M' },
];

const RefactorSeries: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);
	const error = useAppSelector(selectItemsError);
	const { items, itemsMeta } = useAppSelector((state) => state.technicalReviews);
	const warehouses = useAppSelector((state) => state.warehouse.warehouses);
	const warehousesLoading = useAppSelector((state) => state.warehouse.loading);
	const customerSuppliers = useAppSelector((state) => state.customerSuppliers.items);
	const customerSuppliersLoading = useAppSelector((state) => state.customerSuppliers.loading);
	const products = useAppSelector((state) => state.products.items);
	const productsLoading = useAppSelector((state) => state.products.loading);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const currentUser = useAppSelector((state) => state.auth.user);

	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [search, setSearch] = useState('');
	const [equipmentType, setEquipmentType] = useState<string>('all');
	const [reviewStatus, setReviewStatus] = useState<string>('all');
	const [currentStatusFilter, setCurrentStatusFilter] = useState<string>('all');
	const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
	const [customerSupplierFilter, setCustomerSupplierFilter] = useState<string>('all');
	const [gradeFilter, setGradeFilter] = useState<string>('all');
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

	const selectedEquipmentOption =
		EQUIPMENT_FILTER_OPTIONS.find((opt) => opt.value === equipmentType) ||
		EQUIPMENT_FILTER_OPTIONS[0];
	const selectedReviewStatusOption =
		REVIEW_STATUS_OPTIONS.find((opt) => opt.value === reviewStatus) || REVIEW_STATUS_OPTIONS[0];
	const selectedCurrentStatusOption =
		CURRENT_STATUS_OPTIONS.find((opt) => opt.value === currentStatusFilter) ||
		CURRENT_STATUS_OPTIONS[0];
	const selectedGradeOption =
		GRADE_OPTIONS.find((opt) => opt.value === gradeFilter) || GRADE_OPTIONS[0];

	const productsWithSerial = useMemo(
		() => products.filter((p) => p.serial_tracking === true),
		[products],
	);

	const productOptions = useMemo<TSelectOption[]>(() => {
		return productsWithSerial.map((product) => ({
			value: String(product.id),
			label: `${product.name} - ${product.sku}`,
		}));
	}, [productsWithSerial]);

	const warehouseOptionsMemo = useMemo<TSelectOption[]>(() => {
		return warehouses.map((warehouse) => ({
			value: String(warehouse.id),
			label: `${warehouse.name} ${warehouse.code ? `(${warehouse.code})` : ''}`.trim(),
		}));
	}, [warehouses]);

	const customerSupplierOptionsMemo = useMemo<TSelectOption[]>(() => {
		return customerSuppliers.map((cs) => ({
			value: String(cs.id),
			label: cs.name || `Cliente/Proveedor #${cs.id}`,
		}));
	}, [customerSuppliers]);

	const warehouseFilterOptions = useMemo<TSelectOption[]>(() => {
		return [{ value: 'all', label: 'Todas las bodegas' }, ...warehouseOptionsMemo];
	}, [warehouseOptionsMemo]);

	const customerSupplierFilterOptions = useMemo<TSelectOption[]>(() => {
		return [{ value: 'all', label: 'Todos' }, ...customerSupplierOptionsMemo];
	}, [customerSupplierOptionsMemo]);

	const selectedWarehouseOption =
		warehouseFilterOptions.find((opt) => opt.value === warehouseFilter) ||
		warehouseFilterOptions[0];
	const selectedCustomerSupplierOption =
		customerSupplierFilterOptions.find((opt) => opt.value === customerSupplierFilter) ||
		customerSupplierFilterOptions[0];

	const subsidiaryId =
		personalizacionUsuario?.subsidiary_id ??
		currentUser?.subsidiary?.id ??
		currentUser?.branch?.subsidiary?.id ??
		null;

	const handleViewItem = (itemId: number) => {
		navigate(`/technical-reviews/items/${itemId}`);
	};

	const handleCreateItem = () => {
		if (!branchId) {
			toast.error('Debes seleccionar una sucursal antes de crear una revisión');
			return;
		}
		navigate('/technical-reviews/items/create');
	};

	// Fetch reference data
	useEffect(() => {
		if (branchId) {
			dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 200 } }));
			dispatch(
				fetchWarehouses({
					branchId,
					params: { page: 1, per_page: 200, is_active: true },
				}),
			);
		}
	}, [branchId, dispatch]);

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(
				fetchCustomerSuppliers({
					subsidiaryId,
					with_suppliers: true,
					per_page: 1000,
				}),
			);
		}
	}, [subsidiaryId, dispatch]);

	// Debounce search
	const [debouncedSearch, setDebouncedSearch] = useState('');
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setPage(1);
		}, 400);
		return () => clearTimeout(handler);
	}, [search]);

	const queryParams = useMemo(() => {
		const params: Record<string, string | number> = {
			page,
			per_page: limit,
		};
		const baseFilters: Record<string, string | number> = {};
		if (debouncedSearch) baseFilters.search = debouncedSearch;
		if (equipmentType !== 'all') baseFilters.equipment_type = equipmentType;
		if (reviewStatus !== 'all') baseFilters.review_status = reviewStatus;
		if (currentStatusFilter !== 'all') baseFilters.current_status = currentStatusFilter;
		if (warehouseFilter !== 'all') baseFilters.warehouse_id = Number(warehouseFilter);
		if (customerSupplierFilter !== 'all')
			baseFilters.customer_supplier_id = Number(customerSupplierFilter);
		if (gradeFilter !== 'all') baseFilters.grade = gradeFilter;
		Object.assign(params, baseFilters);
		return params;
	}, [
		page,
		limit,
		debouncedSearch,
		equipmentType,
		reviewStatus,
		currentStatusFilter,
		warehouseFilter,
		customerSupplierFilter,
		gradeFilter,
	]);

	const fetchAllForExport = useCallback(
		async (includeDetails = false): Promise<IItem[]> => {
			if (!branchId) return [];
			const baseFilters: Record<string, string | number> = {};
			if (debouncedSearch) baseFilters.search = debouncedSearch;
			if (equipmentType !== 'all') baseFilters.equipment_type = equipmentType;
			if (reviewStatus !== 'all') baseFilters.review_status = reviewStatus;
			if (currentStatusFilter !== 'all') baseFilters.current_status = currentStatusFilter;
			if (warehouseFilter !== 'all') baseFilters.warehouse_id = Number(warehouseFilter);
			if (customerSupplierFilter !== 'all')
				baseFilters.customer_supplier_id = Number(customerSupplierFilter);
			if (gradeFilter !== 'all') baseFilters.grade = gradeFilter;
			const perPage = 1000;
			let pageCursor = 1;
			let lastPage = 1;
			const collected: IItem[] = [];
			do {
				const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
					url: buildItemsUrl(branchId, '/items'),
					method: 'get',
					params: {
						...baseFilters,
						page: pageCursor,
						per_page: perPage,
						with_details: includeDetails ? 1 : undefined,
						with_attributes: includeDetails ? 1 : undefined,
					},
				});
				const pageItems = Array.isArray(response.data?.data)
					? response.data?.data
					: Array.isArray(response.data)
						? (response.data as any[])
						: [];
				collected.push(...pageItems);
				lastPage = response.data?.meta?.last_page ?? pageCursor;
				pageCursor += 1;
			} while (pageCursor <= lastPage);
			return collected;
		},
		[
			branchId,
			debouncedSearch,
			equipmentType,
			reviewStatus,
			currentStatusFilter,
			warehouseFilter,
			customerSupplierFilter,
			gradeFilter,
		],
	);

	useEffect(() => {
		if (!branchId) return;
		dispatch(
			fetchItems({
				branchId,
				params: queryParams,
			}),
		);
	}, [dispatch, branchId, queryParams]);

	return (
		<PageWrapper
			name='technical-reviews-series'
			title='Vista Global por Series'
			isProtectedRoute={true}>
			<Subheader className='mb-6 flex flex-col items-center justify-between'>
				<SubheaderLeft>
					<div className='flex items-center gap-4'>
						<div>
							<Icon icon='DuoArchive' className='h-10 w-10 text-blue-500' />
						</div>
						<div>
							<Badge className='bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300'>
								Vista Global por Series
							</Badge>
							<p className='mt-1 text-sm text-gray-500'>
								Accede a todas las series de equipos individualmente
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						color='emerald'
						className='bg-emerald-500 shadow-md transition-colors hover:bg-emerald-600 hover:shadow-lg'
						onClick={handleCreateItem}>
						<Icon icon='HeroPlus' className='mr-2 text-xl font-bold text-white' />
						Nueva Revisión (Serie Directa)
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container>
				{/* KPIs */}
				{itemsMeta && itemsMeta.total > 0 && (
					<div className='mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
						<Card className='border-gray-100 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800'>
							<CardBody className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
											Total Filtrado
										</p>
										<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100'>
											{itemsMeta.total || 0}
										</p>
										<p className='mt-1 text-[10px] text-gray-400'>
											{items.length} en esta página
										</p>
									</div>
									<div className='rounded-full bg-gray-100 p-2 dark:bg-gray-800'>
										<Icon
											icon='HeroArchiveBox'
											className='h-6 w-6 text-gray-500 dark:text-gray-400'
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-gray-100 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800'>
							<CardBody className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
											Pendientes
										</p>
										<p className='mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
											{
												items.filter((i) => {
													const status =
														typeof i.review_status === 'object' &&
														i.review_status !== null
															? (i.review_status as any).value
															: i.review_status;
													return status === 'pending';
												}).length
											}
										</p>
									</div>
									<div className='rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/40'>
										<Icon
											icon='HeroClock'
											className='h-6 w-6 text-yellow-500 dark:text-yellow-400'
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-gray-100 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800'>
							<CardBody className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
											En Revisión
										</p>
										<p className='mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400'>
											{
												items.filter((i) => {
													const status =
														typeof i.review_status === 'object' &&
														i.review_status !== null
															? (i.review_status as any).value
															: i.review_status;
													return status === 'in_review';
												}).length
											}
										</p>
									</div>
									<div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900/40'>
										<Icon
											icon='HeroWrenchScrewdriver'
											className='h-6 w-6 text-blue-500 dark:text-blue-400'
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-gray-100 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800'>
							<CardBody className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
											Revisados
										</p>
										<p className='mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400'>
											{
												items.filter((i) => {
													const status =
														typeof i.review_status === 'object' &&
														i.review_status !== null
															? (i.review_status as any).value
															: i.review_status;
													return status === 'reviewed';
												}).length
											}
										</p>
									</div>
									<div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900/40'>
										<Icon
											icon='HeroCheckCircle'
											className='h-6 w-6 text-purple-500 dark:text-purple-400'
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-gray-100 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800'>
							<CardBody className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
											Aprobados
										</p>
										<p className='mt-1 text-2xl font-bold text-green-600 dark:text-green-400'>
											{
												items.filter((i) => {
													const status =
														typeof i.review_status === 'object' &&
														i.review_status !== null
															? (i.review_status as any).value
															: i.review_status;
													return status === 'approved';
												}).length
											}
										</p>
									</div>
									<div className='rounded-full bg-green-100 p-2 dark:bg-green-900/40'>
										<Icon
											icon='HeroShieldCheck'
											className='h-6 w-6 text-green-500 dark:text-green-400'
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='border-gray-100 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800'>
							<CardBody className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
											Disponibles
										</p>
										<p className='mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
											{
												items.filter((i) => {
													const status =
														typeof i.current_status === 'object' &&
														i.current_status !== null
															? (i.current_status as any).value
															: i.current_status;
													return status === 'available_for_sale';
												}).length
											}
										</p>
									</div>
									<div className='rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/40'>
										<Icon
											icon='HeroShoppingCart'
											className='h-6 w-6 text-emerald-500 dark:text-emerald-400'
										/>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				)}

				{/* Error */}
				{error && (
					<Card className='mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
						<CardBody>
							<p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
						</CardBody>
					</Card>
				)}

				<Card className='mb-6 shadow-sm'>
					<CardHeader className='pb-0 pt-4'>
						<div className='flex items-center gap-2'>
							<Icon icon='HeroFunnel' className='text-gray-400' />
							<span className='font-semibold text-gray-700 dark:text-gray-300'>
								Filtros Rápidos
							</span>
						</div>
					</CardHeader>
					<CardBody>
						{/* Filtros Básicos */}
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							<div>
								<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
									N° de Serie / Producto
								</label>
								<div className='relative'>
									<Icon
										icon='HeroMagnifyingGlass'
										className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
									/>
									<Input
										name='search'
										className='pl-10'
										placeholder='Buscar SN...'
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
							</div>

							<div>
								<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
									Tipo de Formato
								</label>
								<SelectReact
									name='equipment_type'
									placeholder='Todos los tipos'
									options={EQUIPMENT_FILTER_OPTIONS}
									value={selectedEquipmentOption}
									onChange={(option) => {
										setEquipmentType((option as TSelectOption).value);
										setPage(1);
									}}
								/>
							</div>

							<div>
								<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
									Estado revisión
								</label>
								<SelectReact
									name='review_status'
									placeholder='Todos los estados'
									options={REVIEW_STATUS_OPTIONS}
									value={selectedReviewStatusOption}
									onChange={(option) => {
										setReviewStatus((option as TSelectOption).value);
										setPage(1);
									}}
								/>
							</div>
						</div>

						{/* Toggle Filtros Avanzados */}
						<div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
							<div className='flex gap-2'>
								<Button
									variant='outline'
									size='sm'
									className='border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-900/20'
									onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
									<Icon
										icon={
											showAdvancedFilters
												? 'HeroChevronUp'
												: 'HeroChevronDown'
										}
										className='mr-2 h-4 w-4'
									/>
									{showAdvancedFilters
										? 'Ocultar Filtros Avanzados'
										: 'Mostrar Filtros Avanzados'}
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='text-gray-500'
									onClick={() => {
										setSearch('');
										setEquipmentType('all');
										setReviewStatus('all');
										setCurrentStatusFilter('all');
										setWarehouseFilter('all');
										setCustomerSupplierFilter('all');
										setGradeFilter('all');
										setPage(1);
									}}>
									<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
									Limpiar
								</Button>
							</div>

							{/* Badge de filtros activos */}
							{(search ||
								equipmentType !== 'all' ||
								reviewStatus !== 'all' ||
								currentStatusFilter !== 'all' ||
								warehouseFilter !== 'all' ||
								customerSupplierFilter !== 'all' ||
								gradeFilter !== 'all') && (
								<Badge className='dark:bg-primary-900/30 gap-1 bg-primary-100 text-primary-700 dark:text-primary-300'>
									<Icon icon='HeroFunnel' className='h-3 w-3' />
									{
										[
											search,
											equipmentType !== 'all',
											reviewStatus !== 'all',
											currentStatusFilter !== 'all',
											warehouseFilter !== 'all',
											customerSupplierFilter !== 'all',
											gradeFilter !== 'all',
										].filter(Boolean).length
									}{' '}
									activos
								</Badge>
							)}
						</div>

						{/* Filtros Avanzados */}
						{showAdvancedFilters && (
							<div className='animate-in fade-in slide-in-from-top-2 mt-4 grid gap-4 border-t border-gray-100 pt-4 duration-200 dark:border-gray-800 md:grid-cols-2 lg:grid-cols-4'>
								<div>
									<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
										Estado Comercial
									</label>
									<SelectReact
										name='current_status'
										placeholder='Todos los estados'
										options={CURRENT_STATUS_OPTIONS}
										value={selectedCurrentStatusOption}
										onChange={(option) => {
											setCurrentStatusFilter((option as TSelectOption).value);
											setPage(1);
										}}
									/>
								</div>

								<div>
									<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
										Bodega
									</label>
									<SelectReact
										name='warehouse_id'
										placeholder='Todas las bodegas'
										isLoading={warehousesLoading}
										options={warehouseFilterOptions}
										value={selectedWarehouseOption}
										onChange={(option) => {
											setWarehouseFilter((option as TSelectOption).value);
											setPage(1);
										}}
									/>
								</div>

								<div>
									<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
										Recepción Cliente/Prov.
									</label>
									<SelectReact
										name='customer_supplier_id'
										placeholder='Todos'
										isLoading={customerSuppliersLoading}
										options={customerSupplierFilterOptions}
										value={selectedCustomerSupplierOption}
										onChange={(option) => {
											setCustomerSupplierFilter(
												(option as TSelectOption).value,
											);
											setPage(1);
										}}
									/>
								</div>

								<div>
									<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
										Grado Sugerido Zentria
									</label>
									<SelectReact
										name='grade'
										placeholder='Todos los grados'
										options={GRADE_OPTIONS}
										value={selectedGradeOption}
										onChange={(option) => {
											setGradeFilter((option as TSelectOption).value);
											setPage(1);
										}}
									/>
								</div>
							</div>
						)}
					</CardBody>
				</Card>

				{/* Lista de Items con componente reutilizable */}
				<ItemList
					items={items}
					meta={itemsMeta}
					loading={loading}
					onPageChange={setPage}
					onLimitChange={setLimit}
					onItemClick={handleViewItem}
					variant='global'
					exportFileName='revisiones-globales'
					onExportFetchAll={fetchAllForExport}
				/>
			</Container>
		</PageWrapper>
	);
};

export default RefactorSeries;
