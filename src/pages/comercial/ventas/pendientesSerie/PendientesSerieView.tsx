import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DataTable from '@/components/ui/DataTable';
import type { TColors } from '@/types/colors.type';
import { formatDate } from '@/utils/format.utils';
import type { PendingSerialSale } from '@/services/salesService';
import CloseSaleModal from '@/pages/comercial/ventas/detail/components/modals/CloseSaleModal';
import SaleDetailPage from '@/pages/comercial/ventas/detail/components/modals/SaleDetailPage';
import { pendingSerialToSaleItems } from '../utils';
import { usePendientesSerie } from './hooks/usePendientesSerie';
import Tooltip from '@/components/ui/Tooltip';

const statusColor: Record<string, TColors> = {
	pending: 'amber',
	'on-hold': 'orange',
	confirmed: 'blue',
	processing: 'emerald',
	paid: 'emerald',
	completed: 'emerald',
};

const PendientesSerieView: React.FC = () => {
	const { data, state, search, pagination, actions } = usePendientesSerie();
	const [assignSale, setAssignSale] = useState<PendingSerialSale | null>(null);
	const [detailSaleId, setDetailSaleId] = useState<number | null>(null);

	const openAssign = useCallback((sale: PendingSerialSale) => setAssignSale(sale), []);
	const closeAssign = useCallback(() => setAssignSale(null), []);
	const openDetail = useCallback((saleId: number) => setDetailSaleId(saleId), []);
	const closeDetail = useCallback(() => setDetailSaleId(null), []);

	const columns = useMemo<ColumnDef<PendingSerialSale>[]>(
		() => [
			{
				accessorKey: 'sale_number',
				header: 'N° Venta',
				cell: ({ row }) => {
					const sale = row.original;
					return (
						<div className='flex flex-col gap-0.5'>
							<span className='font-semibold text-zinc-900 dark:text-zinc-100'>
								{sale.sale_number}
							</span>
							{sale.wc_order_number && (
								<span className='text-xs text-zinc-500'>
									Woo #{sale.wc_order_number}
								</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'customer_name',
				header: 'Cliente',
				cell: ({ row }) => row.original.customer_name || '—',
			},
			{
				accessorKey: 'status',
				header: 'Estado',
				cell: ({ row }) => (
					<Badge variant='outline' color={statusColor[row.original.status] ?? 'zinc'}>
						{row.original.status}
					</Badge>
				),
			},
			{
				id: 'pending_series',
				header: 'Series pendientes',
				cell: ({ row }) => {
					const items = row.original.serialized_items ?? [];
					const units = items.reduce((sum, it) => sum + (it.hold_quantity || 0), 0);
					return (
						<div className='flex flex-col gap-0.5'>
							<span className='font-semibold'>{units} unidad(es)</span>
							<span className='text-xs text-zinc-500'>
								{items.length} producto(s)
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Fecha',
				cell: ({ row }) => formatDate(row.original.created_at),
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => (
					<div className='flex justify-end gap-2'>
						<Tooltip text='Ver detalle'>
							<Button
								variant='outline'
								color='violet'
								className='group bg-violet-500/10 hover:bg-violet-500/20'
								onClick={() => openDetail(row.original.id)}>
								<Icon
									icon='HeroEye'
									className='text-xl text-violet-500 group-hover:text-violet-400'
								/>
							</Button>
						</Tooltip>
						<Tooltip text='Asignar series'>
							<Button
								variant='solid'
								color='lime'
								icon='HeroQrCode'
								onClick={() => openAssign(row.original)}>
								Asignar series
							</Button>
						</Tooltip>
					</div>
				),
			},
		],
		[openAssign, openDetail],
	);

	return (
		<PageWrapper isProtectedRoute title='Ventas pendientes de serie'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroQrCode' className='text-2xl' />
					<span>Comercial / Pendientes de serie</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Badge variant='outline' color='amber'>
						{data.total} pendiente(s)
					</Badge>
				</SubheaderRight>
			</Subheader>

			<Container>
				{!state.hasValidBranch && (
					<Alert color='amber' variant='outline' icon='HeroExclamationTriangle'>
						No hay una sucursal/subsidiaria activa para listar las ventas pendientes.
					</Alert>
				)}

				{state.error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						className='mt-2'>
						{state.error}
					</Alert>
				)}

				<Card className='mt-2'>
					<CardHeader>
						<CardTitle>Ventas pendientes de asignar serie</CardTitle>
					</CardHeader>
					<CardBody>
						<DataTable<PendingSerialSale>
							columns={columns}
							data={data.list}
							loading={state.loading}
							emptyMessage={state.emptyMessage}
							enableSearch
							searchValue={search.value}
							onSearchChange={search.onChange}
							searchPlaceholder='Buscar por cliente o N° de venta...'
							manualPagination
							pageCount={data.pageCount}
							paginationState={pagination.state}
							onPaginationChange={pagination.onChange}
						/>
					</CardBody>
				</Card>
			</Container>

			{assignSale && state.subsidiaryId && (
				<CloseSaleModal
					open={Boolean(assignSale)}
					onClose={closeAssign}
					subsidiaryId={state.subsidiaryId}
					saleId={assignSale.id}
					items={pendingSerialToSaleItems(assignSale)}
					onSuccess={() => {
						closeAssign();
						actions.refetch();
					}}
				/>
			)}

			{detailSaleId && state.subsidiaryId && (
				<SaleDetailPage
					subsidiaryId={state.subsidiaryId}
					saleId={detailSaleId}
					isOpen={Boolean(detailSaleId)}
					onClose={closeDetail}
				/>
			)}
		</PageWrapper>
	);
};

export default PendientesSerieView;
