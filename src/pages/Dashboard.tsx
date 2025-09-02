export { default } from './dashboards/DashboardContainer';

// Cargar datos al montar el componente
useEffect(() => {
	const loadDashboardData = async () => {
		console.log('Dashboard: Conectando con backend Laravel...');
		try {
			setLoading(true);
			setError(null);

			console.log('Dashboard: Solicitando datos desde endpoints del backend...');

			const [summary, lowStock, bestSelling] = await Promise.all([
				falabellaApi.getInventorySummary(),
				falabellaApi.getLowStockProducts(5),
				falabellaApi.getBestSellingProducts(30)
			]);

			console.log('📈 Dashboard: Datos recibidos:', {
				summary,
				lowStock: lowStock?.length || 0,
				bestSelling: bestSelling?.length || 0
			});

			// Validar que los datos existan antes de setearlos
			setInventorySummary(summary || {
				totalProducts: 0,
				totalValue: 0,
				lowStockCount: 0,
				outOfStockCount: 0,
				averagePrice: 0
			});
			setLowStockProducts(Array.isArray(lowStock) ? lowStock : []);
			setBestSellingProducts(Array.isArray(bestSelling) ? bestSelling : []);

			console.log('Dashboard: Datos cargados exitosamente');
		} catch (err) {
			console.error('Dashboard: Error loading dashboard data:', err);
			setError(err instanceof Error ? err.message : 'Error al cargar datos del dashboard');
			// Setear valores por defecto en caso de error
			setInventorySummary({
				totalProducts: 0,
				totalValue: 0,
				lowStockCount: 0,
				outOfStockCount: 0,
				averagePrice: 0
			});
			setLowStockProducts([]);
			setBestSellingProducts([]);
		} finally {
			setLoading(false);
			console.log('Dashboard: Carga completada');
		}
	};

	loadDashboardData();
}, []);

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP',
		minimumFractionDigits: 0
	}).format(amount);
};

// Extraer 'nombre' y 'authority' solo si existen en el usuario
const userData = useAppSelector(s => s.auth.user);
const nombre = userData?.first_name ?? '';
const authority = userData?.authority ?? [];
return (
	<PageWrapper isProtectedRoute={true} title='Zentria' name='Dashboard EcoPC'>
		{/* Encabezado */}
		<Subheader>
			<SubheaderLeft>
				<h1 className="text-2xl font-semibold leading-none text-gray-900 dark:text-white">
					¡Hola {user?.first_name ?? '👋'}!
				</h1>
				<Badge className="ml-4 bg-green-100 text-green-800">Dashboard Falabella</Badge>
			</SubheaderLeft>
		</Subheader>

		{/* Contenido principal */}
		<Container className="flex flex-col w-full h-full space-y-6">
			{/* Mostrar error si existe */}
			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardBody className="p-4">
						<div className="flex items-center space-x-2 text-red-700">
							<Icon icon="HeroExclamationTriangle" className="w-5 h-5" />
							<span>{error}</span>
						</div>
					</CardBody>
				</Card>
			)}
			{/* Estadísticas generales */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
					<CardBody className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-blue-100 text-sm font-medium">Total Productos</p>
								<p className="text-2xl font-bold">
									{loading ? '...' : inventorySummary.totalProducts}
								</p>
							</div>
							<Icon icon="HeroCubeTransparent" className="w-8 h-8 text-blue-200" />
						</div>
					</CardBody>
				</Card>

				<Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
					<CardBody className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-green-100 text-sm font-medium">Valor Total</p>
								<p className="text-2xl font-bold">
									{loading ? '...' : formatCurrency(inventorySummary.totalValue)}
								</p>
							</div>
							<Icon icon="HeroCurrencyDollar" className="w-8 h-8 text-green-200" />
						</div>
					</CardBody>
				</Card>

				<Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
					<CardBody className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-yellow-100 text-sm font-medium">Stock Bajo</p>
								<p className="text-2xl font-bold">
									{loading ? '...' : inventorySummary.lowStockCount}
								</p>
							</div>
							<Icon icon="HeroExclamationTriangle" className="w-8 h-8 text-yellow-200" />
						</div>
					</CardBody>
				</Card>

				<Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
					<CardBody className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-red-100 text-sm font-medium">Sin Stock</p>
								<p className="text-2xl font-bold">
									{loading ? '...' : inventorySummary.outOfStockCount}
								</p>
							</div>
							<Icon icon="HeroXCircle" className="w-8 h-8 text-red-200" />
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Sección principal con 3 funcionalidades */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

				{/* 1. Productos con Stock Bajo */}
				<Card className="col-span-1">
					<CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold flex items-center">
								<Icon icon="HeroExclamationTriangle" className="w-5 h-5 mr-2" />
								Stock Bajo
							</h3>
							<Badge className="bg-white/20 text-white">
								{(lowStockProducts || []).length}
							</Badge>
						</div>
					</CardHeader>
					<CardBody className="p-0 max-h-80 overflow-y-auto">
						{loading ? (
							<div className="p-6 text-center text-gray-500">
								<Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2" />
								Cargando productos...
							</div>
						) : (lowStockProducts || []).length === 0 ? (
							<div className="p-6 text-center text-gray-500">
								<Icon icon="HeroCheckCircle" className="w-8 h-8 mx-auto mb-2 text-green-500" />
								¡Todos los productos tienen stock suficiente!
							</div>
						) : (
							(lowStockProducts || []).map((product) => (
								<div key={product.SellerSku} className="p-4 border-b border-gray-200 hover:bg-gray-50">
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<h4 className="font-medium text-gray-900 text-sm">{product.Name}</h4>
											<p className="text-xs text-gray-500">SKU: {product.SellerSku}</p>
											<p className="text-xs text-gray-600">{product.Brand}</p>
										</div>
										<div className="text-right">
											<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.Quantity === 0
												? 'bg-red-100 text-red-800'
												: 'bg-orange-100 text-orange-800'
												}`}>
												{product.Quantity} unidades
											</span>
											<p className="text-xs text-gray-500 mt-1">
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
				<Card className="col-span-1">
					<CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold flex items-center">
								<Icon icon="HeroTrophy" className="w-5 h-5 mr-2" />
								Más Vendidos
							</h3>
							<Badge className="bg-white/20 text-white">
								Últimos 30 días
							</Badge>
						</div>
					</CardHeader>
					<CardBody className="p-0 max-h-80 overflow-y-auto">
						{loading ? (
							<div className="p-6 text-center text-gray-500">
								<Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2" />
								Cargando ventas...
							</div>
						) : (bestSellingProducts || []).length === 0 ? (
							<div className="p-6 text-center text-gray-500">
								<Icon icon="HeroInformationCircle" className="w-8 h-8 mx-auto mb-2" />
								No hay ventas registradas en los últimos 30 días
							</div>
						) : (
							(bestSellingProducts || []).slice(0, 5).map((item, index) => (
								<div key={item.product.SellerSku} className="p-4 border-b border-gray-200 hover:bg-gray-50">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
												index === 1 ? 'bg-gray-100 text-gray-800' :
													index === 2 ? 'bg-orange-100 text-orange-800' :
														'bg-blue-100 text-blue-800'
												}`}>
												{index + 1}
											</div>
											<div className="flex-1">
												<h4 className="font-medium text-gray-900 text-sm">{item.product.Name}</h4>
												<p className="text-xs text-gray-500">{item.product.Brand}</p>
											</div>
										</div>
										<div className="text-right">
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
												{item.totalSold} vendidos
											</span>
											<p className="text-xs text-gray-500 mt-1">
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
				<Card className="col-span-1">
					<CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
						<h3 className="text-lg font-semibold flex items-center">
							<Icon icon="HeroChartBarSquare" className="w-5 h-5 mr-2" />
							Acciones Rápidas
						</h3>
					</CardHeader>
					<CardBody className="p-4 space-y-4">
						{/* Precio promedio */}
						<div className="bg-purple-50 rounded-lg p-4">
							<div className="text-center">
								<p className="text-sm text-purple-600 font-medium">Precio Promedio</p>
								<p className="text-2xl font-bold text-purple-800">
									{loading ? '...' : formatCurrency(inventorySummary.averagePrice)}
								</p>
							</div>
						</div>

						{/* Botones de acción */}
						<div className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
								onClick={() => navigate('/inventario')}
							>
								<Icon icon="HeroCubeTransparent" className="w-4 h-4 mr-2" />
								Ver Inventario Completo
							</Button>

							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
								onClick={() => navigate('/ordenes-compra')}
							>
								<Icon icon="HeroShoppingCart" className="w-4 h-4 mr-2" />
								Crear Orden de Compra
							</Button>

							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50"
								onClick={() => window.open('https://sellercenter.falabella.com', '_blank')}
							>
								<Icon icon="HeroArrowTopRightOnSquare" className="w-4 h-4 mr-2" />
								Ir a Falabella Seller
							</Button>
						</div>

						{/* Última actualización */}
						<div className="text-center pt-4 border-t border-gray-200">
							<p className="text-xs text-gray-500">
								Última actualización: {new Date().toLocaleTimeString('es-CL')}
							</p>
							<Button
								variant="outline"
								size="sm"
								className="text-xs mt-1"
								onClick={() => window.location.reload()}
							>
								<Icon icon="HeroArrowPath" className="w-3 h-3 mr-1" />
								Actualizar
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Banner inferior con acceso legacy */}
			<div className="w-full">
				<Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
					<CardBody className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
							<div>
								<h2 className="text-2xl font-bold mb-2">
									Sistema ERP EcoPC
								</h2>
								<p className="text-emerald-100 mb-4">
									Gestiona tu inventario de manera eficiente con integración directa a Falabella
								</p>
								<div className="flex space-x-3">
									<Button
										variant="outline"
										className="border-white text-white hover:bg-white hover:text-emerald-600"
										onClick={() => navigate('/inventario')}
									>
										Ver Inventario
									</Button>
									<Button
										variant="outline"
										className="border-white text-white hover:bg-white hover:text-emerald-600"
										onClick={() => navigate('/ordenes-compra')}
									>
										Órdenes de Compra
									</Button>
								</div>
							</div>
							<div className="text-center">
								<img
									className="w-full max-w-md mx-auto rounded-lg shadow-lg"
									src="https://placehold.co/400x200/0E9F6E/FFFFFF?text=EcoPC+Dashboard"
									alt="Dashboard EcoPC"
								/>
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