/**
 * ItemDetail - Cabecera con información clave de la serie
 * Muestra estado, grado, sugerencia y botones de acción
 */
import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IItem } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';

interface ItemDetailProps {
	item: IItem;
	loading?: boolean;
	onEditClick?: () => void;
	onApproveClick?: () => void;
	onChangeStatusClick?: () => void;
	showActions?: boolean;
}

const ItemDetail: React.FC<ItemDetailProps> = ({
	item,
	loading = false,
	onEditClick,
	onApproveClick,
	onChangeStatusClick,
	showActions = true,
}) => {
	if (loading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>Cargando serie...</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className='border-l-4 border-blue-500'>
			<CardBody className='p-6'>
				<div className='space-y-4'>
					{/* Header con Serial y Estados */}
					<div className='flex flex-wrap items-start justify-between gap-4'>
						<div className='flex-1'>
							<div className='flex items-center gap-3'>
								<Icon icon='HeroQrCode' className='h-6 w-6 text-blue-600' />
								<div>
									<h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{item.serial_number}
									</h2>
									<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
										Serie #{item.id}
									</p>
								</div>
							</div>
						</div>

						<div className='flex flex-wrap items-center gap-2'>
							<StatusBadge type='review' status={item.review_status} />
							<StatusBadge type='commercial' status={item.current_status} />
						</div>
					</div>

					{/* Info Grid */}
					<div className='grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4'>
						{/* Tipo de Equipo */}
						<div>
							<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
								Tipo de Equipo
							</p>
							<div className='mt-1 flex items-center gap-2'>
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
									className='h-4 w-4 text-gray-600 dark:text-gray-400'
								/>
								<span className='font-medium text-gray-900 dark:text-gray-100'>
									{item.equipment_type === 'notebook'
										? 'Notebook'
										: item.equipment_type === 'desktop'
											? 'Desktop'
											: item.equipment_type === 'aio'
												? 'All-in-One'
												: item.equipment_type === 'docking'
													? 'Docking'
													: 'Monitor'}
								</span>
							</div>
						</div>

						{/* Grado Actual */}
						<div>
							<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
								Grado Actual
							</p>
							<div className='mt-1'>
								{item.grade ? (
									<span className='inline-flex items-center gap-1 text-lg font-bold text-yellow-600 dark:text-yellow-400'>
										<Icon icon='HeroStar' className='h-5 w-5' />
										{item.grade}
									</span>
								) : (
									<span className='text-sm text-gray-400'>Pendiente</span>
								)}
							</div>
						</div>

						{/* Grado Sugerido */}
						{item.suggested_grade && (
							<div>
								<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
									Grado Sugerido
								</p>
								<div className='mt-1 flex items-center gap-2'>
									<span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
										{item.suggested_grade}
									</span>
									{item.confidence !== undefined && item.confidence !== null && (
										<span className='text-xs text-gray-500'>
											({Math.round(item.confidence)}% confianza)
										</span>
									)}
								</div>
							</div>
						)}

						{/* Producto */}
						{item.product_id && (
							<div>
								<p className='text-xs font-medium uppercase text-gray-500 dark:text-gray-400'>
									Producto
								</p>
								<div className='mt-1'>
									<span className='text-sm text-gray-900 dark:text-gray-100'>
										ID: {item.product_id}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Breakdown (si existe) */}
					{item.breakdown && Object.keys(item.breakdown).length > 0 && (
						<div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-950'>
							<div className='mb-2 flex items-center gap-2'>
								<Icon icon='HeroChartBar' className='h-4 w-4 text-blue-600' />
								<h3 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
									Desglose de Calificación
								</h3>
							</div>
							<div className='grid grid-cols-2 gap-2 text-xs md:grid-cols-4'>
								{Object.entries(item.breakdown).map(([key, value]) => (
									<div key={key}>
										<span className='text-blue-700 dark:text-blue-300'>
											{key}:
										</span>{' '}
										<span className='font-medium text-blue-900 dark:text-blue-100'>
											{typeof value === 'number'
												? value.toFixed(1)
												: String(value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Botones de Acción */}
					{showActions && (
						<div className='flex flex-wrap gap-2 border-t pt-4'>
							{onEditClick && item.review_status !== 'approved' && (
								<Button variant='outline' onClick={onEditClick}>
									<Icon icon='HeroPencil' className='mr-2 h-4 w-4' />
									Editar Revisión
								</Button>
							)}

							{onApproveClick && item.review_status === 'reviewed' && (
								<Button color='blue' onClick={onApproveClick}>
									<Icon icon='HeroCheckBadge' className='mr-2 h-4 w-4' />
									Aprobar
								</Button>
							)}

							{onChangeStatusClick &&
								item.review_status === 'approved' &&
								item.current_status !== 'sold' && (
									<Button color='green' onClick={onChangeStatusClick}>
										<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
										Cambiar Estado
									</Button>
								)}
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default ItemDetail;
