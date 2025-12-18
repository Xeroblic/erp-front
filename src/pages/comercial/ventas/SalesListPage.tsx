import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import salesReducer, {
	loadSalesList,
	clearDetail,
	selectSalesList,
	selectSalesMeta,
	selectSalesLoading,
} from '@/store/slices/salesSlice';
import type { SalesListFilters } from '@/services/salesService';
import { formatCLP, translateStatus } from './utils';
// import ApiService from '@/services/ApiService';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import type { TColors } from '@/types/colors.type';
import type { TColorIntensity } from '@/types/colorIntensities.type';
import type { TIcons } from '@/types/icons.type';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
// import Tooltip from '@/components/ui/Tooltip';
import type { ISale } from '@/interface/sales.interface';
import SaleDetailPage from './detail/components/modals/SaleDetailPage';

injectReducer('salesModule', salesReducer);

const statusOptions: TSelectOption[] = [
	{ value: 'draft', label: 'Borrador' },
	{ value: 'pending', label: 'Pendiente' },
	{ value: 'on-hold', label: 'En espera de pago' },
	{ value: 'confirmed', label: 'Confirmado' },
	{ value: 'processing', label: 'Procesando (Pagado)' },
	{ value: 'paid', label: 'Pagado (Listo)' },
	{ value: 'completed', label: 'Completado' },
	{ value: 'delivered', label: 'Entregado' },
	{ value: 'cancelled', label: 'Cancelado' },
	{ value: 'refunded', label: 'Reembolsado' },
];

const statusBadgeMap: Record<string, { color: TColors; intensity: TColorIntensity }> = {
	draft: { color: 'zinc', intensity: '500' },
	pending: { color: 'amber', intensity: '500' },
	'on-hold': { color: 'orange', intensity: '500' },
	confirmed: { color: 'blue', intensity: '500' },
	processing: { color: 'emerald', intensity: '400' },
	paid: { color: 'emerald', intensity: '500' },
	completed: { color: 'emerald', intensity: '600' },
	delivered: { color: 'emerald', intensity: '700' },
	cancelled: { color: 'red', intensity: '500' },
	refunded: { color: 'purple', intensity: '500' },
};

const STATUS_FILTER_ID = 'sales-filter-status';
const SEARCH_FILTER_ID = 'sales-filter-search';
const WOO_FILTER_ID = 'sales-filter-woo';

type SummaryCardConfig = {
	key: string;
	title: string;
	description: string;
	value: string | number;
	icon: TIcons;
	iconColor: TColors;
	iconAccentClass: string;
	valueClass?: string;
};

const SalesListPage: React.FC = () => {
	const dispatch = useAppDispatch();

	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const rawList = useAppSelector(selectSalesList);
	const meta = useAppSelector(selectSalesMeta);

	const list: ISale[] = Array.isArray(rawList) ? rawList : [];
	const loading = useAppSelector(selectSalesLoading);

	const [status, setStatus] = useState<string>('');
	const [wcOrderId, setWcOrderId] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
	const [isFiltering, setIsFiltering] = useState(false);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 5,
	});
	const skipNextAutoFetchRef = useRef(false);
	const [debouncedWcOrderId] = useDebounce(wcOrderId, 400);
	const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
	// const [creatingQuote, setCreatingQuote] = useState(false);

	const statusValue = useMemo(
		() => statusOptions.find((option) => option.value === status) ?? null,
		[status],
	);
	const baseFilters = useMemo<Pick<SalesListFilters, 'with_customer' | 'status'>>(
		() => ({
			with_customer: 1 as const,
			status: status || undefined,
		}),
		[status],
	);

	const serverFilters = useMemo<SalesListFilters>(
		() => ({
			...baseFilters,
			wc_order_id: wcOrderId || undefined,
			page: pagination.pageIndex + 1,
			per_page: pagination.pageSize,
		}),
		[baseFilters, wcOrderId, pagination],
	);

	const debouncedServerFilters = useMemo<SalesListFilters>(
		() => ({
			...baseFilters,
			wc_order_id: debouncedWcOrderId || undefined,
			q: debouncedSearchTerm || undefined,
			page: pagination.pageIndex + 1,
			per_page: pagination.pageSize,
		}),
		[baseFilters, debouncedWcOrderId, debouncedSearchTerm, pagination],
	);

	const activeFilterCount = useMemo(() => {
		return [status, wcOrderId, searchTerm].filter(
			(value) => (value ?? '').toString().trim() !== '',
		).length;
	}, [searchTerm, status, wcOrderId]);
	const filtersSummary = activeFilterCount
		? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} activos`
		: 'Sin filtros activos';

	// Server-side pagination: el backend hace la búsqueda, no filtramos client-side
	const visibleSales = list;

	const summaryStats = useMemo(() => {
		const totalAmount = visibleSales.reduce<number>((acc, sale) => {
			const value = Number(sale.total_amount ?? 0);
			return acc + (Number.isFinite(value) ? value : 0);
		}, 0);

		const deliveredCount = visibleSales.filter((sale: ISale) =>
			['completed', 'delivered'].includes(sale.status),
		).length;

		const inProgressCount = visibleSales.filter((sale: ISale) =>
			['draft', 'confirmed', 'processing', 'paid'].includes(
				(sale.status || '').toLowerCase(),
			),
		).length;

		const avgTicket = visibleSales.length ? totalAmount / visibleSales.length : 0;
		return { totalAmount, deliveredCount, inProgressCount, avgTicket };
	}, [visibleSales]);

	const summaryCards = useMemo<SummaryCardConfig[]>(
		() => [
			{
				key: 'page-total',
				title: 'Total página',
				description: 'Monto total visible',
				value: formatCLP(summaryStats.totalAmount),
				icon: 'DuoDollar',
				iconColor: 'emerald',
				iconAccentClass: 'border-emerald-200/70 bg-emerald-50 text-emerald-600',
				valueClass: 'text-emerald-700 dark:text-emerald-200',
			},
			{
				key: 'avg-ticket',
				title: 'Ticket promedio',
				description: 'Promedio por venta',
				value: formatCLP(Math.round(summaryStats.avgTicket)),
				icon: 'DuoTicket',
				iconColor: 'rose',
				iconAccentClass: 'border-rose-200/70 bg-rose-50 text-rose-500',
				valueClass: 'text-rose-600 dark:text-rose-200',
			},
			{
				key: 'in-progress',
				title: 'En Proceso',
				description: 'Pendientes de cierre/entrega',
				value: summaryStats.inProgressCount,
				icon: 'DuoSale1',
				iconColor: 'amber',
				iconAccentClass: 'border-amber-200/70 bg-rose-50 text-amber-500',
				valueClass: 'text-amber-600 dark:text-amber-200',
			},
			{
				key: 'delivered',
				title: 'Finalizadas',
				description: 'Completadas y Entregadas',
				value: summaryStats.deliveredCount,
				icon: 'DuoDoneCircle',
				iconColor: 'emerald',
				iconAccentClass: 'border-emerald-200/70 bg-emerald-50 text-emerald-500',
				valueClass: 'text-emerald-600 dark:text-emerald-200',
			},
		],
		[summaryStats],
	);

	// const selectedSale = useMemo(
	// 	() => list.find((sale) => sale.id === selectedSaleId) ?? null,
	// 	[list, selectedSaleId],
	// );

	const handleDetailModalState = useCallback(
		(nextOpen: boolean | ((prev: boolean) => boolean)) => {
			setDetailModalOpen((prev) => {
				const resolved =
					typeof nextOpen === 'function'
						? (nextOpen as (value: boolean) => boolean)(prev)
						: nextOpen;
				if (!resolved) {
					setSelectedSaleId(null);
					dispatch(clearDetail());
				}
				return resolved;
			});
		},
		[dispatch],
	);

	const handleViewDetail = useCallback(
		(saleId: number) => {
			setSelectedSaleId(saleId);
			handleDetailModalState(true);
		},
		[handleDetailModalState],
	);

	// const handleCreateSale = () => {
	// 	navigate('/comercial/ventas/crear');
	// };

	const detailModalVisible = detailModalOpen && selectedSaleId !== null && Boolean(subsidiaryId);

	const columns = useMemo<ColumnDef<ISale>[]>(
		() => [
			{
				accessorKey: 'sale_date',
				header: 'Fecha',
				cell: ({ row }) => (
					<div className='font-medium text-zinc-900 dark:text-zinc-100'>
						{/* Arreglar formatDate */}
						{/* {row.original.sale_date ? formatDate(row.original.sale_date) : '—'} */}
						{row.original.sale_date ? row.original.sale_date : '—'}
					</div>
				),
			},
			{
				accessorKey: 'sale_number',
				header: 'Nº Venta',
				cell: ({ row }) => (
					<div className='text-sm font-bold text-zinc-700 dark:text-zinc-200'>
						{row.original.sale_number}
					</div>
				),
			},
			{
				accessorKey: 'customer',
				header: 'Cliente',
				cell: ({ row }) => {
					const { customer } = row.original;
					const name =
						customer?.name ||
						customer?.billing_company ||
						`${customer?.primary_contact?.name || ''}`.trim() ||
						'Cliente sin nombre';
					const rut = customer?.rut || 'S/RUT';
					const email = customer?.email || customer?.primary_contact?.email;

					return (
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
								{name}
							</span>
							<span className='text-xs text-zinc-500'>{rut}</span>
							{email && <span className='text-xs text-zinc-400'>{email}</span>}
						</div>
					);
				},
			},
			{
				accessorKey: 'status',
				header: 'Estado',
				cell: ({ row }) => {
					const currentStatus = (row.original.status || '').toLowerCase();
					const badgeConfig = statusBadgeMap[currentStatus] ?? {
						color: 'zinc',
						intensity: '500',
					};
					return (
						<Badge
							color={badgeConfig.color}
							colorIntensity={badgeConfig.intensity}
							variant='solid'
							className='rounded-md'>
							{translateStatus(row.original.status)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'total_amount',
				header: 'Total (CLP)',
				cell: ({ row }) => (
					<div className='text-right text-sm font-bold text-zinc-900 dark:text-zinc-100'>
						{formatCLP(row.original.total_amount || 0)}
					</div>
				),
			},
			{
				accessorKey: 'items_count',
				header: 'Ítems',
				cell: ({ row }) => (
					<div className='text-center text-sm text-zinc-500'>
						{row.original.items_count ?? 0}
					</div>
				),
			},
			{
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => (
					<div className='flex justify-center gap-2'>
						<Button
							variant='outline'
							size='xs'
							color='violet'
							className='bg-violet-500/20'
							onClick={() => handleViewDetail(row.original.id)}
							isDisable={!subsidiaryId}>
							<Icon
								icon='HeroEye'
								color='violet'
								className='hover:text-bold hover:text-violet-600'
								size='text-xl'
							/>
						</Button>
						<Button
							variant='outline'
							size='xs'
							color='red'
							className='bg-red-200/30'
							onClick={() => handleViewDetail(row.original.id)}
							isDisable={!subsidiaryId}>
							<Icon
								icon='HeroTrash'
								color='red'
								className='hover:text-bold hover:text-red-600'
								size='text-xl'
							/>
						</Button>
					</div>
				),
				enableSorting: false,
				enableColumnFilter: false,
			},
		],
		[handleViewDetail, subsidiaryId],
	);

	const buildFilters = useCallback(
		(): SalesListFilters => ({ ...serverFilters }),
		[serverFilters],
	);

	const handleStatusChange = useCallback(
		(option: TSelectOption | null) => {
			setStatus(option?.value ?? '');
			// Resetear a página 1 cuando cambia el status
			setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
		},
		[pagination.pageSize],
	);

	const handleSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(event.target.value);
			// Resetear a página 1 cuando cambia la búsqueda
			setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
		},
		[pagination.pageSize],
	);

	const handleWooOrderChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setWcOrderId(event.target.value);
			// Resetear a página 1 cuando cambia el filtro de WooCommerce
			setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
		},
		[pagination.pageSize],
	);

	const applyFilters = useCallback(
		async (filters: SalesListFilters) => {
			if (!subsidiaryId) return;
			setIsFiltering(true);
			try {
				await dispatch(loadSalesList({ subsidiaryId, filters })).unwrap();
			} catch (error) {
				console.error('Error al aplicar filtros en ventas', error);
				const message =
					typeof error === 'string'
						? error
						: 'No se pudieron actualizar las ventas filtradas. Intenta nuevamente.';
				toast.error(message);
			} finally {
				setIsFiltering(false);
			}
		},
		[dispatch, subsidiaryId],
	);

	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			await applyFilters(buildFilters());
		},
		[applyFilters, buildFilters],
	);

	const handleResetFilters = useCallback(async () => {
		skipNextAutoFetchRef.current = true;
		setStatus('');
		setWcOrderId('');
		setSearchTerm('');
		// Resetear a página 1
		setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
		await applyFilters({
			with_customer: 1 as const,
			page: 1,
			per_page: pagination.pageSize,
		});
	}, [applyFilters, pagination.pageSize]);

	// Handler para cambios de paginación (cuando el usuario cambia de página)
	const handlePaginationChange = useCallback(
		(updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
			setPagination(updater);
		},
		[],
	);

	// const handleRefresh = () => {
	//     if (!subsidiaryId) return;
	//     dispatch(loadSalesList({ subsidiaryId, filters: buildFilters() }));
	// };

	useEffect(() => {
		if (!subsidiaryId) return;
		if (skipNextAutoFetchRef.current) {
			skipNextAutoFetchRef.current = false;
			return;
		}
		const filtersToApply: SalesListFilters = { ...debouncedServerFilters };
		applyFilters(filtersToApply);
	}, [applyFilters, debouncedServerFilters, subsidiaryId]);

	const filtersBusy = loading || isFiltering;

	const emptyMessage = subsidiaryId
		? searchTerm || status || wcOrderId
			? 'No encontramos ventas que coincidan con los filtros aplicados'
			: 'No hay ventas registradas'
		: 'Selecciona una empresa para cargar ventas';

	return (
		<>
			<PageWrapper title='Listado de Ventas'>
				<Subheader>
					<SubheaderLeft>
						<div>
							<Badge className='mb-1 text-2xl font-semibold'>Ventas</Badge>
							<p className='text-sm text-zinc-500'>
								Consulta y administra las ventas registradas.
							</p>
						</div>
					</SubheaderLeft>
					{/* <SubheaderRight>
						<Tooltip text='Nueva Venta' placement='top-start'>
							<Button
								variant='solid'
								icon='HeroPlus'
								onClick={handleCreateSale}
								isDisable={!subsidiaryId}>
								Nueva Venta
							</Button>
						</Tooltip>
					</SubheaderRight> */}
				</Subheader>
				<Container>
					<div className='space-y-6'>
						{!subsidiaryId && (
							<Alert
								icon='HeroInformationCircle'
								variant='outline'
								color='amber'
								colorIntensity='500'>
								Selecciona una sucursal o empresa para visualizar las ventas
								disponibles.
							</Alert>
						)}

						<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
							{summaryCards.map(
								({
									key,
									title,
									description,
									value,
									icon,
									iconColor,
									iconAccentClass,
									valueClass,
								}) => (
									<Card
										key={key}
										className='h-full border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
										<CardBody className='flex items-center gap-4'>
											<div
												className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl ${iconAccentClass}`}>
												<Icon
													icon={icon}
													size='text-2xl'
													color={iconColor}
												/>
											</div>
											<div className='flex flex-col'>
												<span className='text-sm font-semibold text-zinc-500 dark:text-zinc-300'>
													{title}
												</span>
												<span
													className={`text-2xl font-semibold text-zinc-900 dark:text-white ${valueClass ?? ''}`}>
													{value}
												</span>
												<p className='text-xs text-zinc-500 dark:text-zinc-400'>
													{description}
												</p>
											</div>
										</CardBody>
									</Card>
								),
							)}
						</div>

						<Card>
							<CardHeader>
								<div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-3'>
									<div className='flex items-center gap-2'>
										<Icon icon='DuoFilter' size='text-xl' />
										<CardTitle>
											<Badge>Filtros</Badge>
										</CardTitle>
									</div>
									<span className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
										{filtersSummary}
									</span>
								</div>
								<Button
									variant='outline'
									size='sm'
									icon='HeroXMark'
									onClick={async () => {
										await handleResetFilters();
									}}
									isDisable={!subsidiaryId || filtersBusy}
									isLoading={isFiltering}>
									Limpiar
								</Button>
							</CardHeader>
							<CardBody>
								<form
									onSubmit={handleSubmit}
									className='space-y-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
										<div className='lg:col-span-1'>
											<label
												htmlFor={STATUS_FILTER_ID}
												className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Estado
											</label>
											<SelectReact
												name='status'
												inputId={STATUS_FILTER_ID}
												options={statusOptions}
												value={statusValue}
												isClearable
												placeholder='Todos'
												onChange={(option) =>
													handleStatusChange(
														option as TSelectOption | null,
													)
												}
											/>
										</div>

										<div className='lg:col-span-2'>
											<label
												htmlFor={SEARCH_FILTER_ID}
												className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Búsqueda
											</label>
											<Input
												id={SEARCH_FILTER_ID}
												type='text'
												name='search'
												placeholder='Clientes, totales o Nº de venta'
												value={searchTerm}
												onChange={handleSearchChange}
											/>
											<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
												Filtra por cliente, notas internas, montos o número
												de venta.
											</p>
										</div>

										<div className='lg:col-span-1'>
											<label
												htmlFor={WOO_FILTER_ID}
												className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Orden WooCommerce
											</label>
											<Input
												id={WOO_FILTER_ID}
												type='text'
												name='woocommerce'
												placeholder='ID exacto'
												value={wcOrderId}
												onChange={handleWooOrderChange}
											/>
											<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
												Ingresa el Nº exacto proveniente de WooCommerce.
											</p>
										</div>
									</div>
									{/* <div className='flex flex-wrap items-center justify-end gap-3'>
										<Button
											icon='HeroMagnifyingGlass'
											type='submit'
											variant='solid'
											isDisable={!subsidiaryId || filtersBusy}
											isLoading={isFiltering}>
											Aplicar filtros
										</Button>
									</div> */}
								</form>
							</CardBody>
						</Card>

						<Card>
							<CardBody className='p-0'>
								<DataTable<ISale>
									columns={columns}
									data={visibleSales}
									loading={loading}
									emptyMessage={emptyMessage}
									manualPagination
									pageCount={meta?.last_page ?? 1}
									paginationState={pagination}
									onPaginationChange={handlePaginationChange}
								/>
							</CardBody>
						</Card>
					</div>
				</Container>
			</PageWrapper>

			{detailModalVisible && selectedSaleId && subsidiaryId && (
				<SaleDetailPage
					subsidiaryId={subsidiaryId}
					saleId={selectedSaleId}
					isOpen={detailModalVisible}
					onClose={() => handleDetailModalState(false)}
				/>
			)}
		</>
	);
};

export default SalesListPage;
