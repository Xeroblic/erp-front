import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import salesReducer, {
	loadSalesList,
	clearDetail,
	selectSalesList,
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

const SalesListPage: React.FC = () => {
	const dispatch = useAppDispatch();

	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const rawList = useAppSelector(selectSalesList);

	const list: ISale[] = Array.isArray(rawList) ? rawList : [];
	const loading = useAppSelector(selectSalesLoading);

	const [status, setStatus] = useState<string>('');
	const [wcOrderId, setWcOrderId] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
	const [isFiltering, setIsFiltering] = useState(false);
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
		}),
		[baseFilters, wcOrderId],
	);

	const debouncedServerFilters = useMemo<SalesListFilters>(
		() => ({
			...baseFilters,
			wc_order_id: debouncedWcOrderId || undefined,
		}),
		[baseFilters, debouncedWcOrderId],
	);

	const activeFilterCount = useMemo(() => {
		return [status, wcOrderId, searchTerm]
			.filter((value) => (value ?? '').toString().trim() !== '').length;
	}, [searchTerm, status, wcOrderId]);
	const filtersSummary = activeFilterCount
		? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} activos`
		: 'Sin filtros activos';

	const normalizedSearchTerm = useMemo(
		() => debouncedSearchTerm.trim().toLowerCase(),
		[debouncedSearchTerm],
	);
	const numericSearchTerm = useMemo(
		() => normalizedSearchTerm.replace(/[^\d]/g, ''),
		[normalizedSearchTerm],
	);

	const visibleSales = useMemo(() => {
		if (!normalizedSearchTerm) return list;

		const matchesText = (value?: string | number | null) => {
			if (value === null || typeof value === 'undefined') return false;
			return value.toString().toLowerCase().includes(normalizedSearchTerm);
		};

		const matchesNumeric = (value?: string | number | null) => {
			if (!numericSearchTerm) return false;
			if (value === null || typeof value === 'undefined') return false;
			const digitsOnly = value
				.toString()
				.replace(/[^\d]/g, '');
			if (!digitsOnly) return false;
			return digitsOnly.includes(numericSearchTerm);
		};

		return list.filter((sale) => {
			const { customer } = sale;
			const textualCandidates: Array<string | number | null | undefined> = [
				sale.sale_number,
				sale.notes,
				customer?.name,
				customer?.billing_company,
				customer?.primary_contact?.name,
				customer?.primary_contact?.email,
				customer?.rut,
				customer?.email,
				sale.wc_order_number,
				sale.wc_order_id ? sale.wc_order_id.toString() : undefined,
			];

			if (textualCandidates.some((candidate) => matchesText(candidate))) {
				return true;
			}

			const numericCandidates: Array<string | number | null | undefined> = [
				sale.total_amount,
				sale.pending_amount,
				sale.paid_amount,
				sale.sale_number,
				sale.wc_order_id,
			];

			return numericCandidates.some((candidate) => matchesNumeric(candidate));
		});
	}, [list, normalizedSearchTerm, numericSearchTerm]);

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
							onClick={() => handleViewDetail(row.original.id)}
							isDisable={!subsidiaryId}>
							<Icon icon='HeroEye' size='text-xl' />
						</Button>
						<Button
							variant='outline'
							size='xs'
							color='red'
							onClick={() => handleViewDetail(row.original.id)}
							isDisable={!subsidiaryId}>
							<Icon icon='HeroTrash' color='red' size='text-xl' />
						</Button>
					</div>
				),
				enableSorting: false,
				enableColumnFilter: false,
			},
		],
		[handleViewDetail, subsidiaryId],
	);

	const buildFilters = useCallback((): SalesListFilters => ({ ...serverFilters }), [
		serverFilters,
	]);

	const handleStatusChange = useCallback((option: TSelectOption | null) => {
		setStatus(option?.value ?? '');
	}, []);

	const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	}, []);

	const handleWooOrderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setWcOrderId(event.target.value);
	}, []);

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
		await applyFilters({ with_customer: 1 as const });
	}, [applyFilters]);

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
		? normalizedSearchTerm
			? 'No encontramos ventas que coincidan con la búsqueda aplicada'
			: 'No encontramos ventas con los filtros aplicados'
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
							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg border border-green-300 bg-green-200/20 p-1'>
											<Icon icon='DuoDollar' size='text-3xl' color='green' />
										</div>
										<span className='text-sm font-semibold text-zinc-400'>
											Total página
										</span>
									</div>
								</CardHeader>
								<CardBody>
									<div className='text-2xl font-semibold text-zinc-900 dark:text-white'>
										{formatCLP(summaryStats.totalAmount)}
									</div>
									<p className='text-xs text-zinc-500'>Monto total visible</p>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg border border-red-300 bg-red-200/20 p-1'>
											<Icon icon='DuoTicket' size='text-3xl' color='red' />
										</div>
										<span className='text-sm font-semibold text-zinc-400'>
											Ticket promedio
										</span>
									</div>
								</CardHeader>
								<CardBody>
									<div className='text-2xl font-semibold text-zinc-900 dark:text-white'>
										{formatCLP(Math.round(summaryStats.avgTicket))}
									</div>
									<p className='text-xs text-zinc-500'>Promedio por venta</p>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg border border-amber-300 bg-amber-200/20 p-1'>
											<Icon icon='DuoSale1' size='text-3xl' color='amber' />
										</div>
										<span className='text-sm font-semibold text-zinc-400'>
											En Proceso
										</span>
									</div>
								</CardHeader>
								<CardBody>
									<div className='text-2xl font-semibold text-blue-600 dark:text-blue-300'>
										{summaryStats.inProgressCount}
									</div>
									<p className='text-xs text-zinc-500'>
										Pendientes de cierre/entrega
									</p>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-400 bg-emerald-200/20 p-1'>
											<Icon
												icon='DuoDoneCircle'
												size='text-3xl'
												color='emerald'
											/>
										</div>
										<span className='text-sm font-semibold text-zinc-400'>
											Finalizadas
										</span>
									</div>
								</CardHeader>
								<CardBody>
									<div className='text-2xl font-semibold text-emerald-600 dark:text-emerald-300'>
										{summaryStats.deliveredCount}
									</div>
									<p className='text-xs text-zinc-500'>
										Completadas y Entregadas
									</p>
								</CardBody>
							</Card>
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
													handleStatusChange(option as TSelectOption | null)
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
												Filtra por cliente, notas internas, montos o número de
												venta.
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
									pageSize={15}
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
