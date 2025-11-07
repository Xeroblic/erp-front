/**
 * BatchDetail - Card con metadata y KPIs del lote
 * Muestra información del proveedor, bodega, fechas y estadísticas de progreso
 */
import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import type { IBatch } from '@/interface/technicalReviews.interface';

interface BatchDetailProps {
	batch: IBatch;
	loading?: boolean;
}

const BatchDetail: React.FC<BatchDetailProps> = ({ batch, loading = false }) => {
	if (loading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>Cargando lote...</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	// Calcular cantidades
	const expectedQty = batch.expected_quantity || 0;
	const receivedQty = batch.received_quantity || 0;
	const completedQty = batch.completed_quantity || 0;
	const pendingQty = receivedQty - completedQty;

	// Calcular porcentaje de progreso
	const progressPercentage = expectedQty > 0 ? Math.round((completedQty / expectedQty) * 100) : 0;

	return (
		<Card className='border-l-4 border-green-500'>
			<CardBody className='p-6'>
				<div className='space-y-6'>
					{/* Header */}
					<div className='flex items-start justify-between'>
						<div className='flex items-center gap-3'>
							<div className='rounded-lg bg-green-100 p-3 dark:bg-green-900'>
								<Icon icon='HeroInboxStack' className='h-6 w-6 text-green-600' />
							</div>
							<div>
								<h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
									Lote #{batch.id}
								</h2>
								<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
									{new Date(batch.entry_date).toLocaleDateString('es-ES', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									})}
								</p>
							</div>
						</div>
					</div>

					{/* Metadata Grid */}
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						{/* Proveedor */}
						<div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
							<div className='mb-2 flex items-center gap-2'>
								<Icon icon='HeroTruck' className='h-5 w-5 text-blue-600' />
								<h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
									Proveedor
								</h3>
							</div>
							<p className='text-lg font-medium text-gray-900 dark:text-gray-100'>
								{batch.customer_supplier?.name || 'No especificado'}
							</p>
							{batch.customer_supplier?.id && (
								<p className='mt-1 text-xs text-gray-500'>
									ID: {batch.customer_supplier?.id || batch.customer_supplier_id}
								</p>
							)}
						</div>

						{/* Bodega */}
						<div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
							<div className='mb-2 flex items-center gap-2'>
								<Icon icon='HeroHomeModern' className='h-5 w-5 text-purple-600' />
								<h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
									Bodega
								</h3>
							</div>
							<p className='text-lg font-medium text-gray-900 dark:text-gray-100'>
								{batch.warehouse?.name || 'No especificado'}
							</p>
							{batch.warehouse_id && (
								<p className='mt-1 text-xs text-gray-500'>
									ID: {batch.warehouse_id}
								</p>
							)}
						</div>
					</div>

					{/* KPIs */}
					<div>
						<h3 className='mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
							Estado del Lote
						</h3>
						<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
							{/* Esperada */}
							<div className='rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950'>
								<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
									{expectedQty}
								</div>
								<div className='mt-1 text-xs text-blue-700 dark:text-blue-300'>
									Esperada
								</div>
							</div>

							{/* Recibida */}
							<div className='rounded-lg bg-indigo-50 p-4 text-center dark:bg-indigo-950'>
								<div className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
									{receivedQty}
								</div>
								<div className='mt-1 text-xs text-indigo-700 dark:text-indigo-300'>
									Recibida
								</div>
							</div>

							{/* Completada */}
							<div className='rounded-lg bg-green-50 p-4 text-center dark:bg-green-950'>
								<div className='text-2xl font-bold text-green-600 dark:text-green-400'>
									{completedQty}
								</div>
								<div className='mt-1 text-xs text-green-700 dark:text-green-300'>
									Completada
								</div>
							</div>

							{/* Pendiente */}
							<div className='rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-950'>
								<div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
									{pendingQty}
								</div>
								<div className='mt-1 text-xs text-yellow-700 dark:text-yellow-300'>
									Pendiente
								</div>
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div>
						<div className='mb-2 flex items-center justify-between'>
							<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
								Progreso General
							</span>
							<span className='text-sm font-bold text-green-600 dark:text-green-400'>
								{progressPercentage}%
							</span>
						</div>
						<div className='h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
							<div
								className='h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300'
								style={{ width: `${Math.min(progressPercentage, 100)}%` }}
							/>
						</div>
						<div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
							{completedQty} de {expectedQty} equipos revisados
						</div>
					</div>

					{/* Resumen de Items por Tipo */}
					{batch.items_summary?.by_equipment_type && (
						<div>
							<h3 className='mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
								Distribución por Tipo
							</h3>
							<div className='grid grid-cols-2 gap-2 md:grid-cols-5'>
								{Object.entries(batch.items_summary.by_equipment_type).map(
									([type, count]) => (
										<div
											key={type}
											className='flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700'>
											<Icon
												icon={
													type === 'notebook'
														? 'HeroComputerDesktop'
														: type === 'desktop'
															? 'HeroServerStack'
															: type === 'aio'
																? 'HeroDeviceTablet'
																: type === 'docking'
																	? 'HeroCpuChip'
																	: 'HeroTv'
												}
												className='h-5 w-5 text-gray-600 dark:text-gray-400'
											/>
											<div>
												<div className='text-lg font-bold text-gray-900 dark:text-gray-100'>
													{count}
												</div>
												<div className='text-xs capitalize text-gray-500'>
													{type}
												</div>
											</div>
										</div>
									),
								)}
							</div>
						</div>
					)}

					{/* Notas */}
					{batch.notes && (
						<div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
							<div className='mb-2 flex items-center gap-2'>
								<Icon icon='HeroDocumentText' className='h-4 w-4 text-gray-600' />
								<h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
									Notas
								</h3>
							</div>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								{batch.notes}
							</p>
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default BatchDetail;
