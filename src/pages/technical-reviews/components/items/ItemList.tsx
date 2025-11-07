/**
 * ItemList - Tabla reutilizable de series/ítems
 * Usado en: pages/items/index.tsx y BatchTabs.tsx
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IItem, ListMeta } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';

interface ItemListProps {
	items: IItem[];
	loading: boolean;
	meta: ListMeta;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onItemClick?: (itemId: number) => void;
	baseUrl?: string; // URL base para navegación (ej: '/technical-reviews/items' o '/technical-reviews/batches/5')
	emptyMessage?: string;
}

const ItemList: React.FC<ItemListProps> = ({
	items,
	loading,
	meta,
	onPageChange,
	onLimitChange,
	onItemClick,
	baseUrl = '/technical-reviews/items',
	emptyMessage = 'No hay series para mostrar',
}) => {
	const navigate = useNavigate();

	// Helper para extraer valor de objetos {value, label, description} o devolver el valor directamente
	const extractValue = (value: any): string | null => {
		if (value == null) return null;
		if (typeof value === 'string' || typeof value === 'number') return String(value);
		if (typeof value === 'object' && 'value' in value) return String(value.value);
		return String(value);
	};

	const handleItemClick = (itemId: number) => {
		if (onItemClick) {
			onItemClick(itemId);
		} else {
			navigate(`${baseUrl}/${itemId}`);
		}
	};

	if (loading) {
		return (
			<Card>
				<CardBody className='p-8'>
					<div className='flex items-center justify-center'>
						<Icon
							icon='HeroArrowPath'
							className='mr-2 h-6 w-6 animate-spin text-blue-600'
						/>
						<span className='text-gray-600 dark:text-gray-400'>Cargando series...</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	if (!items || items.length === 0) {
		return (
			<Card>
				<CardBody className='p-8'>
					<div className='text-center'>
						<Icon
							icon='HeroInboxStack'
							className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-600'
						/>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>{emptyMessage}</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='space-y-4'>
			<Card>
				<CardBody className='overflow-x-auto p-0'>
					<table className='w-full'>
						<thead className='bg-gray-50 dark:bg-gray-800'>
							<tr>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
									Serie
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
									Tipo
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
									Estado Revisión
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
									Estado Comercial
								</th>
								<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
									Grado
								</th>
								<th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
							{items.map((item) => (
								<tr
									key={item.id}
									className='cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800'
									onClick={() => handleItemClick(item.id)}>
									<td className='whitespace-nowrap px-4 py-3'>
										<div className='flex items-center gap-2'>
											<Icon
												icon='HeroQrCode'
												className='h-4 w-4 text-gray-400'
											/>
											<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
												{item.serial_number}
											</span>
										</div>
									</td>
									<td className='whitespace-nowrap px-4 py-3'>
										<span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
											<Icon
												icon={
													item.equipment_type === 'notebook'
														? 'HeroComputerDesktop'
														: item.equipment_type === 'desktop'
															? 'HeroServerStack'
															: item.equipment_type === 'aio'
																? 'HeroDeviceTablet'
																: item.equipment_type === 'docking'
																	? 'HeroCpuChip'
																	: 'HeroTv'
												}
												className='h-3 w-3'
											/>
											{item.equipment_type === 'notebook'
												? 'Notebook'
												: item.equipment_type === 'desktop'
													? 'Desktop'
													: item.equipment_type === 'aio'
														? 'AIO'
														: item.equipment_type === 'docking'
															? 'Docking'
															: 'Monitor'}
										</span>
									</td>
									<td className='whitespace-nowrap px-4 py-3'>
										<StatusBadge type='review' status={item.review_status} />
									</td>
									<td className='whitespace-nowrap px-4 py-3'>
										<StatusBadge
											type='commercial'
											status={item.current_status}
										/>
									</td>
									<td className='whitespace-nowrap px-4 py-3'>
										{extractValue(item.grade) ? (
											<span className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
												<Icon icon='HeroStar' className='h-3 w-3' />
												{extractValue(item.grade)}
												{extractValue(item.suggested_grade) &&
													extractValue(item.grade) !==
														extractValue(item.suggested_grade) && (
														<span className='text-[10px] text-yellow-600 dark:text-yellow-400'>
															(Sugerido:{' '}
															{extractValue(item.suggested_grade)})
														</span>
													)}
											</span>
										) : extractValue(item.suggested_grade) ? (
											<span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
												<Icon icon='HeroSparkles' className='h-3 w-3' />
												{extractValue(item.suggested_grade)}
											</span>
										) : (
											<span className='text-xs text-gray-400'>Pendiente</span>
										)}
									</td>
									<td className='whitespace-nowrap px-4 py-3 text-right'>
										<Button
											size='sm'
											variant='outline'
											onClick={(e) => {
												e.stopPropagation();
												handleItemClick(item.id);
											}}>
											<Icon icon='HeroEye' className='h-4 w-4' />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardBody>
			</Card>

			{/* Paginación */}
			{meta.last_page > 1 && (
				<div className='flex items-center justify-between'>
					<div className='text-sm text-gray-600 dark:text-gray-400'>
						Mostrando {(meta.current_page - 1) * meta.per_page + 1} -{' '}
						{Math.min(meta.current_page * meta.per_page, meta.total)} de {meta.total}{' '}
						series
					</div>

					<div className='flex gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange?.(meta.current_page - 1)}
							isDisable={meta.current_page === 1}>
							<Icon icon='HeroChevronLeft' className='h-4 w-4' />
							Anterior
						</Button>

						<div className='flex items-center gap-1'>
							{Array.from({ length: meta.last_page }, (_, i) => i + 1)
								.filter((page) => {
									const distance = Math.abs(page - meta.current_page);
									return (
										distance === 0 ||
										page === 1 ||
										page === meta.last_page ||
										distance <= 2
									);
								})
								.map((page, idx, arr) => {
									const prevPage = arr[idx - 1];
									const showEllipsis = prevPage && page - prevPage > 1;

									return (
										<React.Fragment key={page}>
											{showEllipsis && (
												<span className='px-2 text-gray-400'>...</span>
											)}
											<Button
												variant={
													page === meta.current_page ? 'solid' : 'outline'
												}
												size='sm'
												onClick={() => onPageChange?.(page)}>
												{page}
											</Button>
										</React.Fragment>
									);
								})}
						</div>

						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange?.(meta.current_page + 1)}
							isDisable={meta.current_page === meta.last_page}>
							Siguiente
							<Icon icon='HeroChevronRight' className='h-4 w-4' />
						</Button>

						{onLimitChange && (
							<select
								value={meta.per_page}
								onChange={(e) => onLimitChange(Number(e.target.value))}
								className='ml-2 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800'>
								<option value={10}>10</option>
								<option value={20}>20</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default ItemList;
