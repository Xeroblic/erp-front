import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { DashboardStats } from '../../types';
import FalabellaBackendService, { Product, InventorySummary, BestSellingProduct } from '@/services/falabellaApi.service';

const falabellaApi = new FalabellaBackendService();

const FalabellaDashboard: React.FC = () => {
    const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        averagePrice: 0
    });
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [summary, lowStock, bestSelling] = await Promise.all([
                    falabellaApi.getInventorySummary(),
                    falabellaApi.getLowStockProducts(5),
                    falabellaApi.getBestSellingProducts(30)
                ]);

                setInventorySummary(summary || {
                    totalProducts: 0,
                    totalValue: 0,
                    lowStockCount: 0,
                    outOfStockCount: 0,
                    averagePrice: 0
                });
                setLowStockProducts(Array.isArray(lowStock) ? lowStock : []);
                setBestSellingProducts(Array.isArray(bestSelling) ? bestSelling : []);
            } catch (err) {
                console.error('Error loading Falabella dashboard data:', err);
                setError(err instanceof Error ? err.message : 'Error al cargar datos');
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

    return (
        <div className="space-y-6 py-6">
            {/* Error Banner */}
            {error && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <CardBody className="p-4">
                        <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                            <Icon icon="HeroExclamationTriangle" className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Estadísticas principales - Tema Falabella */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Total Productos</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : inventorySummary.totalProducts.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroCubeTransparent" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Valor Inventario</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : formatCurrency(inventorySummary.totalValue)}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroCurrencyDollar" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Stock Bajo</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : inventorySummary.lowStockCount}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroExclamationTriangle" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-red-700 to-red-800 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Sin Stock</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : inventorySummary.outOfStockCount}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroXCircle" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Productos con Stock Bajo */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Icon icon="HeroExclamationTriangle" className="w-5 h-5 mr-2" />
                                Stock Crítico
                            </h3>
                            <Badge className="bg-white/20 text-white font-semibold">
                                {lowStockProducts.length}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                                <span className="text-gray-600">Cargando productos...</span>
                            </div>
                        ) : lowStockProducts.length === 0 ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroCheckCircle" className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <span className="text-gray-600">¡Stock controlado!</span>
                            </div>
                        ) : (
                            lowStockProducts.map((product) => (
                                <div key={product.SellerSku} className="p-4 border-b border-gray-100 hover:bg-red-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{product.Name}</h4>
                                            <p className="text-xs text-gray-500">SKU: {product.SellerSku}</p>
                                            <p className="text-xs text-red-600 font-medium">{product.Brand}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <Badge className={`${product.Quantity === 0
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-orange-100 text-orange-800'} font-semibold`}>
                                                {product.Quantity} und.
                                            </Badge>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {formatCurrency(product.Price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardBody>
                </Card>

                {/* Productos Más Vendidos */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Icon icon="HeroTrophy" className="w-5 h-5 mr-2" />
                                Top Ventas
                            </h3>
                            <Badge className="bg-white/20 text-white font-semibold">
                                30 días
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                                <span className="text-gray-600">Cargando ventas...</span>
                            </div>
                        ) : bestSellingProducts.length === 0 ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroInformationCircle" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <span className="text-gray-600">Sin ventas registradas</span>
                            </div>
                        ) : (
                            bestSellingProducts.slice(0, 5).map((item, index) => (
                                <div key={item.product.SellerSku} className="p-4 border-b border-gray-100 hover:bg-red-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                                        index === 2 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.product.Name}</h4>
                                                <p className="text-xs text-red-600 font-medium">{item.product.Brand}</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <Badge className="bg-red-100 text-red-800 font-semibold">
                                                {item.totalSold} vendidos
                                            </Badge>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {formatCurrency(item.product.Price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardBody>
                </Card>

                {/* Panel de Control */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-t-lg">
                        <h3 className="text-lg font-semibold flex items-center">
                            <Icon icon="HeroChartBarSquare" className="w-5 h-5 mr-2" />
                            Control Falabella
                        </h3>
                    </CardHeader>
                    <CardBody className="p-4 space-y-4">
                        {/* Precio promedio */}
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200">
                            <div className="text-center">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Precio Promedio</p>
                                <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                                    {loading ? '...' : formatCurrency(inventorySummary.averagePrice)}
                                </p>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50"
                            >
                                <Icon icon="HeroCubeTransparent" className="w-4 h-4 mr-2" />
                                Inventario Falabella
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50"
                            >
                                <Icon icon="HeroShoppingCart" className="w-4 h-4 mr-2" />
                                Órdenes de Compra
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => window.open('https://sellercenter.falabella.com', '_blank')}
                            >
                                <Icon icon="HeroArrowTopRightOnSquare" className="w-4 h-4 mr-2" />
                                Seller Center
                            </Button>
                        </div>

                        {/* Última actualización */}
                        <div className="pt-4 border-t border-red-200">
                            <p className="text-xs text-gray-500 text-center mb-2">
                                Actualizado: {new Date().toLocaleTimeString('es-CL')}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => window.location.reload()}
                            >
                                <Icon icon="HeroArrowPath" className="w-3 h-3 mr-1" />
                                Actualizar Datos
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default FalabellaDashboard;
