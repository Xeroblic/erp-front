import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
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
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import ApiService from '@/services/ApiService';
import type { IItem } from '@/interface/technicalReviews.interface';
import { COMMERCIAL_STATUS_FILTER_OPTIONS } from '@/pages/technical-reviews/constants';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const buildItemsUrl = (entityType: 'branches' | 'subsidiaries', entityId: number, suffix = '') =>
	join(TECHNICAL_REVIEWS_PREFIX, `/${entityType}/${entityId}/technical-reviews${suffix}`);

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

const ItemsListPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();

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

	const effectiveSubsidiaryId =
		subsidiaryId ??
		personalizacionUsuario?.subsidiary_id ??
		currentUser?.subsidiary?.id ??
		currentUser?.branch?.subsidiary?.id ??
		null;
	const endpointEntityType: 'branches' | 'subsidiaries' = effectiveSubsidiaryId
		? 'subsidiaries'
		: 'branches';
	const endpointEntityId = effectiveSubsidiaryId ?? branchId;

	const handleViewItem = (itemId: number) => {
		navigate(`/technical-reviews/items/${itemId}`);
	};

	const handleCreateItem = () => {
		if (!branchId) {
			toast.error('Debes seleccionar una sucursal antes de crear una revisión');
			return;
		}
		// Navegar a la página de creación de revisión sin lote
		navigate('/technical-reviews/items/create');
	};

	// Fetch reference data
	useEffect(() => {
		if (branchId) {
			dispatch(
				fetchProductsList({
					entityParam: 'branches',
					entityId: branchId,
					params: { page: 1, per_page: 200 },
				}),
			);
			dispatch(
				fetchWarehouses({
					branchId,
					params: { page: 1, per_page: 200, is_active: true },
				}),
			);
		}
	}, [branchId, dispatch]);

	useEffect(() => {
		if (effectiveSubsidiaryId) {
			dispatch(
				fetchCustomerSuppliers({
					subsidiaryId: effectiveSubsidiaryId,
					with_suppliers: true,
					per_page: 1000,
				}),
			);
		}
	}, [effectiveSubsidiaryId, dispatch]);

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
			if (!endpointEntityId) return [];
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
					url: buildItemsUrl(endpointEntityType, endpointEntityId, '/items'),
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
			endpointEntityId,
			endpointEntityType,
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
		if (!branchId && !effectiveSubsidiaryId) return;
		dispatch(
			fetchItems({
				branchId,
				subsidiaryId: effectiveSubsidiaryId,
				params: queryParams,
			}),
		);
	}, [dispatch, branchId, effectiveSubsidiaryId, queryParams]);

	return (
		<PageWrapper name='technical-reviews-items' title='Ítems Globales' isProtectedRoute={true}>
			<Subheader className='mb-6 flex flex-col items-center justify-between'>
				<SubheaderLeft>
					<div className='flex items-center gap-4'>
						<div>
							<Icon icon='HeroQrCode' className='h-10 w-10' />
						</div>
						<div>
							<Badge className='text-2xl font-bold'>Ítems Globales</Badge>
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								Vista global de todos los equipos
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						color='emerald'
						className='bg-emerald-500'
						onClick={handleCreateItem}>
						<Icon icon='HeroPlus' className='mr-2 text-xl font-bold text-white' />
						Nueva Revisión
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container>
				{/* Header */}

				{/* KPIs */}
				{itemsMeta && itemsMeta.total > 0 && (
					<div className='mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
						<Card>
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
									<Icon
										icon='HeroQrCode'
										className='h-8 w-8 text-gray-400 dark:text-gray-600'
									/>
								</div>
							</CardBody>
						</Card>

						<Card>
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
										<p className='mt-1 text-[10px] text-gray-400'>
											en esta página
										</p>
									</div>
									<Icon
										icon='HeroClock'
										className='h-8 w-8 text-yellow-400 dark:text-yellow-600'
									/>
								</div>
							</CardBody>
						</Card>

						<Card>
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
										<p className='mt-1 text-[10px] text-gray-400'>
											en esta página
										</p>
									</div>
									<Icon
										icon='HeroWrenchScrewdriver'
										className='h-8 w-8 text-blue-400 dark:text-blue-600'
									/>
								</div>
							</CardBody>
						</Card>

						<Card>
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
										<p className='mt-1 text-[10px] text-gray-400'>
											en esta página
										</p>
									</div>
									<Icon
										icon='HeroCheckCircle'
										className='h-8 w-8 text-purple-400 dark:text-purple-600'
									/>
								</div>
							</CardBody>
						</Card>

						<Card>
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
										<p className='mt-1 text-[10px] text-gray-400'>
											en esta página
										</p>
									</div>
									<Icon
										icon='HeroShieldCheck'
										className='h-8 w-8 text-green-400 dark:text-green-600'
									/>
								</div>
							</CardBody>
						</Card>

						<Card>
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
										<p className='mt-1 text-[10px] text-gray-400'>
											en esta página
										</p>
									</div>
									<Icon
										icon='HeroShoppingCart'
										className='h-8 w-8 text-emerald-400 dark:text-emerald-600'
									/>
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

				<Card className='mb-6'>
					<CardBody>
						{/* Filtros Básicos */}
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							<div>
								<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
									Buscar
								</label>
								<Input
									name='search'
									placeholder='Serie o producto'
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>

							<div>
								<label className='mb-1 block text-xs font-semibold uppercase text-gray-500'>
									Tipo de equipo
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
						<div className='mt-4'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
								<Icon
									icon={showAdvancedFilters ? 'HeroChevronUp' : 'HeroChevronDown'}
									className='mr-2 h-4 w-4'
								/>
								Filtros Avanzados
							</Button>
						</div>

						{/* Filtros Avanzados */}
						{showAdvancedFilters && (
							<div className='mt-4 grid gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2 lg:grid-cols-4'>
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
										Cliente / Proveedor
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
										Grado
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

						<div className='mt-4 flex flex-wrap gap-2'>
							<Button
								variant='outline'
								size='sm'
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
								<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
								Limpiar filtros
							</Button>

							{/* Badge de filtros activos */}
							{(search ||
								equipmentType !== 'all' ||
								reviewStatus !== 'all' ||
								currentStatusFilter !== 'all' ||
								warehouseFilter !== 'all' ||
								customerSupplierFilter !== 'all' ||
								gradeFilter !== 'all') && (
								<span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
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
									filtros activos
								</span>
							)}
						</div>
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

export default ItemsListPage;
