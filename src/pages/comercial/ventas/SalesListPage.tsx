import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import salesReducer, {
	loadSalesList,
	clearDetail,
	selectSalesList,
	selectSalesLoading,
} from '@/store/slices/salesSlice';
import type { SaleListItem, SalesListFilters } from '@/services/salesService';
import { formatCLP, translateStatus } from './utils';
import { formatDate } from '@/utils/format.utils';
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
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import SaleDetailPage from './SaleDetailPage';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';

// Inyección dinámica del reducer
injectReducer('salesModule', salesReducer);

const statusOptions: TSelectOption[] = [
	{ value: 'draft', label: 'Borrador' },
	{ value: 'pending', label: 'Pendiente' },
	{ value: 'on-hold', label: 'En espera de pago' },
	{ value: 'confirmed', label: 'Confirmado (legacy)' },
	{ value: 'processing', label: 'Procesando (pagado)' },
	{ value: 'paid', label: 'Pagado' },
	{ value: 'completed', label: 'Completado' },
	{ value: 'delivered', label: 'Entregado (legacy)' },
	{ value: 'cancelled', label: 'Cancelado' },
	{ value: 'refunded', label: 'Reembolsado' },
	// legacy no implementado: // { value: 'partially_paid', label: 'Parcialmente pagada (legacy)' },
];

const statusBadgeMap: Record<string, { color: TColors; intensity: TColorIntensity }> = {
	draft: { color: 'zinc', intensity: '500' },
	pending: { color: 'amber', intensity: '500' },
	'on-hold': { color: 'amber', intensity: '600' },
	confirmed: { color: 'blue', intensity: '500' },
	processing: { color: 'emerald', intensity: '400' },
	paid: { color: 'emerald', intensity: '500' },
	completed: { color: 'emerald', intensity: '600' },
	delivered: { color: 'emerald', intensity: '700' },
	cancelled: { color: 'rose', intensity: '500' },
	refunded: { color: 'purple', intensity: '500' },
	// legacy no implementado:
	// partially_paid: { color: 'amber', intensity: '500' },
};

const SalesListPage: React.FC = () => {
	const dispatch = useAppDispatch();

	const user = useAppSelector((s: any) => s.auth?.user);
	const personalization = useAppSelector((s: any) => s.personalizacion?.personalizacionUsuario);
	const subsidiaryId: number | null = useMemo(() => {
		return (
			personalization?.sucursal_principal ?? null
		);
	}, [user, personalization]);

	const rawList = useAppSelector(selectSalesList);
	const list: SaleListItem[] = Array.isArray(rawList) ? rawList : [];
	const loading = useAppSelector(selectSalesLoading);

	const [status, setStatus] = useState<string>('');
	const [wcOrderId, setWcOrderId] = useState<string>('');
	const [q, setQ] = useState<string>('');
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

useEffect(() => {
    if (!subsidiaryId) return;
    dispatch(loadSalesList({ subsidiaryId, filters: { with_customer: 1 } }));
}, [subsidiaryId, dispatch]);

	const summaryStats = useMemo(() => {
		const totalAmount = list.reduce<number>((acc, sale) => {
			const value = Number(sale.total_amount ?? 0);
			return acc + (Number.isFinite(value) ? value : 0);
		}, 0);
		const deliveredCount = list.filter(
			(sale: SaleListItem) => sale.status === 'delivered',
		).length;
		const inProgressCount = list.filter((sale: SaleListItem) =>
			['draft', 'confirmed', 'partially_paid', 'paid'].includes(
				(sale.status || '').toLowerCase(),
			),
		).length;
		const avgTicket = list.length ? totalAmount / list.length : 0;
		return { totalAmount, deliveredCount, inProgressCount, avgTicket };
	}, [list]);

	const statusValue = useMemo(
		() => statusOptions.find((option) => option.value === status) ?? null,
		[status],
	);

	const selectedSale = useMemo(
		() => list.find((sale) => sale.id === selectedSaleId) ?? null,
		[list, selectedSaleId],
	);

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

	const detailModalVisible = detailModalOpen && selectedSaleId !== null && Boolean(subsidiaryId);

	const columns = useMemo<ColumnDef<SaleListItem>[]>(
		() => [
			{
				accessorKey: 'sale_date',
				header: 'Fecha',
				cell: ({ row }) => (
					<div className='font-medium text-zinc-900 dark:text-zinc-100'>
						{row.original.sale_date ? formatDate(row.original.sale_date) : '—'}
					</div>
				),
			},
			{
				accessorKey: 'sale_number',
				header: 'Nº Venta',
				cell: ({ row }) => (
					<div className='text-sm text-zinc-700 dark:text-zinc-200'>
						{row.original.sale_number}
					</div>
				),
			},
			{
				accessorKey: 'wc_order_number',
				header: 'E-Commerce ID',
				cell: ({ row }) => (
					<div className='text-sm text-zinc-700 dark:text-zinc-200'>
						{row.original.wc_order_number || row.original.wc_order_id || '—'}
					</div>
				),
			},
			{
				accessorKey: 'customer',
				header: 'Cliente',
				cell: ({ row }) => (
					<div className='text-sm text-zinc-700 dark:text-zinc-200'>
						{row.original.customer?.name || '—'}
					</div>
				),
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
							variant='outline'>
							{translateStatus(row.original.status)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'total_amount',
				header: 'Total (CLP)',
				cell: ({ row }) => (
					<div className='text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						{formatCLP(row.original.total_amount || 0)}
					</div>
				),
			},
			{
				accessorKey: 'items_count',
				header: 'Ítems',
				cell: ({ row }) => (
					<div className='text-right text-sm text-zinc-700 dark:text-zinc-200'>
						{row.original.items_count ?? '—'}
					</div>
				),
			},
			{
				id: 'actions',
				header: () => <div className='text-right'>Acciones</div>,
				cell: ({ row }) => (
					<div className='flex justify-end'>
						<Button
							variant='outline'
							size='xs'
							icon='HeroEye'
							onClick={() => handleViewDetail(row.original.id)}
							isDisable={!subsidiaryId}>
							Detalle
						</Button>
					</div>
				),
				enableSorting: false,
				enableColumnFilter: false,
			},
		],
		[handleViewDetail, subsidiaryId],
	);

	const buildFilters = (): SalesListFilters => ({
		with_customer: 1 as const,
		status: status || undefined,
		wc_order_id: wcOrderId || undefined,
		q: q || undefined,
	});

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!subsidiaryId) return;
		dispatch(loadSalesList({ subsidiaryId, filters: buildFilters() }));
	};

	const handleResetFilters = () => {
		setStatus('');
		setWcOrderId('');
		setQ('');
		if (subsidiaryId) {
			dispatch(loadSalesList({ subsidiaryId, filters: { with_customer: 1 as const } }));
		}
	};

	const handleRefresh = () => {
		if (!subsidiaryId) return;
		dispatch(loadSalesList({ subsidiaryId, filters: buildFilters() }));
	};

	const emptyMessage = subsidiaryId
		? 'No encontramos ventas con los filtros aplicados'
		: 'Selecciona una empresa para cargar ventas';

	return (
		<>
			<PageWrapper title='Listado de Ventas'>
				<Subheader>
					<SubheaderLeft>
						<div>
							<Badge className='text-2xl font-semibold'>Lista de Ventas</Badge>
							<p>Consulta y administra las ventas registradas en el sistema.</p>
						</div>
					</SubheaderLeft>
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
										<div className='mr-4 flex h-12 w-12 items-center justify-center bg-green-200/20 p-1 rounded-lg border border-green-300'>
											<Icon icon='DuoDollar' size='text-3xl' color='green'/>
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
									<p className='text-xs text-zinc-500'>
										Monto total de las ventas listadas
									</p>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center bg-red-200/20 p-1 rounded-lg border border-red-300'>
											<Icon icon='DuoTicket' size='text-3xl' color='red'/>	
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
									<p className='text-xs text-zinc-500'>
										Promedio por venta mostrada
									</p>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center bg-amber-200/20 p-1 rounded-lg border border-amber-300'>
											<Icon icon='DuoSale1' size='text-3xl' color='amber' />
										</div>
										<span className='text-sm font-semibold text-zinc-400'>
											Ventas en proceso
										</span>
									</div>
								</CardHeader>
								<CardBody>
									<div className='text-2xl font-semibold text-blue-600 dark:text-blue-300'>
										{summaryStats.inProgressCount}
									</div>
									<p className='text-xs text-zinc-500'>
										Draft, procesando o pagadas
									</p>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<div className='mr-4 flex h-12 w-12 items-center justify-center bg-emerald-200/20 p-1 rounded-lg border border-emerald-400'>
										<Icon icon='DuoDoneCircle' size='text-3xl' color='emerald' />
										</div>
										<span className='text-sm font-semibold text-zinc-400'>
											Entregadas
										</span>
									</div>
								</CardHeader>
								<CardBody>
									<div className='text-2xl font-semibold text-emerald-600 dark:text-emerald-300'>
										{summaryStats.deliveredCount}
									</div>
									<p className='text-xs text-zinc-500'>
										Entregadas en esta vista
									</p>
								</CardBody>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Icon icon='DuoFilter' size='text-xl' />
									<CardTitle><Badge>Filtros de búsqueda</Badge></CardTitle>
								</div>
								<Button
									variant='outline'
									size='sm'
									icon='HeroXMark'
									onClick={handleResetFilters}
									isDisable={!subsidiaryId}>
									Limpiar
								</Button>
							</CardHeader>
							<CardBody>
								<form onSubmit={handleSubmit} className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
										<div>
											<label className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Estado
											</label>
											<SelectReact
												name='status'
												options={statusOptions}
												value={statusValue}
												isClearable
												placeholder='Todos los estados'
												onChange={(option) =>
													setStatus(
														(option as TSelectOption | null)?.value ??
															'',
													)
												}
											/>
										</div>

										<div>
											<label className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Nº Venta / Nº Woo
											</label>
											<Input
												type='text'
												name='search'
												placeholder='Buscar por número'
												value={q}
												onChange={(ev) => setQ(ev.target.value)}
											/>
										</div>
									</div>
									<div className='flex flex-wrap items-center gap-2'>
										<Button
											icon='HeroMagnifyingGlass'
											type='submit'
											isDisable={!subsidiaryId}>
											Aplicar filtros
										</Button>
										<Button
											variant='outline'
											size='sm'
											icon='HeroArrowPath'
											onClick={handleRefresh}
											isDisable={!subsidiaryId || loading}>
											Actualizar
										</Button>
									</div>
								</form>
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<div className='flex items-center gap-3'>
									<CardTitle>
										<Badge>Listado de ventas</Badge>
									</CardTitle>
								</div>
								<Button
									variant='outline'
									size='sm'
									icon='HeroArrowPath'
									onClick={handleRefresh}
									isDisable={!subsidiaryId || loading}>
									Refrescar
								</Button>
							</CardHeader>
							<CardBody>
								<DataTable<SaleListItem>
									columns={columns}
									data={list}
									loading={loading}
									emptyMessage={emptyMessage}
									pageSize={10}
								/>
							</CardBody>
						</Card>
					</div>
				</Container>
			</PageWrapper>
			{detailModalVisible && selectedSaleId && subsidiaryId && (
				<Modal
					isOpen={detailModalOpen}
					setIsOpen={handleDetailModalState}
					size='xl'
					isScrollable>
					<ModalHeader>
						<div className='flex flex-col'>
							<span className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
								Venta {selectedSale?.sale_number || `#${selectedSaleId}`}
							</span>
							<span className='text-sm font-normal text-zinc-500 dark:text-zinc-400'>
								Nº Woo:{' '}
								{selectedSale?.wc_order_number || selectedSale?.wc_order_id || '—'}
							</span>
						</div>
					</ModalHeader>
					<ModalBody isScrollable>
						<SaleDetailPage subsidiaryId={subsidiaryId} saleId={selectedSaleId} />
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button
								variant='outline'
								icon='HeroXMark'
								onClick={() => handleDetailModalState(false)}>
								Cerrar
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			)}
		</>
	);
};

export default SalesListPage;
