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
        lowStockCount: 0
    });
    const [topProducts, setTopProducts] = useState<EcoPCProduct[]>([]);
    const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEcoPCData = async () => {
            setLoading(true);

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Datos simulados para EcoPC
            setStats({
                totalProducts: 892,
                totalRevenue: 45200000,
                ordersCount: 234,
                lowStockCount: 18
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
                        graphics: 'RTX 4060 8GB'
                    },
                    energyRating: 'A++'
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
                        graphics: 'RTX 4080 16GB'
                    },
                    energyRating: 'A+'
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
                    energyRating: 'A+++'
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
                    energyRating: 'A'
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
                    energyRating: 'A+++'
                }
            ]);

            setSystemAlerts([
                {
                    id: 'ALT001',
                    type: 'warning',
                    message: 'Stock bajo en GPUs RTX 4080 - Solo 3 unidades disponibles',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    resolved: false
                },
                {
                    id: 'ALT002',
                    type: 'info',
                    message: 'Nueva actualización de firmware disponible para monitores EcoPC',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    resolved: false
                },
                {
                    id: 'ALT003',
                    type: 'success',
                    message: 'Respaldo del sistema completado exitosamente',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    resolved: true
                },
                {
                    id: 'ALT004',
                    type: 'error',
                    message: 'Falla temporal en el sistema de garantías - Solucionado',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    resolved: true
                }
            ]);

            setLoading(false);
        };

        loadEcoPCData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'error': return 'HeroXCircle';
            case 'warning': return 'HeroExclamationTriangle';
            case 'success': return 'HeroCheckCircle';
            case 'info': return 'HeroInformationCircle';
            default: return 'HeroInformationCircle';
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'error': return 'text-red-600';
            case 'warning': return 'text-orange-600';
            case 'success': return 'text-green-600';
            case 'info': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    const getEnergyRatingColor = (rating: string) => {
        switch (rating) {
            case 'A+++': return 'bg-green-100 text-green-800';
            case 'A++': return 'bg-green-100 text-green-700';
            case 'A+': return 'bg-yellow-100 text-yellow-800';
            case 'A': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
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
        } else if (diffHours < 24) {
            return `hace ${diffHours}h`;
        } else {
            return date.toLocaleDateString('es-CL');
        }
    };

    return (
        <div className="space-y-6 py-6">
            {/* Estadísticas principales - Tema EcoPC */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Productos</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : stats.totalProducts?.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroComputerDesktop" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Ingresos Totales</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : formatCurrency(stats.totalRevenue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroCurrencyDollar" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Órdenes Técnicas</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : stats.ordersCount}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroWrenchScrewdriver" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-green-700 to-green-800 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Stock Crítico</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : stats.lowStockCount}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroExclamationTriangle" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Productos EcoPC Destacados */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Icon icon="HeroComputerDesktop" className="w-5 h-5 mr-2" />
                                Productos EcoPC
                            </h3>
                            <Badge className="bg-white/20 text-white font-semibold">
                                Top 5
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2 text-green-500" />
                                <span className="text-gray-600">Cargando productos...</span>
                            </div>
                        ) : (
                            topProducts.map((product, index) => (
                                <div key={product.id} className="p-4 border-b border-gray-100 hover:bg-green-50 transition-colors">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                                <p className="text-xs text-green-600 font-medium">{product.category}</p>
                                                {product.energyRating && (
                                                    <Badge className={`${getEnergyRatingColor(product.energyRating)} text-xs mt-1`}>
                                                        Eficiencia {product.energyRating}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <Badge className={`${getStockBadgeColor(product.stock)} font-semibold`}>
                                                    {product.stock} und.
                                                </Badge>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {formatCurrency(product.price)}
                                                </p>
                                                <p className="text-xs text-green-600 font-medium mt-1">
                                                    Garantía {product.warranty}
                                                </p>
                                            </div>
                                        </div>
                                        {product.specifications.processor && (
                                            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                                <div className="grid grid-cols-2 gap-1">
                                                    {product.specifications.processor && (
                                                        <span>CPU: {product.specifications.processor}</span>
                                                    )}
                                                    {product.specifications.ram && (
                                                        <span>RAM: {product.specifications.ram}</span>
                                                    )}
                                                    {product.specifications.storage && (
                                                        <span>Storage: {product.specifications.storage}</span>
                                                    )}
                                                    {product.specifications.graphics && (
                                                        <span>GPU: {product.specifications.graphics}</span>
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
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Icon icon="HeroBell" className="w-5 h-5 mr-2" />
                                Alertas del Sistema
                            </h3>
                            <Badge className="bg-white/20 text-white font-semibold">
                                {systemAlerts.filter(a => !a.resolved).length} activas
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2 text-green-500" />
                                <span className="text-gray-600">Cargando alertas...</span>
                            </div>
                        ) : (
                            systemAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-green-50 transition-colors ${alert.resolved ? 'opacity-60' : ''
                                        }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <Icon
                                            icon={getAlertIcon(alert.type)}
                                            className={`w-5 h-5 mt-0.5 ${getAlertColor(alert.type)}`}
                                        />
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${alert.resolved ? 'line-through' : ''}`}>
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-500">
                                                    {formatTimestamp(alert.timestamp)}
                                                </p>
                                                <Badge className={`text-xs ${alert.resolved
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
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-700 to-green-800 text-white">
                        <h3 className="text-lg font-semibold flex items-center">
                            <Icon icon="HeroCog6Tooth" className="w-5 h-5 mr-2" />
                            Control EcoPC
                        </h3>
                    </CardHeader>
                    <CardBody className="p-4 space-y-4">
                        {/* Estado del sistema */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200">
                            <div className="text-center">
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Sistema EcoPC</p>
                                <Badge className="bg-green-100 text-green-800 mt-2">
                                    <Icon icon="HeroCheckCircle" className="w-3 h-3 mr-1" />
                                    Operativo
                                </Badge>
                            </div>
                        </div>

                        {/* Estadísticas técnicas */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Métricas Técnicas</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Uptime sistema:</span>
                                    <span className="font-medium text-green-600">99.8%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Respuesta promedio:</span>
                                    <span className="font-medium text-green-600">1.2ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Garantías activas:</span>
                                    <span className="font-medium text-green-600">756</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Soporte técnico:</span>
                                    <span className="font-medium text-green-600">24/7</span>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Icon icon="HeroComputerDesktop" className="w-4 h-4 mr-2" />
                                Inventario Técnico
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Icon icon="HeroWrenchScrewdriver" className="w-4 h-4 mr-2" />
                                Órdenes de Servicio
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Icon icon="HeroShieldCheck" className="w-4 h-4 mr-2" />
                                Control Garantías
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => window.open('https://ecopc.cl', '_blank')}
                            >
                                <Icon icon="HeroArrowTopRightOnSquare" className="w-4 h-4 mr-2" />
                                Portal EcoPC
                            </Button>
                        </div>

                        {/* Información de energía */}
                        <div className="pt-4 border-t border-green-200">
                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-2">Certificación Energética</p>
                                <div className="flex justify-center space-x-1">
                                    <Badge className="bg-green-100 text-green-800 text-xs">A+++</Badge>
                                    <Badge className="bg-green-100 text-green-800 text-xs">Eco Friendly</Badge>
                                </div>
                                <p className="text-xs text-green-600 mt-2 font-medium">
                                    -25% consumo energético
                                </p>
                            </div>
                        </div>

                        {/* Actualización */}
                        <div className="pt-4 border-t border-green-200">
                            <p className="text-xs text-gray-500 text-center mb-2">
                                Sincronizado: {new Date().toLocaleTimeString('es-CL')}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-green-200 text-green-600 hover:bg-green-50"
                                onClick={() => window.location.reload()}
                            >
                                <Icon icon="HeroArrowPath" className="w-3 h-3 mr-1" />
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
