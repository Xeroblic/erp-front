import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { DashboardStats } from '../../types';

interface EcoPCProduct {
	id: string;
	name: string;
	sku: string;
	stock: number;
	price: number;
	category: string;
	brand: string;
	warranty: string;
	specifications: {
		processor?: string;
		ram?: string;
		storage?: string;
		graphics?: string;
	};
	energyRating?: 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C';
}

interface SystemAlert {
	id: string;
	type: 'warning' | 'error' | 'info' | 'success';
	message: string;
	timestamp: string;
	resolved: boolean;
}

const EcoPCDashboard: React.FC = () => {
	const [stats, setStats] = useState<DashboardStats>({
		totalProducts: 0,
		totalRevenue: 0,
		ordersCount: 0,
		lowStockCount: 0,
	});
	const [topProducts, setTopProducts] = useState<EcoPCProduct[]>([]);
	const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadEcoPCData = async () => {
			setLoading(true);

			// Simular delay de API
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Datos simulados para EcoPC
			setStats({
				totalProducts: 892,
				totalRevenue: 45200000,
				ordersCount: 234,
				lowStockCount: 18,
			});

			setTopProducts([
				{
					id: 'EPC001',
					name: 'Notebook EcoPC Pro 15.6"',
					sku: 'EPC-PRO-15-I7',
					stock: 12,
					price: 1299990,
					category: 'Notebooks',
					brand: 'EcoPC',
					warranty: '3 años',
					specifications: {
						processor: 'Intel Core i7-12700H',
						ram: '16GB DDR5',
						storage: '512GB SSD NVMe',
						graphics: 'RTX 4060 8GB',
					},
					energyRating: 'A++',
				},
				{
					id: 'EPC002',
					name: 'Desktop EcoPC Gaming RGB',
					sku: 'EPC-GAME-RGB-I9',
					stock: 5,
					price: 1899990,
					category: 'Desktops',
					brand: 'EcoPC',
					warranty: '2 años',
					specifications: {
						processor: 'Intel Core i9-13900K',
						ram: '32GB DDR5',
						storage: '1TB SSD + 2TB HDD',
						graphics: 'RTX 4080 16GB',
					},
					energyRating: 'A+',
				},
				{
					id: 'EPC003',
					name: 'Monitor EcoPC 4K 27"',
					sku: 'EPC-MON-4K-27',
					stock: 8,
					price: 549990,
					category: 'Monitores',
					brand: 'EcoPC',
					warranty: '3 años',
					specifications: {},
					energyRating: 'A+++',
				},
				{
					id: 'EPC004',
					name: 'Teclado Mecánico EcoPC RGB',
					sku: 'EPC-KEY-MECH-RGB',
					stock: 25,
					price: 159990,
					category: 'Periféricos',
					brand: 'EcoPC',
					warranty: '1 año',
					specifications: {},
					energyRating: 'A',
				},
				{
					id: 'EPC005',
					name: 'UPS EcoPC 1500VA',
					sku: 'EPC-UPS-1500VA',
					stock: 3,
					price: 299990,
					category: 'Energía',
					brand: 'EcoPC',
					warranty: '2 años',
					specifications: {},
					energyRating: 'A+++',
				},
			]);

			setSystemAlerts([
				{
					id: 'ALT001',
					type: 'warning',
					message: 'Stock bajo en GPUs RTX 4080 - Solo 3 unidades disponibles',
					timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
					resolved: false,
				},
				{
					id: 'ALT002',
					type: 'info',
					message: 'Nueva actualización de firmware disponible para monitores EcoPC',
					timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
					resolved: false,
				},
				{
					id: 'ALT003',
					type: 'success',
					message: 'Respaldo del sistema completado exitosamente',
					timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
					resolved: true,
				},
				{
					id: 'ALT004',
					type: 'error',
					message: 'Falla temporal en el sistema de garantías - Solucionado',
					timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
					resolved: true,
				},
			]);

			setLoading(false);
		};

		loadEcoPCData();
	}, []);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getAlertIcon = (type: string) => {
		switch (type) {
			case 'error':
				return 'HeroXCircle';
			case 'warning':
				return 'HeroExclamationTriangle';
			case 'success':
				return 'HeroCheckCircle';
			case 'info':
				return 'HeroInformationCircle';
			default:
				return 'HeroInformationCircle';
		}
	};

	const getAlertColor = (type: string) => {
		switch (type) {
			case 'error':
				return 'text-red-600';
			case 'warning':
				return 'text-orange-600';
			case 'success':
				return 'text-green-600';
			case 'info':
				return 'text-blue-600';
			default:
				return 'text-gray-600';
		}
	};

	const getEnergyRatingColor = (rating: string) => {
		switch (rating) {
			case 'A+++':
				return 'bg-green-100 text-green-800';
			case 'A++':
				return 'bg-green-100 text-green-700';
			case 'A+':
				return 'bg-yellow-100 text-yellow-800';
			case 'A':
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStockBadgeColor = (stock: number) => {
		if (stock === 0) return 'bg-red-100 text-red-800';
		if (stock <= 5) return 'bg-orange-100 text-orange-800';
		return 'bg-green-100 text-green-800';
	};

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

		if (diffMins < 60) {
			return `hace ${diffMins} min`;
		}
		if (diffHours < 24) {
			return `hace ${diffHours}h`;
		}
		return date.toLocaleDateString('es-CL');
	};

	return (
		<div className='space-y-6 py-6'>
			{/* Estadísticas principales - Tema EcoPC */}
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-green-100'>
									Total Productos
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.totalProducts?.toLocaleString()}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroComputerDesktop' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-green-100'>
									Ingresos Totales
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : formatCurrency(stats.totalRevenue || 0)}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroCurrencyDollar' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-emerald-100'>
									Órdenes Técnicas
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.ordersCount}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroWrenchScrewdriver' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-green-700 to-green-800 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-green-100'>Stock Crítico</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.lowStockCount}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-8 w-8 text-white'
								/>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Contenido principal */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* Productos EcoPC Destacados */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-green-500 to-green-600 text-white'>
						<div className='flex items-center justify-between'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroComputerDesktop' className='mr-2 h-5 w-5' />
								Productos EcoPC
							</h3>
							<Badge className='bg-white/20 font-semibold text-white'>Top 5</Badge>
						</div>
					</CardHeader>
					<CardBody className='max-h-96 overflow-y-auto p-0'>
						{loading ? (
							<div className='p-6 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-2 h-6 w-6 animate-spin text-green-500'
								/>
								<span className='text-gray-600'>Cargando productos...</span>
							</div>
						) : (
							topProducts.map((product) => (
								<div
									key={product.id}
									className='border-b border-gray-100 p-4 transition-colors hover:bg-green-50'>
									<div className='space-y-2'>
										<div className='flex items-start justify-between'>
											<div className='flex-1'>
												<h4 className='text-sm font-medium text-gray-900'>
													{product.name}
												</h4>
												<p className='text-xs text-gray-500'>
													SKU: {product.sku}
												</p>
												<p className='text-xs font-medium text-green-600'>
													{product.category}
												</p>
												{product.energyRating && (
													<Badge
														className={`${getEnergyRatingColor(product.energyRating)} mt-1 text-xs`}>
														Eficiencia {product.energyRating}
													</Badge>
												)}
											</div>
											<div className='ml-4 text-right'>
												<Badge
													className={`${getStockBadgeColor(product.stock)} font-semibold`}>
													{product.stock} und.
												</Badge>
												<p className='mt-1 text-xs text-gray-600'>
													{formatCurrency(product.price)}
												</p>
												<p className='mt-1 text-xs font-medium text-green-600'>
													Garantía {product.warranty}
												</p>
											</div>
										</div>
										{product.specifications.processor && (
											<div className='rounded bg-gray-50 p-2 text-xs text-gray-600'>
												<div className='grid grid-cols-2 gap-1'>
													{product.specifications.processor && (
														<span>
															CPU: {product.specifications.processor}
														</span>
													)}
													{product.specifications.ram && (
														<span>
															RAM: {product.specifications.ram}
														</span>
													)}
													{product.specifications.storage && (
														<span>
															Storage:{' '}
															{product.specifications.storage}
														</span>
													)}
													{product.specifications.graphics && (
														<span>
															GPU: {product.specifications.graphics}
														</span>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							))
						)}
					</CardBody>
				</Card>

				{/* Alertas del Sistema */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white'>
						<div className='flex items-center justify-between'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroBell' className='mr-2 h-5 w-5' />
								Alertas del Sistema
							</h3>
							<Badge className='bg-white/20 font-semibold text-white'>
								{systemAlerts.filter((a) => !a.resolved).length} activas
							</Badge>
						</div>
					</CardHeader>
					<CardBody className='max-h-96 overflow-y-auto p-0'>
						{loading ? (
							<div className='p-6 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-2 h-6 w-6 animate-spin text-green-500'
								/>
								<span className='text-gray-600'>Cargando alertas...</span>
							</div>
						) : (
							systemAlerts.map((alert) => (
								<div
									key={alert.id}
									className={`border-b border-gray-100 p-4 transition-colors hover:bg-green-50 ${
										alert.resolved ? 'opacity-60' : ''
									}`}>
									<div className='flex items-start space-x-3'>
										<Icon
											icon={getAlertIcon(alert.type)}
											className={`mt-0.5 h-5 w-5 ${getAlertColor(alert.type)}`}
										/>
										<div className='flex-1'>
											<p
												className={`text-sm font-medium ${alert.resolved ? 'line-through' : ''}`}>
												{alert.message}
											</p>
											<div className='mt-1 flex items-center justify-between'>
												<p className='text-xs text-gray-500'>
													{formatTimestamp(alert.timestamp)}
												</p>
												<Badge
													className={`text-xs ${
														alert.resolved
															? 'bg-gray-100 text-gray-600'
															: alert.type === 'error'
																? 'bg-red-100 text-red-700'
																: alert.type === 'warning'
																	? 'bg-orange-100 text-orange-700'
																	: alert.type === 'success'
																		? 'bg-green-100 text-green-700'
																		: 'bg-blue-100 text-blue-700'
													}`}>
													{alert.resolved ? 'Resuelto' : alert.type}
												</Badge>
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</CardBody>
				</Card>

				{/* Panel de Control EcoPC */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-green-700 to-green-800 text-white'>
						<h3 className='flex items-center text-lg font-semibold'>
							<Icon icon='HeroCog6Tooth' className='mr-2 h-5 w-5' />
							Control EcoPC
						</h3>
					</CardHeader>
					<CardBody className='space-y-4 p-4'>
						{/* Estado del sistema */}
						<div className='rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-green-900/20'>
							<div className='text-center'>
								<p className='text-sm font-medium text-green-600 dark:text-green-400'>
									Sistema EcoPC
								</p>
								<Badge className='mt-2 bg-green-100 text-green-800'>
									<Icon icon='HeroCheckCircle' className='mr-1 h-3 w-3' />
									Operativo
								</Badge>
							</div>
						</div>

						{/* Estadísticas técnicas */}
						<div className='space-y-2'>
							<h4 className='text-sm font-medium text-gray-700'>Métricas Técnicas</h4>
							<div className='space-y-1 text-xs'>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Uptime sistema:</span>
									<span className='font-medium text-green-600'>99.8%</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Respuesta promedio:</span>
									<span className='font-medium text-green-600'>1.2ms</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Garantías activas:</span>
									<span className='font-medium text-green-600'>756</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Soporte técnico:</span>
									<span className='font-medium text-green-600'>24/7</span>
								</div>
							</div>
						</div>

						{/* Acciones */}
						<div className='space-y-3'>
							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-green-200 text-green-700 hover:bg-green-50'>
								<Icon icon='HeroComputerDesktop' className='mr-2 h-4 w-4' />
								Inventario Técnico
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-green-200 text-green-700 hover:bg-green-50'>
								<Icon icon='HeroWrenchScrewdriver' className='mr-2 h-4 w-4' />
								Órdenes de Servicio
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-green-200 text-green-700 hover:bg-green-50'>
								<Icon icon='HeroShieldCheck' className='mr-2 h-4 w-4' />
								Control Garantías
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-green-200 text-green-700 hover:bg-green-50'
								onClick={() => window.open('https://ecopc.cl', '_blank')}>
								<Icon icon='HeroArrowTopRightOnSquare' className='mr-2 h-4 w-4' />
								Portal EcoPC
							</Button>
						</div>

						{/* Información de energía */}
						<div className='border-t border-green-200 pt-4'>
							<div className='text-center'>
								<p className='mb-2 text-xs text-gray-600'>
									Certificación Energética
								</p>
								<div className='flex justify-center space-x-1'>
									<Badge className='bg-green-100 text-xs text-green-800'>
										A+++
									</Badge>
									<Badge className='bg-green-100 text-xs text-green-800'>
										Eco Friendly
									</Badge>
								</div>
								<p className='mt-2 text-xs font-medium text-green-600'>
									-25% consumo energético
								</p>
							</div>
						</div>

						{/* Actualización */}
						<div className='border-t border-green-200 pt-4'>
							<p className='mb-2 text-center text-xs text-gray-500'>
								Sincronizado: {new Date().toLocaleTimeString('es-CL')}
							</p>
							<Button
								variant='outline'
								size='sm'
								className='w-full border-green-200 text-xs text-green-600 hover:bg-green-50'
								onClick={() => window.location.reload()}>
								<Icon icon='HeroArrowPath' className='mr-1 h-3 w-3' />
								Actualizar Sistema
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default EcoPCDashboard;
