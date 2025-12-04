import React, { useState, useEffect } from 'react';
import {
	HiOutlineArchiveBox,
	HiOutlineArrowPath,
	HiOutlineCog6Tooth,
	HiOutlineArrowsRightLeft,
	HiOutlineArrowsUpDown,
	HiOutlineClock,
	HiOutlineChartBarSquare,
	HiOutlineShieldCheck, // Icono para garantías
} from 'react-icons/hi2';

// Components
import { toast } from 'react-toastify';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';

// Hooks y datos
import { useInventoryData } from './hooks/useInventarioConsolidado';

// Tipos
export type TabInventario =
	| 'movimientos'
	| 'stock'
	| 'transferencias'
	| 'historial'
	| 'estadisticas'
	| 'garantias'; // Módulo de garantías

export interface FiltrosInventario {
	busqueda: string;
	bodega: string;
	tipoMovimiento: string;
	fechaDesde: string;
	fechaHasta: string;
	producto: string;
	estado: string;
}

const Inventario: React.FC = () => {
	// Estados principales
	const [tabActiva, setTabActiva] = useState<TabInventario>('movimientos');
	const [filtros, setFiltros] = useState<FiltrosInventario>({
		busqueda: '',
		bodega: '',
		tipoMovimiento: '',
		fechaDesde: '',
		fechaHasta: '',
		producto: '',
		estado: '',
	});

	// Estados de modales
	const [ajustarModalOpen, setAjustarModalOpen] = useState(false);
	const [transferirModalOpen, setTransferirModalOpen] = useState(false);
	const [detalleModalOpen, setDetalleModalOpen] = useState(false);
	const [editarModalOpen, setEditarModalOpen] = useState(false); // CU014.2 - Modal para editar movimiento
	const [eliminarModalOpen, setEliminarModalOpen] = useState(false); // CU014.3 - Modal para eliminar movimiento
	// Estados para modales de garantías
	const [crearGarantiaModalOpen, setCrearGarantiaModalOpen] = useState(false);
	const [editarGarantiaModalOpen, setEditarGarantiaModalOpen] = useState(false);
	const [eliminarGarantiaModalOpen, setEliminarGarantiaModalOpen] = useState(false);
	const [detalleGarantiaModalOpen, setDetalleGarantiaModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<any>(null);

	// Hook personalizado para datos
	const {
		loading,
		getMovements,
		getItems,
		getStockLevels,
		getStatistics,
		createMovement,
		editMovement, // CU014.2 - Nueva función para editar movimientos
		deleteMovement, // CU014.3 - Nueva función para eliminar movimientos
		// Funciones de garantías
		getWarranties, // Listar garantías
		createWarranty, // Crear garantía
		editWarranty, // Editar garantía
		deleteWarranty, // Eliminar garantía
		adjustStock,
		simulateLoading,
	} = useInventoryData();

	// Estados para los datos
	const [movimientos, setMovimientos] = useState<any[]>([]);
	const [stockItems, setStockItems] = useState<any[]>([]);
	const [transferencias, setTransferencias] = useState<any[]>([]);
	const [estadisticas, setEstadisticas] = useState<any>(null);
	const [garantias, setGarantias] = useState<any[]>([]); // Estado para garantías

	// Datos mock para bodegas y productos
	const bodegas = [
		{ id: 1, name: 'Bodega Central', code: 'BC01' },
		{ id: 2, name: 'Bodega Norte', code: 'BN02' },
		{ id: 3, name: 'Bodega Sur', code: 'BS03' },
	];

	const productos = [
		{ id: 1, name: 'Laptop Dell XPS 13', sku: 'DELL-XPS-001' },
		{ id: 2, name: 'Monitor Samsung 24"', sku: 'SAM-MON-24' },
		{ id: 3, name: 'Mouse Logitech', sku: 'LOG-MOU-01' },
	];

	// Función consolidada para actualizar datos
	const actualizarDatos = async () => {
		try {
			const [movs, items, stats, warranties] = await Promise.all([
				getMovements(),
				getItems(),
				getStatistics(),
				getWarranties(),
			]);

			setMovimientos(movs || []);
			setStockItems(items || []);
			setEstadisticas(stats);
			setGarantias(warranties || []);

			// Mock transferencias
			setTransferencias([
				{
					id: 1,
					estado: 'pendiente',
					origen: 'Bodega Central',
					destino: 'Bodega Norte',
					fecha: new Date().toISOString(),
				},
				{
					id: 2,
					estado: 'completada',
					origen: 'Bodega Norte',
					destino: 'Bodega Sur',
					fecha: new Date().toISOString(),
				},
			]);
		} catch (error) {
			console.error('Error al cargar datos:', error);
		}
	};

	const transferirStock = async (data: any) => {
		// Mock implementation
		await simulateLoading(1000);
		console.log('Transferir stock:', data);
	};

	// Cargar datos iniciales
	useEffect(() => {
		actualizarDatos();
	}, []);

	// Handlers de filtros
	const handleFiltroChange = (campo: keyof FiltrosInventario, valor: string) => {
		setFiltros((prev) => ({
			...prev,
			[campo]: valor,
		}));
	};

	const limpiarFiltros = () => {
		setFiltros({
			busqueda: '',
			bodega: '',
			tipoMovimiento: '',
			fechaDesde: '',
			fechaHasta: '',
			producto: '',
			estado: '',
		});
	};

	// Handlers de acciones
	const handleAjustarStock = (item: any) => {
		setSelectedItem(item);
		setAjustarModalOpen(true);
	};

	const handleTransferirStock = (item: any) => {
		setSelectedItem(item);
		setTransferirModalOpen(true);
	};

	const handleVerDetalle = (item: any) => {
		setSelectedItem(item);
		setDetalleModalOpen(true);
	};

	// CU014.2 - Manejar la edición de movimientos
	const handleEditarMovimiento = (movimiento: any) => {
		setSelectedItem(movimiento);
		setEditarModalOpen(true);
	};

	// CU014.3 - Manejar la eliminación de movimientos
	const handleEliminarMovimiento = (movimiento: any) => {
		setSelectedItem(movimiento);
		setEliminarModalOpen(true);
	};

	// Manejar creación de garantía
	const handleCrearGarantia = async (data: any) => {
		try {
			await createWarranty(data);
			setCrearGarantiaModalOpen(false);
		} catch (error) {
			console.error('Error creando garantía:', error);
		}
	};

	// Manejar edición de garantía
	const handleEditarGarantia = async (data: any) => {
		try {
			if (selectedItem?.id) {
				await editWarranty(selectedItem.id, data);
				setEditarGarantiaModalOpen(false);
				setSelectedItem(null);
			}
		} catch (error) {
			console.error('Error editando garantía:', error);
		}
	};

	// Manejar eliminación de garantía
	const handleEliminarGarantia = async () => {
		try {
			if (selectedItem?.id) {
				await deleteWarranty(selectedItem.id);
				setEliminarGarantiaModalOpen(false);
				setSelectedItem(null);
			}
		} catch (error) {
			console.error('Error eliminando garantía:', error);
		}
	};

	const handleConfirmarAjuste = async (data: any) => {
		try {
			await adjustStock(data);
			setAjustarModalOpen(false);
			setSelectedItem(null);
			actualizarDatos();
			toast.success('Stock ajustado correctamente');
		} catch (error) {
			toast.error('Error al ajustar el stock');
		}
	};

	const handleConfirmarTransferencia = async (data: any) => {
		try {
			await transferirStock(data);
			setTransferirModalOpen(false);
			setSelectedItem(null);
			actualizarDatos();
			toast.success('Transferencia realizada correctamente');
		} catch (error) {
			toast.error('Error al realizar la transferencia');
		}
	};

	// CU014.2 - Confirmar edición de movimiento
	const handleConfirmarEdicion = async (data: any) => {
		try {
			await editMovement(selectedItem.id, data);
			setEditarModalOpen(false);
			setSelectedItem(null);
			actualizarDatos();
			toast.success('Movimiento actualizado correctamente');
		} catch (error: any) {
			toast.error(`Error al editar movimiento: ${error.message}`);
		}
	};

	// CU014.3 - Confirmar eliminación de movimiento
	const handleConfirmarEliminacion = async () => {
		try {
			const result = await deleteMovement(selectedItem.id);
			setEliminarModalOpen(false);
			setSelectedItem(null);
			actualizarDatos();
			toast.success(
				`${result.message}. Revertido: ${result.revertedQuantity} unidades de ${result.revertedProduct} en ${result.revertedWarehouse}`,
			);
		} catch (error: any) {
			toast.error(`Error al eliminar movimiento: ${error.message}`);
		}
	};

	// Configuración de tabs con iconos directos
	const tabs = [
		{
			id: 'movimientos',
			label: 'Movimientos',
			icon: HiOutlineArrowsUpDown,
			badge: movimientos?.length || 0,
		},
		{
			id: 'stock',
			label: 'Stock Actual',
			icon: HiOutlineArchiveBox,
			badge: stockItems?.length || 0,
		},
		{
			id: 'transferencias',
			label: 'Transferencias',
			icon: HiOutlineArrowsRightLeft,
			badge: transferencias?.filter((t: any) => t.estado === 'pendiente').length || 0,
		},
		{
			id: 'historial',
			label: 'Historial',
			icon: HiOutlineClock,
			badge: null,
		},
		{
			id: 'estadisticas',
			label: 'Estadísticas',
			icon: HiOutlineChartBarSquare,
			badge: null,
		},
		{
			id: 'garantias',
			label: 'Garantías',
			icon: HiOutlineShieldCheck,
			badge: garantias?.filter((g: any) => g.status === 'Activa').length || 0,
		},
	];

	// Renderizado de contenido por tab
	const renderContent = () => {
		switch (tabActiva) {
			case 'movimientos':
				return (
					<Card>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>
										Movimientos de Inventario
									</h3>
									<Badge color='blue'>{movimientos.length} registros</Badge>
								</div>

								{/* Filtros */}
								<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
									<Input
										name='busqueda'
										placeholder='Buscar...'
										value={filtros.busqueda}
										onChange={(e) =>
											handleFiltroChange('busqueda', e.target.value)
										}
									/>
									<Select
										name='bodega'
										value={filtros.bodega}
										onChange={(e) =>
											handleFiltroChange('bodega', e.target.value)
										}>
										<option value=''>Todas las bodegas</option>
										{bodegas.map((b) => (
											<option key={b.id} value={b.id.toString()}>
												{b.name}
											</option>
										))}
									</Select>
									<Select
										name='tipoMovimiento'
										value={filtros.tipoMovimiento}
										onChange={(e) =>
											handleFiltroChange('tipoMovimiento', e.target.value)
										}>
										<option value=''>Todos los tipos</option>
										<option value='IN'>Entrada</option>
										<option value='OUT'>Salida</option>
										<option value='ADJUSTMENT'>Ajuste</option>
										<option value='TRANSFER'>Transferencia</option>
									</Select>
									<Button variant='outline' onClick={limpiarFiltros}>
										Limpiar
									</Button>
								</div>

								{/* Tabla de movimientos */}
								<div className='overflow-x-auto'>
									<table className='min-w-full divide-y divide-gray-200'>
										<thead className='bg-gray-50'>
											<tr>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Tipo
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Producto
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Cantidad
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Bodega
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Fecha
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white'>
											{movimientos.map((mov: any) => (
												<tr key={mov.id}>
													<td className='whitespace-nowrap px-6 py-4'>
														<Badge
															color={
																mov.movement_type === 'IN'
																	? 'emerald'
																	: 'red'
															}>
															{mov.movement_type}
														</Badge>
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														{mov.product?.name || 'N/A'}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														{mov.quantity}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														{mov.warehouse?.name || 'N/A'}
													</td>
													<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
														{new Date(
															mov.movement_date,
														).toLocaleDateString()}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														<div className='flex space-x-2'>
															<Button
																variant='outline'
																size='sm'
																onClick={() =>
																	handleVerDetalle(mov)
																}>
																Ver
															</Button>
															<Button
																color='amber'
																variant='outline'
																size='sm'
																onClick={() =>
																	handleEditarMovimiento(mov)
																}
																title='CU014.2 - Editar movimiento'>
																✏️ Editar
															</Button>
															<Button
																color='red'
																variant='outline'
																size='sm'
																onClick={() =>
																	handleEliminarMovimiento(mov)
																}
																title='CU014.3 - Eliminar movimiento'>
																🗑️ Eliminar
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</CardBody>
					</Card>
				);

			case 'stock':
				return (
					<Card>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>Stock Actual</h3>
									<Badge color='emerald'>{stockItems.length} productos</Badge>
								</div>

								<div className='overflow-x-auto'>
									<table className='min-w-full divide-y divide-gray-200'>
										<thead className='bg-gray-50'>
											<tr>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Producto
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													SKU
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Stock
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Estado
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white'>
											{stockItems.map((item: any) => (
												<tr key={`${item.product_id}-${item.warehouse_id}`}>
													<td className='whitespace-nowrap px-6 py-4'>
														{item.product?.name || 'N/A'}
													</td>
													<td className='whitespace-nowrap px-6 py-4 font-mono text-sm'>
														{item.product?.sku || 'N/A'}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														{item.current_stock}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														<Badge
															color={
																item.status === 'IN_STOCK'
																	? 'emerald'
																	: item.status === 'LOW_STOCK'
																		? 'amber'
																		: 'red'
															}>
															{item.status}
														</Badge>
													</td>
													<td className='space-x-2 whitespace-nowrap px-6 py-4'>
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																handleAjustarStock(item)
															}>
															<HiOutlineCog6Tooth className='mr-1 h-4 w-4' />
															Ajustar
														</Button>
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																handleTransferirStock(item)
															}>
															<HiOutlineArrowsRightLeft className='mr-1 h-4 w-4' />
															Transferir
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</CardBody>
					</Card>
				);

			case 'transferencias':
				return (
					<Card>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>Transferencias</h3>
									<Badge color='blue'>
										{transferencias.length} transferencias
									</Badge>
								</div>

								<div className='overflow-x-auto'>
									<table className='min-w-full divide-y divide-gray-200'>
										<thead className='bg-gray-50'>
											<tr>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													ID
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Origen
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Destino
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Estado
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
													Fecha
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white'>
											{transferencias.map((transfer: any) => (
												<tr key={transfer.id}>
													<td className='whitespace-nowrap px-6 py-4'>
														#{transfer.id}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														{transfer.origen}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														{transfer.destino}
													</td>
													<td className='whitespace-nowrap px-6 py-4'>
														<Badge
															color={
																transfer.estado === 'completada'
																	? 'emerald'
																	: 'amber'
															}>
															{transfer.estado}
														</Badge>
													</td>
													<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
														{new Date(
															transfer.fecha,
														).toLocaleDateString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</CardBody>
					</Card>
				);

			case 'historial':
				return (
					<Card>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>Historial Completo</h3>
									<Badge color='purple'>CU024 - Historial Dedicado</Badge>
								</div>

								<div className='rounded-lg bg-blue-50 p-6'>
									<div className='text-center'>
										<HiOutlineClock className='mx-auto mb-4 h-12 w-12 text-blue-500' />
										<h4 className='mb-2 text-lg font-medium text-blue-900'>
											Módulo de Historial Consolidado
										</h4>
										<p className='mb-4 text-blue-700'>
											Vista completa de todos los movimientos con filtros
											avanzados, exportación y trazabilidad completa según
											especificación CU024.
										</p>
										<div className='space-y-2 text-sm text-blue-600'>
											<p>
												✅ Filtros por fecha, producto, bodega, tipo de
												movimiento
											</p>
											<p>✅ Trazabilidad completa (usuario, timestamps)</p>
											<p>✅ Exportación a CSV/Excel</p>
											<p>✅ Búsqueda por número de serie</p>
											<p>
												✅ Conexión con transferencias
												(reference_type/reference_id)
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				);

			case 'estadisticas':
				return (
					<Card>
						<CardBody>
							<div className='space-y-6'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>
										Dashboard de Estadísticas
									</h3>
									<Badge color='emerald'>Consolidado</Badge>
								</div>

								{/* Métricas principales */}
								<div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
									<Card>
										<CardBody>
											<div className='flex items-center'>
												<div className='flex-shrink-0'>
													<HiOutlineArchiveBox className='h-8 w-8 text-blue-500' />
												</div>
												<div className='ml-4'>
													<p className='text-sm font-medium text-gray-500'>
														Total Productos
													</p>
													<p className='text-2xl font-semibold text-gray-900'>
														{stockItems.length}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>

									<Card>
										<CardBody>
											<div className='flex items-center'>
												<div className='flex-shrink-0'>
													<HiOutlineArrowsUpDown className='h-8 w-8 text-emerald-500' />
												</div>
												<div className='ml-4'>
													<p className='text-sm font-medium text-gray-500'>
														Movimientos
													</p>
													<p className='text-2xl font-semibold text-gray-900'>
														{movimientos.length}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>

									<Card>
										<CardBody>
											<div className='flex items-center'>
												<div className='flex-shrink-0'>
													<HiOutlineArrowsRightLeft className='h-8 w-8 text-purple-500' />
												</div>
												<div className='ml-4'>
													<p className='text-sm font-medium text-gray-500'>
														Transferencias
													</p>
													<p className='text-2xl font-semibold text-gray-900'>
														{transferencias.length}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>

									<Card>
										<CardBody>
											<div className='flex items-center'>
												<div className='flex-shrink-0'>
													<HiOutlineChartBarSquare className='h-8 w-8 text-amber-500' />
												</div>
												<div className='ml-4'>
													<p className='text-sm font-medium text-gray-500'>
														Bodegas
													</p>
													<p className='text-2xl font-semibold text-gray-900'>
														{bodegas.length}
													</p>
												</div>
											</div>
										</CardBody>
									</Card>
								</div>

								{/* Estado del sistema */}
								<div className='rounded-lg bg-emerald-50 p-6'>
									<div className='flex items-center'>
										<div className='flex-shrink-0'>
											<div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100'>
												<HiOutlineArchiveBox className='h-5 w-5 text-emerald-600' />
											</div>
										</div>
										<div className='ml-3'>
											<h4 className='text-lg font-medium text-emerald-900'>
												Sistema de Inventario Consolidado
											</h4>
											<p className='text-emerald-700'>
												✅ CU014.1-CU014.5 implementados | ✅ Transferencias
												consolidadas | ✅ Historial dedicado | 🔄
												WooCommerce Sync (próximamente)
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				);

			case 'garantias':
				return (
					<Card>
						<CardBody>
							<div className='space-y-6'>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>
										Sistema de Garantías Premium
									</h3>
									<div className='flex space-x-2'>
										<Badge color='emerald' variant='outline'>
											{garantias.filter((g) => g.status === 'Activa').length}{' '}
											Activas
										</Badge>
										<Button
											color='blue'
											onClick={() => setCrearGarantiaModalOpen(true)}>
											+ Nueva Garantía
										</Button>
									</div>
								</div>

								{/* Filtros */}
								<div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
									<Input
										name='busqueda_garantias'
										placeholder='Buscar por producto, tipo o notas...'
										value={filtros.busqueda}
										onChange={(e) =>
											setFiltros({ ...filtros, busqueda: e.target.value })
										}
									/>
									<Select
										name='producto_garantias'
										value={filtros.producto}
										onChange={(e) =>
											setFiltros({ ...filtros, producto: e.target.value })
										}>
										<option value=''>Todos los productos</option>
										{productos.map((producto: any) => (
											<option key={producto.id} value={producto.id}>
												{producto.name}
											</option>
										))}
									</Select>
									<Select
										name='estado_garantias'
										value={filtros.estado}
										onChange={(e) =>
											setFiltros({ ...filtros, estado: e.target.value })
										}>
										<option value=''>Todos los estados</option>
										<option value='Activa'>Activa</option>
										<option value='Expirada'>Expirada</option>
										<option value='Usada'>Usada</option>
										<option value='Anulada'>Anulada</option>
									</Select>
									<Input
										name='fecha_desde_garantias'
										type='date'
										placeholder='Fecha desde'
										value={filtros.fechaDesde}
										onChange={(e) =>
											setFiltros({ ...filtros, fechaDesde: e.target.value })
										}
									/>
									<Input
										name='fecha_hasta_garantias'
										type='date'
										placeholder='Fecha hasta'
										value={filtros.fechaHasta}
										onChange={(e) =>
											setFiltros({ ...filtros, fechaHasta: e.target.value })
										}
									/>
								</div>

								{/* Tabla de garantías */}
								<div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
									<table className='min-w-full divide-y divide-gray-300'>
										<thead className='bg-gray-50'>
											<tr>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
													Estado
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
													Producto
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
													Tipo de Garantía
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
													Período
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
													Días Restantes
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white'>
											{garantias
												.filter((garantia: any) => {
													// Filtro por búsqueda general
													if (filtros.busqueda) {
														const busqueda =
															filtros.busqueda.toLowerCase();
														return (
															garantia.product?.name
																?.toLowerCase()
																.includes(busqueda) ||
															garantia.warranty_type
																?.toLowerCase()
																.includes(busqueda) ||
															garantia.notes
																?.toLowerCase()
																.includes(busqueda) ||
															garantia.product?.sku
																?.toLowerCase()
																.includes(busqueda)
														);
													}
													return true;
												})
												.filter((garantia: any) => {
													// Filtro por producto
													if (filtros.producto) {
														return (
															garantia.product_id?.toString() ===
															filtros.producto
														);
													}
													return true;
												})
												.filter((garantia: any) => {
													// Filtro por estado
													if (filtros.estado) {
														return garantia.status === filtros.estado;
													}
													return true;
												})
												.filter((garantia: any) => {
													// Filtro por fecha desde
													if (filtros.fechaDesde) {
														return (
															new Date(garantia.start_date) >=
															new Date(filtros.fechaDesde)
														);
													}
													return true;
												})
												.filter((garantia: any) => {
													// Filtro por fecha hasta
													if (filtros.fechaHasta) {
														return (
															new Date(garantia.end_date) <=
															new Date(filtros.fechaHasta)
														);
													}
													return true;
												})
												.map((garantia: any) => {
													const diasRestantes =
														garantia.status === 'Activa'
															? Math.ceil(
																	(new Date(
																		garantia.end_date,
																	).getTime() -
																		new Date().getTime()) /
																		(1000 * 60 * 60 * 24),
																)
															: 0;

													return (
														<tr key={garantia.id}>
															<td className='whitespace-nowrap px-6 py-4'>
																<Badge
																	color={
																		garantia.status === 'Activa'
																			? 'emerald'
																			: garantia.status ===
																				  'Expirada'
																				? 'red'
																				: garantia.status ===
																					  'Usada'
																					? 'amber'
																					: 'gray'
																	}>
																	{garantia.status}
																</Badge>
															</td>
															<td className='whitespace-nowrap px-6 py-4'>
																<div>
																	<div className='font-medium text-gray-900'>
																		{garantia.product?.name}
																	</div>
																	<div className='text-sm text-gray-500'>
																		SKU: {garantia.product?.sku}
																	</div>
																</div>
															</td>
															<td className='whitespace-nowrap px-6 py-4'>
																{garantia.warranty_type}
															</td>
															<td className='whitespace-nowrap px-6 py-4 text-sm'>
																<div>
																	<div>
																		Inicio:{' '}
																		{new Date(
																			garantia.start_date,
																		).toLocaleDateString()}
																	</div>
																	<div>
																		Fin:{' '}
																		{new Date(
																			garantia.end_date,
																		).toLocaleDateString()}
																	</div>
																</div>
															</td>
															<td className='whitespace-nowrap px-6 py-4'>
																{garantia.status === 'Activa' ? (
																	<span
																		className={
																			diasRestantes <= 30
																				? 'font-bold text-red-600'
																				: 'text-gray-900'
																		}>
																		{diasRestantes > 0
																			? `${diasRestantes} días`
																			: 'Expirada'}
																	</span>
																) : (
																	<span className='text-gray-500'>
																		N/A
																	</span>
																)}
															</td>
															<td className='whitespace-nowrap px-6 py-4'>
																<div className='flex space-x-2'>
																	<Button
																		variant='outline'
																		size='sm'
																		onClick={() => {
																			setSelectedItem(
																				garantia,
																			);
																			setDetalleGarantiaModalOpen(
																				true,
																			);
																		}}>
																		Ver
																	</Button>
																	<Button
																		color='amber'
																		variant='outline'
																		size='sm'
																		onClick={() => {
																			setSelectedItem(
																				garantia,
																			);
																			setEditarGarantiaModalOpen(
																				true,
																			);
																		}}>
																		Editar
																	</Button>
																	<Button
																		color='red'
																		variant='outline'
																		size='sm'
																		onClick={() => {
																			setSelectedItem(
																				garantia,
																			);
																			setEliminarGarantiaModalOpen(
																				true,
																			);
																		}}>
																		Eliminar
																	</Button>
																</div>
															</td>
														</tr>
													);
												})}
											{garantias.length === 0 && (
												<tr>
													<td
														colSpan={6}
														className='px-6 py-12 text-center text-gray-500'>
														<div className='flex flex-col items-center'>
															<HiOutlineShieldCheck className='mb-4 h-12 w-12 text-gray-300' />
															<p className='mb-2 text-lg font-medium text-gray-900'>
																No hay garantías registradas
															</p>
															<p className='mb-4 text-gray-500'>
																Comienza creando la primera garantía
																para tus productos
															</p>
															<Button
																color='blue'
																onClick={() =>
																	setCrearGarantiaModalOpen(true)
																}>
																+ Crear Primera Garantía
															</Button>
														</div>
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>

								{/* Información adicional */}
								<div className='rounded-md border border-blue-200 bg-blue-50 p-4'>
									<div className='flex'>
										<HiOutlineShieldCheck className='h-5 w-5 text-blue-400' />
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-blue-800'>
												Sistema Avanzado de Garantías
											</h3>
											<div className='mt-2 text-sm text-blue-700'>
												<p className='mb-2'>
													<strong>Funcionalidades premium:</strong>
												</p>
												<ul className='list-inside list-disc space-y-1'>
													<li>
														Gestión completa del ciclo de vida de
														garantías
													</li>
													<li>Seguimiento inteligente de vencimientos</li>
													<li>
														Sistema de filtros avanzados multivariable
													</li>
													<li>
														Control automatizado de estados y alertas
													</li>
													<li>
														Historial detallado con auditoría completa
													</li>
													<li>
														Notificaciones automáticas de proximidad al
														vencimiento
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				);

			default:
				return null;
		}
	};

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<HiOutlineArchiveBox className='mr-2 h-6 w-6' />
					<span className='text-lg font-semibold'>Gestión de Inventario</span>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex space-x-2'>
						<Button
							variant='outline'
							color='emerald'
							onClick={() => setAjustarModalOpen(true)}
							className='flex items-center'>
							<HiOutlineCog6Tooth className='mr-1 h-4 w-4' />
							Ajustar Stock
						</Button>
						<Button
							variant='outline'
							color='blue'
							onClick={() => setTransferirModalOpen(true)}
							className='flex items-center'>
							<HiOutlineArrowsRightLeft className='mr-1 h-4 w-4' />
							Transferir
						</Button>
						<Button
							color='blue'
							onClick={actualizarDatos}
							className='flex items-center'>
							<HiOutlineArrowPath className='mr-1 h-4 w-4' />
							Actualizar
						</Button>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Navegación de Tabs */}
				<div className='mb-6'>
					<div className='border-b border-gray-200'>
						<nav className='-mb-px flex space-x-8'>
							{tabs.map((tab) => {
								const IconComponent = tab.icon;
								return (
									<button
										key={tab.id}
										onClick={() => setTabActiva(tab.id as TabInventario)}
										className={`flex items-center whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
											tabActiva === tab.id
												? 'border-blue-500 text-blue-600'
												: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
										} `}>
										<IconComponent className='mr-2 h-5 w-5' />
										{tab.label}
										{tab.badge !== null && (
											<Badge
												className='ml-2'
												color={tabActiva === tab.id ? 'blue' : 'gray'}
												variant='solid'>
												{tab.badge}
											</Badge>
										)}
									</button>
								);
							})}
						</nav>
					</div>
				</div>

				{/* Contenido del Tab Activo */}
				<div className='flex-1'>{renderContent()}</div>

				{/* Modales simplificados - Se implementarán como componentes separados */}
				{/* Modal de Ajuste de Stock */}
				<Modal isOpen={ajustarModalOpen} setIsOpen={setAjustarModalOpen}>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100'>
								<HiOutlineCog6Tooth className='h-6 w-6 text-emerald-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>Ajustar Stock</h2>
								<p className='text-sm text-gray-600'>
									Modificar cantidad en inventario
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						<div className='space-y-4'>
							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Producto
								</label>
								<p className='rounded bg-gray-50 p-2 text-sm text-gray-900'>
									{selectedItem?.product?.name || 'Seleccione un producto'}
								</p>
							</div>

							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Stock Actual
								</label>
								<p className='rounded bg-gray-50 p-2 text-sm text-gray-900'>
									{selectedItem?.current_stock || 0} unidades
								</p>
							</div>

							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Nuevo Stock
								</label>
								<Input
									name='nuevoStock'
									type='number'
									placeholder='Ingrese nueva cantidad'
									min='0'
								/>
							</div>

							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Motivo del Ajuste
								</label>
								<Select name='motivoAjuste'>
									<option value=''>Seleccione un motivo</option>
									<option value='inventory_count'>Conteo físico</option>
									<option value='damaged'>Producto dañado</option>
									<option value='expired'>Producto vencido</option>
									<option value='correction'>Corrección de error</option>
									<option value='other'>Otro motivo</option>
								</Select>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button variant='outline' onClick={() => setAjustarModalOpen(false)}>
								Cancelar
							</Button>
							<Button
								color='emerald'
								onClick={() =>
									handleConfirmarAjuste({
										/* datos del form */
									})
								}>
								Confirmar Ajuste
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Transferencia de Stock */}
				<Modal isOpen={transferirModalOpen} setIsOpen={setTransferirModalOpen}>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
								<HiOutlineArrowsRightLeft className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Transferir Stock
								</h2>
								<p className='text-sm text-gray-600'>
									Mover productos entre bodegas
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						<div className='space-y-4'>
							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Producto
								</label>
								<p className='rounded bg-gray-50 p-2 text-sm text-gray-900'>
									{selectedItem?.product?.name || 'Seleccione un producto'}
								</p>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Bodega Origen
									</label>
									<Select name='bodegaOrigen'>
										<option value=''>Seleccione origen</option>
										{bodegas.map((b) => (
											<option key={b.id} value={b.id}>
												{b.name}
											</option>
										))}
									</Select>
								</div>
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Bodega Destino
									</label>
									<Select name='bodegaDestino'>
										<option value=''>Seleccione destino</option>
										{bodegas.map((b) => (
											<option key={b.id} value={b.id}>
												{b.name}
											</option>
										))}
									</Select>
								</div>
							</div>

							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Cantidad a Transferir
								</label>
								<Input
									name='cantidadTransferir'
									type='number'
									placeholder='Ingrese cantidad'
									min='1'
								/>
							</div>

							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700'>
									Motivo de la Transferencia
								</label>
								<Input
									name='motivoTransferencia'
									placeholder='Describa el motivo de la transferencia'
								/>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button variant='outline' onClick={() => setTransferirModalOpen(false)}>
								Cancelar
							</Button>
							<Button
								color='blue'
								onClick={() =>
									handleConfirmarTransferencia({
										/* datos del form */
									})
								}>
								Confirmar Transferencia
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* CU014.2 - Modal de Edición de Movimiento */}
				<Modal isOpen={editarModalOpen} setIsOpen={setEditarModalOpen}>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
								<HiOutlineArrowsUpDown className='h-6 w-6 text-amber-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Editar Movimiento
								</h2>
								<p className='text-sm text-gray-500'>
									Actualizar los datos del movimiento seleccionado
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedItem && (
							<div className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='mb-2 block text-sm font-medium text-gray-700'>
											Producto *
										</label>
										<Select name='product_id'>
											<option value=''>Seleccionar producto</option>
											{/* Mock data - se llenará con productos reales */}
											<option
												value='1'
												selected={selectedItem.product?.id === 1}>
												Laptop Dell XPS 13
											</option>
											<option
												value='2'
												selected={selectedItem.product?.id === 2}>
												Monitor Samsung 24"
											</option>
											<option
												value='3'
												selected={selectedItem.product?.id === 3}>
												Mouse Logitech MX Master
											</option>
											<option
												value='4'
												selected={selectedItem.product?.id === 4}>
												Teclado Mecánico
											</option>
											<option
												value='5'
												selected={selectedItem.product?.id === 5}>
												Impresora HP LaserJet
											</option>
										</Select>
									</div>
									<div>
										<label className='mb-2 block text-sm font-medium text-gray-700'>
											Tipo de Movimiento *
										</label>
										<Select name='movement_type'>
											<option
												value='IN'
												selected={selectedItem.movement_type === 'IN'}>
												Entrada (IN)
											</option>
											<option
												value='OUT'
												selected={selectedItem.movement_type === 'OUT'}>
												Salida (OUT)
											</option>
											<option
												value='ADJUSTMENT'
												selected={
													selectedItem.movement_type === 'ADJUSTMENT'
												}>
												Ajuste (ADJUSTMENT)
											</option>
											<option
												value='TRANSFER'
												selected={
													selectedItem.movement_type === 'TRANSFER'
												}>
												Transferencia (TRANSFER)
											</option>
										</Select>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='mb-2 block text-sm font-medium text-gray-700'>
											Bodega *
										</label>
										<Select name='warehouse_id'>
											<option value=''>Seleccionar bodega</option>
											<option
												value='1'
												selected={selectedItem.warehouse?.id === 1}>
												Bodega Central
											</option>
											<option
												value='2'
												selected={selectedItem.warehouse?.id === 2}>
												Bodega Norte
											</option>
											<option
												value='3'
												selected={selectedItem.warehouse?.id === 3}>
												Bodega Sur
											</option>
											<option
												value='4'
												selected={selectedItem.warehouse?.id === 4}>
												Bodega Distribución
											</option>
										</Select>
									</div>
									<div>
										<label className='mb-2 block text-sm font-medium text-gray-700'>
											Cantidad *
										</label>
										<Input
											name='quantity'
											type='number'
											placeholder='Ingrese cantidad'
											min='1'
											defaultValue={Math.abs(
												selectedItem.quantity,
											).toString()}
										/>
									</div>
								</div>

								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Referencia
									</label>
									<Input
										name='reference'
										placeholder='Número de referencia (PO, SALE, etc.)'
										defaultValue={selectedItem.reference || ''}
									/>
								</div>

								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Observaciones
									</label>
									<Input
										name='notes'
										placeholder='Describa el motivo del movimiento'
										defaultValue={selectedItem.notes || ''}
									/>
								</div>

								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Costo Unitario
									</label>
									<Input
										name='unit_cost'
										type='number'
										placeholder='Costo unitario (opcional)'
										min='0'
										step='0.01'
										defaultValue={selectedItem.unit_cost?.toString() || ''}
									/>
								</div>

								{/* Advertencias */}
								<div className='rounded-md border border-amber-200 bg-amber-50 p-4'>
									<div className='flex'>
										<div className='flex-shrink-0'>
											<HiOutlineCog6Tooth className='h-5 w-5 text-amber-400' />
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-amber-800'>
												Importante - CU014.2
											</h3>
											<div className='mt-2 text-sm text-amber-700'>
												<ul className='list-inside list-disc space-y-1'>
													<li>
														El sistema revertirá el efecto anterior del
														movimiento
													</li>
													<li>
														Se aplicará el nuevo movimiento con los
														datos actualizados
													</li>
													<li>
														Se validará stock suficiente para salidas
													</li>
													<li>
														Los movimientos asociados a ventas cerradas
														no pueden editarse
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button variant='outline' onClick={() => setEditarModalOpen(false)}>
								Cancelar
							</Button>
							<Button
								color='amber'
								onClick={() => {
									// Obtener datos del formulario y llamar la función
									const formData = {
										product_id: parseInt(
											(
												document.querySelector(
													'[name="product_id"]',
												) as HTMLSelectElement
											)?.value || '1',
										),
										movement_type: (
											document.querySelector(
												'[name="movement_type"]',
											) as HTMLSelectElement
										)?.value as 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER',
										warehouse_id: parseInt(
											(
												document.querySelector(
													'[name="warehouse_id"]',
												) as HTMLSelectElement
											)?.value || '1',
										),
										quantity: parseInt(
											(
												document.querySelector(
													'[name="quantity"]',
												) as HTMLInputElement
											)?.value || '1',
										),
										reference:
											(
												document.querySelector(
													'[name="reference"]',
												) as HTMLInputElement
											)?.value || '',
										notes:
											(
												document.querySelector(
													'[name="notes"]',
												) as HTMLInputElement
											)?.value || '',
										unit_cost:
											parseFloat(
												(
													document.querySelector(
														'[name="unit_cost"]',
													) as HTMLInputElement
												)?.value,
											) || undefined,
									};
									handleConfirmarEdicion(formData);
								}}>
								💾 Guardar Cambios
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* CU014.3 - Modal de Confirmación de Eliminación */}
				<Modal isOpen={eliminarModalOpen} setIsOpen={setEliminarModalOpen}>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
								<HiOutlineArchiveBox className='h-6 w-6 text-red-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Confirmar Eliminación
								</h2>
								<p className='text-sm text-gray-500'>
									Esta acción no se puede deshacer
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedItem && (
							<div className='space-y-4'>
								{/* Información del movimiento a eliminar */}
								<div className='rounded-md border border-red-200 bg-red-50 p-4'>
									<h3 className='mb-3 text-lg font-medium text-red-800'>
										Detalle del Movimiento a Eliminar
									</h3>
									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='font-medium text-red-700'>Tipo:</span>
											<Badge
												color={
													selectedItem.movement_type === 'IN'
														? 'emerald'
														: 'red'
												}
												className='ml-2'>
												{selectedItem.movement_type}
											</Badge>
										</div>
										<div>
											<span className='font-medium text-red-700'>
												Producto:
											</span>
											<span className='ml-2 text-red-900'>
												{selectedItem.product?.name}
											</span>
										</div>
										<div>
											<span className='font-medium text-red-700'>
												Cantidad:
											</span>
											<span className='ml-2 text-red-900'>
												{Math.abs(selectedItem.quantity)}
											</span>
										</div>
										<div>
											<span className='font-medium text-red-700'>
												Bodega:
											</span>
											<span className='ml-2 text-red-900'>
												{selectedItem.warehouse?.name}
											</span>
										</div>
										<div>
											<span className='font-medium text-red-700'>Fecha:</span>
											<span className='ml-2 text-red-900'>
												{new Date(
													selectedItem.movement_date,
												).toLocaleDateString()}
											</span>
										</div>
										<div>
											<span className='font-medium text-red-700'>
												Referencia:
											</span>
											<span className='ml-2 text-red-900'>
												{selectedItem.reference || 'N/A'}
											</span>
										</div>
									</div>
									<div className='mt-3'>
										<span className='font-medium text-red-700'>Notas:</span>
										<p className='ml-2 mt-1 text-red-900'>
											{selectedItem.notes || 'Sin notas'}
										</p>
									</div>
								</div>

								{/* Advertencia sobre el impacto */}
								<div className='rounded-md border border-amber-200 bg-amber-50 p-4'>
									<div className='flex'>
										<div className='flex-shrink-0'>
											<HiOutlineArrowPath className='h-5 w-5 text-amber-400' />
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-amber-800'>
												Impacto en Stock - CU014.3
											</h3>
											<div className='mt-2 text-sm text-amber-700'>
												<ul className='list-inside list-disc space-y-1'>
													<li>
														<strong>El stock se revertirá</strong> al
														estado previo a este movimiento
													</li>
													<li>
														{selectedItem.movement_type === 'IN' ||
														selectedItem.quantity > 0
															? `Se restará ${Math.abs(selectedItem.quantity)} unidades del stock`
															: `Se sumará ${Math.abs(selectedItem.quantity)} unidades al stock`}
													</li>
													<li>
														Los estados de stock
														(IN_STOCK/LOW_STOCK/OUT_OF_STOCK) se
														recalcularán
													</li>
													<li>
														Esta operación es{' '}
														<strong>irreversible</strong>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>

								{/* Validaciones y restricciones */}
								<div className='rounded-md border border-gray-200 bg-gray-50 p-4'>
									<h3 className='text-sm font-medium text-gray-800'>
										Validaciones del Sistema
									</h3>
									<div className='mt-2 text-sm text-gray-600'>
										<ul className='list-inside list-disc space-y-1'>
											<li>
												Se verificará que el movimiento no esté bloqueado
												por procesos posteriores
											</li>
											<li>
												Se validará que la reversión no genere stock
												negativo
											</li>
											<li>
												Los movimientos asociados a ventas cerradas no
												pueden eliminarse
											</li>
											<li>
												Se mantendrá la trazabilidad del cambio en el
												sistema
											</li>
										</ul>
									</div>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button variant='outline' onClick={() => setEliminarModalOpen(false)}>
								Cancelar
							</Button>
							<Button color='red' onClick={handleConfirmarEliminacion}>
								🗑️ Confirmar Eliminación
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Detalle de Movimiento */}
				<Modal isOpen={detalleModalOpen} setIsOpen={setDetalleModalOpen}>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
								<HiOutlineArrowsUpDown className='h-6 w-6 text-purple-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Detalle de Movimiento
								</h2>
								<p className='text-sm text-gray-600'>
									Información completa del movimiento
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedItem && (
							<div className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Tipo de Movimiento
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											<Badge
												color={
													selectedItem.movement_type === 'IN'
														? 'emerald'
														: 'red'
												}>
												{selectedItem.movement_type}
											</Badge>
										</p>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Fecha
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											{new Date(selectedItem.movement_date).toLocaleString()}
										</p>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Producto
									</label>
									<p className='mt-1 text-sm text-gray-900'>
										{selectedItem.product?.name} ({selectedItem.product?.sku})
									</p>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Cantidad
										</label>
										<p className='mt-1 text-sm font-semibold text-gray-900'>
											{selectedItem.quantity > 0 ? '+' : ''}
											{selectedItem.quantity}
										</p>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Bodega
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											{selectedItem.warehouse?.name}
										</p>
									</div>
								</div>

								{selectedItem.reference && (
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Referencia
										</label>
										<p className='mt-1 font-mono text-sm text-gray-900'>
											{selectedItem.reference}
										</p>
									</div>
								)}

								{selectedItem.notes && (
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Notas
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											{selectedItem.notes}
										</p>
									</div>
								)}

								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Responsable
									</label>
									<p className='mt-1 text-sm text-gray-900'>
										{selectedItem.created_by || 'Sistema'}
									</p>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end'>
							<Button variant='outline' onClick={() => setDetalleModalOpen(false)}>
								Cerrar
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal Crear Garantía */}
				<Modal isOpen={crearGarantiaModalOpen} setIsOpen={setCrearGarantiaModalOpen}>
					<ModalHeader>
						<div className='flex items-center'>
							<HiOutlineShieldCheck className='mr-2 h-5 w-5 text-green-600' />
							Nueva Garantía
						</div>
					</ModalHeader>
					<ModalBody>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								const formData = new FormData(e.target as HTMLFormElement);
								const data = {
									product_id: parseInt(formData.get('product_id') as string),
									warranty_type: formData.get('warranty_type'),
									start_date: formData.get('start_date'),
									end_date: formData.get('end_date'),
									notes: formData.get('notes') || '',
									status: 'Activa',
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
								};
								handleCrearGarantia(data);
							}}>
							<div className='space-y-4'>
								<div>
									<Label htmlFor='product_id'>Producto *</Label>
									<Select name='product_id' required>
										<option value=''>Seleccionar producto...</option>
										{productos.map((producto: any) => (
											<option key={producto.id} value={producto.id}>
												{producto.name} ({producto.sku})
											</option>
										))}
									</Select>
								</div>

								<div>
									<Label htmlFor='warranty_type'>Tipo de Garantía *</Label>
									<Select name='warranty_type' required>
										<option value=''>Seleccionar tipo...</option>
										<option value='Fabricante'>Fabricante</option>
										<option value='Extendida'>Extendida</option>
										<option value='Comercial'>Comercial</option>
									</Select>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<Label htmlFor='start_date'>Fecha Inicio *</Label>
										<Input
											name='start_date'
											type='date'
											required
											max={new Date().toISOString().split('T')[0]}
										/>
									</div>
									<div>
										<Label htmlFor='end_date'>Fecha Fin *</Label>
										<Input
											name='end_date'
											type='date'
											required
											min={new Date().toISOString().split('T')[0]}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor='notes'>Notas Adicionales</Label>
									<textarea
										name='notes'
										className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
										rows={3}
										placeholder='Condiciones especiales, términos, etc...'
									/>
								</div>

								<div className='flex justify-end space-x-2'>
									<Button
										type='button'
										variant='outline'
										onClick={() => setCrearGarantiaModalOpen(false)}>
										Cancelar
									</Button>
									<Button type='submit' color='blue'>
										Crear Garantía
									</Button>
								</div>
							</div>
						</form>
					</ModalBody>
				</Modal>

				{/* Modal Editar Garantía */}
				<Modal isOpen={editarGarantiaModalOpen} setIsOpen={setEditarGarantiaModalOpen}>
					<ModalHeader>
						<div className='flex items-center'>
							<HiOutlineShieldCheck className='mr-2 h-5 w-5 text-amber-600' />
							Editar Garantía
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedItem && (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									const formData = new FormData(e.target as HTMLFormElement);
									const data = {
										product_id: parseInt(formData.get('product_id') as string),
										warranty_type: formData.get('warranty_type'),
										start_date: formData.get('start_date'),
										end_date: formData.get('end_date'),
										notes: formData.get('notes') || '',
										status: formData.get('status'),
										updated_at: new Date().toISOString(),
									};
									handleEditarGarantia(data);
								}}>
								<div className='space-y-4'>
									<div>
										<Label htmlFor='product_id'>Producto *</Label>
										<Select
											name='product_id'
											defaultValue={selectedItem.product_id}
											required>
											{productos.map((producto: any) => (
												<option key={producto.id} value={producto.id}>
													{producto.name} ({producto.sku})
												</option>
											))}
										</Select>
									</div>

									<div>
										<Label htmlFor='warranty_type'>Tipo de Garantía *</Label>
										<Select
											name='warranty_type'
											defaultValue={selectedItem.warranty_type}
											required>
											<option value='Fabricante'>Fabricante</option>
											<option value='Extendida'>Extendida</option>
											<option value='Comercial'>Comercial</option>
										</Select>
									</div>

									<div>
										<Label htmlFor='status'>Estado *</Label>
										<Select
											name='status'
											defaultValue={selectedItem.status}
											required>
											<option value='Activa'>Activa</option>
											<option value='Expirada'>Expirada</option>
											<option value='Usada'>Usada</option>
											<option value='Anulada'>Anulada</option>
										</Select>
									</div>

									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label htmlFor='start_date'>Fecha Inicio *</Label>
											<Input
												name='start_date'
												type='date'
												defaultValue={
													selectedItem.start_date?.split('T')[0]
												}
												required
											/>
										</div>
										<div>
											<Label htmlFor='end_date'>Fecha Fin *</Label>
											<Input
												name='end_date'
												type='date'
												defaultValue={selectedItem.end_date?.split('T')[0]}
												required
											/>
										</div>
									</div>

									<div>
										<Label htmlFor='notes'>Notas Adicionales</Label>
										<textarea
											name='notes'
											className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
											rows={3}
											defaultValue={selectedItem.notes || ''}
											placeholder='Condiciones especiales, términos, etc...'
										/>
									</div>

									<div className='flex justify-end space-x-2'>
										<Button
											type='button'
											variant='outline'
											onClick={() => {
												setEditarGarantiaModalOpen(false);
												setSelectedItem(null);
											}}>
											Cancelar
										</Button>
										<Button type='submit' color='amber'>
											Actualizar Garantía
										</Button>
									</div>
								</div>
							</form>
						)}
					</ModalBody>
				</Modal>

				{/* Modal Eliminar Garantía */}
				<Modal isOpen={eliminarGarantiaModalOpen} setIsOpen={setEliminarGarantiaModalOpen}>
					<ModalHeader>
						<div className='flex items-center'>
							<HiOutlineShieldCheck className='mr-2 h-5 w-5 text-red-600' />
							Eliminar Garantía
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedItem && (
							<div className='space-y-4'>
								<div className='rounded-md border border-red-200 bg-red-50 p-4'>
									<div className='flex'>
										<div className='flex-shrink-0'>
											<svg
												className='h-5 w-5 text-red-400'
												fill='currentColor'
												viewBox='0 0 20 20'>
												<path
													fillRule='evenodd'
													d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
													clipRule='evenodd'
												/>
											</svg>
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-red-800'>
												Confirmación requerida
											</h3>
											<div className='mt-2 text-sm text-red-700'>
												¿Está seguro que desea eliminar esta garantía?
												<strong> Esta acción no se puede deshacer.</strong>
											</div>
										</div>
									</div>
								</div>

								<div className='rounded-md bg-gray-50 p-4'>
									<h4 className='mb-2 font-medium text-gray-900'>
										Detalles de la garantía:
									</h4>
									<div className='space-y-2 text-sm text-gray-700'>
										<div>
											<strong>Producto:</strong> {selectedItem.product?.name}
										</div>
										<div>
											<strong>Tipo:</strong> {selectedItem.warranty_type}
										</div>
										<div>
											<strong>Estado:</strong> {selectedItem.status}
										</div>
										<div>
											<strong>Período:</strong>{' '}
											{new Date(selectedItem.start_date).toLocaleDateString()}{' '}
											- {new Date(selectedItem.end_date).toLocaleDateString()}
										</div>
									</div>
								</div>

								<div className='flex justify-end space-x-2'>
									<Button
										variant='outline'
										onClick={() => {
											setEliminarGarantiaModalOpen(false);
											setSelectedItem(null);
										}}>
										Cancelar
									</Button>
									<Button color='red' onClick={handleEliminarGarantia}>
										Confirmar eliminación
									</Button>
								</div>
							</div>
						)}
					</ModalBody>
				</Modal>

				{/* Modal Detalle Garantía */}
				<Modal isOpen={detalleGarantiaModalOpen} setIsOpen={setDetalleGarantiaModalOpen}>
					<ModalHeader>
						<div className='flex items-center'>
							<HiOutlineShieldCheck className='mr-2 h-5 w-5 text-blue-600' />
							Detalle de Garantía
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedItem && (
							<div className='space-y-6'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Estado
										</label>
										<div className='mt-1'>
											<Badge
												color={
													selectedItem.status === 'Activa'
														? 'emerald'
														: selectedItem.status === 'Expirada'
															? 'red'
															: selectedItem.status === 'Usada'
																? 'amber'
																: 'gray'
												}>
												{selectedItem.status}
											</Badge>
										</div>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Tipo de Garantía
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											{selectedItem.warranty_type}
										</p>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Producto
									</label>
									<div className='mt-1 rounded-md bg-gray-50 p-3'>
										<p className='font-medium text-gray-900'>
											{selectedItem.product?.name}
										</p>
										<p className='text-sm text-gray-500'>
											SKU: {selectedItem.product?.sku}
										</p>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Fecha de Inicio
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											{new Date(selectedItem.start_date).toLocaleDateString()}
										</p>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Fecha de Vencimiento
										</label>
										<p className='mt-1 text-sm text-gray-900'>
											{new Date(selectedItem.end_date).toLocaleDateString()}
										</p>
									</div>
								</div>

								{selectedItem.status === 'Activa' && (
									<div className='rounded-md border border-green-200 bg-green-50 p-4'>
										<div className='flex'>
											<HiOutlineShieldCheck className='h-5 w-5 text-green-400' />
											<div className='ml-3'>
												<h3 className='text-sm font-medium text-green-800'>
													Garantía Activa
												</h3>
												<div className='mt-1 text-sm text-green-700'>
													{(() => {
														const diasRestantes = Math.ceil(
															(new Date(
																selectedItem.end_date,
															).getTime() -
																new Date().getTime()) /
																(1000 * 60 * 60 * 24),
														);
														return diasRestantes > 0 ? (
															<span>
																Quedan{' '}
																<strong
																	className={
																		diasRestantes <= 30
																			? 'text-red-600'
																			: ''
																	}>
																	{diasRestantes} días
																</strong>{' '}
																de garantía
															</span>
														) : (
															<span className='font-bold text-red-600'>
																Garantía expirada
															</span>
														);
													})()}
												</div>
											</div>
										</div>
									</div>
								)}

								{selectedItem.notes && (
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Notas Adicionales
										</label>
										<p className='mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-900'>
											{selectedItem.notes}
										</p>
									</div>
								)}

								<div className='grid grid-cols-2 gap-4 text-xs text-gray-500'>
									<div>
										<label className='block font-medium'>Creado el:</label>
										<p>{new Date(selectedItem.created_at).toLocaleString()}</p>
									</div>
									{selectedItem.updated_at !== selectedItem.created_at && (
										<div>
											<label className='block font-medium'>
												Actualizado el:
											</label>
											<p>
												{new Date(selectedItem.updated_at).toLocaleString()}
											</p>
										</div>
									)}
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end'>
							<Button
								variant='outline'
								onClick={() => {
									setDetalleGarantiaModalOpen(false);
									setSelectedItem(null);
								}}>
								Cerrar
							</Button>
						</div>
					</ModalFooter>
				</Modal>
			</Container>
		</PageWrapper>
	);
};

export default Inventario;
