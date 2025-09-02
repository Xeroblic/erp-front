export type DashboardType = 'falabella' | 'ripley' | 'paris' | 'ecopc' | 'ecoti';

export interface DashboardConfig {
    id: DashboardType;
    name: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    logo?: string;
}

export const DASHBOARD_CONFIGS: Record<DashboardType, DashboardConfig> = {
    falabella: {
        id: 'falabella',
        name: 'Falabella',
        description: 'Dashboard para gestión de inventario en Falabella',
        colors: {
            primary: 'rgb(239, 68, 68)', // red-500
            secondary: 'rgb(220, 38, 38)', // red-600
            accent: 'rgb(254, 202, 202)', // red-200
            background: 'rgb(254, 242, 242)', // red-50
            text: 'rgb(127, 29, 29)' // red-800
        }
    },
    ripley: {
        id: 'ripley',
        name: 'Ripley',
        description: 'Dashboard para gestión de inventario en Ripley',
        colors: {
            primary: 'rgb(168, 85, 247)', // purple-500
            secondary: 'rgb(147, 51, 234)', // purple-600
            accent: 'rgb(221, 214, 254)', // purple-200
            background: 'rgb(250, 245, 255)', // purple-50
            text: 'rgb(88, 28, 135)' // purple-800
        }
    },
    paris: {
        id: 'paris',
        name: 'Paris',
        description: 'Dashboard para gestión de inventario en Paris',
        colors: {
            primary: 'rgb(236, 72, 153)', // pink-500
            secondary: 'rgb(219, 39, 119)', // pink-600
            accent: 'rgb(251, 207, 232)', // pink-200
            background: 'rgb(253, 242, 248)', // pink-50
            text: 'rgb(131, 24, 67)' // pink-800
        }
    },
    ecopc: {
        id: 'ecopc',
        name: 'EcoPC',
        description: 'Dashboard principal para gestión EcoPC',
        colors: {
            primary: 'rgb(34, 197, 94)', // green-500
            secondary: 'rgb(22, 163, 74)', // green-600
            accent: 'rgb(187, 247, 208)', // green-200
            background: 'rgb(240, 253, 244)', // green-50
            text: 'rgb(22, 101, 52)' // green-800
        }
    },
    ecoti: {
        id: 'ecoti',
        name: 'EcoTI',
        description: 'Dashboard para servicios tecnológicos EcoTI',
        colors: {
            primary: 'rgb(59, 130, 246)', // blue-500
            secondary: 'rgb(37, 99, 235)', // blue-600
            accent: 'rgb(191, 219, 254)', // blue-200
            background: 'rgb(239, 246, 255)', // blue-50
            text: 'rgb(30, 64, 175)' // blue-800
        }
    }
};

export interface DashboardStats {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    averagePrice: number;
    recentSales: number;
    pendingOrders: number;
}
