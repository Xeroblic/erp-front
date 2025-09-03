import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { DashboardStats } from '../../types';

interface EcoTIService {
    id: string;
    name: string;
    category: 'infrastructure' | 'cloud' | 'security' | 'development' | 'consulting';
    status: 'active' | 'maintenance' | 'planning' | 'completed';
    client: string;
    startDate: string;
    endDate: string;
    budget: number;
    progress: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TechnicalMetric {
    name: string;
    value: string | number;
    unit?: string;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
}

const EcoTIDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalRevenue: 0,
        ordersCount: 0,
        lowStockCount: 0
    });
    const [activeServices, setActiveServices] = useState<EcoTIService[]>([]);
    const [technicalMetrics, setTechnicalMetrics] = useState<TechnicalMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEcoTIData = async () => {
            setLoading(true);

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 900));

            // Datos simulados para EcoTI
            setStats({
                totalProducts: 47, // Proyectos activos
                totalRevenue: 89500000, // Ingresos anuales proyectados
                ordersCount: 23, // Servicios en curso
                lowStockCount: 5 // Recursos críticos
            });

            setActiveServices([
                {
                    id: 'ECOTI001',
                    name: 'Migración Cloud AWS - Banco Central',
                    category: 'cloud',
                    status: 'active',
                    client: 'Banco Central de Chile',
                    startDate: '2024-01-15',
                    endDate: '2024-12-30',
                    budget: 15000000,
                    progress: 67,
                    priority: 'critical'
                },
                {
                    id: 'ECOTI002',
                    name: 'Implementación SAP S/4HANA - Retailer',
                    category: 'infrastructure',
                    status: 'active',
                    client: 'Mega Retail Corp',
                    startDate: '2024-03-01',
                    endDate: '2024-11-15',
                    budget: 8500000,
                    progress: 34,
                    priority: 'high'
                },
                {
                    id: 'ECOTI003',
                    name: 'Auditoría de Seguridad - FinTech',
                    category: 'security',
                    status: 'planning',
                    client: 'FinTech Innovations',
                    startDate: '2024-10-01',
                    endDate: '2024-12-15',
                    budget: 3200000,
                    progress: 12,
                    priority: 'medium'
                },
                {
                    id: 'ECOTI004',
                    name: 'Desarrollo App Móvil - E-commerce',
                    category: 'development',
                    status: 'active',
                    client: 'E-commerce Plus',
                    startDate: '2024-08-01',
                    endDate: '2025-02-28',
                    budget: 5800000,
                    progress: 45,
                    priority: 'high'
                },
                {
                    id: 'ECOTI005',
                    name: 'Consultoría Digital - Gobierno',
                    category: 'consulting',
                    status: 'maintenance',
                    client: 'Ministerio de Hacienda',
                    startDate: '2024-06-01',
                    endDate: '2024-12-31',
                    budget: 12000000,
                    progress: 78,
                    priority: 'medium'
                }
            ]);

            setTechnicalMetrics([
                { name: 'Uptime Infraestructura', value: 99.97, unit: '%', status: 'excellent', trend: 'stable' },
                { name: 'Tiempo Respuesta API', value: 145, unit: 'ms', status: 'excellent', trend: 'down' },
                { name: 'Incidentes Resueltos', value: 15, unit: '/mes', status: 'good', trend: 'up' },
                { name: 'Disponibilidad Cloud', value: 99.94, unit: '%', status: 'excellent', trend: 'stable' },
                { name: 'Vulnerabilidades', value: 2, unit: 'críticas', status: 'warning', trend: 'down' },
                { name: 'Backup Success Rate', value: 100, unit: '%', status: 'excellent', trend: 'stable' },
                { name: 'CPU Utilización', value: 68, unit: '%', status: 'good', trend: 'up' },
                { name: 'Memoria Disponible', value: 2.4, unit: 'TB', status: 'good', trend: 'stable' }
            ]);

            setLoading(false);
        };

        loadEcoTIData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'infrastructure': return 'HeroServerStack';
            case 'cloud': return 'HeroCloudArrowUp';
            case 'security': return 'HeroShieldCheck';
            case 'development': return 'HeroCodeBracket';
            case 'consulting': return 'HeroUsers';
            default: return 'HeroCog6Tooth';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'infrastructure': return 'bg-blue-100 text-blue-800';
            case 'cloud': return 'bg-cyan-100 text-cyan-800';
            case 'security': return 'bg-red-100 text-red-800';
            case 'development': return 'bg-green-100 text-green-800';
            case 'consulting': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800';
            case 'planning': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getMetricStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'text-green-600';
            case 'good': return 'text-blue-600';
            case 'warning': return 'text-orange-600';
            case 'critical': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return 'HeroArrowTrendingUp';
            case 'down': return 'HeroArrowTrendingDown';
            case 'stable': return 'HeroMinus';
            default: return 'HeroMinus';
        }
    };

    return (
        <div className="space-y-6 py-6">
            {/* Estadísticas principales - Tema EcoTI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Proyectos Activos</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : stats.totalProducts}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroRocketLaunch" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Ingresos Anuales</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : formatCurrency(stats.totalRevenue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroChartBarSquare" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium">Servicios Activos</p>
                                <p className="text-3xl font-bold">
                                    {loading ? '...' : stats.ordersCount}
                                </p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <Icon icon="HeroServerStack" className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-blue-700 to-blue-800 text-white shadow-lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Recursos Críticos</p>
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
                {/* Servicios Activos */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Icon icon="HeroRocketLaunch" className="w-5 h-5 mr-2" />
                                Servicios Activos
                            </h3>
                            <Badge className="bg-white/20 text-white font-semibold">
                                {activeServices.filter(s => s.status === 'active').length} activos
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                                <span className="text-gray-600">Cargando servicios...</span>
                            </div>
                        ) : (
                            activeServices.map((service) => (
                                <div key={service.id} className="p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{service.name}</h4>
                                                <p className="text-xs text-gray-500">{service.client}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <Badge className={`${getPriorityColor(service.priority)} font-semibold text-xs`}>
                                                    {service.priority}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex space-x-2">
                                                <Badge className={`${getCategoryColor(service.category)} text-xs`}>
                                                    <Icon icon={getCategoryIcon(service.category)} className="w-3 h-3 mr-1" />
                                                    {service.category}
                                                </Badge>
                                                <Badge className={`${getStatusColor(service.status)} text-xs`}>
                                                    {service.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                {formatCurrency(service.budget)}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Progreso:</span>
                                                <span className="font-medium text-blue-600">{service.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${service.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Inicio: {new Date(service.startDate).toLocaleDateString('es-CL')}</span>
                                            <span>Fin: {new Date(service.endDate).toLocaleDateString('es-CL')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardBody>
                </Card>

                {/* Métricas Técnicas */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Icon icon="HeroChartBarSquare" className="w-5 h-5 mr-2" />
                                Métricas Técnicas
                            </h3>
                            <Badge className="bg-white/20 text-white font-semibold">
                                Live
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <Icon icon="HeroArrowPath" className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                                <span className="text-gray-600">Cargando métricas...</span>
                            </div>
                        ) : (
                            technicalMetrics.map((metric, index) => (
                                <div key={index} className="p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 text-sm">{metric.name}</h4>
                                            <div className="flex items-center space-x-1 mt-1">
                                                <span className={`text-lg font-bold ${getMetricStatusColor(metric.status)}`}>
                                                    {metric.value}
                                                </span>
                                                {metric.unit && (
                                                    <span className="text-xs text-gray-600">{metric.unit}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right ml-4 space-y-1">
                                            <Badge className={`text-xs ${metric.status === 'excellent' ? 'bg-green-100 text-green-800' :
                                                    metric.status === 'good' ? 'bg-blue-100 text-blue-800' :
                                                        metric.status === 'warning' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {metric.status}
                                            </Badge>
                                            <div className="flex items-center justify-center">
                                                <Icon
                                                    icon={getTrendIcon(metric.trend)}
                                                    className={`w-4 h-4 ${metric.trend === 'up' ? 'text-green-600' :
                                                            metric.trend === 'down' ? 'text-red-600' :
                                                                'text-gray-600'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardBody>
                </Card>

                {/* Panel de Control EcoTI */}
                <Card className="col-span-1 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                        <h3 className="text-lg font-semibold flex items-center">
                            <Icon icon="HeroCommandLine" className="w-5 h-5 mr-2" />
                            Control EcoTI
                        </h3>
                    </CardHeader>
                    <CardBody className="p-4 space-y-4">
                        {/* Estado del sistema */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200">
                            <div className="text-center">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Infraestructura EcoTI</p>
                                <Badge className="bg-green-100 text-green-800 mt-2">
                                    <Icon icon="HeroCheckCircle" className="w-3 h-3 mr-1" />
                                    Óptimo
                                </Badge>
                            </div>
                        </div>

                        {/* Resumen de servicios */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Servicios por Categoría</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <Icon icon="HeroCloudArrowUp" className="w-3 h-3 mr-1" />
                                        Cloud & Migración
                                    </span>
                                    <span className="font-medium text-blue-600">8 proyectos</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <Icon icon="HeroShieldCheck" className="w-3 h-3 mr-1" />
                                        Seguridad
                                    </span>
                                    <span className="font-medium text-blue-600">5 auditorías</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <Icon icon="HeroCodeBracket" className="w-3 h-3 mr-1" />
                                        Desarrollo
                                    </span>
                                    <span className="font-medium text-blue-600">12 apps</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 flex items-center">
                                        <Icon icon="HeroUsers" className="w-3 h-3 mr-1" />
                                        Consultoría
                                    </span>
                                    <span className="font-medium text-blue-600">6 clientes</span>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <Icon icon="HeroServerStack" className="w-4 h-4 mr-2" />
                                Monitor Infraestructura
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <Icon icon="HeroCloudArrowUp" className="w-4 h-4 mr-2" />
                                Panel Cloud AWS
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <Icon icon="HeroShieldCheck" className="w-4 h-4 mr-2" />
                                Security Dashboard
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => window.open('https://ecoti.cl', '_blank')}
                            >
                                <Icon icon="HeroArrowTopRightOnSquare" className="w-4 h-4 mr-2" />
                                Portal EcoTI
                            </Button>
                        </div>

                        {/* Certificaciones */}
                        <div className="pt-4 border-t border-blue-200">
                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-2">Certificaciones</p>
                                <div className="grid grid-cols-2 gap-1">
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">AWS Partner</Badge>
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">ISO 27001</Badge>
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">Microsoft Gold</Badge>
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">ITIL v4</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Actualización */}
                        <div className="pt-4 border-t border-blue-200">
                            <p className="text-xs text-gray-500 text-center mb-2">
                                Última sync: {new Date().toLocaleTimeString('es-CL')}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() => window.location.reload()}
                            >
                                <Icon icon="HeroArrowPath" className="w-3 h-3 mr-1" />
                                Sincronizar Datos
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default EcoTIDashboard;
