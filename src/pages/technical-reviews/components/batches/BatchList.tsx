/**
 * BatchList - Tabla de lotes con filtros y búsqueda
 * Muestra listado paginado de lotes con sus datos principales
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import type { IBatch, ListMeta } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
	type PaginationState,
	type Updater,
} from '@tanstack/react-table';
import Input from '@/components/form/Input';

interface BatchListProps {
	batches: IBatch[];
	meta: ListMeta;
	loading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onSearch?: (query: string) => void;
	onStatusFilter?: (status: string) => void;
}

const columnHelper = createColumnHelper<IBatch>();

const BatchList: React.FC<BatchListProps> = ({
	batches,
	meta,
	loading = false,
	onPageChange,
	onLimitChange,
	onSearch,
	onStatusFilter,
}) => {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedStatus, setSelectedStatus] = useState<string>('all');
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: Math.max((meta?.current_page ?? 1) - 1, 0),
		pageSize: meta?.per_page ?? 10,
	});

	useEffect(() => {
		setPagination((prev) => {
			const next: PaginationState = {
				pageIndex: Math.max((meta?.current_page ?? 1) - 1, 0),
				pageSize: meta?.per_page ?? prev.pageSize,
			};

			if (prev.pageIndex === next.pageIndex && prev.pageSize === next.pageSize) {
				return prev;
			}

			return next;
		});
	}, [meta?.current_page, meta?.per_page]);

	const handlePaginationChange = useCallback(
		(updater: Updater<PaginationState>) => {
			setPagination((prev) => {
				const next = typeof updater === 'function' ? updater(prev) : updater;

				if (next.pageIndex !== prev.pageIndex) {
					onPageChange?.(next.pageIndex + 1);
				}

				if (next.pageSize !== prev.pageSize) {
					onLimitChange?.(next.pageSize);
				}

				return next;
			});
		},
		[onLimitChange, onPageChange],
	);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch?.(searchQuery);
	};

	const handleStatusChange = (status: string) => {
		setSelectedStatus(status);
		onStatusFilter?.(status);
	};

	const handleViewBatch = useCallback(
		(batchId: number) => {
			navigate(`/technical-reviews/batches/${batchId}`);
		},
		[navigate],
	);

	const columns = useMemo(
		() => [
			columnHelper.accessor('id', {
				header: 'ID',
				cell: (info) => (
					<span className='font-medium text-gray-900 dark:text-gray-100'>
						#{info.getValue()}
					</span>
				),
			}),
			columnHelper.display({
				id: 'warehouse',
				header: 'Bodega',
				cell: (info) => (
					<div className='flex items-center gap-2'>
						<Icon icon='HeroHomeModern' className='h-4 w-4 text-gray-400' />
						<span className='text-sm text-gray-700 dark:text-gray-300'>
							{info.row.original.warehouse?.name || 'N/A'}
						</span>
					</div>
				),
			}),
			columnHelper.display({
				id: 'supplier',
				header: 'Proveedor',
				cell: (info) => (
					<div className='flex items-center gap-2'>
						<Icon icon='HeroTruck' className='h-4 w-4 text-gray-400' />
						<span className='text-sm text-gray-700 dark:text-gray-300'>
							{info.row.original.customer_supplier?.name || 'N/A'}
						</span>
					</div>
				),
			}),
			columnHelper.display({
				id: 'entryDate',
				header: 'Fecha Entrada',
				cell: (info) => {
					const formattedDate = info.row.original.entry_date
						? new Date(info.row.original.entry_date).toLocaleDateString()
						: 'Sin fecha';

					return (
						<div className='flex items-center gap-2'>
							<Icon icon='HeroCalendar' className='h-4 w-4 text-gray-400' />
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{formattedDate}
							</span>
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'quantity',
				header: 'Cantidad',
				cell: (info) => {
					const { received_quantity = 0, expected_quantity } = info.row.original;
					return (
						<div className='text-sm'>
							<span className='font-medium text-gray-900 dark:text-gray-100'>
								{received_quantity}
							</span>
							<span className='text-gray-500'> / </span>
							<span className='text-gray-600 dark:text-gray-400'>{expected_quantity}</span>
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'status',
				header: 'Estado',
				cell: (info) => (
					<StatusBadge type='commercial' status={info.row.original.status || 'unknown'} />
				),
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => (
					<div className='flex justify-end'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handleViewBatch(info.row.original.id)}>
							<Icon icon='HeroEye' className='mr-1 h-4 w-4' />
							Ver
						</Button>
					</div>
				),
			}),
		],
		[handleViewBatch],
	);

	const table = useReactTable({
		data: batches ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: meta?.last_page ?? 0,
		state: { pagination },
		onPaginationChange: handlePaginationChange,
	});

	if (loading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-12'>
						<Icon icon='HeroArrowPath' className='mr-2 h-6 w-6 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>Cargando lotes...</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	const hasBatches = batches.length > 0;
	const pageStart =
		meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
	const pageEnd =
		meta.total === 0 ? 0 : Math.min(meta.current_page * meta.per_page, meta.total);

	return (
		<div className='space-y-4'>
			{/* Filtros y Búsqueda */}
			<Card>
				<CardBody className='p-4'>
					<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
						{/* Buscador */}
						<form onSubmit={handleSearchSubmit} className='flex-1'>
							<div className='flex gap-2'>
								<div className='relative flex-1'>
									<Icon
										icon='HeroMagnifyingGlass'
										className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
									/>
									<Input
										type='text'
										placeholder='Buscar por ID, proveedor, bodega...'
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className='w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800'
									/>
								</div>
								<Button color='blue'>
									<Icon icon='HeroMagnifyingGlass' className='h-4 w-4' />
								</Button>
							</div>
						</form>

						{/* Filtro por Estado */}
						<div className='flex items-center gap-2'>
							<span className='text-sm text-gray-600 dark:text-gray-400'>
								Estado:
							</span>
							<select
								value={selectedStatus}
								onChange={(e) => handleStatusChange(e.target.value)}
								className='rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800'>
								<option value='all'>Todos</option>
								<option value='pending'>Pendiente</option>
								<option value='completed'>Completado</option>
								<option value='partial'>Parcial</option>
							</select>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Tabla */}
			<Card>
				<CardBody className='p-0'>
					{!hasBatches ? (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<Icon icon='HeroInboxStack' className='mb-2 h-12 w-12 text-gray-400' />
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								No se encontraron lotes
							</p>
						</div>
					) : (
						<>
							<Table className='w-full'>
								<THead>
									{table.getHeaderGroups().map((headerGroup) => (
										<Tr key={headerGroup.id} className='border-b bg-gray-50 dark:bg-gray-800'>
											{headerGroup.headers.map((header) => (
												<Th
													key={header.id}
													className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
												</Th>
											))}
										</Tr>
									))}
								</THead>
								<TBody className='divide-y divide-gray-200 dark:divide-gray-700'>
									{table.getRowModel().rows.map((row) => (
										<Tr
											key={row.id}
											className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-800'>
											{row.getVisibleCells().map((cell) => (
												<Td key={cell.id} className='px-6 py-4'>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</Td>
											))}
										</Tr>
									))}
								</TBody>
							</Table>

							<div className='space-y-3 px-4 py-4'>
								<div className='text-sm text-gray-600 dark:text-gray-400'>
									Mostrando{' '}
									<span className='font-medium'>{pageStart}</span>
									{' a '}
									<span className='font-medium'>{pageEnd}</span>
									{' de '}
									<span className='font-medium'>{meta.total}</span> lotes
								</div>
								<TableCardFooterTemplateV2 table={table} />
							</div>
						</>
					)}
				</CardBody>
			</Card>
		</div>
	);
};

export default BatchList;
