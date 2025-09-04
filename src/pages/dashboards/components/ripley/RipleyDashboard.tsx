import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { DashboardStats } from '../../types';

interface RipleyProduct {
	id: string;
	name: string;
	sku: string;
	stock: number;
	price: number;
	category: string;
	status: 'active' | 'inactive' | 'pending';
}

interface RipleySales {
	productId: string;
	productName: string;
	unitsSold: number;
	revenue: number;
	period: string;
}

const RipleyDashboard: React.FC = () => {
	const [stats, setStats] = useState<DashboardStats>({
		totalProducts: 0,
		totalRevenue: 0,
		ordersCount: 0,
		lowStockCount: 0,
	});
	const [products, setProducts] = useState<RipleyProduct[]>([]);
	const [topSales, setTopSales] = useState<RipleySales[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Simulación de carga de datos para Ripley
		const loadRipleyData = async () => {
			setLoading(true);

			// Simular delay de API
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Datos simulados para Ripley
			setStats({
				totalProducts: 847,
				totalRevenue: 15876000,
				ordersCount: 432,
				lowStockCount: 23,
			});

			setProducts([
				{
					id: 'R001',
					name: 'Smartphone Samsung Galaxy A54',
					sku: 'SMG-A54-128',
					stock: 5,
					price: 349990,
					category: 'Electrónicos',
					status: 'active',
				},
				{
					id: 'R002',
					name: 'Zapatillas Nike Air Max',
					sku: 'NK-AM-270',
					stock: 2,
					price: 129990,
					category: 'Calzado',
					status: 'active',
				},
				{
					id: 'R003',
					name: 'Refrigerador LG 420L',
					sku: 'LG-420L-INV',
					stock: 0,
					price: 599990,
					category: 'Electrodomésticos',
					status: 'inactive',
				},
				{
					id: 'R004',
					name: 'Notebook HP Pavilion',
					sku: 'HP-PAV-15',
					stock: 3,
					price: 799990,
					category: 'Computación',
					status: 'active',
				},
				{
					id: 'R005',
					name: 'Televisor Sony 55"',
					sku: 'SNY-55X80',
					stock: 1,
					price: 899990,
					category: 'Electrónicos',
					status: 'active',
				},
			]);

			setTopSales([
				{
					productId: 'R001',
					productName: 'Smartphone Samsung Galaxy A54',
					unitsSold: 45,
					revenue: 15749550,
					period: '30 días',
				},
				{
					productId: 'R002',
					productName: 'Zapatillas Nike Air Max',
					unitsSold: 32,
					revenue: 4159680,
					period: '30 días',
				},
				{
					productId: 'R004',
					productName: 'Notebook HP Pavilion',
					unitsSold: 18,
					revenue: 14399820,
					period: '30 días',
				},
				{
					productId: 'R005',
					productName: 'Televisor Sony 55"',
					unitsSold: 12,
					revenue: 10799880,
					period: '30 días',
				},
			]);

			setLoading(false);
		};

		loadRipleyData();
	}, []);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getStockBadgeColor = (stock: number) => {
		if (stock === 0) return 'bg-red-100 text-red-800';
		if (stock <= 5) return 'bg-orange-100 text-orange-800';
		return 'bg-green-100 text-green-800';
	};

	const getStatusBadgeColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'inactive':
				return 'bg-red-100 text-red-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div className='space-y-6 py-6'>
			{/* Estadísticas principales - Tema Ripley */}
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-purple-100'>
									Total Productos
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.totalProducts?.toLocaleString()}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroShoppingBag' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-purple-100'>
									Ingresos Totales
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : formatCurrency(stats.totalRevenue || 0)}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroBanknotes' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-indigo-100'>
									Órdenes Activas
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.ordersCount}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon
									icon='HeroClipboardDocumentList'
									className='h-8 w-8 text-white'
								/>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-purple-700 to-purple-800 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-purple-100'>Stock Crítico</p>
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
				{/* Productos con Stock Crítico */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white'>
						<div className='flex items-center justify-between'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroExclamationTriangle' className='mr-2 h-5 w-5' />
								Stock Crítico
							</h3>
							<Badge className='bg-white/20 font-semibold text-white'>
								{products.filter((p) => p.stock <= 5).length}
							</Badge>
						</div>
					</CardHeader>
					<CardBody className='max-h-96 overflow-y-auto p-0'>
						{loading ? (
							<div className='p-6 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-2 h-6 w-6 animate-spin text-purple-500'
								/>
								<span className='text-gray-600'>Cargando productos...</span>
							</div>
						) : (
							products
								.filter((product) => product.stock <= 5)
								.map((product) => (
									<div
										key={product.id}
										className='border-b border-gray-100 p-4 transition-colors hover:bg-purple-50'>
										<div className='flex items-center justify-between'>
											<div className='flex-1'>
												<h4 className='text-sm font-medium text-gray-900'>
													{product.name}
												</h4>
												<p className='text-xs text-gray-500'>
													SKU: {product.sku}
												</p>
												<p className='text-xs font-medium text-purple-600'>
													{product.category}
												</p>
											</div>
											<div className='ml-4 space-y-1 text-right'>
												<Badge
													className={`${getStockBadgeColor(product.stock)} font-semibold`}>
													{product.stock} und.
												</Badge>
												<Badge
													className={`block ${getStatusBadgeColor(product.status)} text-xs`}>
													{product.status}
												</Badge>
												<p className='text-xs text-gray-600'>
													{formatCurrency(product.price)}
												</p>
											</div>
										</div>
									</div>
								))
						)}
					</CardBody>
				</Card>

				{/* Top Ventas */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white'>
						<div className='flex items-center justify-between'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroTrophy' className='mr-2 h-5 w-5' />
								Top Ventas
							</h3>
							<Badge className='bg-white/20 font-semibold text-white'>30 días</Badge>
						</div>
					</CardHeader>
					<CardBody className='max-h-96 overflow-y-auto p-0'>
						{loading ? (
							<div className='p-6 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-2 h-6 w-6 animate-spin text-purple-500'
								/>
								<span className='text-gray-600'>Cargando ventas...</span>
							</div>
						) : (
							topSales.map((sale, index) => (
								<div
									key={sale.productId}
									className='border-b border-gray-100 p-4 transition-colors hover:bg-purple-50'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-3'>
											<div
												className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
													index === 0
														? 'bg-yellow-100 text-yellow-800'
														: index === 1
															? 'bg-gray-100 text-gray-800'
															: index === 2
																? 'bg-orange-100 text-orange-800'
																: 'bg-purple-100 text-purple-800'
												}`}>
												{index + 1}
											</div>
											<div className='flex-1'>
												<h4 className='text-sm font-medium text-gray-900'>
													{sale.productName}
												</h4>
												<p className='text-xs font-medium text-purple-600'>
													{sale.period}
												</p>
											</div>
										</div>
										<div className='ml-4 text-right'>
											<Badge className='bg-purple-100 font-semibold text-purple-800'>
												{sale.unitsSold} vendidos
											</Badge>
											<p className='mt-1 text-xs text-gray-600'>
												{formatCurrency(sale.revenue)}
											</p>
										</div>
									</div>
								</div>
							))
						)}
					</CardBody>
				</Card>

				{/* Panel de Control Ripley */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-purple-700 to-purple-800 text-white'>
						<h3 className='flex items-center text-lg font-semibold'>
							<Icon icon='HeroCommandLine' className='mr-2 h-5 w-5' />
							Control Ripley
						</h3>
					</CardHeader>
					<CardBody className='space-y-4 p-4'>
						{/* Información del marketplace */}
						<div className='rounded-lg border border-purple-200 bg-purple-50 p-4 dark:bg-purple-900/20'>
							<div className='text-center'>
								<p className='text-sm font-medium text-purple-600 dark:text-purple-400'>
									Estado Marketplace
								</p>
								<Badge className='mt-2 bg-green-100 text-green-800'>
									<Icon icon='HeroCheckCircle' className='mr-1 h-3 w-3' />
									Conectado
								</Badge>
							</div>
						</div>

						{/* Acciones */}
						<div className='space-y-3'>
							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50'>
								<Icon icon='HeroShoppingBag' className='mr-2 h-4 w-4' />
								Catálogo Ripley
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50'>
								<Icon icon='HeroChartBarSquare' className='mr-2 h-4 w-4' />
								Análisis de Ventas
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50'>
								<Icon icon='HeroCog6Tooth' className='mr-2 h-4 w-4' />
								Configuración
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50'
								onClick={() => window.open('https://simple.ripley.cl', '_blank')}>
								<Icon icon='HeroArrowTopRightOnSquare' className='mr-2 h-4 w-4' />
								Ripley Simple
							</Button>
						</div>

						{/* Estadísticas rápidas */}
						<div className='space-y-2 border-t border-purple-200 pt-4'>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-600'>Conversión:</span>
								<span className='font-medium text-purple-700'>2.4%</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-600'>Rating promedio:</span>
								<span className='font-medium text-purple-700'>4.2★</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-600'>Tiempo respuesta:</span>
								<span className='font-medium text-purple-700'>2.1h</span>
							</div>
						</div>

						{/* Actualización */}
						<div className='border-t border-purple-200 pt-4'>
							<p className='mb-2 text-center text-xs text-gray-500'>
								Sincronizado: {new Date().toLocaleTimeString('es-CL')}
							</p>
							<Button
								variant='outline'
								size='sm'
								className='w-full border-purple-200 text-xs text-purple-600 hover:bg-purple-50'
								onClick={() => window.location.reload()}>
								<Icon icon='HeroArrowPath' className='mr-1 h-3 w-3' />
								Sincronizar
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default RipleyDashboard;
