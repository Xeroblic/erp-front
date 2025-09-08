import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryMovements,
	fetchInventoryItems,
	fetchStockLevels,
	fetchStockAlerts,
	setFilters,
	clearFilters,
	adjustInventory,
	transferInventory,
	selectInventoryMovements,
	selectInventoryItems,
	selectStockLevels,
	selectStockAlerts,
	selectInventoryLoading,
	selectInventoryPagination,
	selectInventoryFilters,
	selectInventoryActionLoading,
	selectInventoryStatistics,
} from '@/store/slices/inventory/inventorySlice';

// Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TBody, Td, TFoot, THead, Th, Tr } from '@/components/ui/Table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Pagination from '@/components/ui/Pagination';
import Tabs, { Tab } from '@/components/ui/Tabs';
import { ERP_PERMISSIONS } from '@/constants/erp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import type {
	IInventoryMovement,
	IInventoryItem,
	IStockLevel,
	IStockAlert,
	MovementType,
} from '@/interface/inventory.interface';
import { formatCurrency, formatDate } from '@/utils/format.utils';

const Inventario: React.FC = () => {
	const dispatch = useAppDispatch();

	// Redux state
	const movements = useAppSelector(selectInventoryMovements);
	const items = useAppSelector(selectInventoryItems);
	const stockLevels = useAppSelector(selectStockLevels);
	const stockAlerts = useAppSelector(selectStockAlerts);
	const loading = useAppSelector(selectInventoryLoading);
	const pagination = useAppSelector(selectInventoryPagination);
	const filters = useAppSelector(selectInventoryFilters);
	const actionLoading = useAppSelector(selectInventoryActionLoading);
	const statistics = useAppSelector(selectInventoryStatistics);

	// Local state
	const [activeTab, setActiveTab] = useState('movements');
	const [showAdjustModal, setShowAdjustModal] = useState(false);
	const [showTransferModal, setShowTransferModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState<IInventoryItem | null>(null);

	// Formularios
	const [adjustForm, setAdjustForm] = useState({
		product_id: '',
		warehouse_id: '',
		quantity_change: '',
		reason: 'ADJUSTMENT',
		notes: '',
	});

	const [transferForm, setTransferForm] = useState({
		product_id: '',
		from_warehouse_id: '',
		to_warehouse_id: '',
		quantity: '',
		notes: '',
	});

	// Filtros locales
	const [localFilters, setLocalFilters] = useState({
		movement_type: '',
		product_id: '',
		warehouse_id: '',
		date_from: '',
		date_to: '',
		low_stock_only: false,
		out_of_stock_only: false,
	});

	// Cargar datos al montar
	useEffect(() => {
		dispatch(fetchInventoryMovements({ page: 1, filters }));
		dispatch(fetchInventoryItems({ page: 1, filters }));
		dispatch(fetchStockLevels());
		dispatch(fetchStockAlerts());
	}, [dispatch, filters]);

	// Handlers
	const handleApplyFilters = () => {
		const activeFilters = Object.fromEntries(
			Object.entries(localFilters).filter(([_, value]) => {
				if (typeof value === 'boolean') return value;
				return value !== '' && value !== undefined;
			}),
		);
		dispatch(setFilters(activeFilters));
	};

	const handleClearFilters = () => {
		setLocalFilters({
			movement_type: '',
			product_id: '',
			warehouse_id: '',
			date_from: '',
			date_to: '',
			low_stock_only: false,
			out_of_stock_only: false,
		});
		dispatch(clearFilters());
	};

	const handlePageChange = (page: number, type: 'movements' | 'items') => {
		if (type === 'movements') {
			dispatch(fetchInventoryMovements({ page, filters }));
		} else {
			dispatch(fetchInventoryItems({ page, filters }));
		}
	};

	const handleAdjustInventory = async () => {
		try {
			await dispatch(
				adjustInventory({
					product_id: parseInt(adjustForm.product_id),
					warehouse_id: parseInt(adjustForm.warehouse_id),
					quantity_change: parseFloat(adjustForm.quantity_change),
					reason: adjustForm.reason,
					notes: adjustForm.notes || undefined,
				}),
			).unwrap();

			setShowAdjustModal(false);
			setAdjustForm({
				product_id: '',
				warehouse_id: '',
				quantity_change: '',
				reason: 'ADJUSTMENT',
				notes: '',
			});

			// Recargar datos
			dispatch(fetchInventoryMovements({ page: 1, filters }));
			dispatch(fetchStockLevels());
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const handleTransferInventory = async () => {
		try {
			await dispatch(
				transferInventory({
					product_id: parseInt(transferForm.product_id),
					from_warehouse_id: parseInt(transferForm.from_warehouse_id),
					to_warehouse_id: parseInt(transferForm.to_warehouse_id),
					quantity: parseFloat(transferForm.quantity),
					notes: transferForm.notes || undefined,
				}),
			).unwrap();

			setShowTransferModal(false);
			setTransferForm({
				product_id: '',
				from_warehouse_id: '',
				to_warehouse_id: '',
				quantity: '',
				notes: '',
			});

			// Recargar datos
			dispatch(fetchInventoryMovements({ page: 1, filters }));
			dispatch(fetchStockLevels());
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const getMovementTypeBadge = (type: MovementType) => {
		const typeConfig = {
			IN: { color: 'green' as const, text: 'Entrada', icon: '↗️' },
			OUT: { color: 'red' as const, text: 'Salida', icon: '↙️' },
			ADJUSTMENT: { color: 'blue' as const, text: 'Ajuste', icon: '⚖️' },
			TRANSFER: { color: 'purple' as const, text: 'Transferencia', icon: '🔄' },
			PRODUCTION: { color: 'amber' as const, text: 'Producción', icon: '🏭' },
			RETURN: { color: 'orange' as const, text: 'Devolución', icon: '↩️' },
		};

		const config = typeConfig[type] || typeConfig['ADJUSTMENT'];
		return (
			<Badge color={config.color}>
				{config.icon} {config.text}
			</Badge>
		);
	};

	const getStockStatusBadge = (currentStock: number, minStock?: number) => {
		if (currentStock === 0) {
			return <Badge color='red'>Sin Stock</Badge>;
		} else if (minStock && currentStock <= minStock) {
			return <Badge color='yellow'>Stock Bajo</Badge>;
		} else {
			return <Badge color='green'>Normal</Badge>;
		}
	};

	const getAlertLevelBadge = (level: string) => {
		const levelConfig = {
			LOW: { color: 'yellow' as const, text: 'Bajo' },
			OUT: { color: 'red' as const, text: 'Agotado' },
			OVERSTOCK: { color: 'blue' as const, text: 'Sobrestock' },
		};

		const config = levelConfig[level as keyof typeof levelConfig] || levelConfig['LOW'];
		return <Badge color={config.color}>{config.text}</Badge>;
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Inventario</h1>
					<p className='text-zinc-500'>Gestión completa de inventario y almacenes</p>
				</div>

				<div className='flex space-x-2'>
					<PermissionGuard permissions={[ERP_PERMISSIONS.INVENTORY.ADJUST]}>
						<Button
							variant='outline'
							color='blue'
							onClick={() => setShowAdjustModal(true)}
							icon='HeroWrenchScrewdriver'>
							Ajustar Stock
						</Button>
					</PermissionGuard>

					<PermissionGuard permissions={[ERP_PERMISSIONS.INVENTORY.TRANSFER]}>
						<Button
							variant='outline'
							color='purple'
							onClick={() => setShowTransferModal(true)}
							icon='HeroArrowsRightLeft'>
							Transferir
						</Button>
					</PermissionGuard>

					<PermissionGuard permissions={[ERP_PERMISSIONS.REPORTS.INVENTORY_REPORT]}>
						<Button
							variant='solid'
							onClick={() => (window.location.href = '/reportes/inventario')}
							icon='HeroChartBar'>
							Reportes
						</Button>
					</PermissionGuard>
				</div>
			</div>

			{/* Estadísticas */}
			<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6'>
				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-blue-100 p-2'>
								<span className='text-xl text-blue-600'>📦</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Items Total</p>
								<p className='text-xl font-bold'>{statistics.totalItems}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-green-100 p-2'>
								<span className='text-xl text-green-600'>💰</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Valor Total</p>
								<p className='text-xl font-bold'>
									{formatCurrency(statistics.totalValue)}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-yellow-100 p-2'>
								<span className='text-xl text-yellow-600'>⚠️</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Stock Bajo</p>
								<p className='text-xl font-bold'>{statistics.lowStockItems}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-red-100 p-2'>
								<span className='text-xl text-red-600'>🚫</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Sin Stock</p>
								<p className='text-xl font-bold'>{statistics.outOfStockItems}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-purple-100 p-2'>
								<span className='text-xl text-purple-600'>📈</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Movimientos</p>
								<p className='text-xl font-bold'>{statistics.totalMovements}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-indigo-100 p-2'>
								<span className='text-xl text-indigo-600'>🕐</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Recientes</p>
								<p className='text-xl font-bold'>{statistics.recentMovements}</p>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Alertas de stock */}
			{stockAlerts.length > 0 && (
				<Card className='mb-6'>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle className='flex items-center'>
								<span className='mr-2 text-red-600'>🚨</span>
								Alertas de Stock ({stockAlerts.length})
							</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
							{stockAlerts.slice(0, 6).map((alert, index) => (
								<div
									key={index}
									className='rounded-lg border border-red-200 bg-red-50 p-3'>
									<div className='flex items-start justify-between'>
										<div>
											<p className='font-medium text-red-800'>
												{alert.product?.name || 'Producto N/A'}
											</p>
											<p className='text-sm text-red-600'>
												{alert.warehouse?.name || 'Almacén N/A'}
											</p>
										</div>
										{getAlertLevelBadge(alert.alert_level)}
									</div>
									<p className='mt-2 text-sm'>
										Stock actual: <strong>{alert.current_stock}</strong>
										{alert.min_stock && (
											<span className='text-red-600'>
												{' '}
												(Mín: {alert.min_stock})
											</span>
										)}
									</p>
								</div>
							))}
						</div>
						{stockAlerts.length > 6 && (
							<div className='mt-3 text-center'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setActiveTab('alerts')}>
									Ver todas las alertas ({stockAlerts.length})
								</Button>
							</div>
						)}
					</CardBody>
				</Card>
			)}

			{/* Filtros */}
			<Card className='mb-6'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Filtros</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5'>
						{activeTab === 'movements' && (
							<Select
								placeholder='Tipo de Movimiento'
								value={localFilters.movement_type}
								onChange={(e) =>
									setLocalFilters({
										...localFilters,
										movement_type: e.target.value,
									})
								}>
								<option value=''>Todos</option>
								<option value='IN'>Entrada</option>
								<option value='OUT'>Salida</option>
								<option value='ADJUSTMENT'>Ajuste</option>
								<option value='TRANSFER'>Transferencia</option>
								<option value='PRODUCTION'>Producción</option>
								<option value='RETURN'>Devolución</option>
							</Select>
						)}

						<Input
							type='date'
							placeholder='Fecha desde'
							value={localFilters.date_from}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, date_from: e.target.value })
							}
						/>

						<Input
							type='date'
							placeholder='Fecha hasta'
							value={localFilters.date_to}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, date_to: e.target.value })
							}
						/>

						{(activeTab === 'items' || activeTab === 'stock') && (
							<>
								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={localFilters.low_stock_only}
										onChange={(e) =>
											setLocalFilters({
												...localFilters,
												low_stock_only: e.target.checked,
											})
										}
										className='mr-2'
									/>
									Solo stock bajo
								</label>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={localFilters.out_of_stock_only}
										onChange={(e) =>
											setLocalFilters({
												...localFilters,
												out_of_stock_only: e.target.checked,
											})
										}
										className='mr-2'
									/>
									Solo sin stock
								</label>
							</>
						)}

						<div className='flex space-x-2'>
							<Button onClick={handleApplyFilters} icon='HeroMagnifyingGlass'>
								Filtrar
							</Button>

							<Button variant='outline' onClick={handleClearFilters} icon='HeroXMark'>
								Limpiar
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Pestañas */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<Tabs activeTab={activeTab} onTabChange={setActiveTab}>
							<Tab key='movements' text='Movimientos'>
								Movimientos
							</Tab>
							<Tab key='items' text='Items'>
								Items de Inventario
							</Tab>
							<Tab key='stock' text='Niveles'>
								Niveles de Stock
							</Tab>
							<Tab key='alerts' text='Alertas'>
								Alertas ({stockAlerts.length})
							</Tab>
						</Tabs>
					</CardHeaderChild>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					{/* Tab: Movimientos */}
					{activeTab === 'movements' && (
						<>
							<Table className='table-fixed max-md:min-w-[80rem]'>
								<THead>
									<Tr>
										<Th className='w-32'>Fecha</Th>
										<Th>Tipo</Th>
										<Th>Producto</Th>
										<Th>Almacén</Th>
										<Th>Cantidad</Th>
										<Th>Stock Anterior</Th>
										<Th>Stock Nuevo</Th>
										<Th>Referencia</Th>
										<Th>Notas</Th>
									</Tr>
								</THead>
								<TBody>
									{loading.movements ? (
										<Tr>
											<Td colSpan={9} className='py-8 text-center'>
												Cargando movimientos...
											</Td>
										</Tr>
									) : movements.length === 0 ? (
										<Tr>
											<Td colSpan={9} className='py-8 text-center'>
												No hay movimientos registrados
											</Td>
										</Tr>
									) : (
										movements.map((movement) => (
											<Tr key={movement.id}>
												<Td>{formatDate(movement.movement_date)}</Td>
												<Td>
													{getMovementTypeBadge(movement.movement_type)}
												</Td>
												<Td>{movement.product?.name || 'N/A'}</Td>
												<Td>{movement.warehouse?.name || 'N/A'}</Td>
												<Td
													className={`font-mono ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
													{movement.quantity > 0 ? '+' : ''}
													{movement.quantity}
												</Td>
												<Td className='font-mono'>
													{movement.previous_stock}
												</Td>
												<Td className='font-mono'>{movement.new_stock}</Td>
												<Td className='text-sm'>
													{movement.reference_type &&
														movement.reference_id && (
															<span className='text-gray-600'>
																{movement.reference_type}#
																{movement.reference_id}
															</span>
														)}
												</Td>
												<Td className='max-w-xs truncate text-sm'>
													{movement.notes}
												</Td>
											</Tr>
										))
									)}
								</TBody>
							</Table>

							{pagination.movements.totalPages > 1 && (
								<TFoot>
									<Tr>
										<Td colSpan={9}>
											<div className='flex justify-center py-4'>
												<Pagination
													currentPage={pagination.movements.currentPage}
													totalPages={pagination.movements.totalPages}
													onPageChange={(page) =>
														handlePageChange(page, 'movements')
													}
												/>
											</div>
										</Td>
									</Tr>
								</TFoot>
							)}
						</>
					)}

					{/* Tab: Items */}
					{activeTab === 'items' && (
						<>
							<Table className='table-fixed max-md:min-w-[70rem]'>
								<THead>
									<Tr>
										<Th>Producto</Th>
										<Th>SKU</Th>
										<Th>Almacén</Th>
										<Th>Stock Actual</Th>
										<Th>Disponible</Th>
										<Th>Reservado</Th>
										<Th>Estado</Th>
										<Th>Última Actualización</Th>
									</Tr>
								</THead>
								<TBody>
									{loading.items ? (
										<Tr>
											<Td colSpan={8} className='py-8 text-center'>
												Cargando items...
											</Td>
										</Tr>
									) : items.length === 0 ? (
										<Tr>
											<Td colSpan={8} className='py-8 text-center'>
												No hay items registrados
											</Td>
										</Tr>
									) : (
										items.map((item) => (
											<Tr key={`${item.product_id}-${item.warehouse_id}`}>
												<Td>{item.product?.name || 'N/A'}</Td>
												<Td className='font-mono'>
													{item.product?.sku || 'N/A'}
												</Td>
												<Td>{item.warehouse?.name || 'N/A'}</Td>
												<Td className='font-mono'>{item.current_stock}</Td>
												<Td className='font-mono'>
													{item.available_stock}
												</Td>
												<Td className='font-mono'>{item.reserved_stock}</Td>
												<Td>
													{getStockStatusBadge(
														item.current_stock,
														item.min_stock,
													)}
												</Td>
												<Td>{formatDate(item.last_updated)}</Td>
											</Tr>
										))
									)}
								</TBody>
							</Table>

							{pagination.items.totalPages > 1 && (
								<TFoot>
									<Tr>
										<Td colSpan={8}>
											<div className='flex justify-center py-4'>
												<Pagination
													currentPage={pagination.items.currentPage}
													totalPages={pagination.items.totalPages}
													onPageChange={(page) =>
														handlePageChange(page, 'items')
													}
												/>
											</div>
										</Td>
									</Tr>
								</TFoot>
							)}
						</>
					)}

					{/* Tab: Niveles de Stock */}
					{activeTab === 'stock' && (
						<Table className='table-fixed max-md:min-w-[70rem]'>
							<THead>
								<Tr>
									<Th>Producto</Th>
									<Th>Almacén</Th>
									<Th>Stock Actual</Th>
									<Th>Stock Mínimo</Th>
									<Th>Stock Máximo</Th>
									<Th>Punto Reorden</Th>
									<Th>Estado</Th>
									<Th className='w-32'>Acciones</Th>
								</Tr>
							</THead>
							<TBody>
								{loading.stockLevels ? (
									<Tr>
										<Td colSpan={8} className='py-8 text-center'>
											Cargando niveles de stock...
										</Td>
									</Tr>
								) : stockLevels.length === 0 ? (
									<Tr>
										<Td colSpan={8} className='py-8 text-center'>
											No hay niveles de stock configurados
										</Td>
									</Tr>
								) : (
									stockLevels.map((level) => (
										<Tr key={`${level.product_id}-${level.warehouse_id}`}>
											<Td>{level.product?.name || 'N/A'}</Td>
											<Td>{level.warehouse?.name || 'N/A'}</Td>
											<Td className='font-mono'>{level.current_stock}</Td>
											<Td className='font-mono'>
												{level.min_stock || 'N/A'}
											</Td>
											<Td className='font-mono'>
												{level.max_stock || 'N/A'}
											</Td>
											<Td className='font-mono'>
												{level.reorder_point || 'N/A'}
											</Td>
											<Td>
												{getStockStatusBadge(
													level.current_stock,
													level.min_stock,
												)}
											</Td>
											<Td>
												<PermissionGuard
													permissions={[
														ERP_PERMISSIONS.INVENTORY.UPDATE_LEVELS,
													]}>
													<Button
														size='sm'
														variant='outline'
														icon='HeroPencil'
														onClick={() => {
															// Abrir modal de edición de niveles
														}}
													/>
												</PermissionGuard>
											</Td>
										</Tr>
									))
								)}
							</TBody>
						</Table>
					)}

					{/* Tab: Alertas */}
					{activeTab === 'alerts' && (
						<Table className='table-fixed max-md:min-w-[60rem]'>
							<THead>
								<Tr>
									<Th>Producto</Th>
									<Th>Almacén</Th>
									<Th>Nivel de Alerta</Th>
									<Th>Stock Actual</Th>
									<Th>Stock Mínimo</Th>
									<Th>Fecha Alerta</Th>
									<Th className='w-32'>Acciones</Th>
								</Tr>
							</THead>
							<TBody>
								{loading.stockAlerts ? (
									<Tr>
										<Td colSpan={7} className='py-8 text-center'>
											Cargando alertas...
										</Td>
									</Tr>
								) : stockAlerts.length === 0 ? (
									<Tr>
										<Td colSpan={7} className='py-8 text-center text-green-600'>
											🎉 No hay alertas de stock activas
										</Td>
									</Tr>
								) : (
									stockAlerts.map((alert, index) => (
										<Tr key={index}>
											<Td>{alert.product?.name || 'N/A'}</Td>
											<Td>{alert.warehouse?.name || 'N/A'}</Td>
											<Td>{getAlertLevelBadge(alert.alert_level)}</Td>
											<Td className='font-mono'>{alert.current_stock}</Td>
											<Td className='font-mono'>
												{alert.min_stock || 'N/A'}
											</Td>
											<Td>{formatDate(alert.created_at)}</Td>
											<Td>
												<div className='flex gap-1'>
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.INVENTORY.ADJUST,
														]}>
														<Button
															size='sm'
															color='green'
															icon='HeroPlus'
															onClick={() => {
																setAdjustForm({
																	...adjustForm,
																	product_id:
																		alert.product_id.toString(),
																	warehouse_id:
																		alert.warehouse_id.toString(),
																});
																setShowAdjustModal(true);
															}}
														/>
													</PermissionGuard>
												</div>
											</Td>
										</Tr>
									))
								)}
							</TBody>
						</Table>
					)}
				</CardBody>
			</Card>

			{/* Modal de ajuste de inventario */}
			<Modal isOpen={showAdjustModal} setIsOpen={setShowAdjustModal}>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Ajustar Inventario</h3>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='mb-1 block text-sm font-medium'>Producto *</label>
								<Select
									value={adjustForm.product_id}
									onChange={(e) =>
										setAdjustForm({ ...adjustForm, product_id: e.target.value })
									}>
									<option value=''>Seleccionar producto</option>
									{/* Aquí iríamos products del estado global */}
									<option value='1'>Producto 1</option>
									<option value='2'>Producto 2</option>
								</Select>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>Almacén *</label>
								<Select
									value={adjustForm.warehouse_id}
									onChange={(e) =>
										setAdjustForm({
											...adjustForm,
											warehouse_id: e.target.value,
										})
									}>
									<option value=''>Seleccionar almacén</option>
									{/* Aquí iríamos warehouses del estado global */}
									<option value='1'>Almacén Principal</option>
									<option value='2'>Almacén Secundario</option>
								</Select>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='mb-1 block text-sm font-medium'>
									Cambio de Cantidad *
								</label>
								<Input
									type='number'
									step='0.01'
									value={adjustForm.quantity_change}
									onChange={(e) =>
										setAdjustForm({
											...adjustForm,
											quantity_change: e.target.value,
										})
									}
									placeholder='Ej: +10 o -5'
								/>
								<p className='mt-1 text-xs text-gray-500'>
									Usar número positivo para aumentar, negativo para disminuir
								</p>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>Razón *</label>
								<Select
									value={adjustForm.reason}
									onChange={(e) =>
										setAdjustForm({ ...adjustForm, reason: e.target.value })
									}>
									<option value='ADJUSTMENT'>Ajuste general</option>
									<option value='CORRECTION'>Corrección</option>
									<option value='DAMAGED'>Producto dañado</option>
									<option value='EXPIRED'>Producto vencido</option>
									<option value='FOUND'>Producto encontrado</option>
									<option value='LOST'>Producto perdido</option>
								</Select>
							</div>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium'>Notas</label>
							<Textarea
								value={adjustForm.notes}
								onChange={(e) =>
									setAdjustForm({ ...adjustForm, notes: e.target.value })
								}
								placeholder='Detalles del ajuste...'
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setShowAdjustModal(false)}>
						Cancelar
					</Button>
					<Button
						color='blue'
						isLoading={actionLoading.adjust}
						onClick={handleAdjustInventory}
						disabled={
							!adjustForm.product_id ||
							!adjustForm.warehouse_id ||
							!adjustForm.quantity_change
						}>
						Ajustar Inventario
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de transferencia */}
			<Modal isOpen={showTransferModal} setIsOpen={setShowTransferModal}>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Transferir Inventario</h3>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4'>
						<div>
							<label className='mb-1 block text-sm font-medium'>Producto *</label>
							<Select
								value={transferForm.product_id}
								onChange={(e) =>
									setTransferForm({ ...transferForm, product_id: e.target.value })
								}>
								<option value=''>Seleccionar producto</option>
								<option value='1'>Producto 1</option>
								<option value='2'>Producto 2</option>
							</Select>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='mb-1 block text-sm font-medium'>
									Almacén Origen *
								</label>
								<Select
									value={transferForm.from_warehouse_id}
									onChange={(e) =>
										setTransferForm({
											...transferForm,
											from_warehouse_id: e.target.value,
										})
									}>
									<option value=''>Seleccionar origen</option>
									<option value='1'>Almacén Principal</option>
									<option value='2'>Almacén Secundario</option>
								</Select>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium'>
									Almacén Destino *
								</label>
								<Select
									value={transferForm.to_warehouse_id}
									onChange={(e) =>
										setTransferForm({
											...transferForm,
											to_warehouse_id: e.target.value,
										})
									}>
									<option value=''>Seleccionar destino</option>
									<option value='1'>Almacén Principal</option>
									<option value='2'>Almacén Secundario</option>
								</Select>
							</div>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium'>Cantidad *</label>
							<Input
								type='number'
								min='0'
								step='0.01'
								value={transferForm.quantity}
								onChange={(e) =>
									setTransferForm({ ...transferForm, quantity: e.target.value })
								}
								placeholder='Cantidad a transferir'
							/>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium'>Notas</label>
							<Textarea
								value={transferForm.notes}
								onChange={(e) =>
									setTransferForm({ ...transferForm, notes: e.target.value })
								}
								placeholder='Motivo de la transferencia...'
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setShowTransferModal(false)}>
						Cancelar
					</Button>
					<Button
						color='purple'
						isLoading={actionLoading.transfer}
						onClick={handleTransferInventory}
						disabled={
							!transferForm.product_id ||
							!transferForm.from_warehouse_id ||
							!transferForm.to_warehouse_id ||
							!transferForm.quantity ||
							transferForm.from_warehouse_id === transferForm.to_warehouse_id
						}>
						Transferir
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default Inventario;
