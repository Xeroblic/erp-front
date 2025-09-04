import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { DashboardStats } from '../../types';

interface ParisProduct {
	id: string;
	name: string;
	sku: string;
	stock: number;
	price: number;
	category: string;
	brand: string;
	rating: number;
	salesRank: number;
}

interface ParisPromotion {
	id: string;
	name: string;
	discount: number;
	startDate: string;
	endDate: string;
	applicableProducts: number;
	status: 'active' | 'pending' | 'expired';
}

const ParisDashboard: React.FC = () => {
	const [stats, setStats] = useState<DashboardStats>({
		totalProducts: 0,
		totalRevenue: 0,
		ordersCount: 0,
		lowStockCount: 0,
	});
	const [featuredProducts, setFeaturedProducts] = useState<ParisProduct[]>([]);
	const [promotions, setPromotions] = useState<ParisPromotion[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadParisData = async () => {
			setLoading(true);

			// Simular delay de API
			await new Promise((resolve) => setTimeout(resolve, 1200));

			// Datos simulados para Paris
			setStats({
				totalProducts: 1247,
				totalRevenue: 28750000,
				ordersCount: 678,
				lowStockCount: 34,
			});

			setFeaturedProducts([
				{
					id: 'P001',
					name: 'Vestido Floral Primavera',
					sku: 'VF-PRIM-2024',
					stock: 15,
					price: 89990,
					category: 'Moda Mujer',
					brand: 'Paris Style',
					rating: 4.8,
					salesRank: 1,
				},
				{
					id: 'P002',
					name: 'Zapatos Casuales Cuero',
					sku: 'ZC-CUERO-42',
					stock: 8,
					price: 149990,
					category: 'Calzado',
					brand: 'Comfort Plus',
					rating: 4.6,
					salesRank: 2,
				},
				{
					id: 'P003',
					name: 'Perfume Mujer Elegance',
					sku: 'PM-ELEG-50ML',
					stock: 3,
					price: 79990,
					category: 'Perfumería',
					brand: 'Paris Parfum',
					rating: 4.9,
					salesRank: 3,
				},
				{
					id: 'P004',
					name: 'Cartera de Cuero Premium',
					sku: 'CC-PREM-BLK',
					stock: 1,
					price: 199990,
					category: 'Accesorios',
					brand: 'Luxury Line',
					rating: 4.7,
					salesRank: 4,
				},
				{
					id: 'P005',
					name: 'Cosméticos Set Completo',
					sku: 'CS-COMP-2024',
					stock: 12,
					price: 119990,
					category: 'Belleza',
					brand: 'Beauty Pro',
					rating: 4.5,
					salesRank: 5,
				},
			]);

			setPromotions([
				{
					id: 'PROMO001',
					name: 'Descuento Primavera',
					discount: 30,
					startDate: '2024-09-01',
					endDate: '2024-09-30',
					applicableProducts: 245,
					status: 'active',
				},
				{
					id: 'PROMO002',
					name: 'Black Friday Anticipado',
					discount: 50,
					startDate: '2024-11-20',
					endDate: '2024-11-25',
					applicableProducts: 156,
					status: 'pending',
				},
				{
					id: 'PROMO003',
					name: 'Cyber Monday',
					discount: 40,
					startDate: '2024-11-26',
					endDate: '2024-11-27',
					applicableProducts: 89,
					status: 'pending',
				},
			]);

			setLoading(false);
		};

		loadParisData();
	}, []);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getPromotionStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'expired':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStockBadgeColor = (stock: number) => {
		if (stock === 0) return 'bg-red-100 text-red-800';
		if (stock <= 5) return 'bg-orange-100 text-orange-800';
		return 'bg-green-100 text-green-800';
	};

	const renderStars = (rating: number) => {
		return (
			<div className='flex items-center space-x-1'>
				{[1, 2, 3, 4, 5].map((star) => (
					<Icon
						key={star}
						icon='HeroStar'
						className={`h-3 w-3 ${
							star <= rating ? 'text-yellow-400' : 'text-gray-300'
						}`}
					/>
				))}
				<span className='ml-1 text-xs text-gray-600'>{rating}</span>
			</div>
		);
	};

	return (
		<div className='space-y-6 py-6'>
			{/* Estadísticas principales - Tema Paris */}
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-pink-100'>Total Productos</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.totalProducts?.toLocaleString()}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroSparkles' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-pink-100'>
									Ingresos Totales
								</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : formatCurrency(stats.totalRevenue || 0)}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroGift' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-rose-100'>Órdenes París</p>
								<p className='text-3xl font-bold'>
									{loading ? '...' : stats.ordersCount}
								</p>
							</div>
							<div className='rounded-lg bg-white/20 p-3'>
								<Icon icon='HeroShoppingBag' className='h-8 w-8 text-white' />
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className='bg-gradient-to-br from-pink-700 to-pink-800 text-white shadow-lg'>
					<CardBody className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-pink-100'>Stock Bajo</p>
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
				{/* Productos Destacados */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white'>
						<div className='flex items-center justify-between'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroSparkles' className='mr-2 h-5 w-5' />
								Productos Destacados
							</h3>
							<Badge className='bg-white/20 font-semibold text-white'>Top 5</Badge>
						</div>
					</CardHeader>
					<CardBody className='max-h-96 overflow-y-auto p-0'>
						{loading ? (
							<div className='p-6 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-2 h-6 w-6 animate-spin text-pink-500'
								/>
								<span className='text-gray-600'>Cargando productos...</span>
							</div>
						) : (
							featuredProducts.map((product) => (
								<div
									key={product.id}
									className='border-b border-gray-100 p-4 transition-colors hover:bg-pink-50'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-3'>
											<div
												className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
													product.salesRank === 1
														? 'bg-yellow-100 text-yellow-800'
														: product.salesRank === 2
															? 'bg-gray-100 text-gray-800'
															: product.salesRank === 3
																? 'bg-orange-100 text-orange-800'
																: 'bg-pink-100 text-pink-800'
												}`}>
												{product.salesRank}
											</div>
											<div className='flex-1'>
												<h4 className='text-sm font-medium text-gray-900'>
													{product.name}
												</h4>
												<p className='text-xs text-gray-500'>
													SKU: {product.sku}
												</p>
												<p className='text-xs font-medium text-pink-600'>
													{product.brand}
												</p>
												{renderStars(product.rating)}
											</div>
										</div>
										<div className='ml-4 space-y-1 text-right'>
											<Badge
												className={`${getStockBadgeColor(product.stock)} font-semibold`}>
												{product.stock} und.
											</Badge>
											<p className='text-xs text-gray-600'>
												{formatCurrency(product.price)}
											</p>
											<p className='text-xs font-medium text-pink-600'>
												{product.category}
											</p>
										</div>
									</div>
								</div>
							))
						)}
					</CardBody>
				</Card>

				{/* Promociones Activas */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white'>
						<div className='flex items-center justify-between'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroTicket' className='mr-2 h-5 w-5' />
								Promociones
							</h3>
							<Badge className='bg-white/20 font-semibold text-white'>
								{promotions.filter((p) => p.status === 'active').length} activas
							</Badge>
						</div>
					</CardHeader>
					<CardBody className='max-h-96 overflow-y-auto p-0'>
						{loading ? (
							<div className='p-6 text-center'>
								<Icon
									icon='HeroArrowPath'
									className='mx-auto mb-2 h-6 w-6 animate-spin text-pink-500'
								/>
								<span className='text-gray-600'>Cargando promociones...</span>
							</div>
						) : (
							promotions.map((promo) => (
								<div
									key={promo.id}
									className='border-b border-gray-100 p-4 transition-colors hover:bg-pink-50'>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<h4 className='text-sm font-medium text-gray-900'>
												{promo.name}
											</h4>
											<Badge
												className={`${getPromotionStatusColor(promo.status)} text-xs font-semibold`}>
												{promo.status}
											</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<div className='rounded bg-pink-100 px-2 py-1 text-lg font-bold text-pink-800'>
												{promo.discount}% OFF
											</div>
											<div className='text-right'>
												<p className='text-xs text-gray-600'>
													{promo.applicableProducts} productos
												</p>
												<p className='text-xs text-gray-500'>
													{new Date(promo.startDate).toLocaleDateString(
														'es-CL',
													)}{' '}
													-
													{new Date(promo.endDate).toLocaleDateString(
														'es-CL',
													)}
												</p>
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</CardBody>
				</Card>

				{/* Panel de Control Paris */}
				<Card className='col-span-1 shadow-lg'>
					<CardHeader className='rounded-t-xl bg-gradient-to-r from-pink-700 to-pink-800 text-white'>
						<h3 className='flex items-center text-lg font-semibold'>
							<Icon icon='HeroSparkles' className='mr-2 h-5 w-5' />
							Control París
						</h3>
					</CardHeader>
					<CardBody className='space-y-4 p-4'>
						{/* Información del marketplace */}
						<div className='rounded-lg border border-pink-200 bg-pink-50 p-4 dark:bg-pink-900/20'>
							<div className='text-center'>
								<p className='text-sm font-medium text-pink-600 dark:text-pink-400'>
									Estado Paris.cl
								</p>
								<Badge className='mt-2 bg-green-100 text-green-800'>
									<Icon icon='HeroCheckCircle' className='mr-1 h-3 w-3' />
									Online
								</Badge>
							</div>
						</div>

						{/* Categorías principales */}
						<div className='space-y-2'>
							<h4 className='text-sm font-medium text-gray-700'>Categorías Top</h4>
							<div className='space-y-1 text-xs'>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Moda Mujer</span>
									<span className='font-medium text-pink-600'>342 productos</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Belleza</span>
									<span className='font-medium text-pink-600'>287 productos</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Calzado</span>
									<span className='font-medium text-pink-600'>198 productos</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Accesorios</span>
									<span className='font-medium text-pink-600'>156 productos</span>
								</div>
							</div>
						</div>

						{/* Acciones */}
						<div className='space-y-3'>
							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-pink-200 text-pink-700 hover:bg-pink-50'>
								<Icon icon='HeroSparkles' className='mr-2 h-4 w-4' />
								Catálogo Belleza
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-pink-200 text-pink-700 hover:bg-pink-50'>
								<Icon icon='HeroTicket' className='mr-2 h-4 w-4' />
								Gestionar Promociones
							</Button>

							<Button
								variant='outline'
								size='sm'
								className='w-full justify-start border-pink-200 text-pink-700 hover:bg-pink-50'
								onClick={() => window.open('https://www.paris.cl', '_blank')}>
								<Icon icon='HeroArrowTopRightOnSquare' className='mr-2 h-4 w-4' />
								Paris.cl
							</Button>
						</div>

						{/* Métricas de rendimiento */}
						<div className='space-y-2 border-t border-pink-200 pt-4'>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-600'>Rating promedio:</span>
								<span className='font-medium text-pink-700'>4.6★</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-600'>Tiempo de entrega:</span>
								<span className='font-medium text-pink-700'>24-48h</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-600'>Satisfacción:</span>
								<span className='font-medium text-pink-700'>94%</span>
							</div>
						</div>

						{/* Actualización */}
						<div className='border-t border-pink-200 pt-4'>
							<p className='mb-2 text-center text-xs text-gray-500'>
								Actualizado: {new Date().toLocaleTimeString('es-CL')}
							</p>
							<Button
								variant='outline'
								size='sm'
								className='w-full border-pink-200 text-xs text-pink-600 hover:bg-pink-50'
								onClick={() => window.location.reload()}>
								<Icon icon='HeroArrowPath' className='mr-1 h-3 w-3' />
								Actualizar Datos
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default ParisDashboard;
