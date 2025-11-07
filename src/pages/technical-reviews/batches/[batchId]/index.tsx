/**
 * Technical Reviews - Batch Detail
 * Detalle de un lote con tabs de equipos organizados por tipo
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatchById,
	fetchBatchItems,
	selectSelectedBatch,
	selectItems,
	selectBatchesLoading,
	selectItemsLoading,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

const BatchDetailPage: React.FC = () => {
	const { batchId } = useParams<{ batchId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const batch = useAppSelector(selectSelectedBatch);
	const items = useAppSelector(selectItems);
	const batchLoading = useAppSelector(selectBatchesLoading);
	const itemsLoading = useAppSelector(selectItemsLoading);

	const [activeTab, setActiveTab] = useState<EquipmentType>('notebook');

	useEffect(() => {
		if (!batchId || !branchId) return;

		const parsedBatchId = parseInt(batchId);

		dispatch(fetchBatchById({ branchId, batchId: parsedBatchId }));
		dispatch(
			fetchBatchItems({
				branchId,
				batchId: parsedBatchId,
				params: { equipment_type: activeTab },
			}),
		);
	}, [dispatch, batchId, activeTab, branchId]);

	const handleBack = () => {
		navigate('/technical-reviews/batches');
	};

	const handleViewItem = (itemId: number) => {
		navigate(`/technical-reviews/batches/${batchId}/${itemId}`);
	};

	const handleCreateItem = () => {
		navigate(`/technical-reviews/batches/${batchId}/create`);
	};

	const tabs: { label: string; value: EquipmentType; icon: string }[] = [
		{ label: 'Notebooks', value: 'notebook', icon: 'HeroComputerDesktop' },
		{ label: 'Desktops', value: 'desktop', icon: 'HeroServerStack' },
		{ label: 'All-in-One', value: 'aio', icon: 'HeroDeviceTablet' },
		{ label: 'Docking', value: 'docking', icon: 'HeroCube' },
		{ label: 'Monitores', value: 'monitor', icon: 'HeroTv' },
	];

	const filteredItems = items.filter((item) => item.equipment_type === activeTab);

	return (
		<PageWrapper name='batch-detail'>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center gap-4'>
					<Button variant='outline' onClick={handleBack}>
						<Icon icon='HeroArrowLeft' className='h-4 w-4' />
					</Button>
					<div className='flex-1'>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							Lote #{batchId}
						</h1>
						{batch && (
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								{batch.warehouse?.name || `Bodega #${batch.warehouse_id}`} -
								Entrada: {batch.entry_date}
							</p>
						)}
					</div>
					<Button onClick={handleCreateItem}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Agregar Equipo
					</Button>
				</div>

				{batchLoading ? (
					<Card>
						<CardBody>
							<div className='py-12 text-center'>
								<div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent' />
								<p className='mt-2 text-sm text-gray-600'>Cargando lote...</p>
							</div>
						</CardBody>
					</Card>
				) : !batch ? (
					<Card>
						<CardBody>
							<div className='py-12 text-center text-gray-500'>
								<Icon
									icon='HeroExclamationCircle'
									className='mx-auto mb-3 h-12 w-12 text-gray-400'
								/>
								<p>Lote no encontrado</p>
							</div>
						</CardBody>
					</Card>
				) : (
					<>
						{/* Información del lote */}
						<Card className='mb-6'>
							<CardHeader>
								<h3 className='text-lg font-semibold'>Información General</h3>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
									<div>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Estado
										</p>
										<p className='mt-1 font-semibold'>
											<span className='inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
												{batch.status}
											</span>
										</p>
									</div>
									<div>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Cant. Esperada
										</p>
										<p className='mt-1 font-semibold'>
											{batch.expected_quantity}
										</p>
									</div>
									<div>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Proveedor
										</p>
										<p className='mt-1 font-semibold'>
											{batch.customer_supplier?.name ||
												`#${batch.customer_supplier_id}`}
										</p>
									</div>
									<div>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Año
										</p>
										<p className='mt-1 font-semibold'>
											{new Date(batch.entry_date).getFullYear()}
										</p>
									</div>
								</div>
								{batch.notes && (
									<div className='mt-4'>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Notas
										</p>
										<p className='mt-1 text-sm'>{batch.notes}</p>
									</div>
								)}
							</CardBody>
						</Card>

						{/* Tabs de tipos de equipos */}
						<Card>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>Equipos por Tipo</h3>
									<p className='text-sm text-gray-600'>
										{filteredItems.length} {activeTab}
										{filteredItems.length !== 1 ? 's' : ''}
									</p>
								</div>
							</CardHeader>
							<CardBody>
								{/* Tabs */}
								<div className='mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 dark:border-gray-700'>
									{tabs.map((tab) => (
										<button
											key={tab.value}
											onClick={() => setActiveTab(tab.value)}
											className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
												activeTab === tab.value
													? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
													: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
											}`}>
											<Icon icon={tab.icon} className='h-4 w-4' />
											{tab.label}
										</button>
									))}
								</div>

								{/* Lista de items */}
								{itemsLoading ? (
									<div className='py-12 text-center'>
										<div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent' />
										<p className='mt-2 text-sm text-gray-600'>
											Cargando equipos...
										</p>
									</div>
								) : filteredItems.length === 0 ? (
									<div className='py-12 text-center text-gray-500'>
										<Icon
											icon='HeroInboxStack'
											className='mx-auto mb-3 h-12 w-12 text-gray-400'
										/>
										<p>No hay equipos de tipo {activeTab} en este lote</p>
										<Button
											variant='outline'
											className='mt-4'
											onClick={handleCreateItem}>
											Agregar Equipo
										</Button>
									</div>
								) : (
									<div className='overflow-x-auto'>
										<table className='w-full'>
											<thead className='border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
												<tr>
													<th className='px-4 py-3 text-left text-sm font-semibold'>
														ID
													</th>
													<th className='px-4 py-3 text-left text-sm font-semibold'>
														Serie
													</th>
													<th className='px-4 py-3 text-left text-sm font-semibold'>
														Producto
													</th>
													<th className='px-4 py-3 text-left text-sm font-semibold'>
														Estado Revisión
													</th>
													<th className='px-4 py-3 text-left text-sm font-semibold'>
														Estado Comercial
													</th>
													<th className='px-4 py-3 text-right text-sm font-semibold'>
														Acciones
													</th>
												</tr>
											</thead>
											<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
												{filteredItems.map((item) => (
													<tr
														key={item.id}
														className='hover:bg-gray-50 dark:hover:bg-gray-800'>
														<td className='px-4 py-3 text-sm'>
															#{item.id}
														</td>
														<td className='px-4 py-3 font-mono text-sm'>
															{item.serial_number}
														</td>
														<td className='px-4 py-3 text-sm'>
															Producto #{item.product_id}
														</td>
														<td className='px-4 py-3 text-sm'>
															<span className='inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800'>
																{item.review_status}
															</span>
														</td>
														<td className='px-4 py-3 text-sm'>
															<span className='inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800'>
																{item.current_status}
															</span>
														</td>
														<td className='px-4 py-3 text-right text-sm'>
															<Button
																variant='outline'
																size='sm'
																onClick={() =>
																	handleViewItem(item.id)
																}>
																Ver Revisión
															</Button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</CardBody>
						</Card>
					</>
				)}
			</Container>
		</PageWrapper>
	);
};

export default BatchDetailPage;
