import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppSelector } from '@/store';

// Datos mock simples para testing
const mockData = {
	totalProducts: 7,
	totalValue: 2945950,
	lowStockCount: 4,
	outOfStockCount: 1,
	averagePrice: 420850,
	lowStockProducts: [
		{
			SellerSku: 'ECO-LAP-001',
			Name: 'Laptop ASUS VivoBook 15 X1502ZA',
			Brand: 'ASUS',
			Price: 549990,
			Quantity: 3,
		},
		{
			SellerSku: 'ECO-MON-002',
			Name: 'Monitor Samsung Odyssey G3 24"',
			Brand: 'Samsung',
			Price: 169990,
			Quantity: 1,
		},
		{
			SellerSku: 'ECO-KEY-003',
			Name: 'Teclado Razer BlackWidow V3',
			Brand: 'Razer',
			Price: 89990,
			Quantity: 0,
		},
		{
			SellerSku: 'ECO-RAM-006',
			Name: 'Memoria RAM Corsair Vengeance 16GB',
			Brand: 'Corsair',
			Price: 69990,
			Quantity: 4,
		},
	],
	bestSellingProducts: [
		{
			product: {
				SellerSku: 'ECO-LAP-001',
				Name: 'Laptop ASUS VivoBook 15 X1502ZA',
				Brand: 'ASUS',
				Price: 549990,
			},
			totalSold: 6,
		},
		{
			product: {
				SellerSku: 'ECO-MOU-004',
				Name: 'Mouse Logitech G502 HERO',
				Brand: 'Logitech',
				Price: 49990,
			},
			totalSold: 6,
		},
		{
			product: {
				SellerSku: 'ECO-MON-002',
				Name: 'Monitor Samsung Odyssey G3 24"',
				Brand: 'Samsung',
				Price: 169990,
			},
			totalSold: 3,
		},
	],
};

const Dashboard: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.auth);
	const [loading, setLoading] = useState(true);

	// Simular carga de datos
	useEffect(() => {
		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);
		return () => clearTimeout(timer);
	}, []);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<PageWrapper
			isProtectedRoute={false}
			className='bg-gray-50 dark:bg-gray-900'
			name='Dashboard EcoPC'>
			{/* Encabezado */}
			<Subheader>
				<SubheaderLeft>
					<h1 className='text-2xl font-semibold leading-none text-gray-900 dark:text-white'>
						¡Hola {user?.first_name ?? 'Usuario'}! 👋
					</h1>
					<Badge className='ml-4 bg-green-100 text-green-800'>Dashboard Falabella</Badge>
				</SubheaderLeft>
			</Subheader>

			{/* Contenido principal */}
			<Container className='flex h-full w-full flex-col space-y-6'>
				{/* Estadísticas generales */}
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Card className='bg-gradient-to-r from-blue-500 to-blue-600 text-white'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-blue-100'>
										Total Productos
									</p>
									<p className='text-2xl font-bold'>
										{loading ? '...' : mockData.totalProducts}
									</p>
								</div>
								<Icon
									icon='HeroCubeTransparent'
									className='h-8 w-8 text-blue-200'
								/>
							</div>
						</CardBody>
					</Card>

					<Card className='bg-gradient-to-r from-green-500 to-green-600 text-white'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-green-100'>
										Valor Total
									</p>
									<p className='text-xl font-bold'>
										{loading ? '...' : formatCurrency(mockData.totalValue)}
									</p>
								</div>
								<Icon
									icon='HeroCurrencyDollar'
									className='h-8 w-8 text-green-200'
								/>
							</div>
						</CardBody>
					</Card>

					<Card className='bg-gradient-to-r from-yellow-500 to-orange-500 text-white'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-yellow-100'>
										Stock Bajo
									</p>
									<p className='text-2xl font-bold'>
										{loading ? '...' : mockData.lowStockCount}
									</p>
								</div>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-8 w-8 text-yellow-200'
								/>
							</div>
						</CardBody>
					</Card>

					<Card className='bg-gradient-to-r from-red-500 to-red-600 text-white'>
						<CardBody className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-red-100'>Sin Stock</p>
									<p className='text-2xl font-bold'>
										{loading ? '...' : mockData.outOfStockCount}
									</p>
								</div>
								<Icon icon='HeroXCircle' className='h-8 w-8 text-red-200' />
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Sección principal con 3 funcionalidades */}
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
					{/* 1. Productos con Stock Bajo */}
					<Card className='col-span-1'>
						<CardHeader className='bg-gradient-to-r from-orange-500 to-red-500 text-white'>
							<div className='flex items-center justify-between'>
								<h3 className='flex items-center text-lg font-semibold'>
									<Icon icon='HeroExclamationTriangle' className='mr-2 h-5 w-5' />
									Stock Bajo
								</h3>
								<Badge className='bg-white/20 text-white'>
									{mockData.lowStockProducts.length}
								</Badge>
							</div>
						</CardHeader>
						<CardBody className='max-h-80 overflow-y-auto p-0'>
							{loading ? (
								<div className='p-6 text-center text-gray-500'>
									<Icon
										icon='HeroArrowPath'
										className='mx-auto mb-2 h-6 w-6 animate-spin'
									/>
									Cargando productos...
								</div>
							) : (
								mockData.lowStockProducts.map((product) => (
									<div
										key={product.SellerSku}
										className='border-b border-gray-200 p-4 hover:bg-gray-50'>
										<div className='flex items-center justify-between'>
											<div className='flex-1'>
												<h4 className='text-sm font-medium text-gray-900'>
													{product.Name}
												</h4>
												<p className='text-xs text-gray-500'>
													SKU: {product.SellerSku}
												</p>
												<p className='text-xs text-gray-600'>
													{product.Brand}
												</p>
											</div>
											<div className='text-right'>
												<span
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														product.Quantity === 0
															? 'bg-red-100 text-red-800'
															: 'bg-orange-100 text-orange-800'
													}`}>
													{product.Quantity} unidades
												</span>
												<p className='mt-1 text-xs text-gray-500'>
													{formatCurrency(product.Price)}
												</p>
											</div>
										</div>
									</div>
								))
							)}
						</CardBody>
					</Card>

					{/* 2. Productos Más Vendidos */}
					<Card className='col-span-1'>
						<CardHeader className='bg-gradient-to-r from-green-500 to-emerald-500 text-white'>
							<div className='flex items-center justify-between'>
								<h3 className='flex items-center text-lg font-semibold'>
									<Icon icon='HeroTrophy' className='mr-2 h-5 w-5' />
									Más Vendidos
								</h3>
								<Badge className='bg-white/20 text-white'>Últimos 30 días</Badge>
							</div>
						</CardHeader>
						<CardBody className='max-h-80 overflow-y-auto p-0'>
							{loading ? (
								<div className='p-6 text-center text-gray-500'>
									<Icon
										icon='HeroArrowPath'
										className='mx-auto mb-2 h-6 w-6 animate-spin'
									/>
									Cargando ventas...
								</div>
							) : (
								mockData.bestSellingProducts.map((item, index) => (
									<div
										key={item.product.SellerSku}
										className='border-b border-gray-200 p-4 hover:bg-gray-50'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center space-x-3'>
												<div
													className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
														index === 0
															? 'bg-yellow-100 text-yellow-800'
															: index === 1
																? 'bg-gray-100 text-gray-800'
																: index === 2
																	? 'bg-orange-100 text-orange-800'
																	: 'bg-blue-100 text-blue-800'
													}`}>
													{index + 1}
												</div>
												<div className='flex-1'>
													<h4 className='text-sm font-medium text-gray-900'>
														{item.product.Name}
													</h4>
													<p className='text-xs text-gray-500'>
														{item.product.Brand}
													</p>
												</div>
											</div>
											<div className='text-right'>
												<span className='inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
													{item.totalSold} vendidos
												</span>
												<p className='mt-1 text-xs text-gray-500'>
													{formatCurrency(item.product.Price)}
												</p>
											</div>
										</div>
									</div>
								))
							)}
						</CardBody>
					</Card>

					{/* 3. Resumen de Inventario y Acciones */}
					<Card className='col-span-1'>
						<CardHeader className='bg-gradient-to-r from-purple-500 to-indigo-500 text-white'>
							<h3 className='flex items-center text-lg font-semibold'>
								<Icon icon='HeroChartBarSquare' className='mr-2 h-5 w-5' />
								Acciones Rápidas
							</h3>
						</CardHeader>
						<CardBody className='space-y-4 p-4'>
							{/* Precio promedio */}
							<div className='rounded-lg bg-purple-50 p-4'>
								<div className='text-center'>
									<p className='text-sm font-medium text-purple-600'>
										Precio Promedio
									</p>
									<p className='text-2xl font-bold text-purple-800'>
										{loading ? '...' : formatCurrency(mockData.averagePrice)}
									</p>
								</div>
							</div>

							{/* Botones de acción */}
							<div className='space-y-2'>
								<Button
									variant='outline'
									size='sm'
									className='w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50'
									onClick={() => navigate('/inventario')}>
									<Icon icon='HeroCubeTransparent' className='mr-2 h-4 w-4' />
									Ver Inventario Completo
								</Button>

								<Button
									variant='outline'
									size='sm'
									className='w-full justify-start border-green-200 text-green-700 hover:bg-green-50'
									onClick={() => navigate('/ordenes-compra')}>
									<Icon icon='HeroShoppingCart' className='mr-2 h-4 w-4' />
									Crear Orden de Compra
								</Button>

								<Button
									variant='outline'
									size='sm'
									className='w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50'
									onClick={() =>
										window.open('https://sellercenter.falabella.com', '_blank')
									}>
									<Icon
										icon='HeroArrowTopRightOnSquare'
										className='mr-2 h-4 w-4'
									/>
									Ir a Falabella Seller
								</Button>
							</div>

							{/* Última actualización */}
							<div className='border-t border-gray-200 pt-4 text-center'>
								<p className='text-xs text-gray-500'>
									Última actualización: {new Date().toLocaleTimeString('es-CL')}
								</p>
								<Button
									variant='outline'
									size='sm'
									className='mt-1 text-xs'
									onClick={() => window.location.reload()}>
									<Icon icon='HeroArrowPath' className='mr-1 h-3 w-3' />
									Actualizar
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Banner de EcoPC */}
				<div className='w-full'>
					<Card className='bg-gradient-to-r from-emerald-600 to-teal-600 text-white'>
						<CardBody className='p-6'>
							<div className='grid grid-cols-1 items-center gap-6 md:grid-cols-2'>
								<div>
									<h2 className='mb-2 text-2xl font-bold'>
										🚀 Dashboard Falabella EcoPC
									</h2>
									<p className='mb-4 text-emerald-100'>
										Gestiona tu inventario de manera eficiente con datos en
										tiempo real
									</p>
									<div className='flex space-x-3'>
										<Button
											variant='outline'
											className='border-white text-white hover:bg-white hover:text-emerald-600'
											onClick={() =>
												alert('¡Dashboard funcionando perfectamente! 🎉')
											}>
											✅ Todo Funciona
										</Button>
										<Button
											variant='outline'
											className='border-white text-white hover:bg-white hover:text-emerald-600'
											onClick={() => window.location.reload()}>
											🔄 Recargar Datos
										</Button>
									</div>
								</div>
								<div className='text-center'>
									<div className='rounded-lg bg-white/10 p-4'>
										<h3 className='mb-2 text-lg font-bold'>
											📊 Resumen Rápido
										</h3>
										<div className='grid grid-cols-2 gap-2 text-sm'>
											<div>💰 Inventario: $2.9M</div>
											<div>📦 7 Productos</div>
											<div> 4 Stock Bajo</div>
											<div>🏆 6 Más Vendidas</div>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default Dashboard;
