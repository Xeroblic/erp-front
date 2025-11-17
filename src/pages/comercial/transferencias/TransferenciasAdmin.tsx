import React, { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Pagination from '@/components/ui/Pagination';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchTransfers,
	setFilters,
	clearFilters,
	selectTransfers,
	selectTransfersLoading,
	selectTransfersPagination,
	selectTransferFilters,
	selectTransferActionLoading,
	createTransfer,
} from '@/store/slices/transfers/transfersSlice';
import type {
	ICreateTransferRequest,
	ITransfer,
	TransferDirection,
} from '@/interface/transfers.interface';
import { CreateEditTransferModal, TransferDetailModal } from './components';
import TransfersTable from './components/tables/TransfersTable';

const directionOptions: { label: string; value: TransferDirection }[] = [
	{ label: 'Todas', value: 'all' },
	{ label: 'Enviadas', value: 'sent' },
	{ label: 'Recibidas', value: 'received' },
];

interface TransferenciasAdminProps {
	title?: string;
	subtitle?: string;
}

const TransferenciasAdmin: React.FC<TransferenciasAdminProps> = ({
	title = 'Historial de transferencias',
	subtitle = 'Gestiona el movimiento de productos entre tus sucursales.',
}) => {
	const dispatch = useAppDispatch();
	const transfers = useAppSelector(selectTransfers);
	const loading = useAppSelector(selectTransfersLoading);
	const pagination = useAppSelector(selectTransfersPagination);
	const filters = useAppSelector(selectTransferFilters);
	const { create: createLoading } = useAppSelector(selectTransferActionLoading);

	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [detailTransfer, setDetailTransfer] = useState<ITransfer | null>(null);
	const [localFilters, setLocalFilters] = useState({
		direction: filters.direction,
		q: filters.q,
		per_page: filters.per_page,
	});

	useEffect(() => {
		dispatch(fetchTransfers(undefined));
	}, [dispatch]);

	useEffect(() => {
		setLocalFilters(filters);
	}, [filters.direction, filters.q, filters.per_page]);

	const stats = useMemo(() => {
		const sent = transfers.filter((transfer) => transfer.direction === 'sent').length;
		const received = transfers.filter(
			(transfer) => transfer.direction === 'received',
		).length;
		const completed = transfers.filter(
			(transfer) => transfer.status === 'completed',
		).length;

		return {
			total: pagination.totalTransfers,
			sent,
			received,
			completed,
		};
	}, [transfers, pagination.totalTransfers]);

	const refreshList = (page?: number) => {
		dispatch(
			fetchTransfers({
				page,
				direction: localFilters.direction,
				q: localFilters.q,
				per_page: localFilters.per_page,
			}),
		);
	};

	const handleApplyFilters = () => {
		dispatch(setFilters(localFilters));
		refreshList(1);
	};

	const handleClearFilters = () => {
		const reset = { direction: 'all' as TransferDirection, q: '', per_page: 15 };
		setLocalFilters(reset);
		dispatch(clearFilters());
		dispatch(fetchTransfers({ page: 1, ...reset }));
	};

	const handleCreateTransfer = async (payload: ICreateTransferRequest) => {
		try {
			await dispatch(createTransfer(payload)).unwrap();
			setCreateModalOpen(false);
			refreshList(1);
		} catch (error) {
			throw error;
		}
	};

	return (
		<PageWrapper name='transfers-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
							<Icon icon='HeroArrowsRightLeft' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h1 className='text-2xl font-semibold text-gray-900 dark:text-white'>
								{title}
							</h1>
							<p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='outline'
						icon='HeroArrowPath'
						onClick={() => refreshList(pagination.currentPage)}
						disabled={loading}>
						Actualizar
					</Button>
					<PermissionGuard permissions={[ERP_PERMISSIONS.TRANSFERS.CREATE]}>
						<Button
							variant='solid'
							icon='HeroPlus'
							onClick={() => setCreateModalOpen(true)}>
							Nueva transferencia
						</Button>
					</PermissionGuard>
				</SubheaderRight>
			</Subheader>

			<Container className='pb-8'>
				<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody>
							<p className='text-sm text-gray-500'>Transferencias totales</p>
							<p className='text-3xl font-semibold text-gray-900 dark:text-white'>
								{stats.total}
							</p>
						</CardBody>
					</Card>
					<Card>
						<CardBody>
							<p className='text-sm text-gray-500'>Enviadas</p>
							<p className='text-3xl font-semibold text-blue-600 dark:text-blue-400'>
								{stats.sent}
							</p>
						</CardBody>
					</Card>
					<Card>
						<CardBody>
							<p className='text-sm text-gray-500'>Recibidas</p>
							<p className='text-3xl font-semibold text-emerald-600 dark:text-emerald-400'>
								{stats.received}
							</p>
						</CardBody>
					</Card>
					<Card>
						<CardBody>
							<p className='text-sm text-gray-500'>Completadas</p>
							<p className='text-3xl font-semibold text-violet-600 dark:text-violet-400'>
								{stats.completed}
							</p>
						</CardBody>
					</Card>
				</div>

				<Card className='mb-6'>
					<CardHeader>
						<CardTitle>Filtros</CardTitle>
					</CardHeader>
					<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<div className='flex flex-col space-y-1'>
							<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
								Dirección
							</label>
							<Select
								name='direction-filter'
								value={localFilters.direction}
								onChange={(event) =>
									setLocalFilters((prev) => ({
										...prev,
										direction: event.target.value as TransferDirection,
									}))
								}>
								{directionOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
						<div className='flex flex-col space-y-1'>
							<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
								Buscar por código o nota
							</label>
							<Input
								name='search-filter'
								placeholder='Ej. TRF-001 o notas relevantes'
								value={localFilters.q}
								onChange={(event) =>
									setLocalFilters((prev) => ({ ...prev, q: event.target.value }))
								}
							/>
						</div>
						<div className='flex flex-col space-y-1'>
							<label className='text-sm font-medium text-gray-600 dark:text-gray-300'>
								Items por página
							</label>
							<Select
								name='per-page-filter'
								value={String(localFilters.per_page)}
								onChange={(event) =>
									setLocalFilters((prev) => ({
										...prev,
										per_page: Number(event.target.value),
									}))
								}>
								{[10, 15, 25, 50].map((size) => (
									<option key={size} value={String(size)}>
										{size}
									</option>
								))}
							</Select>
						</div>
						<div className='flex items-end space-x-2'>
							<Button
								variant='solid'
								icon='HeroMagnifyingGlass'
								onClick={handleApplyFilters}
								disabled={loading}>
								Aplicar
							</Button>
							<Button
								variant='outline'
								icon='HeroXMark'
								onClick={handleClearFilters}
								disabled={loading}>
								Limpiar
							</Button>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Listado ({pagination.totalTransfers})</CardTitle>
						</div>
					</CardHeader>
					<CardBody className='px-0'>
						<TransfersTable
							transfers={transfers}
							isLoading={loading}
							onView={(transfer) => setDetailTransfer(transfer)}
						/>
					</CardBody>
					{pagination.totalPages > 1 && (
						<div className='px-4 pb-4'>
							<Pagination
								currentPage={pagination.currentPage}
								totalPages={pagination.totalPages}
								onPageChange={(page) => refreshList(page)}
							/>
						</div>
					)}
				</Card>
			</Container>

			<CreateEditTransferModal
				isOpen={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSubmit={handleCreateTransfer}
				isLoading={createLoading}
			/>

			<TransferDetailModal
				isOpen={Boolean(detailTransfer)}
				onClose={() => setDetailTransfer(null)}
				transfer={detailTransfer}
			/>
		</PageWrapper>
	);
};

export default TransferenciasAdmin;
