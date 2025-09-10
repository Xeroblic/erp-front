import React, { useState, useEffect, useMemo } from 'react';
import {
	HiOutlineArchiveBox,
	HiOutlinePlus,
	HiOutlineAdjustmentsHorizontal,
	HiOutlineArrowsRightLeft,
	HiOutlineChartBarSquare,
} from 'react-icons/hi2';

// Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs, { Tab } from '@/components/ui/Tabs';

// Modular components
import { StatisticsCards } from './components/cards/StatisticsCards';
import { MovementsTable } from './components/tables/MovementsTable';
import { ItemsTable } from './components/tables/ItemsTable';
import { StockLevelsTable } from './components/tables/StockLevelsTable';
import { AdjustStockModal } from './components/modals/AdjustStockModal';
import { TransferStockModal } from './components/modals/TransferStockModal';

// Data and hooks
import { useInventoryData } from './hooks/useInventoryData';
import { MockInventoryItem, MockInventoryMovement, MockStockLevel } from './data/mockData';

const Inventario: React.FC = () => {
	// Hooks
	const {
		loading,
		getMovements,
		getItems,
		getStockLevels,
		getStockAlerts,
		getStatistics,
		createMovement,
		adjustStock,
		simulateLoading,
	} = useInventoryData();

	// State
	const [activeTab, setActiveTab] = useState<
		'overview' | 'movements' | 'items' | 'levels' | 'alerts'
	>('overview');

	// Modal states
	const [adjustModalOpen, setAdjustModalOpen] = useState(false);
	const [transferModalOpen, setTransferModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<MockInventoryItem | undefined>();

	// Data
	const statistics = useMemo(() => getStatistics(), []);
	const movements = useMemo(() => getMovements(), []);
	const items = useMemo(() => getItems(), []);
	const stockLevels = useMemo(() => getStockLevels(), []);
	const stockAlerts = useMemo(() => getStockAlerts(), []);

	// Handlers
	const handleViewMovement = (movement: MockInventoryMovement) => {
		console.log('Ver movimiento:', movement);
	};

	const handleViewItem = (item: MockInventoryItem) => {
		console.log('Ver item:', item);
	};

	const handleAdjustStock = (item: MockInventoryItem) => {
		setSelectedItem(item);
		setAdjustModalOpen(true);
	};

	const handleTransferStock = (item: MockInventoryItem) => {
		setSelectedItem(item);
		setTransferModalOpen(true);
	};

	const handleConfirmAdjust = async (data: {
		productId: number;
		warehouseId: number;
		quantity: number;
		reason: string;
	}) => {
		try {
			await adjustStock(data);
			setAdjustModalOpen(false);
			setSelectedItem(undefined);
			// En una app real, recargarías los datos aquí
			console.log('Ajuste realizado:', data);
		} catch (error) {
			console.error('Error al ajustar stock:', error);
		}
	};

	const handleConfirmTransfer = async (data: {
		fromWarehouseId: number;
		toWarehouseId: number;
		productId: number;
		quantity: number;
		reason: string;
	}) => {
		try {
			// Simular transferencia creando movimientos de salida y entrada
			const product = items.find((item) => item.product_id === data.productId)?.product;
			const fromWarehouse = items.find(
				(item) => item.warehouse_id === data.fromWarehouseId,
			)?.warehouse;
			const toWarehouse = items.find(
				(item) => item.warehouse_id === data.toWarehouseId,
			)?.warehouse;

			if (product && fromWarehouse && toWarehouse) {
				// Movimiento de salida
				await createMovement({
					movement_type: 'TRANSFER',
					product,
					warehouse: fromWarehouse,
					quantity: -data.quantity,
					reference: `TRF-${Date.now()}-OUT`,
					notes: `Transferencia hacia ${toWarehouse.name}: ${data.reason}`,
				});

				// Movimiento de entrada
				await createMovement({
					movement_type: 'TRANSFER',
					product,
					warehouse: toWarehouse,
					quantity: data.quantity,
					reference: `TRF-${Date.now()}-IN`,
					notes: `Transferencia desde ${fromWarehouse.name}: ${data.reason}`,
				});
			}

			setTransferModalOpen(false);
			setSelectedItem(undefined);
			console.log('Transferencia realizada:', data);
		} catch (error) {
			console.error('Error al transferir stock:', error);
		}
	};

	return (
		<div className='space-y-6 p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-3'>
					<div className='rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
						<HiOutlineArchiveBox className='h-6 w-6' />
					</div>
					<div>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							Gestión de Inventario
						</h1>
						<p className='text-gray-600 dark:text-gray-400'>
							Control y seguimiento de productos en almacén
						</p>
					</div>
				</div>
				<div className='flex items-center space-x-2'>
					<Button
						color='emerald'
						icon='HiOutlinePlus'
						onClick={() => console.log('Crear nuevo producto')}>
						Nuevo Producto
					</Button>
					<Button
						color='violet'
						icon='HiOutlineAdjustmentsHorizontal'
						onClick={() => console.log('Configurar inventario')}>
						Configurar
					</Button>
				</div>
			</div>

			{/* Statistics Cards */}
			<StatisticsCards statistics={statistics} loading={loading} />

			{/* Content Tabs */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<Tabs
							activeTab={activeTab}
							onTabChange={(tabId) => setActiveTab(tabId as any)}>
							<Tab id='overview' text='Resumen'>
								Resumen
							</Tab>
							<Tab id='movements' text='Movimientos'>
								Movimientos ({movements.length})
							</Tab>
							<Tab id='items' text='Items'>
								Items ({items.length})
							</Tab>
							<Tab id='levels' text='Niveles'>
								Niveles ({stockLevels.length})
							</Tab>
							<Tab id='alerts' text='Alertas'>
								Alertas ({stockAlerts.length})
							</Tab>
						</Tabs>
					</CardHeaderChild>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					{/* Overview Tab */}
					{activeTab === 'overview' && (
						<div className='space-y-6 p-6'>
							<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
								{/* Recent Movements */}
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<HiOutlineArrowsRightLeft className='h-5 w-5 text-blue-600' />
											Movimientos Recientes
										</CardTitle>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Últimas 5 transacciones de inventario
										</p>
									</CardHeader>
									<CardBody>
										<MovementsTable
											movements={movements.slice(0, 5)}
											loading={loading}
											onViewMovement={handleViewMovement}
										/>
									</CardBody>
								</Card>

								{/* Low Stock Items */}
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<HiOutlineArchiveBox className='h-5 w-5 text-amber-600' />
											Items con Stock Bajo
										</CardTitle>
										<p className='text-sm text-gray-600 dark:text-gray-400'>
											Productos que requieren reabastecimiento
										</p>
									</CardHeader>
									<CardBody>
										<ItemsTable
											items={items
												.filter((item) => item.status !== 'IN_STOCK')
												.slice(0, 5)}
											loading={loading}
											onViewItem={handleViewItem}
											onAdjustStock={handleAdjustStock}
											onTransferStock={handleTransferStock}
										/>
									</CardBody>
								</Card>
							</div>
						</div>
					)}

					{/* Movements Tab */}
					{activeTab === 'movements' && (
						<div className='space-y-6 p-6'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<HiOutlineArrowsRightLeft className='h-5 w-5 text-blue-600' />
										Movimientos de Inventario
									</CardTitle>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Historial completo de movimientos de stock
									</p>
								</CardHeader>
								<CardBody>
									<MovementsTable
										movements={movements}
										loading={loading}
										onViewMovement={handleViewMovement}
									/>
								</CardBody>
							</Card>
						</div>
					)}

					{/* Items Tab */}
					{activeTab === 'items' && (
						<div className='space-y-6 p-6'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<HiOutlineArchiveBox className='h-5 w-5 text-emerald-600' />
										Gestión de Items
									</CardTitle>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Control y administración de productos en inventario
									</p>
								</CardHeader>
								<CardBody>
									<ItemsTable
										items={items}
										loading={loading}
										onViewItem={handleViewItem}
										onAdjustStock={handleAdjustStock}
										onTransferStock={handleTransferStock}
									/>
								</CardBody>
							</Card>
						</div>
					)}

					{/* Stock Levels Tab */}
					{activeTab === 'levels' && (
						<div className='space-y-6 p-6'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<HiOutlineChartBarSquare className='h-5 w-5 text-violet-600' />
										Niveles de Stock
									</CardTitle>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Monitoreo y control de niveles de inventario por almacén
									</p>
								</CardHeader>
								<CardBody>
									<StockLevelsTable
										stockLevels={stockLevels}
										loading={loading}
										onViewLevel={(level) => console.log('Ver nivel:', level)}
										onUpdateLevel={(level) =>
											console.log('Actualizar nivel:', level)
										}
									/>
								</CardBody>
							</Card>
						</div>
					)}

					{/* Alerts Tab */}
					{activeTab === 'alerts' && (
						<div className='space-y-6 p-6'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<HiOutlineArchiveBox className='h-5 w-5 text-red-600' />
										Alertas de Stock
									</CardTitle>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Notificaciones de niveles críticos y stock bajo
									</p>
								</CardHeader>
								<CardBody>
									{stockAlerts.length === 0 ? (
										<div className='py-12 text-center text-gray-500 dark:text-gray-400'>
											<HiOutlineArchiveBox className='mx-auto mb-4 h-16 w-16 text-gray-300' />
											<h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-gray-100'>
												Sin alertas de stock
											</h3>
											<p>
												No hay notificaciones de stock bajo en este momento
											</p>
										</div>
									) : (
										<div className='space-y-4'>
											{stockAlerts.map((alert) => (
												<div
													key={alert.id}
													className='rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'>
													<div className='flex items-center justify-between'>
														<div className='flex items-center space-x-3'>
															<Badge
																color={
																	alert.alert_level === 'CRITICAL'
																		? 'red'
																		: alert.alert_level ===
																			  'LOW'
																			? 'amber'
																			: 'gray'
																}>
																{alert.alert_level === 'CRITICAL'
																	? 'Crítico'
																	: alert.alert_level === 'LOW'
																		? 'Bajo'
																		: alert.alert_level ===
																			  'OUT_OF_STOCK'
																			? 'Sin Stock'
																			: alert.alert_level}
															</Badge>
															<div>
																<h4 className='font-medium text-gray-900 dark:text-gray-100'>
																	{alert.product.name}
																</h4>
																<p className='text-sm text-gray-600 dark:text-gray-400'>
																	{alert.warehouse.name} • Stock
																	actual:{' '}
																	<span className='font-medium'>
																		{alert.current_stock}
																	</span>
																	{' • Mínimo: '}
																	<span className='font-medium'>
																		{alert.min_stock}
																	</span>
																</p>
															</div>
														</div>
														<div className='flex items-center space-x-2'>
															<span className='text-xs text-gray-500 dark:text-gray-400'>
																{new Date(
																	alert.created_at,
																).toLocaleDateString('es-ES')}
															</span>
															<Button
																size='sm'
																variant='outline'
																onClick={() =>
																	handleAdjustStock({
																		product_id:
																			alert.product.id,
																		warehouse_id:
																			alert.warehouse.id,
																		product: alert.product,
																		warehouse: alert.warehouse,
																		current_stock:
																			alert.current_stock,
																		available_stock:
																			alert.current_stock,
																		reserved_stock: 0,
																		status: 'OUT_OF_STOCK',
																		last_updated:
																			alert.created_at,
																	})
																}>
																Ajustar Stock
															</Button>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</CardBody>
							</Card>
						</div>
					)}
				</CardBody>
			</Card>

			{/* Modals */}
			<AdjustStockModal
				isOpen={adjustModalOpen}
				onClose={() => {
					setAdjustModalOpen(false);
					setSelectedItem(undefined);
				}}
				item={selectedItem}
				onConfirm={handleConfirmAdjust}
			/>

			<TransferStockModal
				isOpen={transferModalOpen}
				onClose={() => {
					setTransferModalOpen(false);
					setSelectedItem(undefined);
				}}
				item={selectedItem}
				onConfirm={handleConfirmTransfer}
			/>
		</div>
	);
};

export default Inventario;
