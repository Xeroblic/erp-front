/**
 * BatchList - Tabla de lotes con filtros y búsqueda
 * Muestra listado paginado de lotes con sus datos principales
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IBatch, ListMeta } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';

interface BatchListProps {
	batches: IBatch[];
	meta: ListMeta;
	loading?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onSearch?: (query: string) => void;
	onStatusFilter?: (status: string) => void;
}

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

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch?.(searchQuery);
	};

	const handleStatusChange = (status: string) => {
		setSelectedStatus(status);
		onStatusFilter?.(status);
	};

	const handleViewBatch = (batchId: number) => {
		navigate(`/technical-reviews/batches/${batchId}`);
	};

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
									<input
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
						</form>{' '}
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
				<CardBody className='overflow-x-auto p-0'>
					<table className='w-full'>
						<thead className='border-b bg-gray-50 dark:bg-gray-800'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									ID
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									Bodega
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									Proveedor
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									Fecha Entrada
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									Cantidad
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									Estado
								</th>
								<th className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'>
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
							{batches.length === 0 ? (
								<tr>
									<td colSpan={7} className='px-6 py-12 text-center'>
										<div className='flex flex-col items-center justify-center'>
											<Icon
												icon='HeroInboxStack'
												className='mb-2 h-12 w-12 text-gray-400'
											/>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												No se encontraron lotes
											</p>
										</div>
									</td>
								</tr>
							) : (
								batches.map((batch) => (
									<tr
										key={batch.id}
										className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-800'>
										<td className='px-6 py-4'>
											<span className='font-medium text-gray-900 dark:text-gray-100'>
												#{batch.id}
											</span>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroHomeModern'
													className='h-4 w-4 text-gray-400'
												/>
												<span className='text-sm text-gray-700 dark:text-gray-300'>
													{batch.warehouse?.name || 'N/A'}
												</span>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroTruck'
													className='h-4 w-4 text-gray-400'
												/>
												<span className='text-sm text-gray-700 dark:text-gray-300'>
													{batch.customer_supplier?.name || 'N/A'}
												</span>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroCalendar'
													className='h-4 w-4 text-gray-400'
												/>
												<span className='text-sm text-gray-700 dark:text-gray-300'>
													{new Date(
														batch.entry_date,
													).toLocaleDateString()}
												</span>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='text-sm'>
												<span className='font-medium text-gray-900 dark:text-gray-100'>
													{batch.received_quantity || 0}
												</span>
												<span className='text-gray-500'> / </span>
												<span className='text-gray-600 dark:text-gray-400'>
													{batch.expected_quantity}
												</span>
											</div>
										</td>
										<td className='px-6 py-4'>
											<StatusBadge
												type='commercial'
												status={batch.status || 'unknown'}
											/>
										</td>
										<td className='px-6 py-4 text-right'>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleViewBatch(batch.id)}>
												<Icon icon='HeroEye' className='mr-1 h-4 w-4' />
												Ver
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</CardBody>
			</Card>

			{/* Paginación */}
			{meta.total > 0 && (
				<Card>
					<CardBody className='p-4'>
						<div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
							{/* Info */}
							<div className='text-sm text-gray-600 dark:text-gray-400'>
								Mostrando{' '}
								<span className='font-medium'>
									{(meta.current_page - 1) * meta.per_page + 1}
								</span>{' '}
								a{' '}
								<span className='font-medium'>
									{Math.min(meta.current_page * meta.per_page, meta.total)}
								</span>{' '}
								de <span className='font-medium'>{meta.total}</span> lotes
							</div>

							{/* Controles */}
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => onPageChange?.(meta.current_page - 1)}
									isDisable={meta.current_page <= 1}>
									<Icon icon='HeroChevronLeft' className='h-4 w-4' />
								</Button>

								<div className='flex gap-1'>
									{Array.from({ length: meta.last_page }, (_, i) => i + 1)
										.filter(
											(p) =>
												p === 1 ||
												p === meta.last_page ||
												Math.abs(p - meta.current_page) <= 1,
										)
										.map((page, idx, arr) => {
											if (idx > 0 && page - arr[idx - 1] > 1) {
												return (
													<React.Fragment key={`ellipsis-${page}`}>
														<span className='px-2 py-1 text-gray-400'>
															...
														</span>
														<Button
															variant={
																page === meta.current_page
																	? 'solid'
																	: 'outline'
															}
															color={
																page === meta.current_page
																	? 'blue'
																	: 'zinc'
															}
															size='sm'
															onClick={() => onPageChange?.(page)}>
															{page}
														</Button>
													</React.Fragment>
												);
											}
											return (
												<Button
													key={page}
													variant={
														page === meta.current_page
															? 'solid'
															: 'outline'
													}
													color={
														page === meta.current_page ? 'blue' : 'zinc'
													}
													size='sm'
													onClick={() => onPageChange?.(page)}>
													{page}
												</Button>
											);
										})}
								</div>

								<Button
									variant='outline'
									size='sm'
									onClick={() => onPageChange?.(meta.current_page + 1)}
									isDisable={meta.current_page >= meta.current_page}>
									<Icon icon='HeroChevronRight' className='h-4 w-4' />
								</Button>

								<select
									value={meta.per_page}
									onChange={(e) => onLimitChange?.(Number(e.target.value))}
									className='ml-2 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800'>
									<option value={10}>10</option>
									<option value={20}>20</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
							</div>
						</div>
					</CardBody>
				</Card>
			)}
		</div>
	);
};

export default BatchList;
