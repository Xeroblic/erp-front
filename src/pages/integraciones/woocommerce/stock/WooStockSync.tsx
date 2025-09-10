import React, { useState, useEffect } from 'react';

// Components
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs, { Tab } from '@/components/ui/Tabs';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { toast } from 'react-toastify';
import { formatDate } from '@/utils/format.utils';
import {
	HiOutlineCheckCircle,
	HiOutlineExclamationTriangle,
	HiOutlineXCircle,
} from 'react-icons/hi2';

// Mock API service
const mockWooSyncApi = {
	async pullStock(): Promise<WooSyncJob> {
		// Simular delay de API
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const jobId = Date.now();
		return {
			id: jobId,
			type: 'pull',
			status: 'completed',
			started_at: new Date().toISOString(),
			completed_at: new Date().toISOString(),
			products_processed: 15,
			products_updated: 12,
			products_failed: 1,
			errors: ['SKU-404: Producto no encontrado en WooCommerce'],
			log: [
				`[${new Date().toLocaleTimeString()}] Iniciando importación de stock desde WooCommerce`,
				`[${new Date().toLocaleTimeString()}] Conectando a WooCommerce API...`,
				`[${new Date().toLocaleTimeString()}] Obteniendo lista de productos...`,
				`[${new Date().toLocaleTimeString()}] Procesando 15 productos`,
				`[${new Date().toLocaleTimeString()}] Actualizando stock local...`,
				`[${new Date().toLocaleTimeString()}] 12 productos actualizados exitosamente`,
				`[${new Date().toLocaleTimeString()}] 1 producto con errores`,
				`[${new Date().toLocaleTimeString()}] Importación completada`,
			],
		};
	},

	async pushStock(selectedProducts: number[]): Promise<WooSyncJob> {
		await new Promise((resolve) => setTimeout(resolve, 3000));

		const jobId = Date.now();
		return {
			id: jobId,
			type: 'push',
			status: 'completed',
			started_at: new Date().toISOString(),
			completed_at: new Date().toISOString(),
			products_processed: selectedProducts.length,
			products_updated: selectedProducts.length - 1,
			products_failed: 1,
			errors: ['LAP-DELL-15: Error de conexión al actualizar en WooCommerce'],
			log: [
				`[${new Date().toLocaleTimeString()}] Iniciando actualización de stock en WooCommerce`,
				`[${new Date().toLocaleTimeString()}] Productos seleccionados: ${selectedProducts.length}`,
				`[${new Date().toLocaleTimeString()}] Conectando a WooCommerce API...`,
				`[${new Date().toLocaleTimeString()}] Actualizando productos en WooCommerce...`,
				`[${new Date().toLocaleTimeString()}] ${selectedProducts.length - 1} productos actualizados`,
				`[${new Date().toLocaleTimeString()}] 1 producto con errores`,
				`[${new Date().toLocaleTimeString()}] Actualización completada`,
			],
		};
	},
};

// Interfaces
interface WooSyncJob {
	id: number;
	type: 'pull' | 'push';
	status: 'pending' | 'running' | 'completed' | 'failed';
	started_at: string;
	completed_at?: string;
	products_processed?: number;
	products_updated?: number;
	products_failed?: number;
	errors?: string[];
	log?: string[];
}

interface ProductStock {
	id: number;
	sku: string;
	name: string;
	local_stock: number;
	woo_stock: number;
	sync_status: 'synced' | 'out_of_sync' | 'error';
	last_sync: string;
	woo_product_id?: number;
}

// Mock data
const MOCK_PRODUCT_STOCKS: ProductStock[] = [
	{
		id: 1,
		sku: 'LAP-DELL-15',
		name: 'Laptop Dell Inspiron 15',
		local_stock: 25,
		woo_stock: 23,
		sync_status: 'out_of_sync',
		last_sync: '2025-09-09T14:30:00Z',
		woo_product_id: 101,
	},
	{
		id: 2,
		sku: 'MON-SAM-24',
		name: 'Monitor Samsung 24"',
		local_stock: 40,
		woo_stock: 40,
		sync_status: 'synced',
		last_sync: '2025-09-10T08:15:00Z',
		woo_product_id: 102,
	},
	{
		id: 3,
		sku: 'TEC-LOG-MEC',
		name: 'Teclado Mecánico Logitech',
		local_stock: 15,
		woo_stock: 12,
		sync_status: 'out_of_sync',
		last_sync: '2025-09-08T16:45:00Z',
		woo_product_id: 103,
	},
	{
		id: 4,
		sku: 'MOU-HP-OPT',
		name: 'Mouse Óptico HP',
		local_stock: 60,
		woo_stock: 58,
		sync_status: 'out_of_sync',
		last_sync: '2025-09-07T11:20:00Z',
		woo_product_id: 104,
	},
	{
		id: 5,
		sku: 'IMP-HP-LASER',
		name: 'Impresora HP LaserJet',
		local_stock: 8,
		woo_stock: 0,
		sync_status: 'error',
		last_sync: '2025-09-06T09:30:00Z',
		woo_product_id: null,
	},
	{
		id: 6,
		sku: 'CAB-USB-C',
		name: 'Cable USB-C Premium',
		local_stock: 120,
		woo_stock: 120,
		sync_status: 'synced',
		last_sync: '2025-09-10T07:00:00Z',
		woo_product_id: 106,
	},
];

const MOCK_SYNC_HISTORY: WooSyncJob[] = [
	{
		id: 1001,
		type: 'pull',
		status: 'completed',
		started_at: '2025-09-10T08:00:00Z',
		completed_at: '2025-09-10T08:05:00Z',
		products_processed: 15,
		products_updated: 15,
		products_failed: 0,
		log: ['Importación exitosa', 'Todos los productos actualizados'],
	},
	{
		id: 1002,
		type: 'push',
		status: 'completed',
		started_at: '2025-09-09T16:30:00Z',
		completed_at: '2025-09-09T16:33:00Z',
		products_processed: 8,
		products_updated: 7,
		products_failed: 1,
		errors: ['SKU-404: Producto no encontrado'],
	},
	{
		id: 1003,
		type: 'pull',
		status: 'failed',
		started_at: '2025-09-08T14:15:00Z',
		completed_at: '2025-09-08T14:16:00Z',
		products_processed: 0,
		products_updated: 0,
		products_failed: 0,
		errors: ['Error de conexión con WooCommerce API'],
	},
];

const WooStockSync: React.FC = () => {
	const [activeTab, setActiveTab] = useState('import');
	const [productStocks, setProductStocks] = useState<ProductStock[]>(MOCK_PRODUCT_STOCKS);
	const [syncHistory, setSyncHistory] = useState<WooSyncJob[]>(MOCK_SYNC_HISTORY);
	const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showLogModal, setShowLogModal] = useState(false);
	const [selectedJob, setSelectedJob] = useState<WooSyncJob | null>(null);
	const [lastSync, setLastSync] = useState<WooSyncJob | null>(null);

	// Configuración de conexión (mock)
	const [wooConfig, setWooConfig] = useState({
		site_url: 'https://mitienda.com',
		consumer_key: 'ck_*********************',
		consumer_secret: 'cs_*********************',
		status: 'connected' as 'connected' | 'disconnected' | 'error',
	});

	const handleImportStock = async () => {
		setIsProcessing(true);
		try {
			const job = await mockWooSyncApi.pullStock();
			setLastSync(job);
			setSyncHistory([job, ...syncHistory]);

			// Actualizar algunos productos como ejemplo
			const updatedStocks = productStocks.map(
				(product) =>
					({
						...product,
						last_sync: new Date().toISOString(),
						sync_status: Math.random() > 0.2 ? 'synced' : 'out_of_sync',
					}) as ProductStock,
			);
			setProductStocks(updatedStocks);

			toast.success(`Stock importado: ${job.products_updated} productos actualizados`);
		} catch (error) {
			toast.error('Error al importar stock desde WooCommerce');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleUpdateStock = async () => {
		if (selectedProducts.length === 0) {
			toast.error('Seleccione al menos un producto para actualizar');
			return;
		}

		setIsProcessing(true);
		try {
			const job = await mockWooSyncApi.pushStock(selectedProducts);
			setLastSync(job);
			setSyncHistory([job, ...syncHistory]);

			// Marcar productos seleccionados como sincronizados
			const updatedStocks = productStocks.map((product) =>
				selectedProducts.includes(product.id)
					? { ...product, sync_status: 'synced', last_sync: new Date().toISOString() }
					: product,
			);
			setProductStocks(updatedStocks);
			setSelectedProducts([]);

			toast.success(
				`Stock actualizado: ${job.products_updated} productos enviados a WooCommerce`,
			);
		} catch (error) {
			toast.error('Error al actualizar stock en WooCommerce');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSelectAll = () => {
		if (selectedProducts.length === productStocks.length) {
			setSelectedProducts([]);
		} else {
			setSelectedProducts(productStocks.map((p) => p.id));
		}
	};

	const handleSelectProduct = (productId: number) => {
		if (selectedProducts.includes(productId)) {
			setSelectedProducts(selectedProducts.filter((id) => id !== productId));
		} else {
			setSelectedProducts([...selectedProducts, productId]);
		}
	};

	const getSyncStatusBadge = (status: ProductStock['sync_status']) => {
		const statusConfig = {
			synced: { color: 'emerald' as const, text: 'Sincronizado', icon: HiOutlineCheckCircle },
			out_of_sync: {
				color: 'amber' as const,
				text: 'Desincronizado',
				icon: HiOutlineExclamationTriangle,
			},
			error: { color: 'red' as const, text: 'Error', icon: HiOutlineXCircle },
		};

		const config = statusConfig[status];
		const IconComponent = config.icon;
		return (
			<Badge color={config.color} variant='outline'>
				<IconComponent className='mr-1 inline h-4 w-4' />
				{config.text}
			</Badge>
		);
	};

	const getJobStatusBadge = (status: WooSyncJob['status']) => {
		const statusConfig = {
			pending: { color: 'gray' as const, text: 'Pendiente' },
			running: { color: 'blue' as const, text: 'Ejecutando' },
			completed: { color: 'emerald' as const, text: 'Completado' },
			failed: { color: 'red' as const, text: 'Fallido' },
		};

		const config = statusConfig[status];
		return <Badge color={config.color}>{config.text}</Badge>;
	};

	const getConnectionStatusBadge = () => {
		const statusConfig = {
			connected: { color: 'emerald' as const, text: 'Conectado', icon: HiOutlineCheckCircle },
			disconnected: { color: 'gray' as const, text: 'Desconectado', icon: HiOutlineXCircle },
			error: { color: 'red' as const, text: 'Error', icon: HiOutlineExclamationTriangle },
		};

		const config = statusConfig[wooConfig.status];
		const IconComponent = config.icon;
		return (
			<Badge color={config.color}>
				<IconComponent className='mr-1 inline h-4 w-4' />
				{config.text}
			</Badge>
		);
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Sincronización WooCommerce</h1>
					<p className='text-zinc-500'>
						Gestión de sincronización de stock con WooCommerce
					</p>
				</div>
				<div className='flex items-center space-x-4'>
					{getConnectionStatusBadge()}
					<span className='text-sm text-gray-600'>{wooConfig.site_url}</span>
				</div>
			</div>

			{/* Estado de última sincronización */}
			{lastSync && (
				<Card className='mb-6'>
					<CardBody>
						<div className='flex items-center justify-between'>
							<div>
								<h3 className='font-medium'>
									Última Sincronización:{' '}
									{lastSync.type === 'pull' ? 'Importación' : 'Actualización'}
								</h3>
								<p className='text-sm text-gray-600'>
									{formatDate(lastSync.started_at)} - {lastSync.products_updated}{' '}
									productos procesados
								</p>
								{lastSync.errors && lastSync.errors.length > 0 && (
									<p className='text-sm text-red-600'>
										{lastSync.errors.length} errores encontrados
									</p>
								)}
							</div>
							<div className='flex items-center space-x-2'>
								{getJobStatusBadge(lastSync.status)}
								<Button
									size='sm'
									variant='outline'
									icon='HeroEye'
									onClick={() => {
										setSelectedJob(lastSync);
										setShowLogModal(true);
									}}>
									Ver Log
								</Button>
							</div>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Tabs principales */}
			<Tabs activeTab={activeTab} onTabChange={setActiveTab} className='mb-6'>
				<Tab id='import' text='Importar Stock (Pull)'>
					{/* Tab Importar */}
					<Card>
						<CardHeader>
							<CardTitle>Importar Stock desde WooCommerce</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='rounded-lg bg-blue-50 p-4'>
									<h4 className='mb-2 font-medium text-blue-900'>
										¿Qué hace la importación?
									</h4>
									<ul className='space-y-1 text-sm text-blue-800'>
										<li>
											• Obtiene el stock actual de todos los productos en
											WooCommerce
										</li>
										<li>• Compara con el stock local del ERP</li>
										<li>
											• Actualiza el stock local con los valores de
											WooCommerce
										</li>
										<li>
											• Genera un reporte de productos actualizados y errores
										</li>
									</ul>
								</div>

								<div className='flex items-center justify-between'>
									<div>
										<p className='text-sm text-gray-600'>
											Esta acción actualizará el stock local con los valores
											de WooCommerce. Se recomienda realizar antes de abrir la
											tienda cada día.
										</p>
									</div>
									<PermissionGuard
										permissions={[ERP_PERMISSIONS.INVENTORY.UPDATE]}>
										<Button
											icon='HeroArrowDownTray'
											color='blue'
											isLoading={isProcessing && activeTab === 'import'}
											onClick={handleImportStock}>
											Importar Stock Ahora
										</Button>
									</PermissionGuard>
								</div>
							</div>
						</CardBody>
					</Card>
				</Tab>

				<Tab id='export' text='Actualizar Stock (Push)'>
					{/* Tab Actualizar */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle>Actualizar Stock en WooCommerce</CardTitle>
								<div className='flex items-center space-x-2'>
									<span className='text-sm text-gray-600'>
										{selectedProducts.length} productos seleccionados
									</span>
									<Button size='sm' variant='outline' onClick={handleSelectAll}>
										{selectedProducts.length === productStocks.length
											? 'Deseleccionar Todos'
											: 'Seleccionar Todos'}
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='rounded-lg bg-green-50 p-4'>
									<h4 className='mb-2 font-medium text-green-900'>
										¿Qué hace la actualización?
									</h4>
									<ul className='space-y-1 text-sm text-green-800'>
										<li>• Envía el stock actual del ERP hacia WooCommerce</li>
										<li>• Actualiza solo los productos seleccionados</li>
										<li>• Mantiene sincronizados ambos sistemas</li>
										<li>
											• Genera un reporte de productos actualizados y errores
										</li>
									</ul>
								</div>

								{/* Tabla de productos */}
								<div className='overflow-x-auto'>
									<Table>
										<THead>
											<Tr>
												<Th>
													<input
														type='checkbox'
														checked={
															selectedProducts.length ===
															productStocks.length
														}
														onChange={handleSelectAll}
													/>
												</Th>
												<Th>SKU</Th>
												<Th>Producto</Th>
												<Th>Stock Local</Th>
												<Th>Stock WooCommerce</Th>
												<Th>Estado</Th>
												<Th>Última Sync</Th>
											</Tr>
										</THead>
										<TBody>
											{productStocks.map((product) => (
												<Tr key={product.id}>
													<Td>
														<input
															type='checkbox'
															checked={selectedProducts.includes(
																product.id,
															)}
															onChange={() =>
																handleSelectProduct(product.id)
															}
														/>
													</Td>
													<Td className='font-mono text-sm'>
														{product.sku}
													</Td>
													<Td>{product.name}</Td>
													<Td className='font-semibold'>
														{product.local_stock}
													</Td>
													<Td
														className={`font-semibold ${product.local_stock !== product.woo_stock ? 'text-amber-600' : ''}`}>
														{product.woo_stock}
													</Td>
													<Td>
														{getSyncStatusBadge(product.sync_status)}
													</Td>
													<Td className='text-sm text-gray-600'>
														{formatDate(product.last_sync)}
													</Td>
												</Tr>
											))}
										</TBody>
									</Table>
								</div>

								<div className='flex justify-end'>
									<PermissionGuard
										permissions={[ERP_PERMISSIONS.INVENTORY.UPDATE]}>
										<Button
											icon='HeroArrowUpTray'
											color='emerald'
											isLoading={isProcessing && activeTab === 'export'}
											onClick={handleUpdateStock}
											isDisable={selectedProducts.length === 0}>
											Actualizar Stock Seleccionado
										</Button>
									</PermissionGuard>
								</div>
							</div>
						</CardBody>
					</Card>
				</Tab>

				<Tab id='history' text='Historial'>
					{/* Tab Historial */}
					<Card>
						<CardHeader>
							<CardTitle>Historial de Sincronizaciones</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='overflow-x-auto'>
								<Table>
									<THead>
										<Tr>
											<Th>ID</Th>
											<Th>Tipo</Th>
											<Th>Estado</Th>
											<Th>Fecha</Th>
											<Th>Procesados</Th>
											<Th>Actualizados</Th>
											<Th>Errores</Th>
											<Th>Acciones</Th>
										</Tr>
									</THead>
									<TBody>
										{syncHistory.map((job) => (
											<Tr key={job.id}>
												<Td className='font-mono'>{job.id}</Td>
												<Td>
													<Badge
														variant='outline'
														color={
															job.type === 'pull' ? 'blue' : 'emerald'
														}>
														{job.type === 'pull'
															? '📥 Pull'
															: '📤 Push'}
													</Badge>
												</Td>
												<Td>{getJobStatusBadge(job.status)}</Td>
												<Td>{formatDate(job.started_at)}</Td>
												<Td>{job.products_processed || 0}</Td>
												<Td>{job.products_updated || 0}</Td>
												<Td
													className={
														job.products_failed
															? 'font-semibold text-red-600'
															: ''
													}>
													{job.products_failed || 0}
												</Td>
												<Td>
													<Button
														size='sm'
														variant='outline'
														icon='HeroEye'
														onClick={() => {
															setSelectedJob(job);
															setShowLogModal(true);
														}}>
														Ver Log
													</Button>
												</Td>
											</Tr>
										))}
									</TBody>
								</Table>
							</div>
						</CardBody>
					</Card>
				</Tab>
			</Tabs>

			{/* Modal de Log */}
			<Modal isOpen={showLogModal} setIsOpen={setShowLogModal} size='3xl'>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>
						Log de Sincronización - Job #{selectedJob?.id}
					</h3>
				</ModalHeader>
				<ModalBody>
					{selectedJob && (
						<div className='space-y-4'>
							{/* Información del job */}
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Tipo
									</label>
									<p className='mt-1'>
										{selectedJob.type === 'pull'
											? 'Importación (Pull)'
											: 'Actualización (Push)'}
									</p>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Estado
									</label>
									<div className='mt-1'>
										{getJobStatusBadge(selectedJob.status)}
									</div>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Iniciado
									</label>
									<p className='mt-1'>{formatDate(selectedJob.started_at)}</p>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Completado
									</label>
									<p className='mt-1'>
										{selectedJob.completed_at
											? formatDate(selectedJob.completed_at)
											: 'En progreso...'}
									</p>
								</div>
							</div>

							{/* Estadísticas */}
							<div className='grid grid-cols-3 gap-4'>
								<div className='rounded-lg bg-blue-50 p-3 text-center'>
									<div className='text-2xl font-bold text-blue-600'>
										{selectedJob.products_processed || 0}
									</div>
									<div className='text-sm text-blue-800'>Procesados</div>
								</div>
								<div className='rounded-lg bg-green-50 p-3 text-center'>
									<div className='text-2xl font-bold text-green-600'>
										{selectedJob.products_updated || 0}
									</div>
									<div className='text-sm text-green-800'>Actualizados</div>
								</div>
								<div className='rounded-lg bg-red-50 p-3 text-center'>
									<div className='text-2xl font-bold text-red-600'>
										{selectedJob.products_failed || 0}
									</div>
									<div className='text-sm text-red-800'>Con Errores</div>
								</div>
							</div>

							{/* Errores */}
							{selectedJob.errors && selectedJob.errors.length > 0 && (
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Errores
									</label>
									<div className='rounded-lg bg-red-50 p-3'>
										{selectedJob.errors.map((error, index) => (
											<p key={index} className='text-sm text-red-800'>
												• {error}
											</p>
										))}
									</div>
								</div>
							)}

							{/* Log detallado */}
							{selectedJob.log && selectedJob.log.length > 0 && (
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>
										Log Detallado
									</label>
									<div className='max-h-60 overflow-y-auto rounded-lg bg-gray-50 p-3 font-mono text-sm'>
										{selectedJob.log.map((entry, index) => (
											<p key={index} className='text-gray-800'>
												{entry}
											</p>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setShowLogModal(false)}>
						Cerrar
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default WooStockSync;
